/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect, it } from 'vitest';

import { JsonParamParseError, parseJsonParam } from '../../nodes/Freedom24/helpers/parse';

describe('parseJsonParam', () => {
	it('parses valid JSON', () => {
		expect(parseJsonParam('filtersJson', '[{"field":"ticker"}]')).toEqual([{ field: 'ticker' }]);
	});

	it('raises a JsonParamParseError naming the field on invalid JSON', () => {
		expect(() => parseJsonParam('filtersJson', '{not valid')).toThrow(JsonParamParseError);
	});

	it('the thrown error carries the parameter name and raw value', () => {
		try {
			parseJsonParam('sortJson', '{bad');
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(JsonParamParseError);
			const parseError = error as JsonParamParseError;
			expect(parseError.paramName).toBe('sortJson');
			expect(parseError.raw).toBe('{bad');
			expect(parseError.message).toContain('sortJson');
		}
	});
});
