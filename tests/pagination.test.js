import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateItems, getPageNumbers } from '../resources/js/pagination.utils.js';

test('paginateItems returns the first page of items', () => {
    const items = [1, 2, 3, 4, 5];

    const result = paginateItems(items, 1, 2);

    assert.deepEqual(result.pageItems, [1, 2]);
    assert.equal(result.currentPage, 1);
    assert.equal(result.totalPages, 3);
    assert.equal(result.startIndex, 1);
    assert.equal(result.endIndex, 2);
});

test('paginateItems clamps the page number to the last available page', () => {
    const items = [1, 2, 3, 4, 5];

    const result = paginateItems(items, 99, 2);

    assert.deepEqual(result.pageItems, [5]);
    assert.equal(result.currentPage, 3);
});

test('getPageNumbers returns a compact range around the current page', () => {
    assert.deepEqual(getPageNumbers(4, 10, 5), [2, 3, 4, 5, 6]);
    assert.deepEqual(getPageNumbers(1, 3, 5), [1, 2, 3]);
});
