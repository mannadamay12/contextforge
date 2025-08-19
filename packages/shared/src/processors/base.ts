// packages/shared/src/processors/base.ts
export abstract class BaseProcessor {
    abstract process(source: Source): Promise<ProcessedContent>
    
    protected async downloadContent(url: string): Promise<string> {
      // Shared download logic with retry and caching
    }
    
    protected extractText(content: string, type: string): string {
      // Shared text extraction logic
    }
  }
  
  // Individual processors
  export class GitHubProcessor extends BaseProcessor { }
  export class ArxivProcessor extends BaseProcessor { }
  export class YouTubeProcessor extends BaseProcessor { }
  export class WebCrawlerProcessor extends BaseProcessor { }