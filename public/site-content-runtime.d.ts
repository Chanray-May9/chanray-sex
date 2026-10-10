export const PREVIEW_KEY: string;
export function normalizeText(value: string): string;
export function translateText<T>(value: T, overrides: Record<string,string>): T;
export function createContentTranslator(root: Document | Element, initial?: Record<string,string>): { update(next: Record<string,string>): void; stop(): void };
export function readPreview(storage: Storage): Record<string,string> | null;
