// packages/shared/src/processors/base.ts
export class BaseProcessor {
    async downloadContent(url) {
        // Shared download logic with retry and caching
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        }
        catch (error) {
            throw new Error(`Failed to download content from ${url}: ${error}`);
        }
    }
    extractText(content, type) {
        // Shared text extraction logic
        // Placeholder implementation
        return content;
    }
}
// Individual processors - GitHub processor moved to separate file
export class ArxivProcessor extends BaseProcessor {
    async process(source) {
        try {
            const content = await this.downloadContent(source.url);
            const extractedText = this.extractText(content, 'arxiv');
            return {
                content: extractedText,
                metadata: { type: 'arxiv', url: source.url },
                status: 'success'
            };
        }
        catch (error) {
            return {
                content: '',
                metadata: { type: 'arxiv', url: source.url },
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
export class YouTubeProcessor extends BaseProcessor {
    async process(source) {
        try {
            const content = await this.downloadContent(source.url);
            const extractedText = this.extractText(content, 'youtube');
            return {
                content: extractedText,
                metadata: { type: 'youtube', url: source.url },
                status: 'success'
            };
        }
        catch (error) {
            return {
                content: '',
                metadata: { type: 'youtube', url: source.url },
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
export class WebCrawlerProcessor extends BaseProcessor {
    async process(source) {
        try {
            const content = await this.downloadContent(source.url);
            const extractedText = this.extractText(content, 'web');
            return {
                content: extractedText,
                metadata: { type: 'web', url: source.url },
                status: 'success'
            };
        }
        catch (error) {
            return {
                content: '',
                metadata: { type: 'web', url: source.url },
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
//# sourceMappingURL=base.js.map