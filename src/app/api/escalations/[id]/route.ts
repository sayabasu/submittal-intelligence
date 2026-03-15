import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const escalation = await prisma.escalation.findUnique({
      where: { id },
      include: {
        submittal: {
          select: {
            submittalNumber: true,
            description: true,
            vendor: true,
            reviewer: true,
            reviewerEmail: true,
            riskLevel: true,
            specSection: true,
          },
        },
      },
    });

    if (!escalation) {
      return NextResponse.json(
        { error: "Escalation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(escalation);
  } catch (error) {
    console.error("Failed to fetch escalation:", error);
    return NextResponse.json(
      { error: "Failed to fetch escalation" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, editedBody, dismissReason } = body;

    const escalation = await prisma.escalation.findUnique({
      where: { id },
    });

    if (!escalation) {
      return NextResponse.json(
        { error: "Escalation not found" },
        { status: 404 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "edit":
        updateData = {
          editedBody,
          status: "edited",
        };
        break;
      case "approve":
        updateData = {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: "Project Engineer",
          editedBody: editedBody || escalation.editedBody,
        };
        break;
      case "dismiss":
        updateData = {
          status: "dismissed",
          dismissedAt: new Date(),
          dismissReason: dismissReason || "Dismissed by user",
        };
        break;
      case "send":
        updateData = {
          status: "sent",
          sentAt: new Date(),
        };
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action. Use: edit, approve, dismiss, or send" },
          { status: 400 }
        );
    }

    const updated = await prisma.escalation.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update escalation:", error);
    return NextResponse.json(
      { error: "Failed to update escalation" },
      { status: 500 }
    );
  }
}
