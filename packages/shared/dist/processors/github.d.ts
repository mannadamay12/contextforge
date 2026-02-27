import { BaseProcessor, Source, ProcessedContent } from './base.js';
export interface GitHubRepoInfo {
    owner: string;
    repo: string;
    path?: string;
    ref?: string;
}
export interface GitHubFileContent {
    path: string;
    content: string;
    type: 'file' | 'dir';
    size: number;
    sha: string;
}
export declare class GitHubProcessor extends BaseProcessor {
    private octokit;
    constructor(githubToken?: string);
    process(source: Source): Promise<ProcessedContent>;
    private parseGitHubUrl;
    private processRepository;
    private getRepositoryContents;
    private getFileContent;
    private shouldProcessFile;
    private shouldProcessDirectory;
    private formatRepositoryContent;
    private getLanguageFromExtension;
    private formatBytes;
}
//# sourceMappingURL=github.d.ts.map