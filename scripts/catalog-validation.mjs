// Structural checks run before relationship checks so malformed input produces diagnostics,
// rather than throwing while iterating a field with the wrong type.
export function validDate(value) {
  if (value === null) return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0,10) === value;
}

export function validateShape(works, updates) {
  const errors = [], fail = (at, field, message) => errors.push(`${at}.${field}: ${message}`);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const text = value => typeof value === 'string' && Boolean(value.trim());
  const record = (work, at, part = false) => {
    if (!object(work)) { errors.push(`${at}: expected an object`); return; }
    at += ` (${typeof work.id === 'string' ? work.id : 'missing id'})`;
    for (const field of ['id','slug','title_ja','title_en',...(!part ? ['category','ensemble','instrumentation_ja','instrumentation_en'] : [])]) {
      if (!text(work[field])) fail(at,field,'expected non-empty text');
    }
    if (!part) for (const field of ['published','featured']) if (typeof work[field] !== 'boolean') fail(at,field,'expected boolean');
    for (const field of ['sample']) if (field in work && typeof work[field] !== 'boolean') fail(at,field,'expected boolean');
    for (const field of ['artist_name','composer_name','lyricist_name','commentary','commentary_ja','commentary_en','commentary_source','featured_intro_ja','featured_intro_en']) {
      if (work[field] !== undefined && work[field] !== null && typeof work[field] !== 'string') fail(at,field,'expected text or null');
    }
    if (part && 'featured' in work && typeof work.featured !== 'boolean') fail(at,'featured','expected boolean');
    if (!validDate(work.published_date)) fail(at,'published_date','expected a real ISO calendar date or null');
    for (const field of ['scores','other_videos']) {
      if (!Array.isArray(work[field])) { fail(at,field,'expected an array'); continue; }
      work[field].forEach((item,i) => {
        if (!object(item)) { fail(at,`${field}[${i}]`,'expected an object'); return; }
        for (const key of ['url','label_ja','label_en']) if (!text(item[key])) fail(at,`${field}[${i}].${key}`,'expected non-empty text');
      });
    }
    if (!part) for (const field of ['instruments','tags']) {
      if (!Array.isArray(work[field]) || work[field].some(item => !text(item))) fail(at,field,'expected an array of non-empty strings');
    }
    if (!object(work.video)) fail(at,'video','expected an object');
    else for (const field of ['youtube','niconico','soundcloud','fallback_url']) {
      if (work.video[field] !== undefined && work.video[field] !== null && !text(work.video[field])) fail(at,`video.${field}`,'expected non-empty text or null');
    }
    if ('recognitions' in work && (!Array.isArray(work.recognitions) || work.recognitions.some(item => !object(item)))) fail(at,'recognitions','expected an array of objects');
    if ('parts' in work) {
      if (part || !Array.isArray(work.parts) || !work.parts.length) fail(at,'parts','expected a non-empty top-level parts array');
      else work.parts.forEach((item,i) => record(item,`${at}.parts[${i}]`,true));
    }
  };
  if (!Array.isArray(works)) errors.push('works: expected an array');
  else works.forEach((work,i) => record(work,`works[${i}]`));
  if (!Array.isArray(updates)) errors.push('updates: expected an array');
  else updates.forEach((update,i) => {
    const at = `updates[${i}]`;
    if (!object(update)) { errors.push(`${at}: expected an object`); return; }
    if (update.date === null || !validDate(update.date)) fail(at,'date','expected a real ISO calendar date');
    for (const field of ['text_ja','text_en']) if (!text(update[field])) fail(at,field,'expected non-empty text');
    if (update.link !== undefined && update.link !== null && !text(update.link)) fail(at,'link','expected non-empty text or null');
  });
  return errors;
}
