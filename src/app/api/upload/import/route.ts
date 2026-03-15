import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateRisk } from "@/lib/risk-engine";
import type { ColumnMapping, ImportResult } from "@/lib/types";

const STATUS_MAP: Record<string, string> = {
  "not submitted": "not_submitted",
  "not_submitted": "not_submitted",
  submitted: "submitted",
  "under review": "under_review",
  "under_review": "under_review",
  approved: "approved",
  "approved as noted": "approved_as_noted",
  "approved_as_noted": "approved_as_noted",
  rejected: "rejected",
  resubmit: "resubmit",
  "revise and resubmit": "resubmit",
};

function normalizeStatus(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return STATUS_MAP[lower] || "not_submitted";
}

function parseDate(value: string): Date | null {
  if (!value || value.trim() === "") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(value: string, fallback: number): number {
  if (!value || value.trim() === "") return fallback;
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mapping,
      rows,
      filename,
      fileType,
    }: {
      mapping: ColumnMapping;
      rows: string[][];
      headers: string[];
      filename: string;
      fileType: string;
    } = body;

    if (!mapping || !rows || rows.length === 0) {
      return NextResponse.json(
        { error: "No mapping or data provided" },
        { status: 400 }
      );
    }

    // Get or create a default project
    let project = await prisma.project.findFirst();
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: "Default Data Center Project",
          code: "DC-001",
          description: "Imported project",
        },
      });
    }

    // Invert mapping: schema field -> column index
    const headerToIndex: Record<string, number> = {};
    const invertedMapping: Record<string, number> = {};

    // mapping: { fileColumnName: schemaFieldName }
    // We need to find which index in the row corresponds to each schema field
    // rows are already mapped by headers order, so we need headers
    const headersList = Object.keys(mapping);
    headersList.forEach((header, _idx) => {
      // Find index of this header in the rows. But rows are raw arrays,
      // we need to know the original header order.
      // The caller sends headers array too.
      headerToIndex[header] = body.headers.indexOf(header);
    });

    for (const [fileCol, schemaField] of Object.entries(mapping)) {
      const idx = body.headers.indexOf(fileCol);
      if (idx >= 0) {
        invertedMapping[schemaField] = idx;
      }
    }

    const getField = (row: string[], field: string): string => {
      const idx = invertedMapping[field];
      if (idx === undefined || idx < 0) return "";
      return (row[idx] ?? "").trim();
    };

    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
    const now = new Date();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const submittalNumber = getField(row, "submittalNumber");
        const description = getField(row, "description");
        const requiredOnSiteDateStr = getField(row, "requiredOnSiteDate");

        // Validate required fields
        if (!submittalNumber) {
          result.errors.push({ row: i + 1, reason: "Missing submittal number" });
          result.skipped++;
          continue;
        }
        if (!description) {
          result.errors.push({ row: i + 1, reason: "Missing description" });
          result.skipped++;
          continue;
        }

        const requiredOnSiteDate = parseDate(requiredOnSiteDateStr);
        if (!requiredOnSiteDate) {
          result.errors.push({ row: i + 1, reason: "Invalid or missing required on-site date" });
          result.skipped++;
          continue;
        }

        // Check for duplicates
        const existing = await prisma.submittal.findFirst({
          where: {
            projectId: project.id,
            submittalNumber,
          },
        });

        if (existing) {
          result.errors.push({ row: i + 1, reason: `Duplicate submittal number: ${submittalNumber}` });
          result.skipped++;
          continue;
        }

        const status = normalizeStatus(getField(row, "status") || "not_submitted");
        const manufacturingLeadTimeWeeks = parseNumber(getField(row, "manufacturingLeadTimeWeeks"), 8);
        const shippingBufferDays = parseNumber(getField(row, "shippingBufferDays"), 14);
        const poProcessingDays = parseNumber(getField(row, "poProcessingDays"), 10);

        const submittalData = {
          projectId: project.id,
          submittalNumber,
          specSection: getField(row, "specSection") || "00 00 00",
          description,
          equipmentCategory: getField(row, "equipmentCategory") || "General",
          submittalType: "product_data",
          discipline: getField(row, "discipline") || "Electrical",
          status,
          submittedDate: parseDate(getField(row, "submittedDate")),
          reviewDueDate: parseDate(getField(row, "reviewDueDate")),
          approvedDate: parseDate(getField(row, "approvedDate")),
          manufacturingLeadTimeWeeks: Math.round(manufacturingLeadTimeWeeks),
          requiredOnSiteDate,
          shippingBufferDays: Math.round(shippingBufferDays),
          poProcessingDays: Math.round(poProcessingDays),
          vendor: getField(row, "vendor") || "TBD",
          vendorContact: getField(row, "vendorContact") || null,
          vendorEmail: getField(row, "vendorEmail") || null,
          reviewer: getField(row, "reviewer") || "TBD",
          reviewerEmail: getField(row, "reviewerEmail") || null,
          sourceRow: i + 1,
        };

        // Calculate risk
        const risk = calculateRisk(
          {
            submittalNumber: submittalData.submittalNumber,
            description: submittalData.description,
            equipmentCategory: submittalData.equipmentCategory,
            status: submittalData.status,
            reviewDueDate: submittalData.reviewDueDate,
            requiredOnSiteDate: submittalData.requiredOnSiteDate,
            manufacturingLeadTimeWeeks: submittalData.manufacturingLeadTimeWeeks,
            shippingBufferDays: submittalData.shippingBufferDays,
            poProcessingDays: submittalData.poProcessingDays,
            reviewer: submittalData.reviewer,
            vendor: submittalData.vendor,
          },
          now
        );

        await prisma.submittal.create({
          data: {
            ...submittalData,
            riskLevel: risk.level,
            riskScore: risk.score,
            daysUntilCritical: risk.daysUntilCritical,
            riskCalculatedAt: now,
            riskNotes: risk.narrative,
          },
        });

        result.imported++;
      } catch (rowError) {
        const message = rowError instanceof Error ? rowError.message : "Unknown error";
        result.errors.push({ row: i + 1, reason: message });
        result.skipped++;
      }
    }

    // Log the upload
    await prisma.uploadLog.create({
      data: {
        filename: filename || "unknown",
        fileType: fileType || "unknown",
        rowCount: rows.length,
        importedCount: result.imported,
        skippedCount: result.skipped,
        errorCount: result.errors.length,
        columnMapping: JSON.stringify(mapping),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to import data:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
}
