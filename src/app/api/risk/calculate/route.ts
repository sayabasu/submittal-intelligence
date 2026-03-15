import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateRisk } from "@/lib/risk-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { ids } = body as { ids?: string[] };

    const where = ids && ids.length > 0 ? { id: { in: ids } } : {};

    const submittals = await prisma.submittal.findMany({
      where,
    });

    if (submittals.length === 0) {
      return NextResponse.json(
        { error: "No submittals found" },
        { status: 404 }
      );
    }

    const now = new Date();
    let updated = 0;

    for (const submittal of submittals) {
      const risk = calculateRisk(
        {
          submittalNumber: submittal.submittalNumber,
          description: submittal.description,
          equipmentCategory: submittal.equipmentCategory,
          status: submittal.status,
          reviewDueDate: submittal.reviewDueDate,
          requiredOnSiteDate: submittal.requiredOnSiteDate,
          manufacturingLeadTimeWeeks: submittal.manufacturingLeadTimeWeeks,
          shippingBufferDays: submittal.shippingBufferDays,
          poProcessingDays: submittal.poProcessingDays,
          reviewer: submittal.reviewer,
          vendor: submittal.vendor,
        },
        now
      );

      await prisma.submittal.update({
        where: { id: submittal.id },
        data: {
          riskLevel: risk.level,
          riskScore: risk.score,
          daysUntilCritical: risk.daysUntilCritical,
          riskNotes: risk.narrative,
          riskCalculatedAt: now,
        },
      });

      updated++;
    }

    return NextResponse.json({
      success: true,
      updated,
      calculatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Failed to calculate risk:", error);
    return NextResponse.json(
      { error: "Failed to calculate risk" },
      { status: 500 }
    );
  }
}
