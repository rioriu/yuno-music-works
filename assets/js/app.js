const script = document.querySelector('script[src$="assets/js/app.js"]');
const ROOT = new URL('../../', script.src);
const DATA = new URL('data/', ROOT);
const state = {lang: localStorage.getItem('yuno-language') === 'en' ? 'en' : 'ja'};

const C = {
  ja: {home:'ホーム',originals:'オリジナル作品',arrangements:'編曲作品',profile:'プロフィール',contact:'お問い合わせ',updates:'更新情報',menu:'メニュー',skip:'本文へ移動',language:'言語',year:'年',duration:'演奏時間',origin:'原曲',artist:'アーティスト',composer:'作曲',lyricist:'作詞',commentary:'作品解説',footer:'© YUNO / MUSIC & WORKS',noWorks:'条件に合う作品はありません。',noVideo:'動画は準備中です。',fallbackVideo:'動画を開く',loadingVideo:'動画を読み込んでいます…',videoTitle:'動画プレーヤー',sourceDescription:'YouTube概要欄を見る',backToWorks:'作品一覧へ戻る',commentaryMissing:'作品解説が見つかりませんでした。',notFound:'この作品は見つかりませんでした。',parts:'曲目',viewWork:'作品を見る',all:'すべて'},
  en: {home:'Home',originals:'Original Works',arrangements:'Arrangements',profile:'Profile',contact:'Contact',updates:'Updates',menu:'Menu',skip:'Skip to content',language:'Language',year:'Year',duration:'Duration',origin:'Original',artist:'Artist',composer:'Composer',lyricist:'Lyricist',commentary:'Commentary',footer:'© YUNO / MUSIC & WORKS',noWorks:'No works match these filters.',noVideo:'Video is being prepared.',fallbackVideo:'Open video',loadingVideo:'Loading video…',videoTitle:'Video player',sourceDescription:'View the YouTube description',backToWorks:'Back to works',commentaryMissing:'Commentary could not be found.',notFound:'This work could not be found.',parts:'Parts',viewWork:'View work',all:'All'},
};
const ENSEMBLES = {piano:{ja:'ピアノ',en:'Piano'},solo:{ja:'独奏',en:'Solo'},'solo-piano':{ja:'独奏＋ピアノ',en:'Solo & Piano'},strings:{ja:'弦楽アンサンブル',en:'String Ensemble'},woodwinds:{ja:'木管アンサンブル',en:'Woodwind Ensemble'},brass:{ja:'金管アンサンブル',en:'Brass Ensemble'},percussion:{ja:'打楽器アンサンブル',en:'Percussion Ensemble'},mixed:{ja:'混成アンサンブル',en:'Mixed Ensemble'},orchestra:{ja:'オーケストラ',en:'Orchestra'},wind:{ja:'吹奏楽',en:'Wind Ensemble'},'art-song':{ja:'歌曲',en:'Art Song'},pops:{ja:'POPS',en:'POPS'},choral:{ja:'合唱',en:'Choral Works'}};
const t = key => C[state.lang][key] || key;
const rootLink = path => new URL(path, ROOT).href;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const TRUSTED_EXTERNAL_ORIGINS = new Set(['https://www.youtube.com','https://www.nicovideo.jp','https://store.piascore.com','https://www.mymusic5.com']);
const trustedExternalUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && TRUSTED_EXTERNAL_ORIGINS.has(url.origin) ? url.href : null;
  } catch { return null; }
};
const label = (value, key) => value[`${key}_${state.lang}`] || value[`${key}_ja`] || '';
const isMultipart = work => Array.isArray(work.parts) && work.parts.length > 0;
const duration = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

function localizeStatic() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-ja][data-en]').forEach(element => { element.textContent = element.dataset[state.lang]; });
}
function renderShell() {
  const page = document.body.dataset.page;
  const nav = [['home',''],['originals','originals/'],['arrangements','arrangements/'],['profile','profile/'],['contact','contact/'],['updates','updates/']];
  document.querySelector('[data-site-header]').innerHTML = `<a class="skip-link" href="#main">${t('skip')}</a><a class="brand" href="${rootLink('')}" aria-label="YUNO / MUSIC & WORKS">YUNO / MUSIC &amp; WORKS</a><div class="header-actions"><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">${t('menu')}</button><nav class="main-nav" id="site-nav" aria-label="${t('menu')}"><ul>${nav.map(([key,url]) => `<li><a href="${rootLink(url)}"${page === key ? ' aria-current="page"' : ''}>${t(key)}</a></li>`).join('')}</ul></nav><div class="language-switch" aria-label="${t('language')}"><button type="button" data-lang="ja" aria-pressed="${state.lang === 'ja'}">日本語</button><button type="button" data-lang="en" aria-pressed="${state.lang === 'en'}">EN</button></div></div>`;
  document.querySelector('[data-site-footer]').innerHTML = `<div class="footer-inner"><span>${t('footer')}</span><a href="${rootLink('updates/')}">${t('updates')}</a></div>`;
  const navEl = document.querySelector('.main-nav'), navToggle = document.querySelector('.nav-toggle'), mobileNav = window.matchMedia('(max-width: 760px)');
  const setNav = open => { const mobile = mobileNav.matches; navEl.toggleAttribute('hidden', mobile && !open); navToggle.setAttribute('aria-expanded', String(mobile ? open : true)); };
  setNav(false); navToggle.onclick = () => setNav(navEl.hasAttribute('hidden')); mobileNav.addEventListener('change', () => setNav(false));
  document.querySelectorAll('[data-lang]').forEach(button => { button.onclick = () => { localStorage.setItem('yuno-language', button.dataset.lang); location.reload(); }; });
}
async function getJson(name) { const response = await fetch(new URL(name, DATA)); if (!response.ok) throw Error(name); return response.json(); }

function buildWorkIndex(works) {
  const byId = new Map(), bySlug = new Map();
  const add = (item, parent = null) => { byId.set(item.id, {work:item,parent}); bySlug.set(item.slug, {work:item,parent}); };
  works.forEach(work => { add(work); if (isMultipart(work)) work.parts.forEach(part => add(part, work)); });
  return {byId,bySlug};
}
function detailHref(parent, hash = '') { return `${rootLink(`originals/work/?work=${encodeURIComponent(parent.id)}`)}${hash ? `#${encodeURIComponent(hash)}` : ''}`; }
function catalogHref(work) { return rootLink(`originals/list/?ensemble=${encodeURIComponent(work.ensemble)}`); }
function commentaryHref(work) { return rootLink(`${String(work.commentary).replace(/^\/+|\/+$/g,'')}/?work=${encodeURIComponent(work.id)}`); }
function videoMarkup(work) {
  const video = work.video || {}; let src = null;
  if (video.youtube) src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtube)}?rel=0`;
  else if (video.niconico) src = `https://embed.nicovideo.jp/watch/${encodeURIComponent(video.niconico)}`;
  const fallback = trustedExternalUrl(video.fallback_url);
  if (!src) return `<p class="no-video">${t('noVideo')}${fallback ? ` <a target="_blank" rel="noopener" href="${esc(fallback)}">${t('fallbackVideo')}</a>` : ''}</p>`;
  return `<div class="video-wrap" data-video-src="${esc(src)}"><p class="video-pending">${t('loadingVideo')}</p><noscript>${fallback ? `<a target="_blank" rel="noopener" href="${esc(fallback)}">${t('fallbackVideo')}</a>` : ''}</noscript></div>`;
}
function actions(work) {
  const externalLink = item => {
    const url = trustedExternalUrl(item.url);
    return url ? `<a target="_blank" rel="noopener" href="${esc(url)}">${esc(label(item,'label'))}</a>` : '';
  };
  return [...(work.other_videos || []).map(externalLink),...(work.scores || []).map(externalLink),...(work.commentary ? [`<a href="${commentaryHref(work)}">${t('commentary')}</a>`] : [])].filter(Boolean);
}
function credits(work) {
  return [['artist_name','artist'],['composer_name','composer'],['lyricist_name','lyricist']].filter(([field]) => work[field]).map(([field,key]) => `${t(key)}: ${esc(work[field])}`).join(' · ');
}
function metadata(work, partLabel = '') {
  const ensemble = ENSEMBLES[work.ensemble]?.[state.lang];
  return `<div class="work-meta">${Number.isInteger(work.composition_year) ? `<span>${work.composition_year}${state.lang === 'ja' ? '年' : ''}</span>` : ''}${ensemble ? `<span>${esc(ensemble)}</span>` : ''}<span>${esc(label(work,'instrumentation'))}</span>${partLabel ? `<span>${esc(partLabel)}</span>` : ''}<span>${t('duration')} ${duration(work.duration_seconds)}</span></div>`;
}
function card(work) {
  const secondaryTitle = work.type === 'arrangement' ? `<p class="secondary-title">${esc(label(work,'original_title'))}</p>` : '';
  const origin = work.type === 'arrangement' ? `<p class="arrangement-origin">${t('origin')}: ${esc(label(work,'original_title'))}${credits(work) ? `<br>${credits(work)}` : ''}</p>` : credits(work) ? `<p class="arrangement-origin">${credits(work)}</p>` : '';
  const multipart = isMultipart(work), links = multipart ? [`<a class="internal-action" href="${detailHref(work)}">${t('viewWork')}</a>`] : actions(work);
  return `<article class="work" id="${esc(work.slug)}"><header class="work-heading"><div><h2><a href="${multipart ? detailHref(work) : `#${esc(work.slug)}`}">${esc(label(work,'title'))}</a></h2>${secondaryTitle}</div></header>${origin}${metadata(work, multipart ? label(work,'parts_label') : '')}${multipart ? '' : videoMarkup(work)}${links.length ? `<div class="work-actions">${links.join('')}</div>` : ''}</article>`;
}
function lazyVideos() {
  const videos = [...document.querySelectorAll('[data-video-src]')], add = element => { if (element.dataset.loaded) return; element.dataset.loaded = 'true'; const iframe = document.createElement('iframe'); iframe.loading = 'lazy'; iframe.title = t('videoTitle'); iframe.allow = 'accelerometer; encrypted-media; picture-in-picture'; iframe.referrerPolicy = 'strict-origin-when-cross-origin'; iframe.src = element.dataset.videoSrc; element.replaceChildren(iframe); };
  if (!('IntersectionObserver' in window)) { videos.forEach(add); return; }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { add(entry.target); observer.unobserve(entry.target); } }), {rootMargin:'250px 0px'}); videos.forEach(element => observer.observe(element));
}
function focusHash() {
  if (!location.hash) return; let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id); if (!target) return; target.setAttribute('tabindex','-1'); target.focus({preventScroll:true}); target.scrollIntoView();
}
async function renderCatalog() {
  const output = document.querySelector('[data-work-list]'); if (!output) return;
  const works = await getJson('works.json'), index = buildWorkIndex(works), all = works.filter(work => work.published && work.type === document.body.dataset.catalog);
  const category = document.querySelector('[name=category]'), ensemble = document.querySelector('[name=ensemble]'), sort = document.querySelector('[name=sort]'), params = new URLSearchParams(location.search);
  if (category && params.has('category')) category.value = params.get('category'); if (ensemble && params.has('ensemble')) ensemble.value = params.get('ensemble');
  if (document.body.dataset.catalog === 'original' && location.hash) { let slug; try { slug = decodeURIComponent(location.hash.slice(1)); } catch {} const hit = index.bySlug.get(slug); if (hit?.parent?.published) { location.replace(detailHref(hit.parent, hit.work.slug)); return; } }
  const render = () => {
    const items = all.filter(work => (!category || !category.value || work.category === category.value) && (!ensemble || !ensemble.value || work.ensemble === ensemble.value));
    items.sort((a,b) => { if (sort?.value === 'title') return label(a,'title').localeCompare(label(b,'title'),state.lang); if (!a.published_date && !b.published_date) return 0; if (!a.published_date) return 1; if (!b.published_date) return -1; return sort?.value === 'oldest' ? a.published_date.localeCompare(b.published_date) : b.published_date.localeCompare(a.published_date); });
    output.innerHTML = items.length ? items.map(card).join('') : `<p class="empty-state">${t('noWorks')}</p>`;
    const summary = document.querySelector('[data-filter-summary]'); if (summary) summary.textContent = ensemble?.value && ENSEMBLES[ensemble.value] ? ENSEMBLES[ensemble.value][state.lang] : t('all');
    if (document.body.dataset.catalog === 'original') { const next = new URL(location.href); if (ensemble?.value) next.searchParams.set('ensemble',ensemble.value); else next.searchParams.delete('ensemble'); history.replaceState(null,'',next); }
    lazyVideos(); requestAnimationFrame(focusHash);
  };
  [category,ensemble,sort].filter(Boolean).forEach(control => control.addEventListener('change',render)); window.addEventListener('hashchange',focusHash); render();
}
function partMarkup(parent, part) {
  const links = actions(part);
  return `<article class="work work-part" id="${esc(part.slug)}"><header class="work-heading"><h3>${esc(label(part,'title'))}</h3></header><div class="work-meta"><span>${t('duration')} ${duration(part.duration_seconds)}</span>${part.published_date ? `<span>${esc(part.published_date)}</span>` : ''}</div>${videoMarkup(part)}${links.length ? `<div class="work-actions">${links.join('')}</div>` : ''}</article>`;
}
async function renderWorkDetail() {
  const output = document.querySelector('[data-work-detail]'); if (!output) return;
  const works = await getJson('works.json'), index = buildWorkIndex(works), id = new URLSearchParams(location.search).get('work'), hit = index.byId.get(id);
  if (!hit || hit.parent || !hit.work.published || !isMultipart(hit.work)) { output.innerHTML = `<p class="empty-state">${t('notFound')}</p><p><a href="${rootLink('originals/list/')}">${t('backToWorks')}</a></p>`; return; }
  const work = hit.work; document.title = `${label(work,'title')} — YUNO`;
  output.innerHTML = `<header class="page-heading"><div class="eyebrow">Original Works</div><h1>${esc(label(work,'title'))}</h1>${credits(work) ? `<p>${credits(work)}</p>` : ''}${metadata(work,label(work,'parts_label'))}</header><section class="parts" aria-labelledby="parts-heading"><h2 id="parts-heading">${esc(label(work,'parts_heading') || t('parts'))}</h2>${work.parts.map(part => partMarkup(work,part)).join('')}</section><p class="catalog-back"><a href="${catalogHref(work)}">${t('backToWorks')}</a></p>`;
  lazyVideos(); requestAnimationFrame(focusHash);
}
async function renderUpdates() {
  const output = document.querySelector('[data-updates]'); if (!output) return; let updates = await getJson('updates.json'); const limit = Number(output.dataset.limit || 0); if (limit) updates = updates.slice(0,limit);
  output.innerHTML = updates.map(update => `<article class="update"><time datetime="${esc(update.date)}">${new Intl.DateTimeFormat(state.lang === 'ja' ? 'ja-JP' : 'en-GB',{year:'numeric',month:'short',day:'numeric'}).format(new Date(`${update.date}T00:00:00`))}</time><p>${update.link ? `<a href="${rootLink(update.link)}">${esc(label(update,'text'))}</a>` : esc(label(update,'text'))}</p></article>`).join('');
}
async function renderCommentary() {
  const output = document.querySelector('[data-commentary-page]'); if (!output) return;
  const works = await getJson('works.json'), hit = buildWorkIndex(works).byId.get(new URLSearchParams(location.search).get('work'));
  if (!hit || !hit.work.commentary) { output.innerHTML = `<p class="empty-state">${t('commentaryMissing')}</p><p><a href="${rootLink('originals/list/')}">${t('backToWorks')}</a></p>`; return; }
  const work = hit.work, back = hit.parent ? detailHref(hit.parent,work.slug) : catalogHref(work), paragraphs = (work[`commentary_${state.lang}`] || work.commentary_ja).split(/\n\n+/).map(text => `<p>${esc(text)}</p>`).join(''), source = trustedExternalUrl(work.commentary_source);
  document.title = `${label(work,'title')} — YUNO`; output.innerHTML = `<div class="eyebrow">Commentary</div><h1>${esc(label(work,'title'))}</h1><p class="commentary-lead">${esc(label(hit.parent || work,'instrumentation'))}</p><div class="commentary-body">${paragraphs}</div><div class="commentary-links">${source ? `<a target="_blank" rel="noopener" href="${esc(source)}">${t('sourceDescription')}</a>` : ''}<a href="${back}">${t('backToWorks')}</a></div>`;
}
document.addEventListener('DOMContentLoaded', async () => {
  renderShell(); localizeStatic();
  try { await Promise.all([renderCatalog(),renderWorkDetail(),renderUpdates(),renderCommentary()]); }
  catch (error) { console.error(error); document.querySelectorAll('[data-work-list],[data-work-detail],[data-updates],[data-commentary-page]').forEach(element => { if (!element.innerHTML) element.innerHTML = `<p class="empty-state">${state.lang === 'ja' ? 'コンテンツを読み込めませんでした。' : 'Content could not be loaded.'}</p>`; }); }
});
