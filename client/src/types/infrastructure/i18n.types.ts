export interface I18nResources extends Record<string, Record<string, NamespaceContent>> {
	en: Record<string, NamespaceContent>;
	he: Record<string, NamespaceContent>;
}
export type NamespaceContent = Record<string, string | string[] | Record<string, unknown>>;
