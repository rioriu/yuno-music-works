import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {validateSite} from '../scripts/validate.mjs';
import {validDate} from '../scripts/catalog-validation.mjs';

const cache = new Map();
async function read(file) {
  if (!cache.has(file)) cache.set(file,await readFile(file,'utf8'));
  return cache.get(file);
}
async function check({works,updates,html} = {}) {
  return validateSite({readText:async file => {
    let source = await read(file);
    const edit = file.endsWith(`${path.sep}works.json`) ? works : file.endsWith(`${path.sep}updates.json`) ? updates : null;
    if (edit) { const data = JSON.parse(source); source = JSON.stringify(edit(data) ?? data); }
    if (html && file.endsWith('.html')) source = html(source,file);
    return source;
  }});
}

test('normal work and update additions do not require count changes',async () => {
  const result = await check({works:data => { data.push({...structuredClone(data[0]),id:'new-work',slug:'new-work'}); },updates:data => { data.push({...data[0],date:'2026-09-05'}); }});
  assert.deepEqual(result.errors,[]);
});
test('updates may be empty',async () => assert.deepEqual((await check({updates:() => []})).errors,[]));
for (const [name,edit,expected] of [
  ['empty bilingual title',data => { data[0].title_ja = ''; data[0].title_en = ' '; },/presto-marimba-sax-quartet.*title_ja/],
  ['string publication flag',data => { data[0].published = 'false'; },/published.*boolean/],
  ['impossible date',data => { data[0].published_date = '2026-02-30'; },/published_date.*calendar/],
  ['non-array scores',data => { data[0].scores = {}; },/scores.*array/],
  ['null record',data => { data[0] = null; },/expected an object/],
  ['wrong root shape',() => ({}),/works: expected an array/],
  ['duplicate ID',data => { data[1].id = data[0].id; },/duplicate id/],
  ['broken parent duration',data => { data.find(work => work.parts).duration_seconds++; },/parent duration/],
  ['unapproved URL',data => { data[0].video.fallback_url = 'https://untrusted.invalid/'; },/approved HTTPS origin/],
  ['nested empty title',data => { data.find(work => work.parts).parts[0].title_en = ''; },/parts.*title_en/],
]) test(`rejects ${name}`,async () => assert.match((await check({works:edit})).errors.join('\n'),expected));
test('calendar dates reject rollover and accept leap days',() => {
  for (const value of ['2026-02-30','2025-02-29','2026-04-31','2026-13-01',42,undefined]) assert.equal(validDate(value),false);
  for (const value of ['2024-02-29','2026-09-05',null]) assert.equal(validDate(value),true);
});
test('update dates and text use strict validation',async () => {
  assert.match((await check({updates:data => { data[0].date = '2026-02-30'; }})).errors.join('\n'),/updates\[0\].date/);
  assert.match((await check({updates:data => { data[0].text_en = ' '; }})).errors.join('\n'),/text_en/);
});
test('query-bearing CSS references are checked',async () => {
  const result = await check({html:source => source.replace('styles.css?v=','DOES-NOT-EXIST.css?v=')});
  assert.match(result.errors.join('\n'),/missing local target.*DOES-NOT-EXIST.css\?v=/);
});
test('work queries, static hashes and dynamic hashes are checked',async () => {
  for (const href of ['commentary/?work=missing','originals/#missing','originals/work/?work=brass-quartet-sonata#missing','profile/#missing']) {
    const result = await check({html:(source,file) => file === path.resolve('index.html') ? source.replace('</main>',`<a href="${href}">Broken</a></main>`) : source});
    assert.match(result.errors.join('\n'),/invalid work reference|missing local hash/);
  }
});
test('existing IDs, slugs and query/hash links remain valid',async () => {
  // Exercise the real catalog using a known current slug instead of assuming a content-specific one.
  const works = JSON.parse(await read(path.resolve('data/works.json')));
  const valid = await check({html:(source,file) => file === path.resolve('index.html') ? source.replace('</main>',`<a href="originals/?view=all#${works[0].slug}">Works</a></main>`) : source});
  assert.deepEqual(valid.errors,[]);
});
