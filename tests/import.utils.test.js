import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeCommandsToText } from '../resources/js/import.utils.js';

test('serializeCommandsToText joins commands with line breaks', () => {
    const result = serializeCommandsToText([
        { id: 1, text: 'git status' },
        { id: 2, text: 'npm test' }
    ]);

    assert.equal(result, 'git status\nnpm test');
});

test('serializeCommandsToText returns empty string for invalid input', () => {
    assert.equal(serializeCommandsToText(null), '');
});
