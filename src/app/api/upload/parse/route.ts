import { NextRequest, NextResponse } from "next/server";
import { parseExcelBuffer, parseCsvString } from "@/lib/file-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const isCSV = filename.endsWith(".csv");
    const isExcel =
      filename.endsWith(".xlsx") ||
      filename.endsWith(".xls");

    if (!isCSV && !isExcel) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a .csv, .xlsx, or .xls file." },
        { status: 400 }
      );
    }

    let parsed;

    if (isCSV) {
      const text = await file.text();
      parsed = parseCsvString(text);
    } else {
      const buffer = await file.arrayBuffer();
      parsed = parseExcelBuffer(buffer);
    }

    if (parsed.headers.length === 0) {
      return NextResponse.json(
        { error: "File appears to be empty or has no headers." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      filename: file.name,
      fileType: isCSV ? "csv" : "excel",
      headers: parsed.headers,
      sampleRows: parsed.sampleRows,
      totalRows: parsed.totalRows,
      detectedMapping: parsed.detectedMapping,
    });
  } catch (error) {
    console.error("Failed to parse file:", error);
    return NextResponse.json(
      { error: "Failed to parse file. Please check the file format." },
      { status: 500 }
    );
  }
}
