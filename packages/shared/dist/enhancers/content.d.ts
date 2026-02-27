export declare class ContentEnhancer {
    deduplicateContent(contents: string[]): Promise<string[]>;
    summarizeIfTooLong(content: string, maxTokens: number): Promise<string>;
    extractKeyInformation(content: string, context: string): Promise<string>;
}
//# sourceMappingURL=content.d.ts.map