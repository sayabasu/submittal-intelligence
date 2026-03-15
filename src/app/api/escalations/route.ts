import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { openai } from "@/lib/openai";
import { buildEscalationPrompt, parseEscalationResponse } from "@/lib/escalation-prompt";
import { calculateRisk } from "@/lib/risk-engine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const urgencyLevel = searchParams.get("urgencyLevel");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (urgencyLevel) where.urgencyLevel = urgencyLevel;

    const escalations = await prisma.escalation.findMany({
      where,
      include: {
        submittal: {
          select: {
            submittalNumber: true,
            description: true,
            vendor: true,
            reviewer: true,
            riskLevel: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: escalations });
  } catch (error) {
    console.error("Failed to fetch escalations:", error);
    return NextResponse.json(
      { error: "Failed to fetch escalations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submittalId } = body;

    if (!submittalId) {
      return NextResponse.json(
        { error: "submittalId is required" },
        { status: 400 }
      );
    }

    const submittal = await prisma.submittal.findUnique({
      where: { id: submittalId },
      include: { project: true },
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

    const startTime = Date.now();
    const prompt = buildEscalationPrompt({
      projectName: submittal.project.name,
      submittalNumber: submittal.submittalNumber,
      description: submittal.description,
      equipmentCategory: submittal.equipmentCategory,
      specSection: submittal.specSection,
      status: submittal.status,
      vendor: submittal.vendor,
      reviewer: submittal.reviewer,
      reviewerEmail: submittal.reviewerEmail,
      reviewDueDate: submittal.reviewDueDate,
      requiredOnSiteDate: submittal.requiredOnSiteDate,
      manufacturingLeadTimeWeeks: submittal.manufacturingLeadTimeWeeks,
      risk,
      senderName: "Project Engineer",
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const generationTimeMs = Date.now() - startTime;
    const responseText = completion.choices[0]?.message?.content || "";
    const { subject, body: emailBody } = parseEscalationResponse(responseText);

    const urgencyLevel = risk.level === "critical" ? "critical" : risk.level === "high" ? "high" : "medium";

    const escalation = await prisma.escalation.create({
      data: {
        projectId: submittal.projectId,
        submittalId: submittal.id,
        subject,
        body: emailBody,
        recipient: submittal.reviewer,
        recipientEmail: submittal.reviewerEmail,
        urgencyLevel,
        aiModel: "gpt-4o-mini",
        promptVersion: "v1",
        generationTimeMs,
        status: "draft",
      },
      include: {
        submittal: {
          select: {
            submittalNumber: true,
            description: true,
            vendor: true,
            reviewer: true,
            riskLevel: true,
          },
        },
      },
    });

    return NextResponse.json(escalation, { status: 201 });
  } catch (error) {
    console.error("Failed to generate escalation:", error);
    return NextResponse.json(
      { error: "Failed to generate escalation" },
      { status: 500 }
    );
  }
}
