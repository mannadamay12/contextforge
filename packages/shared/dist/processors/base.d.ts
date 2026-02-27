export interface Source {
    url: string;
    type: string;
    metadata?: Record<string, unknown>;
}
export interface ProcessedContent {
    content: string;
    metadata: Record<string, unknown>;
    status: 'success' | 'error';
    error?: string;
}
export declare abstract class BaseProcessor {
    abstract process(source: Source): Promise<ProcessedContent>;
    protected downloadContent(url: string): Promise<string>;
    protected extractText(content: string, type: string): string;
}
export declare class ArxivProcessor extends BaseProcessor {
    process(source: Source): Promise<ProcessedContent>;
}
export declare class YouTubeProcessor extends BaseProcessor {
    process(source: Source): Promise<ProcessedContent>;
}
export declare class WebCrawlerProcessor extends BaseProcessor {
    process(source: Source): Promise<ProcessedContent>;
}
//# sourceMappingURL=base.d.ts.map