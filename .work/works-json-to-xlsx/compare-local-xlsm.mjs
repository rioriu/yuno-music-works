import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const localWorks = JSON.parse((await fs.readFile("../../data/works.json", "utf8")).replace(/^\uFEFF/, ""));
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load("C:/Users/Yuno/Downloads/works.xlsm"));
const sheet = workbook.worksheets.getItem("Works");
const values = sheet.getUsedRange(true).values;
const headers = values[0];
const idIndex = headers.indexOf("id");
const yearIndex = headers.indexOf("composition_year");
const localById = new Map(localWorks.map((work) => [String(work.id), work]));
const differences = [];
for (let row = 1; row < values.length; row += 1) {
  const id = String(values[row]?.[idIndex] ?? "");
  const xlsmYear = values[row]?.[yearIndex] ?? null;
  const localYear = localById.get(id)?.composition_year ?? null;
  if (String(xlsmYear) !== String(localYear)) {
    differences.push({
      id,
      title_ja: localById.get(id)?.title_ja ?? null,
      local: localYear,
      xlsm: xlsmYear,
    });
  }
}
console.log(JSON.stringify(differences, null, 2));
