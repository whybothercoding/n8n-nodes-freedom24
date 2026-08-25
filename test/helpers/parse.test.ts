/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { INode, NodeOperationError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';

import { parseJsonArrayParam, parseJsonParam } from '../../nodes/Freedom24/helpers/parse';

const fakeNode: INode = {
	id: '1',
	name: 'Freedom24',
	type: '@indiegoweb/n8n-nodes-freedom24.freedom24',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

describe('parseJsonParam', () => {
	it('parses valid JSON', () => {
		expect(parseJsonParam(fakeNode, 0, 'filtersJson', '[{"field":"ticker"}]')).toEqual([
			{ field: 'ticker' },
		]);
	});

	it('raises a NodeOperationError naming the field on invalid JSON', () => {
		expect(() => parseJsonParam(fakeNode, 0, 'filtersJson', '{not valid')).toThrow(
			NodeOperationError,
		);
	});

	it('the thrown error carries the parameter name in its message and the item index in its context', () => {
		try {
			parseJsonParam(fakeNode, 2, 'sortJson', '{bad');
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(NodeOperationError);
			const opError = error as NodeOperationError;
			expect(opError.message).toContain('sortJson');
			expect(opError.context.itemIndex).toBe(2);
		}
	});
});

describe('parseJsonArrayParam', () => {
	it('parses a valid JSON array', () => {
		expect(parseJsonArrayParam(fakeNode, 0, 'filtersJson', '[{"field":"ticker"}]')).toEqual([
			{ field: 'ticker' },
		]);
	});

	it('raises a NodeOperationError on invalid JSON syntax', () => {
		expect(() => parseJsonArrayParam(fakeNode, 0, 'filtersJson', '{not valid')).toThrow(
			NodeOperationError,
		);
	});

	it('raises a NodeOperationError when the parsed value is valid JSON but not an array', () => {
		expect(() => parseJsonArrayParam(fakeNode, 0, 'filtersJson', '{"field":"ticker"}')).toThrow(
			NodeOperationError,
		);
	});
});
