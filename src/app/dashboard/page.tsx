import { prisma } from "@/lib/db";
import { calculateRisk } from "@/lib/risk-engine";
import { RISK_LEVELS, AT_RISK_STATUSES } from "@/lib/constants";
import { formatDate, isOverdue } from "@/lib/date-utils";
import {
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Bot,
  FileCheck,
  RefreshCw,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisciplineRiskChart } from "./discipline-risk-chart";

interface RiskCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface UpcomingDeadline {
  id: string;
  submittalNumber: string;
  description: string;
  reviewDueDate: string;
  riskLevel: string;
  discipline: string;
  reviewer: string;
  daysUntil: number;
  isOverdue: boolean;
}

interface DisciplineRiskData {
  discipline: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

async function getDashboardData() {
  const now = new Date();

  // Fetch all submittals for risk calculation
  const allSubmittals = await prisma.submittal.findMany();

  // Calculate live risk for each
  const enriched = allSubmittals.map((s) => {
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
    return { ...s, risk };
  });

  // Risk counts
  const riskCounts: RiskCounts = {
    critical: enriched.filter((s) => s.risk.level === RISK_LEVELS.CRITICAL).length,
    high: enriched.filter((s) => s.risk.level === RISK_LEVELS.HIGH).length,
    medium: enriched.filter((s) => s.risk.level === RISK_LEVELS.MEDIUM).length,
    low: enriched.filter((s) => s.risk.level === RISK_LEVELS.LOW).length,
  };

  // Risk by discipline
  const disciplineMap = new Map<string, { critical: number; high: number; medium: number; low: number }>();
  for (const s of enriched) {
    const existing = disciplineMap.get(s.discipline) || { critical: 0, high: 0, medium: 0, low: 0 };
    existing[s.risk.level as keyof typeof existing]++;
    disciplineMap.set(s.discipline, existing);
  }
  const disciplineRiskData: DisciplineRiskData[] = Array.from(disciplineMap.entries())
    .map(([discipline, counts]) => ({ discipline, ...counts }))
    .sort((a, b) => (b.critical + b.high) - (a.critical + a.high));

  // Upcoming deadlines -- submittals with review due dates that are not approved
  const atRiskStatuses = AT_RISK_STATUSES as unknown as string[];
  const upcomingDeadlines: UpcomingDeadline[] = enriched
    .filter(
      (s) =>
        s.reviewDueDate !== null &&
        atRiskStatuses.includes(s.status)
    )
    .map((s) => {
      const dueDate = new Date(s.reviewDueDate!);
      const daysUntil = Math.round(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: s.id,
        submittalNumber: s.submittalNumber,
        description: s.description,
        reviewDueDate: s.reviewDueDate!.toISOString(),
        riskLevel: s.risk.level,
        discipline: s.discipline,
        reviewer: s.reviewer,
        daysUntil,
        isOverdue: isOverdue(s.reviewDueDate),
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 10);

  return {
    riskCounts,
    disciplineRiskData,
    upcomingDeadlines,
    totalSubmittals: allSubmittals.length,
  };
}

const riskCardConfig = [
  {
    key: "critical" as const,
    label: "Critical Risk",
    icon: ShieldAlert,
    bgColor: "bg-red-50",
    borderColor: "border-l-4 border-l-red-500",
    textColor: "text-red-700",
    iconColor: "text-red-500",
    badgeClass: "risk-badge-critical",
  },
  {
    key: "high" as const,
    label: "High Risk",
    icon: AlertTriangle,
    bgColor: "bg-orange-50",
    borderColor: "border-l-4 border-l-orange-500",
    textColor: "text-orange-700",
    iconColor: "text-orange-500",
    badgeClass: "risk-badge-high",
  },
  {
    key: "medium" as const,
    label: "Medium Risk",
    icon: TrendingUp,
    bgColor: "bg-amber-50",
    borderColor: "border-l-4 border-l-amber-500",
    textColor: "text-amber-700",
    iconColor: "text-amber-500",
    badgeClass: "risk-badge-medium",
  },
  {
    key: "low" as const,
    label: "Low Risk",
    icon: ShieldCheck,
    bgColor: "bg-green-50",
    borderColor: "border-l-4 border-l-green-500",
    textColor: "text-green-700",
    iconColor: "text-green-500",
    badgeClass: "risk-badge-low",
  },
];

// Mock activity feed entries for the agent
const agentActivities = [
  {
    id: 1,
    action: "Risk scores recalculated",
    detail: "All 303 submittals updated with current risk assessments",
    time: "2 minutes ago",
    icon: RefreshCw,
    color: "text-blue-500",
  },
  {
    id: 2,
    action: "Escalation draft generated",
    detail: "Auto-generated email for SUB-ELEC-042 (48kV Switchgear)",
    time: "15 minutes ago",
    icon: Send,
    color: "text-violet-500",
  },
  {
    id: 3,
    action: "New critical risk detected",
    detail: "SUB-MECH-018 margin dropped below 0 days",
    time: "1 hour ago",
    icon: AlertTriangle,
    color: "text-red-500",
  },
  {
    id: 4,
    action: "Submittal status updated",
    detail: "SUB-FP-007 moved from Under Review to Approved",
    time: "2 hours ago",
    icon: FileCheck,
    color: "text-green-500",
  },
  {
    id: 5,
    action: "Review deadline approaching",
    detail: "5 submittals due within the next 7 days",
    time: "3 hours ago",
    icon: Clock,
    color: "text-amber-500",
  },
];

export default async function DashboardPage() {
  const { riskCounts, disciplineRiskData, upcomingDeadlines, totalSubmittals } =
    await getDashboardData();

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Project Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Hyperion DC-01 &mdash; {totalSubmittals} submittals tracked
        </p>
      </div>

      {/* Risk Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {riskCardConfig.map((config) => {
          const Icon = config.icon;
          const count = riskCounts[config.key];

          return (
            <Card
              key={config.key}
              className={`${config.borderColor} ${config.bgColor} ring-0`}
            >
              <CardContent className="flex items-center gap-4 pt-4">
                <div className={`rounded-lg bg-white/70 p-2.5 shadow-sm`}>
                  <Icon className={`h-5 w-5 ${config.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">
                    {config.label}
                  </p>
                  <p className={`text-2xl font-bold ${config.textColor}`}>
                    {count}
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  {totalSubmittals > 0
                    ? `${Math.round((count / totalSubmittals) * 100)}%`
                    : "0%"}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Risk Distribution by Discipline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
              Risk Distribution by Discipline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DisciplineRiskChart data={disciplineRiskData} />
          </CardContent>
        </Card>

        {/* Upcoming Review Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-slate-400" />
              Upcoming Review Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  No upcoming deadlines
                </p>
              ) : (
                upcomingDeadlines.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="mt-0.5">
                      <RiskDot level={item.riskLevel} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">
                          {item.submittalNumber}
                        </span>
                        <span className="truncate text-xs text-slate-400">
                          {item.discipline}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {item.description}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Reviewer: {item.reviewer.split(" - ")[0]}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {item.isOverdue ? (
                        <Badge
                          variant="destructive"
                          className="text-[10px]"
                        >
                          {Math.abs(item.daysUntil)}d overdue
                        </Badge>
                      ) : item.daysUntil <= 3 ? (
                        <Badge
                          variant="outline"
                          className="border-amber-300 text-[10px] text-amber-600"
                        >
                          {item.daysUntil}d left
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {formatDate(item.reviewDueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agent Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-slate-400" />
              Agent Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentActivities.map((activity) => {
                const ActivityIcon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 rounded-full bg-slate-50 p-1.5">
                      <ActivityIcon
                        className={`h-3.5 w-3.5 ${activity.color}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700">
                        {activity.action}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activity.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {activity.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RiskDot({ level }: { level: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-amber-500",
    low: "bg-green-500",
  };

  return (
    <div className={`h-2.5 w-2.5 rounded-full ${colors[level] || "bg-slate-300"}`} />
  );
}
