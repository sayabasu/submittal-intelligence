import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ProjectSummary } from "@/lib/types";

export async function GET() {
  try {
    const project = await prisma.project.findFirst({
      include: {
        _count: {
          select: { submittals: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "No project found" },
        { status: 404 }
      );
    }

    // Get status counts
    const statusGroups = await prisma.submittal.groupBy({
      by: ["status"],
      where: { projectId: project.id },
      _count: { status: true },
    });

    const statusCounts: Record<string, number> = {};
    for (const group of statusGroups) {
      statusCounts[group.status] = group._count.status;
    }

    // Get risk level counts
    const riskGroups = await prisma.submittal.groupBy({
      by: ["riskLevel"],
      where: { projectId: project.id, riskLevel: { not: null } },
      _count: { riskLevel: true },
    });

    const riskCounts: Record<string, number> = {};
    for (const group of riskGroups) {
      if (group.riskLevel) {
        riskCounts[group.riskLevel] = group._count.riskLevel;
      }
    }

    // Get discipline counts
    const disciplineGroups = await prisma.submittal.groupBy({
      by: ["discipline"],
      where: { projectId: project.id },
      _count: { discipline: true },
    });

    const disciplineCounts: Record<string, number> = {};
    for (const group of disciplineGroups) {
      disciplineCounts[group.discipline] = group._count.discipline;
    }

    const summary: ProjectSummary = {
      id: project.id,
      name: project.name,
      code: project.code,
      description: project.description,
      location: project.location,
      capacityMw: project.capacityMw,
      owner: project.owner,
      epc: project.epc,
      noticeToProceedDate: project.noticeToProceedDate?.toISOString() ?? null,
      targetCompletionDate:
        project.targetCompletionDate?.toISOString() ?? null,
      totalSubmittals: project._count.submittals,
      statusCounts,
      riskCounts,
      disciplineCounts,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching project summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch project summary" },
      { status: 500 }
    );
  }
}
