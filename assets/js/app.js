const script = document.querySelector('script[src$="assets/js/app.js"]');
const ROOT = new URL('../../', script.src);
const DATA = new URL('data/', ROOT);
const state = {lang: localStorage.getItem('yuno-language') === 'en' ? 'en' : 'ja'};

const C = {
  ja: {
    home: 'ホーム', originals: 'オリジナル作品', arrangements: '編曲作品', profile: 'プロフィール',
    contact: 'お問い合わせ', updates: '更新情報', menu: 'メニュー', skip: '本文へ移動', language: '言語',
    year: '年', duration: '演奏時間', origin: '原曲', artist: 'アーティスト', composer: '作曲',
    lyricist: '作詞', commentary: '作品解説', footer: '© YUNO / MUSIC & WORKS',
    noWorks: '条件に合う作品はありません。', noVideo: '動画は準備中です。', fallbackVideo: '動画を開く',
    loadingVideo: '動画を読み込んでいます…', videoTitle: '動画プレーヤー', sourceDescription: 'YouTube概要欄を見る',
    backToWorks: '作品一覧へ戻る', commentaryMissing: '作品解説が見つかりませんでした。', all: 'すべて',
  },
  en: {
    home: 'Home', originals: 'Original Works', arrangements: 'Arrangements', profile: 'Profile',
    contact: 'Contact', updates: 'Updates', menu: 'Menu', skip: 'Skip to content', language: 'Language',
    year: 'Year', duration: 'Duration', origin: 'Original', artist: 'Artist', composer: 'Composer',
    lyricist: 'Lyricist', commentary: 'Commentary', footer: '© YUNO / MUSIC & WORKS',
    noWorks: 'No works match these filters.', noVideo: 'Video is being prepared.', fallbackVideo: 'Open video',
    loadingVideo: 'Loading video…', videoTitle: 'Video player', sourceDescription: 'View the YouTube description',
    backToWorks: 'Back to works', commentaryMissing: 'Commentary could not be found.', all: 'All',
  },
};

const ENSEMBLES = {
  piano: {ja: 'ピアノ', en: 'Piano'},
  solo: {ja: '独奏', en: 'Solo'},
  'solo-piano': {ja: '独奏＋ピアノ', en: 'Solo & Piano'},
  strings: {ja: '弦楽アンサンブル', en: 'String Ensemble'},
  woodwinds: {ja: '木管アンサンブル', en: 'Woodwind Ensemble'},
  brass: {ja: '金管アンサンブル', en: 'Brass Ensemble'},
  percussion: {ja: '打楽器アンサンブル', en: 'Percussion Ensemble'},
  mixed: {ja: '混成アンサンブル', en: 'Mixed Ensemble'},
  orchestra: {ja: 'オーケストラ', en: 'Orchestra'},
  wind: {ja: '吹奏楽', en: 'Wind Ensemble'},
  'art-song': {ja: '歌曲', en: 'Art Song'},
  pops: {ja: 'POPS', en: 'POPS'},
  choral: {ja: '合唱', en: 'Choral Works'},
};

const t = key => C[state.lang][key] || key;
const rootLink = path => new URL(path, ROOT).href;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const label = (value, key) => value[`${key}_${state.lang}`] || value[`${key}_ja`] || '';
const dateText = date => new Intl.DateTimeFormat(state.lang === 'ja' ? 'ja-JP' : 'en-GB', {year:'numeric', month:'short', day:'numeric'}).format(new Date(`${date}T00:00:00`));
const ext = url => ` target="_blank" rel="noopener" href="${esc(url)}"`;

function localizeStatic() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-ja][data-en]').forEach(element => {
    element.textContent = element.dataset[state.lang];
  });
}

function renderShell() {
  const page = document.body.dataset.page;
  const nav = [['home',''], ['originals','originals/'], ['arrangements','arrangements/'], ['profile','profile/'], ['contact','contact/'], ['updates','updates/']];
  document.querySelector('[data-site-header]').innerHTML = `
    <a class="skip-link" href="#main">${t('skip')}</a>
    <a class="brand" href="${rootLink('')}" aria-label="YUNO / MUSIC & WORKS">YUNO / MUSIC &amp; WORKS</a>
    <div class="header-actions">
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">${t('menu')}</button>
      <nav class="main-nav" id="site-nav" aria-label="${t('menu')}"><ul>${nav.map(([key, url]) => `<li><a href="${rootLink(url)}"${page === key ? ' aria-current="page"' : ''}>${t(key)}</a></li>`).join('')}</ul></nav>
      <div class="language-switch" aria-label="${t('language')}">
        <button type="button" data-lang="ja" aria-pressed="${state.lang === 'ja'}">日本語</button>
        <button type="button" data-lang="en" aria-pressed="${state.lang === 'en'}">EN</button>
      </div>
    </div>`;
  document.querySelector('[data-site-footer]').innerHTML = `<div class="footer-inner"><span>${t('footer')}</span><a href="${rootLink('updates/')}">${t('updates')}</a></div>`;

  const navEl = document.querySelector('.main-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = window.matchMedia('(max-width: 760px)');
  const setNav = open => {
    const isMobile = mobileNav.matches;
    navEl.toggleAttribute('hidden',isMobile&&!open);
    navToggle.setAttribute('aria-expanded', String(isMobile ? open : true));
  };
  setNav(false);
  navToggle.onclick = () => setNav(navEl.hasAttribute('hidden'));
  mobileNav.addEventListener('change',()=>setNav(false));
  document.querySelectorAll('[data-lang]').forEach(button => {
    button.onclick = () => {
      localStorage.setItem('yuno-language', button.dataset.lang);
      location.reload();
    };
  });
}

async function getJson(name) {
  const response = await fetch(new URL(name, DATA));
  if (!response.ok) throw Error(name);
  return response.json();
}

function videoMarkup(work) {
  const video = work.video || {};
  let src = null;
  if (video.youtube) src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtube)}?rel=0`;
  else if(video.niconico) src = `https://embed.nicovideo.jp/watch/${encodeURIComponent(video.niconico)}`;
  if (!src) return `<p class="no-video">${t('noVideo')}${video.fallback_url ? ` <a${ext(video.fallback_url)}>${t('fallbackVideo')}</a>` : ''}</p>`;
  return `<div class="video-wrap" data-video-src="${esc(src)}"><p class="video-pending">${t('loadingVideo')}</p><noscript>${video.fallback_url ? `<a${ext(video.fallback_url)}>${t('fallbackVideo')}</a>` : ''}</noscript></div>`;
}

function card(work) {
  const secondaryTitle = work.type === 'arrangement' ? `<p class="secondary-title">${esc(label(work, 'original_title'))}</p>` : '';
  const credits = [['artist_name','artist'], ['composer_name','composer'], ['lyricist_name','lyricist']]
    .filter(([field]) => work[field])
    .map(([field, key]) => `${t(key)}: ${esc(work[field])}`)
    .join(' · ');
  const origin = work.type === 'arrangement'
    ? `<p class="arrangement-origin">${t('origin')}: ${esc(label(work, 'original_title'))}${credits ? `<br>${credits}` : ''}</p>`
    : credits ? `<p class="arrangement-origin">${credits}</p>` : '';
  const actions = [
    ...(work.other_videos || []).map(item => `<a${ext(item.url)}>${esc(label(item, 'label'))}</a>`),
    ...(work.scores || []).map(item => `<a${ext(item.url)}>${esc(label(item, 'label'))} · ${esc(item.vendor)}</a>`),
    ...(work.commentary ? [`<a href="${rootLink(`${work.commentary}/?work=${encodeURIComponent(work.id)}`)}">${t('commentary')}</a>`] : []),
  ];
  const ensemble = ENSEMBLES[work.ensemble]?.[state.lang];
  return `<article class="work">
    <header class="work-heading"><div><h2>${esc(label(work, 'title'))}</h2>${secondaryTitle}</div></header>
    ${origin}
    <div class="work-meta">
      ${Number.isInteger(work.composition_year) ? `<span>${work.composition_year}${state.lang === 'ja' ? '年' : ''}</span>` : ''}
      ${ensemble ? `<span>${esc(ensemble)}</span>` : ''}
      <span>${esc(label(work, 'instrumentation'))}</span>
      <span>${t('duration')} ${Math.floor(work.duration_seconds / 60)}:${String(work.duration_seconds % 60).padStart(2, '0')}</span>
    </div>
    ${videoMarkup(work)}
    ${actions.length ? `<div class="work-actions">${actions.join('')}</div>` : ''}
  </article>`;
}

function lazyVideos() {
  const videos = [...document.querySelectorAll('[data-video-src]')];
  const add = element => {
    if (element.dataset.loaded) return;
    element.dataset.loaded = 'true';
    const iframe = document.createElement('iframe');
    iframe.loading = 'lazy';
    iframe.title = t('videoTitle');
    iframe.allow = 'accelerometer; encrypted-media; picture-in-picture';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.src = element.dataset.videoSrc;
    element.replaceChildren(iframe);
  };
  if (!('IntersectionObserver' in window)) {
    videos.forEach(add);
    return;
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      add(entry.target);
      observer.unobserve(entry.target);
    }
  }), {rootMargin: '250px 0px'});
  videos.forEach(element => observer.observe(element));
}

async function renderCatalog() {
  const output = document.querySelector('[data-work-list]');
  if (!output) return;
  const all = (await getJson('works.json')).filter(work => work.published && work.type === document.body.dataset.catalog);
  const category = document.querySelector('[name=category]');
  const ensemble = document.querySelector('[name=ensemble]');
  const sort = document.querySelector('[name=sort]');
  const params = new URLSearchParams(location.search);
  if (category && params.has('category')) category.value = params.get('category');
  if (ensemble && params.has('ensemble')) ensemble.value = params.get('ensemble');

  const render = () => {
    const items = all.filter(work => (!category || !category.value || work.category === category.value) && (!ensemble || !ensemble.value || work.ensemble === ensemble.value));
    items.sort((a, b) => {
      if (sort?.value === 'title') return label(a, 'title').localeCompare(label(b, 'title'), state.lang);
      if (!a.published_date && !b.published_date) return 0;
      if (!a.published_date) return 1;
      if (!b.published_date) return -1;
      return sort?.value === 'oldest' ? a.published_date.localeCompare(b.published_date) : b.published_date.localeCompare(a.published_date);
    });
    output.innerHTML = items.length ? items.map(card).join('') : `<p class="empty-state">${t('noWorks')}</p>`;
    const summary = document.querySelector('[data-filter-summary]');
    if (summary) summary.textContent = ensemble?.value && ENSEMBLES[ensemble.value] ? ENSEMBLES[ensemble.value][state.lang] : t('all');
    if (document.body.dataset.catalog === 'original') {
      const next = new URL(location.href);
      if (ensemble?.value) next.searchParams.set('ensemble', ensemble.value); else next.searchParams.delete('ensemble');
      history.replaceState(null, '', next);
    }
    lazyVideos();
  };
  [category, ensemble, sort].filter(Boolean).forEach(control => control.addEventListener('change', render));
  render();
}

async function renderUpdates() {
  const output = document.querySelector('[data-updates]');
  if (!output) return;
  let updates = await getJson('updates.json');
  const limit = Number(output.dataset.limit || 0);
  if (limit) updates = updates.slice(0, limit);
  output.innerHTML = updates.map(update => `<article class="update"><time datetime="${esc(update.date)}">${dateText(update.date)}</time><p>${update.link ? `<a href="${rootLink(update.link)}">${esc(label(update, 'text'))}</a>` : esc(label(update, 'text'))}</p></article>`).join('');
}

async function renderCommentary() {
  const output = document.querySelector('[data-commentary-page]');
  if (!output) return;
  const id = new URLSearchParams(location.search).get('work');
  const work = (await getJson('works.json')).find(item => item.id === id && item.commentary);
  if (!work) {
    output.innerHTML = `<p class="empty-state">${t('commentaryMissing')}</p><p><a href="${rootLink('originals/list/')}">${t('backToWorks')}</a></p>`;
    return;
  }
  document.title = `${label(work, 'title')} — YUNO`;
  const paragraphs = (work[`commentary_${state.lang}`] || work.commentary_ja).split(/\n\n+/).map(text => `<p>${esc(text)}</p>`).join('');
  output.innerHTML = `
    <div class="eyebrow">Commentary</div>
    <h1>${esc(label(work, 'title'))}</h1>
    <p class="commentary-lead">${esc(label(work, 'instrumentation'))}</p>
    <div class="commentary-body">${paragraphs}</div>
    <div class="commentary-links">
      <a${ext(work.commentary_source)}>${t('sourceDescription')}</a>
      <a href="${rootLink(`originals/list/?ensemble=${encodeURIComponent(work.ensemble)}`)}">${t('backToWorks')}</a>
    </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  renderShell();
  localizeStatic();
  try {
    await Promise.all([renderCatalog(), renderUpdates(), renderCommentary()]);
  } catch (error) {
    console.error(error);
    document.querySelectorAll('[data-work-list],[data-updates],[data-commentary-page]').forEach(element => {
      if (!element.innerHTML) element.innerHTML = `<p class="empty-state">${state.lang === 'ja' ? 'コンテンツを読み込めませんでした。' : 'Content could not be loaded.'}</p>`;
    });
  }
});
