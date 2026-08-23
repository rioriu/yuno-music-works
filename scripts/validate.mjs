import {createHash} from 'node:crypto';
import {existsSync,statSync} from 'node:fs';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors = [];
const fail = message => errors.push(message);
const read = file => readFile(path.join(root,file),'utf8');
const json = async file => { try { return JSON.parse(await read(file)); } catch (error) { fail(`${file}: invalid JSON (${error.message})`); return []; } };
const existsFile = file => existsSync(file) && statSync(file).isFile();
const localTarget = (file, url) => {
  const clean = url.split(/[?#]/,1)[0];
  const resolved = path.resolve(path.dirname(file),clean);
  if (existsSync(resolved) && statSync(resolved).isDirectory()) return path.join(resolved,'index.html');
  return resolved;
};
async function htmlFiles(dir = root) {
  const entries = await readdir(dir,{withFileTypes:true});
  return (await Promise.all(entries.filter(entry => !['.git','node_modules'].includes(entry.name)).map(entry => entry.isDirectory() ? htmlFiles(path.join(dir,entry.name)) : entry.name.endsWith('.html') ? [path.join(dir,entry.name)] : []))).flat();
}
const pages = await htmlFiles();
const works = await json('data/works.json');
const updates = await json('data/updates.json');
const appSource = await read('assets/js/app.js');
const originalSource = await read('originals/index.html');
const arrangementSource = await read('arrangements/index.html');
const originalListSource = await read('originals/list/index.html');
const originalDetailSource = await read('originals/work/index.html');
const favicon = await read('favicon.svg');

const originalEnsembles = ['piano','solo','solo-piano','strings','woodwinds','brass','percussion','mixed','orchestra','wind','art-song','choral','pops'];
const arrangementGenres = new Set(['pops','screen']);
const arrangementEnsembles = new Set(['solo','duo','ensemble']);
const topFields = ['id','slug','type','title_ja','title_en','category','composition_year','published_date','ensemble','instrumentation_ja','instrumentation_en','instruments','duration_seconds','video','other_videos','scores','commentary','tags','featured','published'];
const ids = new Set(), slugs = new Set();
let commentaryCount = 0;
const validateJapanese = (value, location = 'works') => {
  if (Array.isArray(value)) { value.forEach((item,index) => validateJapanese(item,`${location}[${index}]`)); return; }
  if (!value || typeof value !== 'object') return;
  for (const [key,item] of Object.entries(value)) {
    const next = `${location}.${key}`;
    if (key.endsWith('_ja') && typeof item === 'string') {
      if (item.includes('?') || item.includes('\uFFFD')) fail(`${next}: corrupted Japanese text`);
      if (item.includes('(') || item.includes(')')) fail(`${next}: ASCII parentheses are forbidden in Japanese content`);
    }
    validateJapanese(item,next);
  }
};
validateJapanese(works);
if (!Array.isArray(works) || !works.length) fail('works: expected a non-empty array');
if (works.length !== 75) fail(`works: expected 75 top-level works, got ${works.length}`);
if (works.some(work => work.sample === true || JSON.stringify(work).includes('example.com'))) fail('works: sample/example content is forbidden');
const validDate = value => value === null || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)));
const validSlug = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value);
const validVideo = video => video && (!video.youtube || /^[\w-]{11}$/.test(video.youtube)) && (!video.niconico || /^(sm|so)\d+$/.test(video.niconico)) && (!video.soundcloud || /^https:\/\/(?:www\.)?soundcloud\.com\/[^?#\s]+$/.test(video.soundcloud));
for (const [index,work] of works.entries()) {
  for (const field of topFields) if (!(field in work)) fail(`works[${index}]: missing ${field}`);
  if (ids.has(work.id)) fail(`works[${index}]: duplicate id`); ids.add(work.id);
  if (work.published) { if (!validSlug(work.slug)) fail(`works[${index}]: invalid published slug`); else if (slugs.has(work.slug)) fail(`works[${index}]: duplicate published slug`); else slugs.add(work.slug); }
  if (!['original','arrangement'].includes(work.type)) fail(`works[${index}]: invalid type`);
  if (work.type === 'original' && !originalEnsembles.includes(work.ensemble)) fail(`works[${index}]: invalid original ensemble`);
  if (work.type === 'arrangement') {
    if (!arrangementGenres.has(work.category)) fail(`works[${index}]: arrangement category must be pops|screen`);
    if (work.published && (typeof work.composer_name !== 'string' || !work.composer_name.trim())) fail(`works[${index}]: published arrangement requires composer_name`);
    if (work.artist_name?.includes('\u3000') || work.composer_name?.includes('\u3000')) fail(`works[${index}]: artist/composer contains U+3000`);
    if (work.title_ja !== work.original_title_ja || work.title_en !== work.original_title_en) fail(`works[${index}]: arrangement title must match original title`);
    if ((work.category === 'screen') && work.instrumentation_ja?.includes('ピアノソロ')) fail(`works[${index}]: screen arrangement cannot use ピアノソロ`);
  }
  if (work.type === 'original' && work.category === 'classical' && work.instrumentation_ja?.includes('ピアノソロ')) fail(`works[${index}]: classical original cannot use ピアノソロ`);
  if (work.type === 'arrangement' && work.category === 'pops' && work.instrumentation_ja?.includes('ピアノ独奏')) fail(`works[${index}]: POPS arrangement cannot use ピアノ独奏`);
  if (work.composition_year !== null && (!Number.isInteger(work.composition_year) || work.composition_year < 0)) fail(`works[${index}]: invalid composition_year`);
  if ('revision_year' in work && (!Number.isInteger(work.revision_year) || work.revision_year < work.composition_year)) fail(`works[${index}]: invalid revision_year`);
  if (!validDate(work.published_date)) fail(`works[${index}]: invalid published_date`);
  if (work.composition_year !== null && work.published_date && work.composition_year > Number(work.published_date.slice(0,4))) fail(`works[${index}]: composition_year is later than publication year`);
  if (work.revision_year && work.published_date && work.revision_year > Number(work.published_date.slice(0,4))) fail(`works[${index}]: revision_year is later than publication year`);
  if (!Number.isInteger(work.duration_seconds) || work.duration_seconds < 0) fail(`works[${index}]: invalid duration_seconds`);
  if (!Array.isArray(work.instruments) || !Array.isArray(work.scores) || !Array.isArray(work.other_videos) || !Array.isArray(work.tags)) fail(`works[${index}]: expected arrays`);
  if ('recognitions' in work) {
    if (!Array.isArray(work.recognitions) || !work.recognitions.length) fail(`works[${index}]: recognitions must be a non-empty array`);
    else for (const [recognitionIndex,recognition] of work.recognitions.entries()) for (const field of ['competition_ja','competition_en','result_ja','result_en']) if (typeof recognition[field] !== 'string' || !recognition[field].trim()) fail(`works[${index}].recognitions[${recognitionIndex}]: missing ${field}`);
  }
  if (!validVideo(work.video)) fail(`works[${index}]: invalid video`);
  if (work.type === 'arrangement') for (const field of ['original_title_ja','original_title_en']) if (!work[field]) fail(`works[${index}]: arrangement missing ${field}`);
  for (const item of [...work.scores,...work.other_videos]) if (!item.url || !/^https?:\/\//.test(item.url)) fail(`works[${index}]: external link must be http(s)`);
  for (const field of ['lyricist_name']) if (work[field] && !work[field].endsWith('様')) fail(`works[${index}]: ${field} must end in 様`);
  if (work.commentary) { commentaryCount++; if (!work.commentary_ja || !work.commentary_en || !work.commentary_source) fail(`works[${index}]: commentary text and source required`); if (!existsFile(path.join(root,work.commentary,'index.html'))) fail(`works[${index}]: commentary route missing`); }
  if (Array.isArray(work.parts)) {
    if (work.type !== 'original' || !work.parts.length) fail(`works[${index}]: multipart parts are invalid`);
    let durationTotal = 0, newest = null;
    for (const [partIndex,part] of work.parts.entries()) {
      for (const field of ['id','slug','title_ja','title_en','composition_year','published_date','duration_seconds','video','other_videos','scores','commentary']) if (!(field in part)) fail(`works[${index}].parts[${partIndex}]: missing ${field}`);
      if (ids.has(part.id)) fail(`works[${index}].parts[${partIndex}]: duplicate id`); ids.add(part.id);
      if (!validSlug(part.slug) || slugs.has(part.slug)) fail(`works[${index}].parts[${partIndex}]: invalid or duplicate slug`); slugs.add(part.slug);
      if (!validDate(part.published_date)) fail(`works[${index}].parts[${partIndex}]: invalid published_date`);
      if (part.composition_year !== null && (!Number.isInteger(part.composition_year) || part.composition_year < 0)) fail(`works[${index}].parts[${partIndex}]: invalid composition_year`);
      if (part.composition_year !== null && part.published_date && part.composition_year > Number(part.published_date.slice(0,4))) fail(`works[${index}].parts[${partIndex}]: composition_year is later than publication year`);
      if (!Number.isInteger(part.duration_seconds) || part.duration_seconds < 0) fail(`works[${index}].parts[${partIndex}]: invalid duration_seconds`);
      if (!Array.isArray(part.scores) || !Array.isArray(part.other_videos) || !validVideo(part.video)) fail(`works[${index}].parts[${partIndex}]: invalid arrays or video`);
      for (const item of [...part.scores,...part.other_videos]) if (!item.url || !/^https?:\/\//.test(item.url)) fail(`works[${index}].parts[${partIndex}]: external link must be http(s)`);
      if (part.commentary) { commentaryCount++; if (!part.commentary_ja || !part.commentary_en || !part.commentary_source) fail(`works[${index}].parts[${partIndex}]: commentary text and source required`); if (!existsFile(path.join(root,part.commentary,'index.html'))) fail(`works[${index}].parts[${partIndex}]: commentary route missing`); }
      durationTotal += part.duration_seconds; if (part.published_date && (!newest || part.published_date > newest)) newest = part.published_date;
    }
    if (work.duration_seconds !== durationTotal) fail(`works[${index}]: parent duration must equal parts`);
    if (work.published_date !== newest) fail(`works[${index}]: parent published_date must equal newest part`);
  }
}
for (const ensemble of originalEnsembles) if (!works.some(work => work.type === 'original' && work.ensemble === ensemble)) fail(`works: no original work for ${ensemble}`);
const publishedOriginals = works.filter(work => work.type === 'original' && work.published), publishedArrangements = works.filter(work => work.type === 'arrangement' && work.published);
if (publishedOriginals.length !== 57) fail(`works: expected 57 published originals, got ${publishedOriginals.length}`);
const originalGroupPredicates = {
  solo:work => ['piano','solo'].includes(work.ensemble),
  'solo-piano':work => work.ensemble === 'solo-piano',
  chamber:work => ['strings','woodwinds','brass','percussion','mixed'].includes(work.ensemble),
  large:work => ['wind','orchestra'].includes(work.ensemble),
  vocal:work => ['art-song','choral'].includes(work.ensemble),
  pops:work => work.category === 'pops',
};
const expectedOriginalGroupCounts = {solo:7,'solo-piano':5,chamber:18,large:5,vocal:5,pops:17};
for (const [group,predicate] of Object.entries(originalGroupPredicates)) {
  const count = publishedOriginals.filter(predicate).length;
  if (count !== expectedOriginalGroupCounts[group]) fail(`works: original group ${group} count must be ${expectedOriginalGroupCounts[group]}, got ${count}`);
}
const publishedPopsOriginals = publishedOriginals.filter(work => work.category === 'pops');
if (publishedPopsOriginals.some(work => /^(?:ボーカル|Vocal)$/i.test(work.instrumentation_ja) || /^(?:ボーカル|Vocal)$/i.test(work.instrumentation_en))) fail('works: POPS originals require a named singing character');
if (publishedPopsOriginals.some(work => !/^(?:CeVIO|VoiSona)\s+/.test(work.instrumentation_ja) || !/^(?:CeVIO|VoiSona)\s+/.test(work.instrumentation_en))) fail('works: POPS originals require a singing-software name');
for (const required of ['function singingCharacterShort',"work.category !== 'pops'",'replace(/\\bIA English\\b/gi']) if (!appSource.includes(required)) fail(`app.js: POPS singing-character display missing ${required}`);
if (appSource.includes("replace(/^(?:CeVIO|VoiSona)\\s+/i,''")) fail('app.js: POPS display must retain the singing-software name');
const originalDurationPredicates = {
  'under-3':work => work.duration_seconds < 180,
  '3-5':work => work.duration_seconds >= 180 && work.duration_seconds < 300,
  '5-10':work => work.duration_seconds >= 300 && work.duration_seconds < 600,
  '10-plus':work => work.duration_seconds >= 600,
};
const expectedOriginalDurationCounts = {'under-3':9,'3-5':20,'5-10':18,'10-plus':10};
for (const [range,predicate] of Object.entries(originalDurationPredicates)) {
  const count = publishedOriginals.filter(predicate).length;
  if (count !== expectedOriginalDurationCounts[range]) fail(`works: original duration ${range} count must be ${expectedOriginalDurationCounts[range]}, got ${count}`);
}
const originalInstrumentSets = {
  piano:['piano'],
  woodwinds:['flute','oboe','clarinet','bassoon','saxophone','alto-saxophone'],
  brass:['horn','trumpet','trombone','tuba'],
  strings:['violin','viola','cello'],
  percussion:['marimba','vibraphone','xylophone','glockenspiel','percussion','cajon'],
  voice:['voice','choir'],
};
const expectedOriginalInstrumentCounts = {piano:16,woodwinds:12,brass:5,strings:8,percussion:7,voice:5};
for (const [group,instruments] of Object.entries(originalInstrumentSets)) {
  const count = publishedOriginals.filter(work => work.category !== 'pops' && work.instruments.some(instrument => instruments.includes(instrument))).length;
  if (count !== expectedOriginalInstrumentCounts[group]) fail(`works: non-POPS original instrument ${group} count must be ${expectedOriginalInstrumentCounts[group]}, got ${count}`);
}
if (publishedArrangements.length !== 18) fail(`works: expected 18 published arrangements, got ${publishedArrangements.length}`);
if (publishedArrangements.filter(work => work.category === 'pops').length !== 15 || publishedArrangements.filter(work => work.category === 'screen').length !== 3) fail('works: arrangement category counts must be pops=15 and screen=3');
if (publishedArrangements.filter(work => work.artist_name === 'キリンジ').length !== 10) fail('works: Kirinji creator count mismatch');
const arrangementCreator = work => work.artist_name || work.composer_name || '';
if (publishedArrangements.filter(work => arrangementCreator(work) === '久石 譲').length !== 2) fail('works: Hisaishi creator count mismatch');
if (publishedArrangements.filter(work => !['キリンジ','久石 譲'].includes(arrangementCreator(work))).length !== 6) fail('works: other creator count mismatch');
if (publishedArrangements.filter(work => work.ensemble === 'solo').length !== 14 || publishedArrangements.filter(work => work.ensemble === 'duo').length !== 1 || publishedArrangements.filter(work => work.ensemble === 'ensemble').length !== 3) fail('works: arrangement ensemble counts must be solo=14, duo=1, ensemble=3');
if (publishedArrangements.some(work => work.lyricist_name && !work.lyricist_name.endsWith('様'))) fail('works: lyricist honorific missing');
if (works.find(work => work.id === 'evarlasting-nightmare')?.title_ja !== 'Everlasting Nightmare') fail('works: Everlasting Nightmare correction missing');
if (works.find(work => work.id === 'sonata-string-quartet')?.composition_year !== 2016) fail('works: sonata composition year correction missing');
if (!Array.isArray(updates) || updates.length !== 1) fail(`data/updates.json: expected one update`);
for (const [index,update] of updates.entries()) { if (!/^\d{4}-\d{2}-\d{2}$/.test(update.date) || !update.text_ja || !update.text_en) fail(`updates[${index}]: ISO date and bilingual text required`); if (update.link && !existsFile(path.join(root,update.link,'index.html'))) fail(`updates[${index}]: missing linked route ${update.link}`); }

const securityCsp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://www.youtube-nocookie.com https://embed.nicovideo.jp https://w.soundcloud.com; form-action https://formspree.io; base-uri 'self'; object-src 'none'";
const securityCsp404 = "default-src 'self'; script-src 'self' 'sha256-FZle6OXos+3f3ug6BjmOoAoRSxzst3tGXeOgv541flg='; style-src 'self' 'sha256-WEgh/1LeHk6RuhyrbXjs13j9FrZFoATLZ6f0KC3y/CA='; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://www.youtube-nocookie.com https://embed.nicovideo.jp https://w.soundcloud.com; form-action https://formspree.io; base-uri 'self'; object-src 'none'";
const allowedOrigins = new Set(['https://www.youtube.com','https://www.nicovideo.jp','https://soundcloud.com','https://www.soundcloud.com','https://store.piascore.com','https://www.mymusic5.com']);
const validExternal = value => { try { const url = new URL(value); return url.protocol === 'https:' && allowedOrigins.has(url.origin); } catch { return false; } };
const validRoute = value => typeof value === 'string' && /^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]*\/?$/.test(value) && !value.includes('..');
const routeSet = new Set(['index.html','404.html','originals/index.html','originals/list/index.html','originals/work/index.html','arrangements/index.html','commentary/index.html','profile/index.html','contact/index.html','updates/index.html']);
for (const route of routeSet) if (!existsFile(path.join(root,route))) fail(`missing route ${route}`);
let internalLinks = 0;
for (const page of pages) {
  const source = await readFile(page,'utf8'), relative = path.relative(root,page).replaceAll('\\','/'), notFound = relative === '404.html';
  if (!notFound) {
    if (!source.includes('data-site-header') || !source.includes('data-site-footer')) fail(`${relative}: missing shared shell mount`);
    if (!source.match(/<meta\s+name="description"\s+content="[^"]+"/i)) fail(`${relative}: missing fallback meta description`);
    if (!source.includes('data-page-meta=')) fail(`${relative}: missing stable page metadata key`);
    if (!source.match(/<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="[^"]*favicon\.svg"/i)) fail(`${relative}: missing relative favicon link`);
  }
  if (!notFound && /\b(?:href|src)=["']\/(?!\/)/.test(source)) fail(`${relative}: root-absolute local URL`);
  for (const pattern of ['example.com','sample','demo','placeholder','prepublication','replace before publishing','サンプル','デモ','例示','プレースホルダー','公開前','公開準備中','要差し替え']) if (source.toLocaleLowerCase().includes(pattern.toLocaleLowerCase())) fail(`${relative}: public placeholder content matches "${pattern}"`);
  for (const ref of [...source.matchAll(/\b(?:href|src)=["']([^"'#?]+)["']/g)].map(match => match[1])) {
    if (notFound || /^(https?:|mailto:|data:)/.test(ref)) continue;
    internalLinks++;
    if (!existsSync(localTarget(page,ref))) fail(`${relative}: missing local target ${ref}`);
  }
  if (!source.includes(`http-equiv="Content-Security-Policy" content="${notFound ? securityCsp404 : securityCsp}"`)) fail(`${relative}: missing or weakened CSP`);
  if (!source.includes('name="referrer" content="strict-origin-when-cross-origin"')) fail(`${relative}: missing referrer policy`);
  if (!notFound && /<(?:script|style)\b(?![^>]*\bsrc=)/i.test(source)) fail(`${relative}: inline script or style is forbidden`);
  for (const tag of source.match(/<[^>]*\btarget=["']_blank["'][^>]*>/gi) || []) if (!/\brel=["'][^"']*\bnoopener\b/i.test(tag)) fail(`${relative}: target=_blank link lacks rel=noopener`);
}
const notFound = await read('404.html');
for (const required of ["location.pathname.split('/').filter(Boolean)[0]","/\\.github\\.io$/i.test(location.hostname)","? `/${firstSegment}/` : '/'"]) if (!notFound.includes(required)) fail(`404.html: missing ${required}`);
if (!notFound.includes('document.querySelector(\'link[rel="icon"]\')') || !notFound.includes('favicon.href = `${siteBase}favicon.svg`')) fail('404.html: favicon must follow the deployment-aware site base');
if (!notFound.includes('<link rel="icon" type="image/svg+xml" href="data:,">') || /<link\s+rel="icon"[^>]+href="(?:\.\.?\/)?favicon\.svg"/i.test(notFound)) fail('404.html: favicon initial href must not fetch a relative path');
const hash = value => createHash('sha256').update(value,'utf8').digest('base64');
const inline404 = [...notFound.matchAll(/<(style|script)>([\s\S]*?)<\/\1>/gi)];
if (inline404.length !== 2) fail('404.html: expected one inline style and one inline script');
for (const [,kind,content] of inline404) if (!securityCsp404.includes(`'sha256-${hash(content)}'`)) fail(`404.html: CSP ${kind} hash does not match inline content`);
if (!favicon.includes('viewBox="0 0 64 64"') || !favicon.includes('#f7f5ef') || !favicon.includes('#0c5f63') || !favicon.includes('rx=')) fail('favicon.svg: missing required 64px cream/teal rounded-square mark');
if (/<(?:script|style|iframe|img)[^>]+src=["']https?:/i.test(favicon)) fail('favicon.svg: external dependency is forbidden');

try { new Function(appSource); } catch (error) { fail(`assets/js/app.js: invalid JavaScript syntax (${error.message})`); }
for (const required of ['const PAGE_META','function recognitionMarkup','work-recognitions','data-original-group-links','data-original-duration-links','data-original-instrument-links','function originalBrowseHref','data-original-results','viewOriginal','data-original-toggle','data-original-panel','data-arrangement-creator-links','data-arrangement-genre-links','data-arrangement-ensemble-links','function arrangementBrowseHref','data-arrangement-results','viewArrangement','arrangement-toggle-icon','data-arrangement-panel','aria-controls','history.replaceState','hashchange','iframe.allowFullscreen = true','fullscreen','data-video-title','trustedExternalUrl','IntersectionObserver','const ORIGINAL_SORTS','function normalizeOriginalListUrl']) if (!appSource.includes(required)) fail(`app.js: missing ${required}`);
if (originalSource.includes('original-overview-controls') || originalSource.includes('ensemble-section') || originalSource.includes('list/?ensemble=')) fail('originals/index.html: old overview controls or ensemble index remain');
for (const required of ['data-original-discovery','data-original-group-links','data-original-duration-links','data-original-instrument-links','data-original-all-link','data-original-results','Browse by ensemble or genre','Browse by duration','Browse by instrument']) if (!originalSource.includes(required)) fail(`originals/index.html: discovery structure missing ${required}`);
const originalInstrumentLogic = appSource.slice(appSource.indexOf('function originalMatchesInstrument'),appSource.indexOf('function originalBrowseHref'));
if (!originalInstrumentLogic.includes("work.category === 'pops'")) fail('app.js: original instrument browsing must exclude POPS works');
if (!appSource.includes("woodwinds:{ja:'木管楽器'")) fail('app.js: original woodwind label must be 木管楽器');
const originalRowLogic = appSource.slice(appSource.indexOf('function originalRow'),appSource.indexOf('function originalExpandedMarkup'));
if (!originalRowLogic.includes('data-original-toggle') || !originalRowLogic.includes('arrangement-toggle-action') || !originalRowLogic.includes('duration(work.duration_seconds)')) fail('app.js: original rows need an obvious expansion control and duration');
if (arrangementSource.includes('name="genre"') || arrangementSource.includes('arrangement-controls') || arrangementSource.includes('value="classical"')) fail('arrangements/index.html: old inline filter controls remain');
for (const required of ['data-arrangement-discovery','data-arrangement-creator-links','data-arrangement-genre-links','data-arrangement-ensemble-links','data-arrangement-all-link','data-arrangement-results','Browse by artist/composer','Browse by source genre','Browse by ensemble']) if (!arrangementSource.includes(required)) fail(`arrangements/index.html: discovery structure missing ${required}`);
const arrangementRowLogic = appSource.slice(appSource.indexOf('function arrangementRow'),appSource.indexOf('function arrangementExpandedMarkup'));
if (arrangementRowLogic.includes('published') || arrangementRowLogic.includes('arrangementDate')) fail('app.js: arrangement rows must not display publication dates');
if (!arrangementRowLogic.includes('data-arrangement-toggle') || !arrangementRowLogic.includes('arrangement-toggle-action')) fail('app.js: arrangement rows need an obvious expansion control');
if (!originalListSource.includes('Published date: newest first') || !originalListSource.includes('Published date: oldest first')) fail('originals/list/index.html: published sort labels missing');
const originalCatalogLogic = appSource.slice(appSource.indexOf('async function renderCatalog'),appSource.indexOf('function partMarkup'));
for (const required of ['let selectedEnsemble','selectedSort = params.get','if (!ORIGINAL_ENSEMBLES.includes(selectedEnsemble))','if (!ORIGINAL_SORTS.includes(selectedSort))','normalizeOriginalListUrl(selectedEnsemble,selectedSort)','selectedEnsemble = ensemble?.value ||','selectedSort = sort?.value ||']) if (!originalCatalogLogic.includes(required)) fail(`app.js: original list URL state logic missing ${required}`);
if (!originalDetailSource.includes('data-work-detail')) fail('originals/work/index.html: missing detail mount');
for (const [index,work] of works.entries()) {
  for (const item of [...work.scores,...work.other_videos]) if (!validExternal(item.url)) fail(`works[${index}]: external link must use an approved HTTPS origin`);
  for (const [partIndex,part] of (work.parts || []).entries()) for (const item of [...part.scores,...part.other_videos]) if (!validExternal(item.url)) fail(`works[${index}].parts[${partIndex}]: external link must use an approved HTTPS origin`);
  for (const item of [work,...(work.parts || [])]) {
    if (item.video?.fallback_url && !validExternal(item.video.fallback_url)) fail(`works[${index}]: fallback video URL must use an approved HTTPS origin`);
    if (item.commentary_source && !validExternal(item.commentary_source)) fail(`works[${index}]: commentary source must use an approved HTTPS origin`);
    if (item.commentary && !validRoute(item.commentary)) fail(`works[${index}]: commentary route must stay within the site`);
  }
}
for (const update of updates) if (update.link && !validRoute(update.link)) fail('updates: link must stay within the site');
const contact = await read('contact/index.html');
if (!contact.includes('action="https://formspree.io/f/meajewlw"')) fail('contact: unexpected form endpoint');
if (errors.length) { console.error('Validation failed:'); errors.forEach(error => console.error(`- ${error}`)); process.exit(1); }
console.log(`Validated ${pages.length} pages, ${works.length} top-level works, ${updates.length} update, ${commentaryCount} commentary references, and ${internalLinks} internal links.`);
