import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pages } from '../../constants';
import { categories } from './constants';
import { discoverTools } from './discovery';

test('every registered tool is discoverable with its original content and route', () => {
  const tools = discoverTools(pages, categories).flatMap((category) => category.items);
  assert.equal(tools.length, pages.length);
  for (const page of pages) assert.ok(tools.includes(page), page.name);
  assert.equal(discoverTools(pages, categories).length, categories.length);
});
test('search matches names, descriptions and categories regardless of case or surrounding spaces', () => {
  assert.ok(
    discoverTools(pages, categories, '  jSoN  ')
      .flatMap((g) => g.items)
      .some((p) => p.name === 'Json Formatter'),
  );
  assert.ok(
    discoverTools(pages, categories, 'timestamps')
      .flatMap((g) => g.items)
      .some((p) => p.path === '/utility/epoch'),
  );
  assert.equal(
    discoverTools(pages, categories, 'Visual Tools')[0].items.length,
    pages.filter((p) => p.path.startsWith('/visual-tools/')).length,
  );
});
test('category and query filters intersect and support an empty result', () => {
  assert.equal(discoverTools(pages, categories, 'json', '/game/').length, 0);
  assert.equal(discoverTools(pages, categories, 'no-such-tool-123').length, 0);
  const groups = discoverTools(pages, categories, '', '/utility/');
  assert.equal(groups.length, 1);
  assert.equal(groups[0].items.length, pages.filter((p) => p.path.startsWith('/utility/')).length);
});
test('new registry entries automatically appear, including beyond the old six-item limit', () => {
  const added = {
    ...pages[0],
    name: 'Registry test entry',
    path: '/utility/registry-test',
    desc: 'Only used by this test',
  };
  const group = discoverTools([...pages, added], categories, '', '/utility/')[0];
  assert.ok(group.items.length > 6);
  assert.equal(group.items.at(-1), added);
});
