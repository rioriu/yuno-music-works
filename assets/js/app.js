const script = document.querySelector('script[src$="assets/js/app.js"]');
const ROOT = new URL('../../', script.src);
const DATA = new URL('data/', ROOT);
const state = {lang: localStorage.getItem('yuno-language') === 'en' ? 'en' : 'ja'};

const C = {
  ja: {home:'ホーム',originals:'オリジナル作品',arrangements:'編曲作品',profile:'プロフィール',contact:'お問い合わせ',updates:'更新情報',menu:'メニュー',skip:'本文へ移動',language:'言語',year:'年',duration:'演奏時間',origin:'原曲',artist:'アーティスト',composer:'作曲',lyricist:'作詞',commentary:'作品解説',footer:'© YUNO / MUSIC & WORKS',noWorks:'条件に合う作品はありません。',noVideo:'動画はありません。',fallbackVideo:'動画を開く',loadingVideo:'動画を読み込んでいます…',videoTitle:'動画プレーヤー',backToWorks:'作品一覧へ戻る',commentaryMissing:'作品解説が見つかりませんでした。',notFound:'この作品は見つかりませんでした。',parts:'曲目',viewWork:'作品を見る',all:'すべて',publishedNewest:'公開日：新しい順',publishedOldest:'公開日：古い順',results:'件',works:'作品',published:'公開日',browseCreators:'アーティスト・作曲家から探す',showing:'表示中',sourceGenre:'原曲ジャンル',filmTv:'映画・ドラマ音楽',pianoSolo:'ピアノソロ',pianoFourHands:'ピアノ連弾',chamberEnsemble:'室内楽',other:'その他',allArrangements:'すべての編曲作品',viewArrangement:'動画・関連リンクを開く',closeArrangement:'閉じる',allOriginals:'すべてのオリジナル作品',viewOriginal:'動画・作品情報を開く',closeOriginal:'閉じる',recognitions:'受賞・入選歴'},
  en: {home:'Home',originals:'Original Works',arrangements:'Arrangements',profile:'Profile',contact:'Contact',updates:'Updates',menu:'Menu',skip:'Skip to content',language:'Language',year:'Year',duration:'Duration',origin:'Original',artist:'Artist',composer:'Composer',lyricist:'Lyricist',commentary:'Commentary',footer:'© YUNO / MUSIC & WORKS',noWorks:'No works match these filters.',noVideo:'No video is available.',fallbackVideo:'Open video',loadingVideo:'Loading video…',videoTitle:'Video player',backToWorks:'Back to works',commentaryMissing:'Commentary could not be found.',notFound:'This work could not be found.',parts:'Parts',viewWork:'View work',all:'All',publishedNewest:'Published date: newest first',publishedOldest:'Published date: oldest first',results:'',works:'works',published:'Published',browseCreators:'Browse by artist/composer',showing:'Showing',sourceGenre:'Source genre',filmTv:'Film & TV Music',pianoSolo:'Piano Solo',pianoFourHands:'Piano Four Hands',chamberEnsemble:'Chamber Ensemble',other:'Other',allArrangements:'All arrangements',viewArrangement:'Open video and links',closeArrangement:'Close',allOriginals:'All original works',viewOriginal:'Open video and work information',closeOriginal:'Close',recognitions:'Awards and selections'},
};
const PAGE_META = {
  home: {ja:{title:'YUNO / MUSIC & WORKS',description:'YUNOのオリジナル作品と編曲作品を、演奏動画や楽譜へのリンクとともに紹介します。'},en:{title:'YUNO / MUSIC & WORKS',description:'Explore YUNO’s original works and arrangements with performance videos and score links.'}},
  originals: {ja:{title:'オリジナル作品 — YUNO',description:'YUNOのオリジナル作品を、編成・ジャンル、曲の長さ、楽器から探せます。'},en:{title:'Original Works — YUNO',description:'Browse YUNO’s original works by ensemble or genre, duration, and instrument.'}},
  'original-list': {ja:{title:'オリジナル作品一覧 — YUNO',description:'YUNOのオリジナル作品一覧。編成で絞り込めます。'},en:{title:'Original Works — YUNO',description:'Browse and filter YUNO’s original works by instrumentation.'}},
  'original-detail': {ja:{title:'オリジナル作品 — YUNO',description:'YUNOのオリジナル作品の詳細と各楽章・曲目。'},en:{title:'Original Work — YUNO',description:'Details and parts for a YUNO original work.'}},
  arrangements: {ja:{title:'編曲作品 — YUNO',description:'YUNOによる編曲作品を、アーティスト・作曲家、原曲ジャンル、編成から探せます。'},en:{title:'Arrangements — YUNO',description:'Browse YUNO arrangements by artist or composer, source genre, and ensemble.'}},
  commentary: {ja:{title:'作品解説 — YUNO',description:'YUNOの作品解説。'},en:{title:'Commentary — YUNO',description:'Commentary on a YUNO work.'}},
  profile: {ja:{title:'プロフィール — 宇野 芳宣 / YUNO',description:'作曲・編曲を行うYUNO（宇野 芳宣）のプロフィールと受賞歴を紹介します。'},en:{title:'Profile — Yoshinobu Uno / YUNO',description:'Profile and awards of composer and arranger YUNO (Yoshinobu Uno).'}},
  contact: {ja:{title:'お問い合わせ — YUNO',description:'YUNOへのお問い合わせフォームと公式公開チャンネルの案内です。'},en:{title:'Contact — YUNO',description:'Contact YUNO through the inquiry form or official public channels.'}},
  updates: {ja:{title:'更新情報 — YUNO',description:'YUNO / MUSIC & WORKSの作品公開情報とサイト更新履歴です。'},en:{title:'Updates — YUNO',description:'Publications and site updates for YUNO / MUSIC & WORKS.'}},
};
const ENSEMBLES = {piano:{ja:'ピアノ',en:'Piano'},solo:{ja:'独奏',en:'Solo'},'solo-piano':{ja:'独奏＋ピアノ',en:'Solo & Piano'},strings:{ja:'弦楽アンサンブル',en:'String Ensemble'},woodwinds:{ja:'木管アンサンブル',en:'Woodwind Ensemble'},brass:{ja:'金管アンサンブル',en:'Brass Ensemble'},percussion:{ja:'打楽器アンサンブル',en:'Percussion Ensemble'},mixed:{ja:'混成アンサンブル',en:'Mixed Ensemble'},orchestra:{ja:'オーケストラ',en:'Orchestra'},wind:{ja:'吹奏楽',en:'Wind Ensemble'},'art-song':{ja:'歌曲',en:'Art Song'},pops:{ja:'POPS',en:'POPS'},choral:{ja:'合唱',en:'Choral Works'}};
const ORIGINAL_ENSEMBLES = Object.keys(ENSEMBLES);
const ORIGINAL_GROUPS = {
  solo:{ja:'ソロ（ピアノを含む）',en:'Solo (including piano)',ensembles:['piano','solo']},
  'solo-piano':{ja:'独奏＋ピアノ',en:'Solo & Piano',ensembles:['solo-piano']},
  chamber:{ja:'室内楽・アンサンブル',en:'Chamber Music & Ensembles',ensembles:['strings','woodwinds','brass','percussion','mixed']},
  large:{ja:'吹奏楽・オーケストラ',en:'Wind Ensemble & Orchestra',ensembles:['wind','orchestra']},
  vocal:{ja:'声楽・合唱',en:'Vocal & Choral',ensembles:['art-song','choral']},
  pops:{ja:'POPS',en:'POPS',category:'pops'},
};
const ORIGINAL_DURATIONS = {
  'under-3':{ja:'3分未満',en:'Under 3 minutes',min:0,max:180},
  '3-5':{ja:'3〜5分',en:'3–5 minutes',min:180,max:300},
  '5-10':{ja:'5〜10分',en:'5–10 minutes',min:300,max:600},
  '10-plus':{ja:'10分以上',en:'10 minutes or longer',min:600,max:Infinity},
};
const ORIGINAL_INSTRUMENTS = {
  piano:{ja:'ピアノ',en:'Piano',instruments:['piano']},
  woodwinds:{ja:'木管楽器',en:'Woodwind Instruments',instruments:['flute','oboe','clarinet','bassoon','saxophone','alto-saxophone']},
  brass:{ja:'金管楽器',en:'Brass Instruments',instruments:['horn','trumpet','trombone','tuba']},
  strings:{ja:'弦楽器',en:'String Instruments',instruments:['violin','viola','cello']},
  percussion:{ja:'打楽器',en:'Percussion Instruments',instruments:['marimba','vibraphone','xylophone','glockenspiel','percussion','cajon']},
  voice:{ja:'声・合唱',en:'Voice & Choir',instruments:['voice','choir']},
};
const ARRANGEMENT_GENRES = ['pops','screen'];
const ARRANGEMENT_ENSEMBLES = ['solo','duo','ensemble'];
const ARRANGEMENT_SORTS = ['newest','oldest','title'];
const ORIGINAL_SORTS = ['newest','oldest','title'];
const t = key => C[state.lang][key] || key;
const rootLink = path => new URL(path, ROOT).href;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const TRUSTED_EXTERNAL_ORIGINS = new Set(['https://www.youtube.com','https://www.nicovideo.jp','https://soundcloud.com','https://www.soundcloud.com','https://store.piascore.com','https://www.mymusic5.com']);
const trustedExternalUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && TRUSTED_EXTERNAL_ORIGINS.has(url.origin) ? url.href : null;
  } catch { return null; }
};
const label = (value, key) => value[`${key}_${state.lang}`] || value[`${key}_ja`] || '';
const isMultipart = work => Array.isArray(work.parts) && work.parts.length > 0;
const duration = seconds => {
  const halfMinutes = Math.round(Number(seconds) / 30);
  const minutes = Math.floor(halfMinutes / 2);
  const half = halfMinutes % 2;
  return state.lang === 'ja' ? `約${minutes}分${half ? '半' : ''}` : `about ${minutes + (half ? 0.5 : 0)} min.`;
};
const hidesDuration = work => work?.type === 'arrangement' || (work?.type === 'original' && work?.ensemble === 'pops');
const durationMarkup = (work, parent = work) => hidesDuration(work) || hidesDuration(parent) ? '' : `<p class="work-duration">${t('duration')} ${duration(work.duration_seconds)}</p>`;

function setDescription(value) {
  let element = document.querySelector('meta[name="description"]');
  if (!element) { element = document.createElement('meta'); element.name = 'description'; document.head.appendChild(element); }
  element.content = value;
}
function renderPageMeta() {
  const key = document.body.dataset.pageMeta || document.body.dataset.page || 'home';
  const meta = PAGE_META[key] || PAGE_META.home;
  document.title = meta[state.lang].title;
  setDescription(meta[state.lang].description);
}
function localizeStatic() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-ja][data-en]').forEach(element => { element.textContent = element.dataset[state.lang]; });
}
function renderShell() {
  const page = document.body.dataset.page;
  const nav = [['home',''],['originals','originals/'],['arrangements','arrangements/'],['profile','profile/'],['contact','contact/'],['updates','updates/']];
  document.querySelector('[data-site-header]').innerHTML = `<a class="skip-link" href="#main">${t('skip')}</a><a class="brand" href="${rootLink('')}" aria-label="YUNO / MUSIC & WORKS">YUNO / MUSIC &amp; WORKS</a><div class="header-actions"><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="${t('menu')}"><span class="nav-toggle-icon" aria-hidden="true"><span></span><span></span><span></span></span><span class="visually-hidden">${t('menu')}</span></button><nav class="main-nav" id="site-nav" aria-label="${t('menu')}"><ul>${nav.map(([key,url]) => `<li><a href="${rootLink(url)}"${page === key ? ' aria-current="page"' : ''}>${t(key)}</a></li>`).join('')}</ul></nav><div class="language-switch" aria-label="${t('language')}"><button type="button" data-lang="ja" aria-pressed="${state.lang === 'ja'}">日本語</button><button type="button" data-lang="en" aria-pressed="${state.lang === 'en'}">EN</button></div></div>`;
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
function originalGroupFromEnsemble(ensemble) {
  if (ensemble === 'pops') return 'pops';
  return Object.entries(ORIGINAL_GROUPS).find(([,group]) => group.ensembles?.includes(ensemble))?.[0] || '';
}
function originalGroupValue(work) { return work.category === 'pops' ? 'pops' : originalGroupFromEnsemble(work.ensemble); }
function catalogHref(work) { return rootLink(`originals/?group=${encodeURIComponent(originalGroupValue(work))}`); }
function commentaryHref(work) { return rootLink(`${String(work.commentary).replace(/^\/+|\/+$/g,'')}/?work=${encodeURIComponent(work.id)}`); }

function videoSource(work) {
  const video = work.video || {};
  if (video.youtube) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtube)}?rel=0`;
  if (video.niconico) return `https://embed.nicovideo.jp/watch/${encodeURIComponent(video.niconico)}`;
  if (video.soundcloud) {
    const track = trustedExternalUrl(video.soundcloud);
    if (track) return `https://w.soundcloud.com/player/?visual=true&url=${encodeURIComponent(track)}&show_artwork=true`;
  }
  return null;
}
function videoMarkup(work) {
  const src = videoSource(work), fallback = trustedExternalUrl(work.video?.fallback_url), title = `${label(work,'title')} — ${t('videoTitle')}`;
  if (!src) return `<p class="no-video">${t('noVideo')}${fallback ? ` <a target="_blank" rel="noopener" href="${esc(fallback)}">${t('fallbackVideo')}</a>` : ''}</p>`;
  return `<div class="video-wrap" data-video-src="${esc(src)}" data-video-title="${esc(title)}"><p class="video-pending">${t('loadingVideo')}</p><noscript>${fallback ? `<a target="_blank" rel="noopener" href="${esc(fallback)}">${t('fallbackVideo')}</a>` : ''}</noscript></div>`;
}
function mountVideo(element) {
  if (!element || element.dataset.loaded) return;
  element.dataset.loaded = 'true';
  const iframe = document.createElement('iframe');
  iframe.loading = 'lazy';
  iframe.title = element.dataset.videoTitle || t('videoTitle');
  iframe.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  iframe.setAttribute('allowfullscreen','');
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.src = element.dataset.videoSrc;
  element.replaceChildren(iframe);
}
function lazyVideos() {
  const videos = [...document.querySelectorAll('[data-video-src]')];
  if (!('IntersectionObserver' in window)) { videos.forEach(mountVideo); return; }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { mountVideo(entry.target); observer.unobserve(entry.target); } }), {rootMargin:'250px 0px'});
  videos.forEach(element => observer.observe(element));
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
function arrangementCredits(work) {
  const parts = [];
  if (work.artist_name && work.artist_name === work.composer_name) parts.push(`${t('composer')}: ${esc(work.composer_name)}`);
  else {
    if (work.artist_name) parts.push(`${t('artist')}: ${esc(work.artist_name)}`);
    if (work.composer_name) parts.push(`${t('composer')}: ${esc(work.composer_name)}`);
  }
  if (work.lyricist_name) parts.push(`${t('lyricist')}: ${esc(work.lyricist_name)}`);
  return parts.join(' · ');
}
function recognitionMarkup(work) {
  if (!Array.isArray(work.recognitions) || !work.recognitions.length) return '';
  const separator = state.lang === 'ja' ? '　' : ' — ';
  const items = work.recognitions.map(item => `<span class="work-recognition">${esc(label(item,'competition'))}${separator}${esc(label(item,'result'))}</span>`).join('');
  return `<span class="work-recognitions" aria-label="${esc(t('recognitions'))}">${items}</span>`;
}
function metadata(work, partLabel = '') {
  return `<div class="work-meta"><span class="work-meta-ensemble">${esc(instrumentationShort(work))}</span>${Number.isInteger(work.composition_year) ? `<span>${work.composition_year}${state.lang === 'ja' ? '年' : ''}</span>` : ''}${partLabel ? `<span>${esc(partLabel)}</span>` : ''}</div>`;
}
function originalCard(work) {
  const title = label(work,'title'), multipart = isMultipart(work), links = multipart ? [`<a class="internal-action" href="${detailHref(work)}">${t('viewWork')}</a>`] : actions(work);
  return `<article class="work" id="${esc(work.slug)}"><header class="work-heading"><div><h2><a href="${multipart ? detailHref(work) : `#${esc(work.slug)}`}"${multipart ? '' : ' class="work-anchor"'}>${esc(title)}</a></h2>${recognitionMarkup(work)}</div></header>${metadata(work, multipart ? label(work,'parts_label') : '')}${multipart ? '' : videoMarkup(work)}${multipart ? '' : durationMarkup(work)}${links.length ? `<div class="work-actions">${links.join('')}</div>` : ''}</article>`;
}
function singingCharacterShort(work, japanese, english) {
  if (work.type !== 'original' || work.category !== 'pops' || !work.instruments?.includes('voice')) return '';
  const value = (state.lang === 'ja' ? japanese : english) || japanese || english;
  return value
    .replace(/（歌唱）$/,'')
    .replace(/\s+voices?$/i,'')
    .replace(/\bIA English\b/gi,'IA')
    .trim();
}
function instrumentationShort(work) {
  const japanese = work.instrumentation_ja || '', english = work.instrumentation_en || '';
  const singingCharacters = singingCharacterShort(work,japanese,english);
  if (singingCharacters) return singingCharacters;
  if (state.lang === 'en') return english || japanese;
  const japaneseOverrides = {'右手のためのピアノ独奏':'右手ピアノ独奏','ピアノ独奏':'ピアノ独奏','ピアノソロ':'ピアノソロ','ピアノ連弾':'ピアノ連弾','チェロ五重奏':'チェロ五重奏','サックス四重奏':'サックス四重奏','トロンボーン四重奏':'トロンボーン四重奏','ヴァイオリン二重奏':'ヴァイオリン二重奏','ホルン独奏':'ホルン独奏','シロフォン独奏':'シロフォン独奏'};
  if (japaneseOverrides[japanese]) return japaneseOverrides[japanese];
  if (new Set(['打楽器六重奏','吹奏楽','混声合唱','室内オーケストラ','弦楽四重奏','ボーカル']).has(japanese)) return japanese;
  let value = japanese || english;
  value = value.replace(/アルトサクソフォン/g, 'A.Sax.').replace(/サクソフォン|サックス/g, 'Sax.').replace(/トランペット/g, 'Trp.').replace(/トロンボーン/g, 'Trb.').replace(/チューバ/g, 'Tba.').replace(/ホルン/g, 'Hn.').replace(/フルート/g, 'Fl.').replace(/オーボエ/g, 'Ob.').replace(/クラリネット/g, 'Cl.').replace(/ファゴット/g, 'Bn.').replace(/ヴァイオリン/g, 'Vn.').replace(/ヴィオラ|ビオラ/g, 'Va.').replace(/チェロ/g, 'Vc.').replace(/ピアノ/g, 'Pf.').replace(/マリンバ/g, 'Mar.').replace(/ヴィブラフォン/g, 'Vib.').replace(/グロッケンシュピール/g, 'Glsp.').replace(/シロフォン/g, 'Xyl.').replace(/打楽器/g, 'Perc.').replace(/カホン/g, 'Caj.');
  return value.replace(/[＋、]/g, ' + ').replace(/\.(?=[\u3040-\u30ff\u3400-\u9fff\d])/g, '. ').replace(/\s{2,}/g, ' ').trim();
}

function readHash() {
  try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; }
}
function focusHash() {
  const id = readHash(); if (!id) return;
  const target = document.getElementById(id); if (!target) return;
  target.setAttribute('tabindex','-1'); target.focus({preventScroll:true}); target.scrollIntoView();
}
function replaceUrl(params) {
  const next = new URL(location.href);
  next.search = params.toString();
  history.replaceState(null,'',next);
}
function normalizeOriginalListUrl(ensemble, sort) {
  const next = new URLSearchParams(location.search);
  if (ensemble) next.set('ensemble',ensemble); else next.delete('ensemble');
  if (sort === 'newest') next.delete('sort'); else next.set('sort',sort);
  replaceUrl(next);
}
function originalCountText(count) { return state.lang === 'ja' ? `${count}${t('works')}` : `${count} ${t('works')}`; }

function originalMatchesGroup(work, value) {
  const group = ORIGINAL_GROUPS[value];
  if (!group) return false;
  if (group.category) return work.category === group.category;
  return group.ensembles.includes(work.ensemble);
}
function originalMatchesDuration(work, value) {
  const range = ORIGINAL_DURATIONS[value];
  return Boolean(range && work.duration_seconds >= range.min && work.duration_seconds < range.max);
}
function originalMatchesInstrument(work, value) {
  const group = ORIGINAL_INSTRUMENTS[value];
  if (!group || work.category === 'pops') return false;
  return work.instruments.some(instrument => group.instruments.includes(instrument));
}
function originalBrowseHref(key, value) {
  const params = new URLSearchParams(); params.set(key,value);
  return `${rootLink('originals/')}?${params}`;
}
function originalBrowseLink(text, count, key, value) {
  return `<a class="arrangement-discovery-link" href="${esc(originalBrowseHref(key,value))}"><span>${esc(text)}</span><strong>${count}</strong><span class="arrangement-discovery-arrow" aria-hidden="true">→</span></a>`;
}
function renderOriginalDiscovery(works) {
  const groupMount = document.querySelector('[data-original-group-links]'), durationMount = document.querySelector('[data-original-duration-links]'), instrumentMount = document.querySelector('[data-original-instrument-links]'), allMount = document.querySelector('[data-original-all-link]');
  if (groupMount) groupMount.innerHTML = Object.entries(ORIGINAL_GROUPS).map(([value,group]) => originalBrowseLink(group[state.lang],works.filter(work => originalMatchesGroup(work,value)).length,'group',value)).join('');
  if (durationMount) durationMount.innerHTML = Object.entries(ORIGINAL_DURATIONS).map(([value,range]) => originalBrowseLink(range[state.lang],works.filter(work => originalMatchesDuration(work,value)).length,'duration',value)).join('');
  if (instrumentMount) instrumentMount.innerHTML = Object.entries(ORIGINAL_INSTRUMENTS).map(([value,group]) => originalBrowseLink(group[state.lang],works.filter(work => originalMatchesInstrument(work,value)).length,'instrument',value)).join('');
  if (allMount) allMount.innerHTML = `<a href="${esc(originalBrowseHref('view','all'))}">${t('allOriginals')} <span aria-hidden="true">→</span></a>`;
}
function originalSelectionLabel(group, durationValue, instrument) {
  const labels = [
    ORIGINAL_GROUPS[group]?.[state.lang],
    ORIGINAL_DURATIONS[durationValue]?.[state.lang],
    ORIGINAL_INSTRUMENTS[instrument]?.[state.lang],
  ].filter(Boolean);
  if (!labels.length) return t('allOriginals');
  return state.lang === 'ja' ? `${labels.join('・')}の作品` : `${labels.join(' / ')} works`;
}
function originalRow(work) {
  const slug = esc(work.slug), panel = `original-panel-${slug}`, credit = credits(work);
  const meta = [
    Number.isInteger(work.composition_year) ? `${work.composition_year}${state.lang === 'ja' ? '年' : ''}` : '',
    duration(work.duration_seconds),
    isMultipart(work) ? label(work,'parts_label') : '',
  ].filter(Boolean);
  return `<article class="arrangement-row original-row" id="${slug}" data-original-row data-slug="${slug}"><button class="arrangement-toggle original-toggle" type="button" data-original-toggle data-slug="${slug}" aria-expanded="false" aria-controls="${panel}"><span class="arrangement-toggle-main"><span class="arrangement-title">${esc(label(work,'title'))}</span>${credit ? `<span class="arrangement-credit">${credit}</span>` : ''}${recognitionMarkup(work)}<span class="work-meta arrangement-meta"><span class="work-meta-ensemble">${esc(instrumentationShort(work))}</span>${meta.map(value => `<span>${esc(value)}</span>`).join('')}</span></span><span class="arrangement-toggle-action"><span class="original-toggle-label">${t('viewOriginal')}</span><span class="arrangement-toggle-icon" aria-hidden="true">＋</span></span></button><div class="arrangement-panel original-panel" id="${panel}" data-original-panel hidden></div></article>`;
}
function originalExpandedMarkup(work) {
  if (isMultipart(work)) {
    const headingId = `${esc(work.slug)}-parts-title`;
    const parts = work.parts.map(part => `<li><a href="${detailHref(work,part.slug)}">${esc(label(part,'title'))}</a><span>${esc(duration(part.duration_seconds))}</span></li>`).join('');
    const links = [...actions(work),`<a class="internal-action" href="${detailHref(work)}">${t('viewWork')}</a>`];
    return `<div class="original-expanded"><section class="original-parts-summary" aria-labelledby="${headingId}"><h3 id="${headingId}">${t('parts')}</h3><ol>${parts}</ol></section><div class="work-actions">${links.join('')}</div></div>`;
  }
  const links = actions(work);
  return `<div class="original-expanded"><div class="arrangement-video">${videoMarkup(work)}</div>${links.length ? `<div class="work-actions">${links.join('')}</div>` : ''}</div>`;
}
async function renderOriginalDiscoveryCatalog(works) {
  const output = document.querySelector('[data-work-list]'); if (!output) return;
  const discovery = document.querySelector('[data-original-discovery]'), results = document.querySelector('[data-original-results]'), all = works.filter(work => work.published && work.type === 'original');
  renderOriginalDiscovery(all);
  const params = new URLSearchParams(location.search), legacyEnsemble = params.get('ensemble');
  let selectedGroup = params.get('group') || '', selectedDuration = params.get('duration') || '', selectedInstrument = params.get('instrument') || '', showAll = params.get('view') === 'all';
  if (!selectedGroup && ORIGINAL_ENSEMBLES.includes(legacyEnsemble)) selectedGroup = originalGroupFromEnsemble(legacyEnsemble);
  if (!ORIGINAL_GROUPS[selectedGroup]) selectedGroup = '';
  if (!ORIGINAL_DURATIONS[selectedDuration]) selectedDuration = '';
  if (!ORIGINAL_INSTRUMENTS[selectedInstrument]) selectedInstrument = '';
  if (params.has('view') && !showAll) params.delete('view');
  const index = buildWorkIndex(all), hashSlug = readHash(), hashHit = index.bySlug.get(hashSlug);
  if (hashHit?.parent) { location.replace(detailHref(hashHit.parent,hashHit.work.slug)); return; }
  const hashWork = hashHit && !hashHit.parent ? hashHit.work : null;
  if (hashSlug && !hashWork) clearLocationHash();
  const showResults = showAll || Boolean(selectedGroup || selectedDuration || selectedInstrument || hashWork);
  if (selectedGroup || selectedDuration || selectedInstrument) showAll = false;
  const normalize = () => {
    const next = new URLSearchParams(location.search);
    next.delete('ensemble'); next.delete('category'); next.delete('sort');
    selectedGroup ? next.set('group',selectedGroup) : next.delete('group');
    selectedDuration ? next.set('duration',selectedDuration) : next.delete('duration');
    selectedInstrument ? next.set('instrument',selectedInstrument) : next.delete('instrument');
    showAll ? next.set('view','all') : next.delete('view');
    replaceUrl(next);
  };
  normalize();
  if (discovery) discovery.hidden = showResults;
  if (results) results.hidden = !showResults;
  if (!showResults) { output.replaceChildren(); return; }
  let expandedSlug = null;
  const closeExpanded = (clearHash = false) => {
    output.querySelectorAll('[data-original-panel]').forEach(panel => { panel.replaceChildren(); panel.hidden = true; });
    output.querySelectorAll('[data-original-toggle]').forEach(button => {
      button.setAttribute('aria-expanded','false');
      const buttonLabel = button.querySelector('.original-toggle-label'), icon = button.querySelector('.arrangement-toggle-icon');
      if (buttonLabel) buttonLabel.textContent = t('viewOriginal');
      if (icon) icon.textContent = '＋';
    });
    expandedSlug = null;
    if (clearHash) clearLocationHash();
  };
  const openExpanded = (slug, updateHash = true) => {
    const row = document.getElementById(slug), work = all.find(item => item.slug === slug);
    if (!row?.matches('[data-original-row]') || !work) return false;
    if (expandedSlug && expandedSlug !== slug) closeExpanded(false);
    const button = row.querySelector('[data-original-toggle]'), panel = row.querySelector('[data-original-panel]');
    button.setAttribute('aria-expanded','true');
    const buttonLabel = button.querySelector('.original-toggle-label'), icon = button.querySelector('.arrangement-toggle-icon');
    if (buttonLabel) buttonLabel.textContent = t('closeOriginal');
    if (icon) icon.textContent = '−';
    panel.hidden = false;
    panel.innerHTML = originalExpandedMarkup(work);
    panel.querySelectorAll('[data-video-src]').forEach(mountVideo);
    expandedSlug = slug;
    if (updateHash && readHash() !== slug) { const next = new URL(location.href); next.hash = slug; history.replaceState(null,'',next); }
    return true;
  };
  const handleHash = () => {
    const slug = readHash();
    if (!slug) { if (expandedSlug) closeExpanded(false); return; }
    if (!openExpanded(slug,false)) { if (expandedSlug) closeExpanded(false); clearLocationHash(); }
  };
  const render = () => {
    const priorSlug = expandedSlug || readHash();
    const items = all.filter(work => (!selectedGroup || originalMatchesGroup(work,selectedGroup)) && (!selectedDuration || originalMatchesDuration(work,selectedDuration)) && (!selectedInstrument || originalMatchesInstrument(work,selectedInstrument)));
    items.sort((a,b) => {
      const yearDifference = (Number.isInteger(b.composition_year) ? b.composition_year : -Infinity) - (Number.isInteger(a.composition_year) ? a.composition_year : -Infinity);
      if (yearDifference) return yearDifference;
      const dateDifference = (b.published_date || '').localeCompare(a.published_date || '');
      return dateDifference || label(a,'title').localeCompare(label(b,'title'),state.lang);
    });
    output.innerHTML = items.length ? items.map(originalRow).join('') : `<p class="empty-state">${t('noWorks')}</p>`;
    const count = document.querySelector('[data-original-count]'), status = document.querySelector('[data-original-status]'), title = document.querySelector('[data-original-results-title]');
    if (title) title.textContent = originalSelectionLabel(selectedGroup,selectedDuration,selectedInstrument);
    if (count) count.textContent = originalCountText(items.length);
    if (status) status.textContent = state.lang === 'ja' ? `${items.length}件のオリジナル作品を表示` : `${t('showing')} ${items.length} original work${items.length === 1 ? '' : 's'}`;
    output.querySelectorAll('[data-original-toggle]').forEach(button => button.addEventListener('click', () => {
      const slug = button.dataset.slug;
      if (expandedSlug === slug) closeExpanded(true); else openExpanded(slug,true);
    }));
    if (priorSlug && items.some(item => item.slug === priorSlug)) openExpanded(priorSlug,false);
    else if (priorSlug) closeExpanded(true);
  };
  window.addEventListener('hashchange',handleHash);
  render();
}

function arrangementCreator(work) { return work.artist_name || work.composer_name || ''; }
function arrangementCreatorCounts(works) {
  const counts = new Map(); works.forEach(work => { const creator = arrangementCreator(work); if (creator) counts.set(creator,(counts.get(creator) || 0) + 1); });
  return [...counts.entries()].sort(([a,countA],[b,countB]) => countB - countA || a.localeCompare(b,state.lang === 'ja' ? 'ja-JP' : 'en',{sensitivity:'base'}));
}
const ARRANGEMENT_FEATURED_CREATORS = ['キリンジ','久石 譲'];
function arrangementBrowseHref(key, value) {
  const params = new URLSearchParams(); params.set(key,value);
  return `${rootLink('arrangements/')}?${params}`;
}
function arrangementBrowseLink(text, count, key, value) {
  return `<a class="arrangement-discovery-link" href="${esc(arrangementBrowseHref(key,value))}"><span>${esc(text)}</span><strong>${count}</strong><span class="arrangement-discovery-arrow" aria-hidden="true">→</span></a>`;
}
function renderArrangementDiscovery(works) {
  const creatorMount = document.querySelector('[data-arrangement-creator-links]'), genreMount = document.querySelector('[data-arrangement-genre-links]'), ensembleMount = document.querySelector('[data-arrangement-ensemble-links]'), allMount = document.querySelector('[data-arrangement-all-link]');
  const creatorCount = creator => works.filter(work => arrangementCreator(work) === creator).length;
  const creatorLinks = [
    ['キリンジ',creatorCount('キリンジ'),'キリンジ'],
    [state.lang === 'ja' ? '久石 譲' : 'Joe Hisaishi',creatorCount('久石 譲'),'久石 譲'],
    [t('other'),works.filter(work => !ARRANGEMENT_FEATURED_CREATORS.includes(arrangementCreator(work))).length,'other'],
  ];
  if (creatorMount) creatorMount.innerHTML = creatorLinks.map(([text,count,value]) => arrangementBrowseLink(text,count,'creator',value)).join('');
  if (genreMount) genreMount.innerHTML = [
    arrangementBrowseLink(state.lang === 'ja' ? 'ポップス' : 'POPS',works.filter(work => work.category === 'pops').length,'genre','pops'),
    arrangementBrowseLink(t('filmTv'),works.filter(work => work.category === 'screen').length,'genre','screen'),
  ].join('');
  if (ensembleMount) ensembleMount.innerHTML = [
    arrangementBrowseLink(t('pianoSolo'),works.filter(work => work.ensemble === 'solo').length,'ensemble','solo'),
    arrangementBrowseLink(t('pianoFourHands'),works.filter(work => work.ensemble === 'duo').length,'ensemble','duo'),
    arrangementBrowseLink(t('chamberEnsemble'),works.filter(work => work.ensemble === 'ensemble').length,'ensemble','ensemble'),
  ].join('');
  if (allMount) allMount.innerHTML = `<a href="${esc(arrangementBrowseHref('view','all'))}">${t('allArrangements')} <span aria-hidden="true">→</span></a>`;
}
function arrangementSelectionLabel(creator, genre, ensemble) {
  const labels = [];
  if (creator) labels.push(creator === 'other' ? t('other') : creator === '久石 譲' && state.lang === 'en' ? 'Joe Hisaishi' : creator);
  if (genre) labels.push(genre === 'pops' ? (state.lang === 'ja' ? 'ポップス' : 'POPS') : t('filmTv'));
  if (ensemble) labels.push({solo:t('pianoSolo'),duo:t('pianoFourHands'),ensemble:t('chamberEnsemble')}[ensemble]);
  if (!labels.length) return t('allArrangements');
  return state.lang === 'ja' ? `${labels.join('・')}の編曲作品` : `${labels.join(' / ')} arrangements`;
}
function arrangementRow(work) {
  const slug = esc(work.slug), panel = `arrangement-panel-${slug}`;
  return `<article class="arrangement-row" id="${slug}" data-arrangement-row data-slug="${slug}"><button class="arrangement-toggle" type="button" data-arrangement-toggle data-slug="${slug}" aria-expanded="false" aria-controls="${panel}"><span class="arrangement-toggle-main"><span class="arrangement-title">${esc(label(work,'title'))}</span><span class="arrangement-credit">${arrangementCredits(work)}</span><span class="work-meta arrangement-meta"><span>${esc(instrumentationShort(work))}</span></span></span><span class="arrangement-toggle-action"><span class="arrangement-toggle-label">${t('viewArrangement')}</span><span class="arrangement-toggle-icon" aria-hidden="true">＋</span></span></button><div class="arrangement-panel" id="${panel}" data-arrangement-panel hidden></div></article>`;
}
function arrangementExpandedMarkup(work) {
  const links = actions(work);
  return `<div class="arrangement-expanded"><div class="arrangement-video">${videoMarkup(work)}</div>${links.length ? `<div class="work-actions">${links.join('')}</div>` : ''}</div>`;
}
function clearLocationHash() {
  if (!location.hash) return;
  const next = new URL(location.href); next.hash = ''; history.replaceState(null,'',next);
}
async function renderArrangementCatalog(works) {
  const output = document.querySelector('[data-work-list]'); if (!output) return;
  const discovery = document.querySelector('[data-arrangement-discovery]'), results = document.querySelector('[data-arrangement-results]'), all = works.filter(work => work.published && work.type === 'arrangement');
  renderArrangementDiscovery(all);
  const params = new URLSearchParams(location.search), creatorValues = new Set(arrangementCreatorCounts(all).map(([creator]) => creator));
  creatorValues.add('other');
  let selectedCreator = params.get('creator') || '', selectedGenre = params.get('genre') || '', selectedEnsemble = params.get('ensemble') || '', selectedSort = params.get('sort') || 'newest', showAll = params.get('view') === 'all';
  if (!creatorValues.has(selectedCreator)) selectedCreator = '';
  if (!ARRANGEMENT_GENRES.includes(selectedGenre)) selectedGenre = '';
  if (!ARRANGEMENT_ENSEMBLES.includes(selectedEnsemble)) selectedEnsemble = '';
  if (!ARRANGEMENT_SORTS.includes(selectedSort)) selectedSort = 'newest';
  if (params.has('view') && !showAll) params.delete('view');
  const hashSlug = readHash(), hashWork = all.find(work => work.slug === hashSlug);
  if (hashSlug && !hashWork) clearLocationHash();
  const showResults = showAll || Boolean(selectedCreator || selectedGenre || selectedEnsemble || selectedSort !== 'newest' || hashWork);
  if (selectedCreator || selectedGenre || selectedEnsemble) showAll = false;
  const normalize = () => { const next = new URLSearchParams(location.search); next.delete('category'); selectedCreator ? next.set('creator',selectedCreator) : next.delete('creator'); selectedGenre ? next.set('genre',selectedGenre) : next.delete('genre'); selectedEnsemble ? next.set('ensemble',selectedEnsemble) : next.delete('ensemble'); selectedSort !== 'newest' ? next.set('sort',selectedSort) : next.delete('sort'); showAll ? next.set('view','all') : next.delete('view'); replaceUrl(next); };
  normalize();
  if (discovery) discovery.hidden = showResults;
  if (results) results.hidden = !showResults;
  if (!showResults) { output.replaceChildren(); return; }
  let expandedSlug = null;
  const closeExpanded = (clearHash = false) => { output.querySelectorAll('[data-arrangement-panel]').forEach(panel => { panel.replaceChildren(); panel.hidden = true; }); output.querySelectorAll('[data-arrangement-toggle]').forEach(button => { button.setAttribute('aria-expanded','false'); const label = button.querySelector('.arrangement-toggle-label'), icon = button.querySelector('.arrangement-toggle-icon'); if (label) label.textContent = t('viewArrangement'); if (icon) icon.textContent = '＋'; }); expandedSlug = null; if (clearHash) clearLocationHash(); };
  const openExpanded = (slug, updateHash = true) => {
    const row = document.getElementById(slug), work = all.find(item => item.slug === slug);
    if (!row?.matches('[data-arrangement-row]')) return false;
    if (!row || !work) return false;
    if (expandedSlug && expandedSlug !== slug) closeExpanded(false);
    const button = row.querySelector('[data-arrangement-toggle]'), panel = row.querySelector('[data-arrangement-panel]');
    button.setAttribute('aria-expanded','true'); const buttonLabel = button.querySelector('.arrangement-toggle-label'), icon = button.querySelector('.arrangement-toggle-icon'); if (buttonLabel) buttonLabel.textContent = t('closeArrangement'); if (icon) icon.textContent = '−'; panel.hidden = false; panel.innerHTML = arrangementExpandedMarkup(work); const video = panel.querySelector('[data-video-src]'); if (video) mountVideo(video); expandedSlug = slug;
    if (updateHash && readHash() !== slug) { const next = new URL(location.href); next.hash = slug; history.replaceState(null,'',next); }
    return true;
  };
  const handleHash = () => { const slug = readHash(); if (!slug) { if (expandedSlug) closeExpanded(false); return; } if (!openExpanded(slug,false)) { if (expandedSlug) closeExpanded(false); clearLocationHash(); } };
  const render = () => {
    const priorSlug = expandedSlug || readHash();
    const items = all.filter(work => (!selectedCreator || (selectedCreator === 'other' ? !ARRANGEMENT_FEATURED_CREATORS.includes(arrangementCreator(work)) : arrangementCreator(work) === selectedCreator)) && (!selectedGenre || work.category === selectedGenre) && (!selectedEnsemble || work.ensemble === selectedEnsemble));
    items.sort((a,b) => { if (selectedSort === 'title') return label(a,'title').localeCompare(label(b,'title'),state.lang); return selectedSort === 'oldest' ? a.published_date.localeCompare(b.published_date) : b.published_date.localeCompare(a.published_date); });
    output.innerHTML = items.length ? items.map(arrangementRow).join('') : `<p class="empty-state">${t('noWorks')}</p>`;
    const count = document.querySelector('[data-arrangement-count]'), status = document.querySelector('[data-arrangement-status]'), title = document.querySelector('[data-arrangement-results-title]');
    if (title) title.textContent = arrangementSelectionLabel(selectedCreator,selectedGenre,selectedEnsemble);
    if (count) count.textContent = originalCountText(items.length);
    if (status) status.textContent = state.lang === 'ja' ? `${items.length}件の編曲作品を表示` : `${t('showing')} ${items.length} arrangement${items.length === 1 ? '' : 's'}`;
    output.querySelectorAll('[data-arrangement-toggle]').forEach(button => button.addEventListener('click', () => { const slug = button.dataset.slug; if (expandedSlug === slug) closeExpanded(true); else openExpanded(slug,true); }));
    if (priorSlug && items.some(item => item.slug === priorSlug)) openExpanded(priorSlug,false); else if (priorSlug) { closeExpanded(true); }
  };
  window.addEventListener('hashchange',handleHash);
  render();
}
async function renderCatalog() {
  const output = document.querySelector('[data-work-list]'); if (!output) return;
  const works = await getJson('works.json');
  if (document.body.dataset.catalog === 'arrangement') { await renderArrangementCatalog(works); return; }
  if (document.body.dataset.catalog === 'original-discovery') { await renderOriginalDiscoveryCatalog(works); return; }
  const index = buildWorkIndex(works), all = works.filter(work => work.published && work.type === 'original'), ensemble = document.querySelector('[name=ensemble]'), sort = document.querySelector('[name=sort]'), params = new URLSearchParams(location.search);
  let selectedEnsemble = params.get('ensemble') || '', selectedSort = params.get('sort') || 'newest';
  if (!ORIGINAL_ENSEMBLES.includes(selectedEnsemble)) selectedEnsemble = '';
  if (!ORIGINAL_SORTS.includes(selectedSort)) selectedSort = 'newest';
  if (ensemble) ensemble.value = selectedEnsemble;
  if (sort) sort.value = selectedSort;
  normalizeOriginalListUrl(selectedEnsemble,selectedSort);
  if (location.hash) { const hit = index.bySlug.get(readHash()); if (hit?.parent?.published && hit.parent.type === 'original') { location.replace(detailHref(hit.parent, hit.work.slug)); return; } }
  const render = () => {
    selectedEnsemble = ensemble?.value || '';
    selectedSort = sort?.value || 'newest';
    normalizeOriginalListUrl(selectedEnsemble,selectedSort);
    const items = all.filter(work => !selectedEnsemble || work.ensemble === selectedEnsemble);
    items.sort((a,b) => { if (selectedSort === 'title') return label(a,'title').localeCompare(label(b,'title'),state.lang); if (!a.published_date && !b.published_date) return 0; if (!a.published_date) return 1; if (!b.published_date) return -1; return selectedSort === 'oldest' ? a.published_date.localeCompare(b.published_date) : b.published_date.localeCompare(a.published_date); });
    output.innerHTML = items.length ? items.map(originalCard).join('') : `<p class="empty-state">${t('noWorks')}</p>`;
    const summary = document.querySelector('[data-filter-summary]'); if (summary) summary.textContent = selectedEnsemble && ENSEMBLES[selectedEnsemble] ? ENSEMBLES[selectedEnsemble][state.lang] : t('all');
    lazyVideos(); requestAnimationFrame(focusHash);
  };
  [ensemble,sort].filter(Boolean).forEach(control => control.addEventListener('change',render)); window.addEventListener('hashchange',focusHash); render();
}
function partMarkup(parent, part) {
  const links = actions(part);
  return `<article class="work work-part" id="${esc(part.slug)}"><header class="work-heading"><h3>${esc(label(part,'title'))}</h3></header>${videoMarkup(part)}${durationMarkup(part,parent)}${links.length ? `<div class="work-actions">${links.join('')}</div>` : ''}</article>`;
}
async function renderWorkDetail() {
  const output = document.querySelector('[data-work-detail]'); if (!output) return;
  const works = await getJson('works.json'), index = buildWorkIndex(works), id = new URLSearchParams(location.search).get('work'), hit = index.byId.get(id);
  if (!hit || hit.parent || !hit.work.published || !isMultipart(hit.work)) { output.innerHTML = `<p class="empty-state">${t('notFound')}</p><p><a href="${rootLink('originals/')}">${t('backToWorks')}</a></p>`; return; }
  const work = hit.work, compositionPeriod = label(work,'composition_period');
  document.title = `${label(work,'title')} — YUNO`; setDescription(state.lang === 'ja' ? `${label(work,'title')}の作品詳細。` : `Details for ${label(work,'title')}.`);
  output.innerHTML = `<header class="page-heading"><div class="eyebrow">${state.lang === 'ja' ? 'オリジナル作品' : 'Original Works'}</div><h1>${esc(label(work,'title'))}</h1>${credits(work) ? `<p>${credits(work)}</p>` : ''}${recognitionMarkup(work)}${metadata(work,label(work,'parts_label'))}${compositionPeriod ? `<p>${esc(compositionPeriod)}</p>` : ''}</header><section class="parts">${work.parts.map(part => partMarkup(work,part)).join('')}</section><p class="catalog-back"><a href="${catalogHref(work)}">${t('backToWorks')}</a></p>`;
  lazyVideos(); requestAnimationFrame(focusHash);
}
async function renderUpdates() {
  const output = document.querySelector('[data-updates]'); if (!output) return; let updates = await getJson('updates.json'); const limit = Number(output.dataset.limit || 0); if (limit) updates = updates.slice(0,limit);
  output.innerHTML = updates.map(update => `<article class="update"><time datetime="${esc(update.date)}">${new Intl.DateTimeFormat(state.lang === 'ja' ? 'ja-JP' : 'en-GB',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(`${update.date}T00:00:00Z`))}</time><p>${update.link ? `<a href="${rootLink(update.link)}">${esc(label(update,'text'))}</a>` : esc(label(update,'text'))}</p></article>`).join('');
}
async function renderCommentary() {
  const output = document.querySelector('[data-commentary-page]'); if (!output) return;
  const works = await getJson('works.json'), hit = buildWorkIndex(works).byId.get(new URLSearchParams(location.search).get('work'));
  if (!hit || !hit.work.commentary) { output.innerHTML = `<p class="empty-state">${t('commentaryMissing')}</p><p><a href="${rootLink('originals/')}">${t('backToWorks')}</a></p>`; return; }
  const work = hit.work, back = hit.parent ? detailHref(hit.parent,work.slug) : catalogHref(work), paragraphs = (work[`commentary_${state.lang}`] || work.commentary_ja).split(/\n\n+/).map(text => `<p>${esc(text)}</p>`).join('');
  document.title = `${label(work,'title')} — YUNO`; setDescription(state.lang === 'ja' ? `${label(work,'title')}の作品解説。` : `Commentary for ${label(work,'title')}.`); output.innerHTML = `<div class="eyebrow">${t('commentary')}</div><h1>${esc(label(work,'title'))}</h1><p class="commentary-lead">${esc(instrumentationShort(hit.parent || work))}</p><div class="commentary-body">${paragraphs}</div><div class="commentary-links"><a href="${back}">${t('backToWorks')}</a></div>`;
}
document.addEventListener('DOMContentLoaded', async () => {
  renderShell(); localizeStatic(); renderPageMeta();
  try { await Promise.all([renderCatalog(),renderWorkDetail(),renderUpdates(),renderCommentary()]); }
  catch (error) { console.error(error); document.querySelectorAll('[data-work-list],[data-work-detail],[data-updates],[data-commentary-page]').forEach(element => { if (!element.innerHTML) element.innerHTML = `<p class="empty-state">${state.lang === 'ja' ? 'コンテンツを読み込めませんでした。' : 'Content could not be loaded.'}</p>`; }); }
});
