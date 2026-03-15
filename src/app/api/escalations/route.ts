import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { openai } from "@/lib/openai";
import { buildEscalationPrompt, parseEscalationResponse } from "@/lib/escalation-prompt";
import { calculateRisk } from "@/lib/risk-engine";
import { format } from "date-fns";

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

    let responseText = "";
    let aiModel = "gpt-4o-mini";
    let openaiClient = openai;

    if (openaiClient) {
      try {
        const completion = await openaiClient.chat.completions.create({
          model: aiModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 500,
        });
        responseText = completion.choices[0]?.message?.content || "";
      } catch (err) {
        console.error("OpenAI API call failed:", err);
        openaiClient = null; // Force fallback below
      }
    }

    if (!openaiClient) {
      aiModel = "rule-based-template";
      responseText = `SUBJECT: Urgent Escalation: Submittal ${submittal.submittalNumber} - ${submittal.description}
BODY: Dear ${submittal.reviewer.split(" - ")[0]},

I am writing to formally escalate the review for submittal ${submittal.submittalNumber} (${submittal.description}). 

Our latest risk analysis shows this item is at ${risk.level.toUpperCase()} risk. With a current margin of ${risk.marginDays} days and a required on-site date of ${format(new Date(submittal.requiredOnSiteDate), "MMM d, yyyy")}, any further delay in the review process will directly impact the project schedule. 

The full procurement pipeline (including manufacturing and shipping) requires ${risk.breakdown.totalNeededDays} days. Please prioritize this review and provide your feedback as soon as possible to avoid a critical path delay.

Best regards,
Project Engineer`;
    }

    const generationTimeMs = Date.now() - startTime;
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
        aiModel,
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
