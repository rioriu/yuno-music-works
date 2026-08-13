import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const projectDir = path.resolve(process.cwd(), "../..");
const baselinePath = path.join(projectDir, "outputs", "20260813-works-json-to-xlsx", "works.xlsx");
const candidatePath = "C:/Users/Yuno/Downloads/works.xlsm";
const sourcePath = path.join(projectDir, "data", "works.json");
const previewDir = path.join(process.cwd(), "audit-previews");
const sheetNames = ["Works", "Parts", "Videos", "Scores"];

const baselineWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(baselinePath));
const candidateWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(candidatePath));
const sourceWorks = JSON.parse((await fs.readFile(sourcePath, "utf8")).replace(/^\uFEFF/, ""));

const isDate = (value) => value instanceof Date;
const normalize = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (isDate(value)) return `date:${value.toISOString().slice(0, 10)}`;
  if (typeof value === "number" && Number.isNaN(value)) return "NaN";
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value;
  return String(value);
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
const cellAddress = (rowIndex, colIndex) => `${colLetter(colIndex + 1)}${rowIndex + 1}`;
const getSheetMatrix = (workbook, name) => {
  const sheet = workbook.worksheets.getItem(name);
  const range = sheet.getUsedRange(true);
  return {
    sheet,
    values: range.values,
    formulas: range.formulas,
  };
};
const matrixDimensions = (matrix) => ({
  rows: Array.isArray(matrix) ? matrix.length : 0,
  cols: Array.isArray(matrix) && matrix.length > 0 ? matrix[0].length : 0,
});

const compareSheet = (name) => {
  const baseline = getSheetMatrix(baselineWorkbook, name);
  const candidate = getSheetMatrix(candidateWorkbook, name);
  const baselineDims = matrixDimensions(baseline.values);
  const candidateDims = matrixDimensions(candidate.values);
  const maxRows = Math.max(baselineDims.rows, candidateDims.rows);
  const maxCols = Math.max(baselineDims.cols, candidateDims.cols);
  const valueDiffs = [];
  const formulaDiffs = [];
  for (let row = 0; row < maxRows; row += 1) {
    for (let col = 0; col < maxCols; col += 1) {
      const before = normalize(baseline.values?.[row]?.[col]);
      const after = normalize(candidate.values?.[row]?.[col]);
      if (before !== after) {
        valueDiffs.push({
          cell: cellAddress(row, col),
          before,
          after,
          header: normalize(candidate.values?.[0]?.[col] ?? baseline.values?.[0]?.[col]),
          rowKey: normalize(candidate.values?.[row]?.[0] ?? baseline.values?.[row]?.[0]),
        });
      }
      const beforeFormula = normalize(baseline.formulas?.[row]?.[col]);
      const afterFormula = normalize(candidate.formulas?.[row]?.[col]);
      if (beforeFormula !== afterFormula) {
        formulaDiffs.push({
          cell: cellAddress(row, col),
          before: beforeFormula,
          after: afterFormula,
        });
      }
    }
  }
  return {
    name,
    baselineDims,
    candidateDims,
    valueDiffs,
    formulaDiffs,
  };
};

const comparisons = sheetNames.map(compareSheet);
const worksComparison = comparisons.find((item) => item.name === "Works");
const worksBaseline = getSheetMatrix(baselineWorkbook, "Works").values;
const worksCandidate = getSheetMatrix(candidateWorkbook, "Works").values;
const headers = worksCandidate[0] ?? worksBaseline[0] ?? [];
const idIndex = headers.indexOf("id");
const compositionYearIndex = headers.indexOf("composition_year");
const titleEnIndex = headers.indexOf("title_en");

const sourceById = new Map(sourceWorks.map((work) => [String(work.id), work]));
const compositionYearChanges = [];
if (idIndex >= 0 && compositionYearIndex >= 0) {
  for (let row = 1; row < worksCandidate.length; row += 1) {
    const id = String(worksCandidate[row]?.[idIndex] ?? "");
    if (!id) continue;
    const sourceValue = sourceById.get(id)?.composition_year ?? null;
    const baselineValue = normalize(worksBaseline[row]?.[compositionYearIndex]);
    const candidateValue = normalize(worksCandidate[row]?.[compositionYearIndex]);
    if (baselineValue !== candidateValue) {
      compositionYearChanges.push({
        row: row + 1,
        id,
        title_en: worksCandidate[row]?.[titleEnIndex] ?? null,
        source_json: sourceValue,
        before: baselineValue,
        after: candidateValue,
      });
    }
  }
}

const sourceMissingYearIds = sourceWorks.filter((work) => work.composition_year === null || work.composition_year === undefined).map((work) => String(work.id));
const addedYearsFromMissingSource = compositionYearChanges.filter((change) => sourceMissingYearIds.includes(change.id) && change.after !== null);
const nonYearValueDiffs = comparisons.flatMap((comparison) => (
  comparison.valueDiffs.filter((diff) => !(comparison.name === "Works" && diff.header === "composition_year"))
    .map((diff) => ({ sheet: comparison.name, ...diff }))
));
const candidateWorkbookSummary = await candidateWorkbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 5000,
  tableMaxRows: 3,
  tableMaxCols: 8,
  tableMaxCellChars: 80,
});
const formulaErrors = await candidateWorkbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "candidate formula error scan",
});

await fs.mkdir(previewDir, { recursive: true });
const preview = await candidateWorkbook.render({ sheetName: "Works", range: "A1:Q12", scale: 1, format: "png" });
await fs.writeFile(path.join(previewDir, "works-current.png"), new Uint8Array(await preview.arrayBuffer()));

console.log(JSON.stringify({
  candidatePath,
  baselinePath,
  sourcePath,
  candidateWorkbookSummary: candidateWorkbookSummary.ndjson,
  formulaErrors: formulaErrors.ndjson,
  comparisons: comparisons.map((comparison) => ({
    sheet: comparison.name,
    baseline: comparison.baselineDims,
    candidate: comparison.candidateDims,
    valueDiffCount: comparison.valueDiffs.length,
    formulaDiffCount: comparison.formulaDiffs.length,
    valueDiffs: comparison.valueDiffs.slice(0, 100),
    formulaDiffs: comparison.formulaDiffs.slice(0, 100),
  })),
  compositionYearChanges,
  addedYearsFromMissingSource,
  nonYearValueDiffCount: nonYearValueDiffs.length,
  nonYearValueDiffs: nonYearValueDiffs.slice(0, 100),
  previewDir,
}, null, 2));
