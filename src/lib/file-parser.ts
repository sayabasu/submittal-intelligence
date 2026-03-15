import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { ColumnMapping, ParsedFile } from "./types";

const KNOWN_COLUMN_MAPPINGS: Record<string, string> = {
  // Submittal number
  "submittal no": "submittalNumber",
  "submittal number": "submittalNumber",
  "submittal #": "submittalNumber",
  "sub no": "submittalNumber",
  "number": "submittalNumber",
  "no.": "submittalNumber",
  // Spec section
  "spec section": "specSection",
  "specification": "specSection",
  "spec": "specSection",
  "csi section": "specSection",
  "section": "specSection",
  // Description
  "description": "description",
  "item description": "description",
  "equipment": "description",
  "item": "description",
  // Status
  "status": "status",
  "submittal status": "status",
  "current status": "status",
  "review status": "status",
  // Vendor
  "vendor": "vendor",
  "manufacturer": "vendor",
  "supplier": "vendor",
  "mfr": "vendor",
  // Reviewer
  "reviewer": "reviewer",
  "assigned to": "reviewer",
  "review by": "reviewer",
  "responsible": "reviewer",
  // Dates
  "submitted date": "submittedDate",
  "date submitted": "submittedDate",
  "submit date": "submittedDate",
  "review due date": "reviewDueDate",
  "due date": "reviewDueDate",
  "review due": "reviewDueDate",
  "approved date": "approvedDate",
  "date approved": "approvedDate",
  "approval date": "approvedDate",
  "required on site": "requiredOnSiteDate",
  "need by date": "requiredOnSiteDate",
  "required date": "requiredOnSiteDate",
  "site date": "requiredOnSiteDate",
  // Lead time
  "lead time": "manufacturingLeadTimeWeeks",
  "lead time (weeks)": "manufacturingLeadTimeWeeks",
  "mfg lead time": "manufacturingLeadTimeWeeks",
  "manufacturing lead time": "manufacturingLeadTimeWeeks",
  // Shipping buffer
  "shipping buffer": "shippingBufferDays",
  "shipping buffer (days)": "shippingBufferDays",
  "shipping days": "shippingBufferDays",
  "shipping lead time": "shippingBufferDays",
  // PO processing
  "po processing": "poProcessingDays",
  "po processing (days)": "poProcessingDays",
  "po days": "poProcessingDays",
  "po lead time": "poProcessingDays",
  // Discipline
  "discipline": "discipline",
  "trade": "discipline",
  "division": "discipline",
  // Category
  "equipment category": "equipmentCategory",
  "category": "equipmentCategory",
  "type": "equipmentCategory",
};

function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    if (KNOWN_COLUMN_MAPPINGS[normalized]) {
      mapping[header] = KNOWN_COLUMN_MAPPINGS[normalized];
    }
  }
  return mapping;
}

export function parseExcelBuffer(buffer: ArrayBuffer): ParsedFile {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  if (jsonData.length === 0) {
    return { headers: [], sampleRows: [], totalRows: 0, detectedMapping: {} };
  }

  const headers = (jsonData[0] as string[]).map((h) => String(h || "").trim());
  const dataRows = jsonData.slice(1).filter((row) =>
    (row as string[]).some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== "")
  );

  const sampleRows = dataRows.slice(0, 20).map((row) =>
    headers.map((_, i) => {
      const val = (row as unknown[])[i];
      if (val && typeof val === "object" && "toISOString" in val) return (val as Date).toISOString().split("T")[0];
      return String(val ?? "");
    })
  );

  return {
    headers,
    sampleRows,
    totalRows: dataRows.length,
    detectedMapping: detectColumnMapping(headers),
  };
}

export function parseCsvString(csvString: string): ParsedFile {
  const result = Papa.parse(csvString, {
    header: false,
    skipEmptyLines: true,
  });

  const rows = result.data as string[][];
  if (rows.length === 0) {
    return { headers: [], sampleRows: [], totalRows: 0, detectedMapping: {} };
  }

  const headers = rows[0].map((h) => String(h || "").trim());
  const dataRows = rows.slice(1);
  const sampleRows = dataRows.slice(0, 20).map((row) =>
    headers.map((_, i) => String(row[i] ?? ""))
  );

  return {
    headers,
    sampleRows,
    totalRows: dataRows.length,
    detectedMapping: detectColumnMapping(headers),
  };
}
