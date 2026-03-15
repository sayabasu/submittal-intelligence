import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateRisk } from "@/lib/risk-engine";
import { RISK_LEVELS, AT_RISK_STATUSES } from "@/lib/constants";

export async function GET() {
  try {
    // Fetch submittals that are not yet fully approved/delivered
    const submittals = await prisma.submittal.findMany({
      where: {
        status: { in: AT_RISK_STATUSES as unknown as string[] },
      },
    });

    const now = new Date();

    // Calculate live risk for each and filter for at-risk items
    const atRiskLevels = [RISK_LEVELS.CRITICAL, RISK_LEVELS.HIGH, RISK_LEVELS.MEDIUM];

    const alerts = submittals
      .map((s) => {
        const risk = calculateRisk(
          {
            submittalNumber: s.submittalNumber,
            description: s.description,
            equipmentCategory: s.equipmentCategory,
            status: s.status,
            reviewDueDate: s.reviewDueDate,
            requiredOnSiteDate: s.requiredOnSiteDate,
            manufacturingLeadTimeWeeks: s.manufacturingLeadTimeWeeks,
            shippingBufferDays: s.shippingBufferDays,
            poProcessingDays: s.poProcessingDays,
            reviewer: s.reviewer,
            vendor: s.vendor,
          },
          now
        );

        return {
          id: s.id,
          submittalNumber: s.submittalNumber,
          specSection: s.specSection,
          description: s.description,
          equipmentCategory: s.equipmentCategory,
          discipline: s.discipline,
          status: s.status,
          reviewer: s.reviewer,
          reviewerEmail: s.reviewerEmail,
          vendor: s.vendor,
          reviewDueDate: s.reviewDueDate,
          requiredOnSiteDate: s.requiredOnSiteDate,
          manufacturingLeadTimeWeeks: s.manufacturingLeadTimeWeeks,
          riskLevel: risk.level,
          riskScore: risk.score,
          marginDays: risk.marginDays,
          daysUntilCritical: risk.daysUntilCritical,
          riskNarrative: risk.narrative,
          riskBreakdown: risk.breakdown,
        };
      })
      .filter((item) => (atRiskLevels as string[]).includes(item.riskLevel))
      .sort((a, b) => b.riskScore - a.riskScore);

    // Summary counts
    const counts = {
      critical: alerts.filter((a) => a.riskLevel === RISK_LEVELS.CRITICAL).length,
      high: alerts.filter((a) => a.riskLevel === RISK_LEVELS.HIGH).length,
      medium: alerts.filter((a) => a.riskLevel === RISK_LEVELS.MEDIUM).length,
      total: alerts.length,
    };

    return NextResponse.json({
      data: alerts,
      counts,
    });
  } catch (error) {
    console.error("Failed to fetch risk alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk alerts" },
      { status: 500 }
    );
  }
}
