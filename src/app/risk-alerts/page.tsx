import Link from "next/link";
import { prisma } from "@/lib/db";
import { calculateRisk } from "@/lib/risk-engine";
import {
  RISK_COLORS,
  RISK_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import { formatDate, formatShortDate } from "@/lib/date-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  Clock,
  Building2,
  UserCircle,
} from "lucide-react";

export const metadata = {
  title: "Risk Alerts | Submittal Intelligence",
  description: "Critical and high risk submittals requiring attention",
};

interface EnrichedSubmittal {
  id: string;
  submittalNumber: string;
  specSection: string;
  description: string;
  equipmentCategory: string;
  discipline: string;
  status: string;
  vendor: string;
  reviewer: string;
  reviewerEmail: string | null;
  reviewDueDate: Date | null;
  requiredOnSiteDate: Date;
  manufacturingLeadTimeWeeks: number;
  shippingBufferDays: number;
  poProcessingDays: number;
  riskLevel: string;
  riskScore: number;
  marginDays: number;
  narrative: string;
}

export default async function RiskAlertsPage() {
  const now = new Date();

  // Fetch all submittals that are not approved/completed
  const submittals = await prisma.submittal.findMany({
    where: {
      status: {
        notIn: ["approved", "approved_as_noted"],
      },
    },
    orderBy: { requiredOnSiteDate: "asc" },
  });

  // Calculate risk for each and filter critical/high
  const enriched: EnrichedSubmittal[] = [];

  for (const s of submittals) {
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

    if (risk.level === "critical" || risk.level === "high") {
      enriched.push({
        id: s.id,
        submittalNumber: s.submittalNumber,
        specSection: s.specSection,
        description: s.description,
        equipmentCategory: s.equipmentCategory,
        discipline: s.discipline,
        status: s.status,
        vendor: s.vendor,
        reviewer: s.reviewer,
        reviewerEmail: s.reviewerEmail,
        reviewDueDate: s.reviewDueDate,
        requiredOnSiteDate: s.requiredOnSiteDate,
        manufacturingLeadTimeWeeks: s.manufacturingLeadTimeWeeks,
        shippingBufferDays: s.shippingBufferDays,
        poProcessingDays: s.poProcessingDays,
        riskLevel: risk.level,
        riskScore: risk.score,
        marginDays: risk.marginDays,
        narrative: risk.narrative,
      });
    }
  }

  // Sort: critical first (by margin ascending), then high (by margin ascending)
  enriched.sort((a, b) => {
    if (a.riskLevel === "critical" && b.riskLevel !== "critical") return -1;
    if (a.riskLevel !== "critical" && b.riskLevel === "critical") return 1;
    return a.marginDays - b.marginDays;
  });

  const criticalItems = enriched.filter((s) => s.riskLevel === "critical");
  const highItems = enriched.filter((s) => s.riskLevel === "high");

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          Risk Alerts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submittals at critical or high risk of causing schedule delays.
          {enriched.length > 0 && (
            <span className="ml-1 font-medium">
              {criticalItems.length} critical, {highItems.length} high risk
              items require attention.
            </span>
          )}
        </p>
      </div>

      {enriched.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-green-50 p-3 mb-3">
              <AlertTriangle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">No Risk Alerts</h3>
            <p className="text-sm text-muted-foreground mt-1">
              All submittals are within acceptable risk thresholds.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Critical Section */}
      {criticalItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-600">
              Critical ({criticalItems.length})
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {criticalItems.map((item) => (
              <RiskAlertCard key={item.id} submittal={item} />
            ))}
          </div>
        </div>
      )}

      {/* High Section */}
      {highItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-orange-600">
              High Risk ({highItems.length})
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {highItems.map((item) => (
              <RiskAlertCard key={item.id} submittal={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskAlertCard({ submittal }: { submittal: EnrichedSubmittal }) {
  const riskColor = RISK_COLORS[submittal.riskLevel] || "#6b7280";
  const isCritical = submittal.riskLevel === "critical";

  return (
    <Card
      className="overflow-hidden"
      style={{ borderLeft: `4px solid ${riskColor}` }}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Top row: Submittal info + Action */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/submittals/${submittal.id}`}
                  className="font-mono text-sm font-semibold text-primary hover:underline"
                >
                  {submittal.submittalNumber}
                </Link>
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: riskColor + "18",
                    color: riskColor,
                    border: `1px solid ${riskColor}40`,
                  }}
                >
                  {submittal.marginDays > 0
                    ? `${submittal.marginDays}d margin`
                    : `${Math.abs(submittal.marginDays)}d late`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {STATUS_LABELS[submittal.status] || submittal.status}
                </span>
              </div>
              <p className="text-sm font-medium truncate">
                {submittal.description}
              </p>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {submittal.vendor}
                </span>
                <span className="flex items-center gap-1">
                  <UserCircle className="h-3 w-3" />
                  {submittal.reviewer}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  On site: {formatShortDate(submittal.requiredOnSiteDate)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/submittals/${submittal.id}`}>
                <Button variant="outline" size="sm">
                  View Detail
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
              <Link
                href={`/escalations?submittalId=${submittal.id}&generate=true`}
              >
                <Button
                  variant={isCritical ? "destructive" : "outline"}
                  size="sm"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Escalate
                </Button>
              </Link>
            </div>
          </div>

          {/* Narrative */}
          <div className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-2.5">
            {submittal.narrative}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
