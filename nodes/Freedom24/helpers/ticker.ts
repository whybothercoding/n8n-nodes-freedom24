import { IDataObject } from 'n8n-workflow';

/**
 * The Ticker field is a resourceLocator (`{ mode, value }`) so it renders a searchable dropdown,
 * but every action just wants the plain ticker string. Also accepts a bare string so a
 * hand-written or programmatically-built workflow JSON keeps working.
 */
export function resolveTickerParam(value: unknown): string {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object' && 'value' in (value as IDataObject)) {
		return String((value as IDataObject).value ?? '');
	}
	return '';
}
