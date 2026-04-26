import { useTranslation } from 'react-i18next';

import { AlertVariant, GameKey } from '@/constants';
import { Alert, AlertDescription } from '@/components';

function dedupeMessages(messages: readonly string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of messages) {
		const s = raw.trim();
		if (!s || seen.has(s)) continue;
		seen.add(s);
		out.push(s);
	}
	return out;
}

export function mergeGameSettingsFlowIssueMessages(
	...buckets: ReadonlyArray<readonly (string | null | undefined)[]>
): string[] {
	const flat: string[] = [];
	for (const bucket of buckets) {
		for (const raw of bucket) {
			if (typeof raw === 'string' && raw.trim()) flat.push(raw.trim());
		}
	}
	return dedupeMessages(flat);
}

export function GameSettingsFlowIssuesAlert({ items }: { items: readonly string[] }): JSX.Element | null {
	const { t } = useTranslation('game');
	const unique = dedupeMessages(items);
	if (unique.length === 0) return null;

	return (
		<Alert variant={AlertVariant.DESTRUCTIVE} className='py-3'>
			<AlertDescription className='space-y-2'>
				<p className='text-sm font-medium'>{t(GameKey.SETTINGS_ISSUES_HEADING)}</p>
				<ul className='list-disc ps-4 text-sm space-y-1.5'>
					{unique.map((msg, i) => (
						<li key={i}>{msg}</li>
					))}
				</ul>
			</AlertDescription>
		</Alert>
	);
}
