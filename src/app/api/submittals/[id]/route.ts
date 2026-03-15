import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateRisk } from "@/lib/risk-engine";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const submittal = await prisma.submittal.findUnique({
      where: { id },
      include: {
        project: true,
        escalations: {
          orderBy: { createdAt: "desc" },
        },
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!submittal) {
      return NextResponse.json(
        { error: "Submittal not found" },
        { status: 404 }
      );
    }

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
      new Date()
    );

    return NextResponse.json({
      ...submittal,
      riskLevel: risk.level,
      riskScore: risk.score,
      daysUntilCritical: risk.daysUntilCritical,
      marginDays: risk.marginDays,
      riskNarrative: risk.narrative,
      riskBreakdown: risk.breakdown,
    });
  } catch (error) {
    console.error("Failed to fetch submittal:", error);
    return NextResponse.json(
      { error: "Failed to fetch submittal" },
      { status: 500 }
    );
  }
}
