import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { calculateRisk } from "@/lib/risk-engine";
import {
  RISK_COLORS,
  RISK_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/constants";
import { formatDate, formatShortDate, isOverdue } from "@/lib/date-utils";
import { differenceInCalendarDays, format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  AlertTriangle,
  CalendarDays,
  Building2,
  UserCircle,
  Mail,
  Truck,
  Factory,
  FileText,
  Clock,
  ChevronRight,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const submittal = await prisma.submittal.findUnique({
    where: { id },
    select: { submittalNumber: true, description: true },
  });
  if (!submittal) return { title: "Not Found" };
  return {
    title: `${submittal.submittalNumber} - ${submittal.description} | Submittal Intelligence`,
  };
}

export default async function SubmittalDetailPage({ params }: PageProps) {
  const { id } = await params;

  const submittal = await prisma.submittal.findUnique({
    where: { id },
    include: {
      project: true,
      escalations: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!submittal) {
    notFound();
  }

  const now = new Date();
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

  const riskColor = RISK_COLORS[risk.level] || "#6b7280";
  const statusColor = STATUS_COLORS[submittal.status] || "#6b7280";
  const statusLabel = STATUS_LABELS[submittal.status] || submittal.status;
  const riskLabel = RISK_LABELS[risk.level] || risk.level;

  // Timeline calculation
  const reviewDueDate = submittal.reviewDueDate ? new Date(submittal.reviewDueDate) : null;
  const requiredOnSiteDate = new Date(submittal.requiredOnSiteDate);
  const totalDaysAvailable = differenceInCalendarDays(requiredOnSiteDate, now);

  let reviewRemainingStr = "";
  if (reviewDueDate) {
    const daysUntilDue = differenceInCalendarDays(reviewDueDate, now);
    if (daysUntilDue > 0) {
      reviewRemainingStr = `${daysUntilDue} days remaining`;
    } else if (daysUntilDue === 0) {
      reviewRemainingStr = "Due today";
    } else {
      reviewRemainingStr = `OVERDUE by ${Math.abs(daysUntilDue)} days`;
    }
  } else {
    reviewRemainingStr = "Not yet submitted";
  }

  // Timeline segments for visualization
  const { breakdown } = risk;
  const totalNeeded = breakdown.totalNeededDays;
  const segmentParts = [
    { label: "Review", days: breakdown.remainingReviewDays, color: "#8b5cf6" },
    ...(breakdown.resubmissionPenaltyDays > 0
      ? [{ label: "Resubmit", days: breakdown.resubmissionPenaltyDays, color: "#f59e0b" }]
      : []),
    { label: "PO Processing", days: breakdown.poProcessingDays, color: "#3b82f6" },
    { label: "Manufacturing", days: breakdown.manufacturingDays, color: "#6366f1" },
    { label: "Shipping", days: breakdown.shippingDays, color: "#06b6d4" },
  ];

  const maxDays = Math.max(totalNeeded, totalDaysAvailable, 1);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl">
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/submittals"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Submittal Log
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">
          {submittal.submittalNumber}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {submittal.submittalNumber}
              </h1>
              <span
                className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: statusColor + "18",
                  color: statusColor,
                  border: `1px solid ${statusColor}40`,
                }}
              >
                {statusLabel}
              </span>
              <span
                className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: riskColor + "18",
                  color: riskColor,
                  border: `1px solid ${riskColor}40`,
                }}
              >
                {riskLabel} Risk
              </span>
            </div>
            <p className="text-base text-muted-foreground">
              {submittal.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span>Spec: {submittal.specSection}</span>
              <span>Category: {submittal.equipmentCategory}</span>
              <span>Discipline: {submittal.discipline}</span>
              <span>Rev {submittal.revision}</span>
            </div>
          </div>
          <Link href={`/escalations?submittalId=${submittal.id}`}>
            <Button variant="destructive" size="sm">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              Generate Escalation
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Calculation Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Risk Calculation Breakdown
            </CardTitle>
            <CardDescription>
              Transparent math showing how the risk level is determined
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-lg p-4 font-mono text-sm leading-relaxed border"
              style={{ borderLeftColor: riskColor, borderLeftWidth: "4px" }}
            >
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Today:</span>
                  <span>{format(now, "MMMM d, yyyy")}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Review remaining:
                  </span>
                  <span
                    className={cn(
                      reviewDueDate && isOverdue(reviewDueDate) && "text-red-600 font-semibold"
                    )}
                  >
                    {breakdown.remainingReviewDays} days
                    {reviewDueDate && (
                      <span className="text-xs ml-1">({reviewRemainingStr})</span>
                    )}
                  </span>
                </div>
                {breakdown.resubmissionPenaltyDays > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Resubmission penalty:
                    </span>
                    <span className="text-amber-600">
                      {breakdown.resubmissionPenaltyDays} days
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PO processing:</span>
                  <span>{breakdown.poProcessingDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Manufacturing:
                  </span>
                  <span>
                    {submittal.manufacturingLeadTimeWeeks} weeks (
                    {breakdown.manufacturingDays} days)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Shipping buffer:
                  </span>
                  <span>{breakdown.shippingDays} days</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total needed:</span>
                  <span>{breakdown.totalNeededDays} days</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Days available:</span>
                  <span>
                    {breakdown.daysAvailable} days
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      (until {formatShortDate(submittal.requiredOnSiteDate)})
                    </span>
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Margin:</span>
                  <span style={{ color: riskColor }}>
                    {risk.marginDays > 0 ? "+" : ""}
                    {risk.marginDays} days
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Risk Level:</span>
                  <span style={{ color: riskColor }}>{riskLabel.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Info Card */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4" />
                Vendor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="font-medium">{submittal.vendor}</div>
              {submittal.vendorContact && (
                <div className="text-muted-foreground">
                  {submittal.vendorContact}
                </div>
              )}
              {submittal.vendorEmail && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {submittal.vendorEmail}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <UserCircle className="h-4 w-4" />
                Reviewer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="font-medium">{submittal.reviewer}</div>
              {submittal.reviewerEmail && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {submittal.reviewerEmail}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4" />
                Key Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted:</span>
                <span>{formatDate(submittal.submittedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Review Due:</span>
                <span
                  className={cn(
                    reviewDueDate && isOverdue(reviewDueDate) && "text-red-600 font-semibold"
                  )}
                >
                  {formatDate(submittal.reviewDueDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approved:</span>
                <span>{formatDate(submittal.approvedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PO Linked:</span>
                <span>{formatDate(submittal.linkedPoDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Req. On Site:</span>
                <span className="font-medium">
                  {formatDate(submittal.requiredOnSiteDate)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Procurement Timeline
          </CardTitle>
          <CardDescription>
            Visual breakdown of the procurement chain from today to required
            on-site date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Timeline bar */}
            <div className="relative">
              <div className="h-10 bg-muted rounded-lg overflow-hidden flex">
                {segmentParts.map((seg, idx) => {
                  const widthPct = Math.max(
                    (seg.days / maxDays) * 100,
                    2
                  );
                  return (
                    <div
                      key={idx}
                      className="h-full flex items-center justify-center text-[10px] font-medium text-white relative"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: seg.color,
                        minWidth: "40px",
                      }}
                      title={`${seg.label}: ${seg.days} days`}
                    >
                      <span className="truncate px-1">
                        {seg.days}d
                      </span>
                    </div>
                  );
                })}
                {/* Margin */}
                {risk.marginDays > 0 && (
                  <div
                    className="h-full flex items-center justify-center text-[10px] font-medium"
                    style={{
                      width: `${Math.max((risk.marginDays / maxDays) * 100, 2)}%`,
                      backgroundColor: "#16a34a20",
                      color: "#16a34a",
                      minWidth: "40px",
                    }}
                    title={`Margin: ${risk.marginDays} days`}
                  >
                    <span className="truncate px-1">
                      +{risk.marginDays}d
                    </span>
                  </div>
                )}
              </div>

              {/* Today marker */}
              <div className="absolute -top-1 left-0 flex flex-col items-center">
                <div className="w-0.5 h-12 bg-foreground" />
                <span className="text-[10px] font-medium mt-0.5">Today</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs">
              {segmentParts.map((seg, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-muted-foreground">
                    {seg.label}: {seg.days}d
                  </span>
                </div>
              ))}
              {risk.marginDays > 0 && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: "#16a34a" }}
                  />
                  <span className="text-muted-foreground">
                    Margin: {risk.marginDays}d
                  </span>
                </div>
              )}
              {risk.marginDays < 0 && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: "#dc2626" }}
                  />
                  <span className="text-red-600 font-medium">
                    Deficit: {Math.abs(risk.marginDays)}d LATE
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Narrative */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Risk Assessment Narrative
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {risk.narrative}
          </p>
        </CardContent>
      </Card>

      {/* Recent Escalations */}
      {submittal.escalations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recent Escalations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submittal.escalations.map((esc) => (
                <Link
                  key={esc.id}
                  href={`/escalations/${esc.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{esc.subject}</span>
                    <span className="text-xs text-muted-foreground">
                      To: {esc.recipient} | {formatDate(esc.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor:
                          esc.urgencyLevel === "critical"
                            ? "#dc262618"
                            : esc.urgencyLevel === "high"
                              ? "#ea580c18"
                              : "#ca8a0418",
                        color:
                          esc.urgencyLevel === "critical"
                            ? "#dc2626"
                            : esc.urgencyLevel === "high"
                              ? "#ea580c"
                              : "#ca8a04",
                      }}
                    >
                      {esc.urgencyLevel}
                    </span>
                    <Badge variant="outline">{esc.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
