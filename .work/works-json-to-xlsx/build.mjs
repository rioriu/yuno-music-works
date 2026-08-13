import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const projectDir = path.resolve(process.cwd(), "../..");
const inputPath = path.join(projectDir, "data", "works.json");
const outputDir = path.join(projectDir, "outputs", "20260813-works-json-to-xlsx");
const outputPath = path.join(outputDir, "works.xlsx");
const previewDir = path.join(process.cwd(), "previews");

const rawJson = await fs.readFile(inputPath, "utf8");
const works = JSON.parse(rawJson.replace(/^\uFEFF/, ""));

const nestedKeys = new Set(["video", "other_videos", "scores", "parts"]);
const preferredWorkKeys = [
  "id",
  "slug",
  "type",
  "title_ja",
  "title_en",
  "original_title_ja",
  "original_title_en",
  "artist_name",
  "composer_name",
  "lyricist_name",
  "category",
  "composition_year",
  "published_date",
  "ensemble",
  "instrumentation_ja",
  "instrumentation_en",
  "duration_seconds",
  "instruments",
  "tags",
  "featured",
  "published",
  "sample",
  "parts_label_ja",
  "parts_label_en",
  "parts_heading_ja",
  "parts_heading_en",
  "commentary",
  "commentary_ja",
  "commentary_en",
  "commentary_source",
];
const preferredPartKeys = [
  "id",
  "slug",
  "title_ja",
  "title_en",
  "composition_year",
  "published_date",
  "duration_seconds",
  "commentary",
  "commentary_ja",
  "commentary_en",
  "commentary_source",
];

const unique = (items) => [...new Set(items)];
const objectKeys = (records) => unique(
  records.flatMap((record) => (record && typeof record === "object" ? Object.keys(record) : [])),
);
const isPrimitive = (value) => value === null || ["string", "number", "boolean"].includes(typeof value);
const asText = (value) => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    if (value.every((item) => isPrimitive(item))) return value.filter((item) => item !== null).join(", ");
    return JSON.stringify(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};
const asDate = (value) => {
  if (typeof value !== "string") return asText(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
};
const valueForKey = (record, key) => {
  if (key.endsWith("_date")) return asDate(record?.[key]);
  return asText(record?.[key]);
};
const colLetter = (oneBasedIndex) => {
  let index = oneBasedIndex;
  let result = "";
  while (index > 0) {
    const remainder = (index - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    index = Math.floor((index - 1) / 26);
  }
  return result;
};
const uniqueColumns = (columns) => unique(columns);

const topKeySet = new Set(
  objectKeys(works).filter((key) => !nestedKeys.has(key)),
);
const workKeys = [
  ...preferredWorkKeys.filter((key) => topKeySet.has(key)),
  ...[...topKeySet].filter((key) => !preferredWorkKeys.includes(key)).sort(),
];

const partEntries = works.flatMap((work) => (
  Array.isArray(work.parts)
    ? work.parts.map((part) => ({ work, part }))
    : []
));
const partNestedKeys = new Set(["video", "other_videos", "scores"]);
const partKeySet = new Set(objectKeys(partEntries.map(({ part }) => part)).filter((key) => !partNestedKeys.has(key)));
const partKeys = [
  ...preferredPartKeys.filter((key) => partKeySet.has(key)),
  ...[...partKeySet].filter((key) => !preferredPartKeys.includes(key)).sort(),
];

const videoRecords = [
  ...works.map((work) => work.video),
  ...partEntries.map(({ part }) => part.video),
].filter(Boolean);
const videoKeys = objectKeys(videoRecords);

const scoreRecords = [
  ...works.flatMap((work) => (Array.isArray(work.scores) ? work.scores : [])),
  ...partEntries.flatMap(({ part }) => (Array.isArray(part.scores) ? part.scores : [])),
];
const scoreKeys = objectKeys(scoreRecords);

const otherVideoRecords = [
  ...works.flatMap((work) => (Array.isArray(work.other_videos) ? work.other_videos : [])),
  ...partEntries.flatMap(({ part }) => (Array.isArray(part.other_videos) ? part.other_videos : [])),
];
const otherVideoKeys = objectKeys(otherVideoRecords);

const workVideoColumns = videoKeys.map((key) => `video_${key}`);
const worksColumns = uniqueColumns([
  ...workKeys,
  ...workVideoColumns,
  "other_videos_count",
  "scores_count",
  "parts_count",
]);

const workRows = works.map((work) => worksColumns.map((column) => {
  if (column.startsWith("video_")) return asText(work.video?.[column.slice("video_".length)]);
  if (column === "other_videos_count") return Array.isArray(work.other_videos) ? work.other_videos.length : 0;
  if (column === "scores_count") return Array.isArray(work.scores) ? work.scores.length : 0;
  if (column === "parts_count") return Array.isArray(work.parts) ? work.parts.length : 0;
  return valueForKey(work, column);
}));

const partColumns = uniqueColumns([
  "work_id",
  "work_title_ja",
  "work_title_en",
  ...partKeys.map((key) => `part_${key}`),
  ...videoKeys.map((key) => `part_video_${key}`),
  "part_other_videos_count",
  "part_scores_count",
]);

const partRows = partEntries.map(({ work, part }) => partColumns.map((column) => {
  if (column === "work_id") return asText(work.id);
  if (column === "work_title_ja") return asText(work.title_ja);
  if (column === "work_title_en") return asText(work.title_en);
  if (column.startsWith("part_video_")) return asText(part.video?.[column.slice("part_video_".length)]);
  if (column === "part_other_videos_count") return Array.isArray(part.other_videos) ? part.other_videos.length : 0;
  if (column === "part_scores_count") return Array.isArray(part.scores) ? part.scores.length : 0;
  if (column.startsWith("part_")) return valueForKey(part, column.slice("part_".length));
  return null;
}));

const nestedBaseColumns = [
  "scope",
  "work_id",
  "part_id",
  "work_title_ja",
  "work_title_en",
  "part_title_ja",
  "part_title_en",
];

const entityContext = (work, part, scope) => [
  scope,
  asText(work.id),
  part ? asText(part.id) : null,
  asText(work.title_ja),
  asText(work.title_en),
  part ? asText(part.title_ja) : null,
  part ? asText(part.title_en) : null,
];

const videoColumns = [
  ...nestedBaseColumns,
  "video_key",
  "label_ja",
  "label_en",
  "value",
  "url",
  "fallback_url",
];
const videoRows = [];
const addVideoRows = (work, part, scope) => {
  const entity = part ?? work;
  const video = entity.video ?? {};
  const fallbackUrl = asText(video.fallback_url);
  const providerKeys = videoKeys.filter((key) => key !== "fallback_url" && video[key] !== null && video[key] !== undefined && video[key] !== "");
  if (providerKeys.length > 0) {
    for (const key of providerKeys) {
      const value = asText(video[key]);
      videoRows.push([
        ...entityContext(work, part, scope),
        key,
        null,
        null,
        value,
        key === "soundcloud" ? value : fallbackUrl,
        fallbackUrl,
      ]);
    }
  } else if (fallbackUrl) {
    videoRows.push([
      ...entityContext(work, part, scope),
      "fallback_url",
      null,
      null,
      fallbackUrl,
      fallbackUrl,
      fallbackUrl,
    ]);
  }
  for (const otherVideo of entity.other_videos ?? []) {
    videoRows.push([
      ...entityContext(work, part, scope),
      "other",
      asText(otherVideo.label_ja),
      asText(otherVideo.label_en),
      asText(otherVideo.url),
      asText(otherVideo.url),
      null,
    ]);
  }
};
for (const work of works) {
  addVideoRows(work, null, "work");
  for (const part of work.parts ?? []) addVideoRows(work, part, "part");
}

const scoresColumns = [
  ...nestedBaseColumns,
  ...scoreKeys.map((key) => `score_${key}`),
];
const scoreRows = [];
const addScoreRows = (work, part, scope) => {
  const entity = part ?? work;
  for (const score of entity.scores ?? []) {
    scoreRows.push([
      ...entityContext(work, part, scope),
      ...scoreKeys.map((key) => asText(score[key])),
    ]);
  }
};
for (const work of works) {
  addScoreRows(work, null, "work");
  for (const part of work.parts ?? []) addScoreRows(work, part, "part");
}

const widthFor = (column) => {
  if (/commentary/.test(column)) return 42;
  if (/_url$|url/.test(column)) return 42;
  if (/title|instrumentation|label/.test(column)) return 30;
  if (/instruments|tags/.test(column)) return 24;
  if (/id|slug/.test(column)) return 28;
  if (/date/.test(column)) return 14;
  if (/duration|year|count/.test(column)) return 15;
  if (/^published$|^featured$|^sample$/.test(column)) return 12;
  return 18;
};
const setColumnLayout = (sheet, columns, rowCount) => {
  const lastRow = Math.max(1, rowCount + 1);
  columns.forEach((column, index) => {
    const range = sheet.getRange(`${colLetter(index + 1)}1:${colLetter(index + 1)}${lastRow}`);
    range.format.columnWidth = widthFor(column);
    if (/commentary|title|instrumentation|label/.test(column)) range.format.wrapText = true;
  });
};
const styleSheet = (sheet, columns, rows, tableName) => {
  const rowCount = rows.length;
  const lastRow = rowCount + 1;
  const lastCol = colLetter(columns.length);
  const fullRange = sheet.getRange(`A1:${lastCol}${lastRow}`);
  const headerRange = sheet.getRange(`A1:${lastCol}1`);
  const dataRange = rowCount > 0 ? sheet.getRange(`A2:${lastCol}${lastRow}`) : null;
  sheet.showGridLines = false;
  headerRange.format = {
    fill: "#1F4E78",
    font: { bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
  };
  headerRange.format.rowHeight = 30;
  if (dataRange) {
    dataRange.format = {
      verticalAlignment: "center",
      font: { color: "#1F2937" },
    };
    dataRange.format.rowHeight = 22;
  }
  fullRange.format.borders = {
    insideHorizontal: { style: "thin", color: "#D9E2F3" },
    bottom: { style: "thin", color: "#B4C7E7" },
  };
  const table = sheet.tables.add(`A1:${lastCol}${lastRow}`, true, tableName);
  table.style = "TableStyleMedium2";
  sheet.freezePanes.freezeRows(1);
  setColumnLayout(sheet, columns, rowCount);
  for (const [index, column] of columns.entries()) {
    const range = sheet.getRange(`${colLetter(index + 1)}2:${colLetter(index + 1)}${lastRow}`);
    if (/published_date$/.test(column)) range.format.numberFormat = "yyyy-mm-dd";
    if (/composition_year$|duration_seconds$|_count$/.test(column)) range.format.numberFormat = "0";
    if (/^(published|featured|sample)$/.test(column)) range.format.horizontalAlignment = "center";
  }
};
const addDataSheet = (workbook, name, columns, rows, tableName) => {
  const sheet = workbook.worksheets.add(name);
  sheet.getRangeByIndexes(0, 0, rows.length + 1, columns.length).values = [columns, ...rows];
  styleSheet(sheet, columns, rows, tableName);
  return sheet;
};

const workbook = Workbook.create();
const worksSheet = addDataSheet(workbook, "Works", worksColumns, workRows, "WorksTable");
const partsSheet = addDataSheet(workbook, "Parts", partColumns, partRows, "PartsTable");
const videosSheet = addDataSheet(workbook, "Videos", videoColumns, videoRows, "VideosTable");
const scoresSheet = addDataSheet(workbook, "Scores", scoresColumns, scoreRows, "ScoresTable");

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const inspectWorks = await workbook.inspect({
  kind: "table",
  range: "Works!A1:Q6",
  include: "values,formulas",
  tableMaxRows: 6,
  tableMaxCols: 17,
  tableMaxCellChars: 80,
});
const inspectParts = await workbook.inspect({
  kind: "table",
  range: "Parts!A1:K6",
  include: "values,formulas",
  tableMaxRows: 6,
  tableMaxCols: 11,
  tableMaxCellChars: 80,
});
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});

for (const [sheetName, fileName] of [["Works", "works-preview.png"], ["Parts", "parts-preview.png"], ["Videos", "videos-preview.png"], ["Scores", "scores-preview.png"]]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(path.join(previewDir, fileName), new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
const roundTripWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
const roundTripWorks = await roundTripWorkbook.inspect({
  kind: "table",
  range: "Works!A1:D3",
  include: "values,formulas",
  tableMaxRows: 3,
  tableMaxCols: 4,
  tableMaxCellChars: 80,
});
const roundTripErrors = await roundTripWorkbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "round-trip formula error scan",
});

console.log(JSON.stringify({
  inputPath,
  outputPath,
  sourceWorks: works.length,
  parts: partRows.length,
  videos: videoRows.length,
  scores: scoreRows.length,
  inspectWorks: inspectWorks.ndjson,
  inspectParts: inspectParts.ndjson,
  formulaErrors: errors.ndjson,
  roundTripWorks: roundTripWorks.ndjson,
  roundTripFormulaErrors: roundTripErrors.ndjson,
  previewDir,
  outputBytes: (await fs.stat(outputPath)).size,
}, null, 2));
