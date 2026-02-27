import { Octokit } from '@octokit/rest';
import { BaseProcessor } from './base.js';
export class GitHubProcessor extends BaseProcessor {
    octokit;
    constructor(githubToken) {
        super();
        const token = githubToken || process.env.GITHUB_TOKEN;
        this.octokit = new Octokit({
            auth: token && token !== 'your-github-token' ? token : undefined,
        });
    }
    async process(source) {
        try {
            const repoInfo = this.parseGitHubUrl(source.url);
            if (!repoInfo) {
                throw new Error(`Invalid GitHub URL: ${source.url}`);
            }
            const content = await this.processRepository(repoInfo);
            return {
                content: this.formatRepositoryContent(content, repoInfo),
                metadata: {
                    type: 'github_repo',
                    url: source.url,
                    owner: repoInfo.owner,
                    repo: repoInfo.repo,
                    path: repoInfo.path,
                    ref: repoInfo.ref,
                    fileCount: content.length,
                    totalSize: content.reduce((sum, file) => sum + file.size, 0)
                },
                status: 'success'
            };
        }
        catch (error) {
            return {
                content: '',
                metadata: { type: 'github_repo', url: source.url },
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    parseGitHubUrl(url) {
        const patterns = [
            // https://github.com/owner/repo
            /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/,
            // https://github.com/owner/repo/tree/branch/path
            /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)$/,
            // https://github.com/owner/repo/tree/branch
            /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/?$/,
            // https://github.com/owner/repo/blob/branch/file.ext
            /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/,
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                const [, owner, repo, ref, path] = match;
                return {
                    owner: owner.trim(),
                    repo: repo.replace(/\.git$/, '').trim(),
                    ref: ref?.trim(),
                    path: path?.trim()
                };
            }
        }
        return null;
    }
    async processRepository(repoInfo) {
        const files = [];
        // Get repository information
        const { data: repo } = await this.octokit.rest.repos.get({
            owner: repoInfo.owner,
            repo: repoInfo.repo,
        });
        // If no specific path or ref, use default branch
        const ref = repoInfo.ref || repo.default_branch;
        const path = repoInfo.path || '';
        // Get repository contents
        const contents = await this.getRepositoryContents(repoInfo.owner, repoInfo.repo, path, ref);
        for (const item of contents) {
            if (item.type === 'file') {
                // Skip binary files and files that are too large
                if (this.shouldProcessFile(item.name, item.size)) {
                    const fileContent = await this.getFileContent(repoInfo.owner, repoInfo.repo, item.path, ref);
                    if (fileContent) {
                        files.push(fileContent);
                    }
                }
            }
            else if (item.type === 'dir' && this.shouldProcessDirectory(item.name)) {
                // Recursively process directories (with depth limit)
                const subFiles = await this.processRepository({
                    ...repoInfo,
                    path: item.path,
                    ref
                });
                files.push(...subFiles);
            }
        }
        return files;
    }
    async getRepositoryContents(owner, repo, path = '', ref) {
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner,
                repo,
                path,
                ref,
            });
            return Array.isArray(data) ? data : [data];
        }
        catch (error) {
            console.warn(`Failed to get contents for ${path}:`, error);
            return [];
        }
    }
    async getFileContent(owner, repo, path, ref) {
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner,
                repo,
                path,
                ref,
            });
            if (!Array.isArray(data) && data.type === 'file' && data.content) {
                const content = Buffer.from(data.content, 'base64').toString('utf-8');
                return {
                    path,
                    content,
                    type: 'file',
                    size: data.size,
                    sha: data.sha
                };
            }
        }
        catch (error) {
            console.warn(`Failed to get file content for ${path}:`, error);
        }
        return null;
    }
    shouldProcessFile(filename, size) {
        // Skip files that are too large (>1MB)
        if (size > 1024 * 1024) {
            return false;
        }
        // Skip binary and unwanted file types
        const skipExtensions = [
            '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
            '.mp4', '.mp3', '.wav', '.avi',
            '.zip', '.tar', '.gz', '.rar',
            '.exe', '.bin', '.so', '.dll',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx',
            '.min.js', '.min.css' // minified files
        ];
        const lowercaseFilename = filename.toLowerCase();
        return !skipExtensions.some(ext => lowercaseFilename.endsWith(ext));
    }
    shouldProcessDirectory(dirname) {
        // Skip common directories that usually don't contain useful source code
        const skipDirs = [
            'node_modules', '.git', '.svn', '.hg',
            'build', 'dist', 'target', 'bin', 'obj',
            '.next', '.nuxt', '.vscode', '.idea',
            'vendor', 'packages', '__pycache__',
            'coverage', '.nyc_output', 'logs'
        ];
        return !skipDirs.includes(dirname.toLowerCase());
    }
    formatRepositoryContent(files, repoInfo) {
        const header = `# Repository: ${repoInfo.owner}/${repoInfo.repo}\n`;
        const summary = `\n## Repository Summary\n- Files processed: ${files.length}\n- Total size: ${this.formatBytes(files.reduce((sum, f) => sum + f.size, 0))}\n`;
        let content = header + summary + '\n';
        // Sort files: README first, then by directory depth, then alphabetically
        const sortedFiles = files.sort((a, b) => {
            // Prioritize README files
            const aIsReadme = /readme/i.test(a.path);
            const bIsReadme = /readme/i.test(b.path);
            if (aIsReadme && !bIsReadme)
                return -1;
            if (!aIsReadme && bIsReadme)
                return 1;
            // Then by directory depth (fewer slashes first)
            const aDepth = a.path.split('/').length;
            const bDepth = b.path.split('/').length;
            if (aDepth !== bDepth)
                return aDepth - bDepth;
            // Finally alphabetically
            return a.path.localeCompare(b.path);
        });
        for (const file of sortedFiles) {
            content += `\n## File: ${file.path}\n\n`;
            // Add language hint for syntax highlighting
            const extension = file.path.split('.').pop()?.toLowerCase();
            const language = this.getLanguageFromExtension(extension || '');
            content += `\`\`\`${language}\n${file.content}\n\`\`\`\n`;
        }
        return content;
    }
    getLanguageFromExtension(ext) {
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'jsx',
            'tsx': 'tsx',
            'py': 'python',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cc': 'cpp',
            'cxx': 'cpp',
            'h': 'c',
            'hpp': 'cpp',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'swift': 'swift',
            'kt': 'kotlin',
            'scala': 'scala',
            'sh': 'bash',
            'bash': 'bash',
            'zsh': 'zsh',
            'fish': 'fish',
            'ps1': 'powershell',
            'sql': 'sql',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'less': 'less',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'toml': 'toml',
            'ini': 'ini',
            'cfg': 'ini',
            'conf': 'ini',
            'md': 'markdown',
            'markdown': 'markdown',
            'txt': 'text',
            'dockerfile': 'dockerfile',
            'makefile': 'makefile'
        };
        return languageMap[ext] || 'text';
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
//# sourceMappingURL=github.js.map