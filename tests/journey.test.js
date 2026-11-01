import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyPages, journeyPageFor } from '../js/ui/journey.js';

test('journey keeps campaign order and separates worlds without losing the final level', () => {
  const ids = Array.from({ length: 19 }, (_, i) => `level-${i}`);
  const levels = ids.map((_, i) => ({ world: i < 9 ? 'I' : i < 18 ? 'II' : 'III' }));
  const pages = journeyPages(ids, levels);
  assert.deepEqual(pages.map(p => p.ids.length), [5, 4, 5, 4, 1]);
  assert.deepEqual(pages.flatMap(p => p.ids), ids);
  assert.equal(journeyPageFor(pages, ids[9]), 2);
  assert.equal(journeyPageFor(pages, ids[18]), 4);
  assert.equal(journeyPageFor(pages, 'old-save-id'), 0);
});
