export interface TraceStorage {
	enterWith(value: string): void;
	getStore(): string | undefined;
}
