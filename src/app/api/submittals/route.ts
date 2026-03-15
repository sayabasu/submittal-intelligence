import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateRisk } from "@/lib/risk-engine";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const riskLevel = searchParams.get("riskLevel");
    const discipline = searchParams.get("discipline");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10))
    );
    const sortBy = searchParams.get("sortBy") || "submittalNumber";
    const sortDir = (searchParams.get("sortDir") || "asc") as "asc" | "desc";

    const where: Prisma.SubmittalWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    if (discipline) {
      where.discipline = discipline;
    }

    if (search) {
      where.OR = [
        { submittalNumber: { contains: search } },
        { description: { contains: search } },
        { equipmentCategory: { contains: search } },
        { vendor: { contains: search } },
        { reviewer: { contains: search } },
        { specSection: { contains: search } },
      ];
    }

    const allowedSortFields: Record<string, string> = {
      submittalNumber: "submittalNumber",
      specSection: "specSection",
      description: "description",
      discipline: "discipline",
      status: "status",
      riskLevel: "riskLevel",
      riskScore: "riskScore",
      reviewDueDate: "reviewDueDate",
      requiredOnSiteDate: "requiredOnSiteDate",
      daysUntilCritical: "daysUntilCritical",
      vendor: "vendor",
      reviewer: "reviewer",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    };

    const orderByField = allowedSortFields[sortBy] || "submittalNumber";
    const orderBy: Prisma.SubmittalOrderByWithRelationInput = {
      [orderByField]: sortDir,
    };

    const [submittals, total] = await Promise.all([
      prisma.submittal.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.submittal.count({ where }),
    ]);

    // Enrich with live risk calculation
    const now = new Date();
    const enriched = submittals.map((s) => {
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
        ...s,
        riskLevel: risk.level,
        riskScore: risk.score,
        daysUntilCritical: risk.daysUntilCritical,
        marginDays: risk.marginDays,
        riskNarrative: risk.narrative,
      };
    });

    return NextResponse.json({
      data: enriched,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch submittals:", error);
    return NextResponse.json(
      { error: "Failed to fetch submittals" },
      { status: 500 }
    );
  }
}
