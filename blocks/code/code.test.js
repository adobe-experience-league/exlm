import assert from 'node:assert/strict';
import test from 'node:test';
import joinCodeLines from './join-code-lines.js';

function lineCount(text) {
  return (text.match(/\n/g) || []).length + 1;
}

test('one published pre is two counted lines and stays under the threshold', () => {
  const firstLine = '---\n';
  assert.equal(lineCount(firstLine), 2);
  assert.equal(lineCount(firstLine) > 20, false);
});

test('sibling pres join into one block that can show more', () => {
  const lines = Array.from({ length: 21 }, (_, index) => `line ${index}\n`);
  const text = joinCodeLines(lines);
  assert.equal(lineCount(text), 21);
  assert.equal(lineCount(text) > 20, true);
  assert.equal(text.endsWith('line 20'), true);
});

test('keeps markup characters and a blank first line', () => {
  const text = joinCodeLines(['\n', 'name: <insert company name>\n', '{{dimensionHeader}}\n']);
  assert.equal(text, '\nname: <insert company name>\n{{dimensionHeader}}');
});
