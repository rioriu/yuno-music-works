import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/app.js',import.meta.url),'utf8');
function element() {
  return {innerHTML:'',textContent:'',hidden:false,dataset:{},attributes:{},
    setAttribute(key,value) { this.attributes[key] = value; },
    querySelector() { return this.button ||= {addEventListener:(event,callback) => { this.retry = callback; },focus() {}}; },
    querySelectorAll:() => [],replaceChildren() { this.innerHTML = ''; },closest:() => null,focus() {},
  };
}
function app(url = 'https://local.test/originals/', fetch = async () => ({ok:true,json:async () => []})) {
  const mounts = new Map(), location = new URL(url), redirects = [], errors = [];
  location.replace = value => redirects.push(value);
  const context = vm.createContext({URL,URLSearchParams,console:{error:error => errors.push(error)},
    window:{matchMedia:() => ({matches:true}),addEventListener() {}},
    document:{querySelector:selector => selector.startsWith('script[') ? {src:'https://local.test/assets/js/app.js'} : mounts.get(selector) || null,querySelectorAll:() => [],addEventListener() {},getElementById:() => null},
    location,history:{replaceState:(_state,_title,next) => { location.href = String(next); }},fetch,requestAnimationFrame() {},
  });
  Object.defineProperty(context,'localStorage',{get() { throw Error('Storage denied'); }});
  vm.runInContext(source,context);
  return {mounts,context,location,redirects,errors,run:expression => vm.runInContext(expression,context)};
}
const fixture = [
  {id:'flute',slug:'flute',published:true,type:'original',ensemble:'woodwinds',category:'classical',instruments:['flute'],title_ja:'フルート',title_en:'Flute',duration_seconds:179,composition_year:2020,published_date:'2022-01-01'},
  {id:'violin',slug:'violin',published:true,type:'original',ensemble:'strings',category:'classical',instruments:['violin'],title_ja:'弦',title_en:'Strings',duration_seconds:180,composition_year:2021,published_date:'2021-01-01'},
  {id:'piano',slug:'piano',published:true,type:'original',ensemble:'piano',category:'classical',instruments:['piano'],title_ja:'ピアノ',title_en:'Piano',duration_seconds:300,composition_year:2020,published_date:'2023-01-01'},
];
function catalog(url) {
  const state = app(url);
  for (const selector of ['[data-work-list]','[data-original-results]','[data-original-discovery]','[data-original-count]','[data-original-results-title]']) state.mounts.set(selector,element());
  state.context.works = structuredClone(fixture);
  return state;
}
test('storage denial does not prevent initialization or language selection',() => {
  const state = app();
  assert.equal(state.run('state.lang'),'ja');
  assert.doesNotThrow(() => state.run("saveLanguage('en')"));
  const english = app('https://local.test/originals/?lang=en');
  assert.equal(english.run('state.lang'),'en');
  assert.equal(english.run("originalBrowseHref('group','solo')"),'https://local.test/originals/?group=solo&lang=en');
  assert.equal(english.run("arrangementBrowseHref('genre','pops')"),'https://local.test/arrangements/?genre=pops&lang=en');
  const switching = app('https://local.test/originals/?ensemble=woodwinds#flute');
  switching.run("changeLanguage('en')");
  assert.equal(switching.location.href,'https://local.test/originals/?ensemble=woodwinds&lang=en#flute');
  switching.run("changeLanguage('ja')");
  assert.equal(switching.location.href,'https://local.test/originals/?ensemble=woodwinds&lang=ja#flute');
});
test('prototype names and invalid values normalize to discovery without throwing',async () => {
  for (const value of ['__proto__','toString','constructor','unknown']) {
    const state = catalog(`https://local.test/originals/?group=${value}&duration=${value}&instrument=${value}`);
    await state.run('renderOriginalDiscoveryCatalog(works)');
    assert.equal(state.location.search,'');
    assert.equal(state.mounts.get('[data-original-discovery]').hidden,false);
    for (const fn of ['originalMatchesGroup','originalMatchesDuration','originalMatchesInstrument']) assert.equal(state.run(`${fn}(works[0],'${value}')`),false);
  }
});
test('legacy ensemble URLs retain exactly their original selection on repeated loads',async () => {
  let url = 'https://local.test/originals/?ensemble=woodwinds&lang=en';
  for (let i = 0; i < 2; i++) {
    const state = catalog(url);
    await state.run('renderOriginalDiscoveryCatalog(works)');
    const markup = state.mounts.get('[data-work-list]').innerHTML;
    assert.match(markup,/id="flute"/); assert.doesNotMatch(markup,/id="violin"/);
    assert.equal(state.location.searchParams.get('ensemble'),'woodwinds');
    assert.equal(state.location.searchParams.get('lang'),'en');
    url = state.location.href;
  }
});
test('combined filters and duration boundaries use a small fixture',async () => {
  const state = catalog('https://local.test/originals/?group=chamber&duration=under-3&instrument=woodwinds');
  await state.run('renderOriginalDiscoveryCatalog(works)');
  assert.equal(state.mounts.get('[data-original-count]').textContent,'1作品');
  assert.equal(state.run("works.filter(work => originalMatchesDuration(work,'3-5')).length"),1);
  assert.equal(state.run("works.filter(work => originalMatchesDuration(work,'5-10')).length"),1);
});
test('normal catalog order remains composition year, publication, title',async () => {
  const state = catalog('https://local.test/originals/?view=all');
  await state.run('renderOriginalDiscoveryCatalog(works)');
  const markup = state.mounts.get('[data-work-list]').innerHTML;
  assert.ok(markup.indexOf('id="violin"') < markup.indexOf('id="piano"'));
  assert.ok(markup.indexOf('id="piano"') < markup.indexOf('id="flute"'));
});
test('legacy child hashes redirect to their parent detail and keep the child hash',async () => {
  const state = catalog('https://local.test/originals/?ensemble=brass#movement');
  state.context.works = [{...fixture[0],id:'suite',slug:'suite',parts:[{id:'old-id',slug:'movement'}]}];
  await state.run('renderOriginalDiscoveryCatalog(works)');
  assert.equal(state.redirects[0],'https://local.test/originals/work/?work=suite#movement');
});
test('video fallback is a normal link outside the lazily mounted player',() => {
  const state = app();
  state.context.work = {...fixture[0],video:{youtube:'abcdefghijk',fallback_url:'https://www.youtube.com/watch?v=abcdefghijk'}};
  const markup = state.run('videoMarkup(work)');
  assert.match(markup,/<\/div><p class="video-fallback"><a target="_blank" rel="noopener" href="https:\/\/www.youtube.com/);
  assert.doesNotMatch(markup,/<noscript|<iframe/);
  state.context.work.video.fallback_url = 'javascript:alert(1)';
  assert.doesNotMatch(state.run('videoMarkup(work)'),/javascript:/);
  assert.match(state.run('videoMarkup(work)'),/href="https:\/\/www.youtube.com/);
});
test('featured cards show the introduction and video without instrumentation or duration',() => {
  const state = app();
  state.context.parent = {...fixture[0],id:'cycle',slug:'cycle'};
  state.context.work = {...fixture[0],id:'song',slug:'song',title_ja:'白昼夢（トローニー）',featured_intro_ja:'紹介文',video:{youtube:'jYWPOyB479A'}};
  const markup = state.run('featuredCard(work,parent)');
  assert.match(markup,/白昼夢（トローニー）/);
  assert.match(markup,/紹介文/);
  assert.match(markup,/data-video-src=/);
  assert.match(markup,/originals\/work\/\?work=cycle#song/);
  assert.doesNotMatch(markup,/work-meta|work-duration|フルート|演奏時間/);
});
for (const [name,fetch] of [
  ['404',async () => ({ok:false,status:404})],
  ['invalid JSON',async () => ({ok:true,json:async () => { throw new SyntaxError('Invalid JSON'); }})],
  ['network failure',async () => { throw new TypeError('Network failed'); }],
  ['wrong JSON root',async () => ({ok:true,json:async () => ({})})],
]) test(`${name} shows a retry outside the hidden result and recovers`,async () => {
  const state = app(undefined,fetch), output = element(), status = element();
  state.mounts.set('[data-work-list]',output);
  state.mounts.set('[data-load-status="[data-work-list]"]',status);
  await state.run("renderRegion('[data-work-list]',async () => { await getJson('works.json'); })");
  assert.equal(status.hidden,false); assert.match(status.innerHTML,/再試行/);
  assert.equal(output.attributes['aria-busy'],'false');
  state.context.fetch = async () => ({ok:true,json:async () => []});
  await status.retry();
  assert.equal(status.hidden,true);
});
test('latest update is selected by date and empty updates are visible',async () => {
  const state = app(), output = element(); output.dataset.limit = '1';
  state.mounts.set('[data-updates]',output);
  state.context.fetch = async () => ({ok:true,json:async () => [{date:'2020-01-01',text_ja:'古い'},{date:'2026-01-01',text_ja:'新しい'}]});
  await state.run('renderUpdates()');
  assert.match(output.innerHTML,/新しい/); assert.doesNotMatch(output.innerHTML,/古い/);
  state.context.fetch = async () => ({ok:true,json:async () => []});
  await state.run('renderUpdates()');
  assert.match(output.innerHTML,/更新情報はありません/);
});

test('empty catalogs show a visible empty result instead of empty discovery',async () => {
  const state = catalog('https://local.test/originals/');
  state.context.works = [];
  await state.run('renderOriginalDiscoveryCatalog(works)');
  assert.equal(state.mounts.get('[data-original-results]').hidden,false);
  assert.match(state.mounts.get('[data-work-list]').innerHTML,/条件に合う作品はありません/);
});

test('arrangement sorting tolerates unknown publication dates',async () => {
  const state = app('https://local.test/arrangements/?view=all&sort=oldest');
  const output = element(); state.mounts.set('[data-work-list]',output);
  state.context.works = fixture.map((work,i) => ({...work,type:'arrangement',published_date:i === 0 ? null : work.published_date}));
  await state.run('renderArrangementCatalog(works)');
  assert.ok(output.innerHTML.indexOf('id="violin"') < output.innerHTML.indexOf('id="flute"'));
});

test('a failed region does not replace another region and repeated retries recover',async () => {
  const state = app(), output = element(), updates = element(), status = element(), updateStatus = element();
  state.mounts.set('[data-work-list]',output); state.mounts.set('[data-updates]',updates);
  state.mounts.set('[data-load-status="[data-work-list]"]',status);
  state.mounts.set('[data-load-status="[data-updates]"]',updateStatus);
  await state.run(`Promise.all([
    renderRegion('[data-work-list]',async () => { await fetch(); }),
    renderRegion('[data-updates]',async () => { document.querySelector('[data-updates]').innerHTML = 'Loaded updates'; }),
  ])`);
  state.context.fetch = async () => { throw Error('offline'); };
  await state.run("renderRegion('[data-work-list]',async () => { await fetch(); })");
  await status.retry();
  assert.equal(status.hidden,false);
  assert.equal(updates.innerHTML,'Loaded updates');
  assert.equal(updateStatus.hidden,true);
  state.context.fetch = async () => ({});
  await status.retry();
  assert.equal(status.hidden,true);
});

test('HTML retains basic navigation and places status outside replaceable or hidden content',async () => {
  for (const [route,mount] of [['originals/','data-work-list'],['arrangements/','data-work-list'],['originals/list/','data-work-list'],['originals/work/','data-work-detail'],['commentary/','data-commentary-page'],['updates/','data-updates']]) {
    const html = await readFile(new URL(`../${route}index.html`,import.meta.url),'utf8');
    assert.match(html,/<header[^>]*data-site-header><nav/);
    assert.match(html,/<noscript>/);
    const statusIndex = html.indexOf(`data-load-status="[${mount}]"`);
    const contentIndex = html.search(new RegExp(`\\s${mount}(?=[\\s>])`));
    assert.ok(statusIndex > 0 && statusIndex < contentIndex,route);
    const hiddenResults = html.search(/data-(?:original|arrangement)-results hidden/);
    if (hiddenResults !== -1) assert.ok(statusIndex < hiddenResults,route);
  }
});
