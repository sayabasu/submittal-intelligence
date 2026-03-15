"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ESCALATION_STATUSES,
  RISK_COLORS,
} from "@/lib/constants";
import { formatDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Send,
  Eye,
  Plus,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Sparkles,
} from "lucide-react";

interface EscalationItem {
  id: string;
  subject: string;
  body: string;
  recipient: string;
  recipientEmail: string | null;
  urgencyLevel: string;
  status: string;
  editedBody: string | null;
  createdAt: string;
  submittal: {
    submittalNumber: string;
    description: string;
    vendor: string;
    reviewer: string;
    riskLevel: string | null;
  };
}

interface SubmittalOption {
  id: string;
  submittalNumber: string;
  description: string;
  riskLevel: string | null;
  vendor: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  draft: { label: "Draft", icon: Clock, color: "#6b7280" },
  edited: { label: "Edited", icon: Clock, color: "#3b82f6" },
  approved: { label: "Approved", icon: CheckCircle, color: "#16a34a" },
  sent: { label: "Sent", icon: Send, color: "#059669" },
  dismissed: { label: "Dismissed", icon: XCircle, color: "#9ca3af" },
};

const URGENCY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
};

export default function EscalationsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <EscalationsPage />
    </Suspense>
  );
}

function EscalationsPage() {
  const searchParams = useSearchParams();
  const submittalIdParam = searchParams.get("submittalId");
  const autoGenerate = searchParams.get("generate") === "true";

  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Generate escalation dialog
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [submittalSearch, setSubmittalSearch] = useState("");
  const [submittalOptions, setSubmittalOptions] = useState<SubmittalOption[]>([]);
  const [selectedSubmittalId, setSelectedSubmittalId] = useState<string | null>(
    submittalIdParam || null
  );
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchEscalations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const res = await fetch(`/api/escalations?${params.toString()}`);
      const json = await res.json();
      setEscalations(json.data || []);
    } catch (err) {
      console.error("Failed to fetch escalations:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchEscalations();
  }, [fetchEscalations]);

  // Auto-generate if coming from risk alerts with generate=true
  useEffect(() => {
    if (autoGenerate && submittalIdParam) {
      handleGenerate(submittalIdParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchSubmittals = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSubmittalOptions([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/submittals?search=${encodeURIComponent(query)}&pageSize=10&sortBy=riskScore&sortDir=desc`
      );
      const json = await res.json();
      setSubmittalOptions(
        (json.data || []).map((s: Record<string, unknown>) => ({
          id: s.id,
          submittalNumber: s.submittalNumber,
          description: s.description,
          riskLevel: s.riskLevel,
          vendor: s.vendor,
        }))
      );
    } catch {
      setSubmittalOptions([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchSubmittals(submittalSearch), 300);
    return () => clearTimeout(timer);
  }, [submittalSearch, searchSubmittals]);

  const handleGenerate = async (submittalId: string) => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submittalId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate escalation");
      }

      setShowGenerateDialog(false);
      setSelectedSubmittalId(null);
      setSubmittalSearch("");
      await fetchEscalations();
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Failed to generate escalation"
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Escalation Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated escalation drafts for at-risk submittals. Review, edit,
            and send.
          </p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Escalation
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(ESCALATION_STATUSES).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_CONFIG[s]?.label || s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {escalations.length} escalation{escalations.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Escalation Cards */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : escalations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Mail className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No Escalations Yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Generate escalation drafts for at-risk submittals to expedite
              reviews and prevent schedule delays.
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowGenerateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Generate First Escalation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {escalations.map((esc) => (
            <EscalationCard key={esc.id} escalation={esc} />
          ))}
        </div>
      )}

      {/* Generate Escalation Dialog */}
      <Dialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Escalation
            </DialogTitle>
            <DialogDescription>
              Select a submittal to generate an AI-powered escalation draft.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search submittals by number or description..."
                value={submittalSearch}
                onChange={(e) => setSubmittalSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {submittalOptions.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-md border">
                {submittalOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 p-2.5 text-left text-sm hover:bg-muted/50 transition-colors border-b last:border-b-0",
                      selectedSubmittalId === opt.id && "bg-muted"
                    )}
                    onClick={() => setSelectedSubmittalId(opt.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs">
                          {opt.submittalNumber}
                        </span>
                        {opt.riskLevel && (
                          <span
                            className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{
                              color: RISK_COLORS[opt.riskLevel] || "#6b7280",
                              backgroundColor:
                                (RISK_COLORS[opt.riskLevel] || "#6b7280") + "18",
                            }}
                          >
                            {opt.riskLevel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {generateError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {generateError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedSubmittalId || generating}
              onClick={() =>
                selectedSubmittalId && handleGenerate(selectedSubmittalId)
              }
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Generate Draft
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EscalationCard({ escalation }: { escalation: EscalationItem }) {
  const statusConf = STATUS_CONFIG[escalation.status] || STATUS_CONFIG.draft;
  const urgencyColor = URGENCY_COLORS[escalation.urgencyLevel] || "#6b7280";
  const bodyPreview =
    (escalation.editedBody || escalation.body)
      .split("\n")
      .filter((l) => l.trim())
      .slice(0, 2)
      .join(" ") || "No body content";

  const truncatedPreview =
    bodyPreview.length > 200
      ? bodyPreview.slice(0, 200) + "..."
      : bodyPreview;

  return (
    <Card className="hover:ring-1 hover:ring-foreground/10 transition-all">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2.5">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/submittals/${escalation.submittal ? "" : ""}${escalation.id}`}
                  className="text-sm font-semibold hover:underline"
                >
                  {escalation.subject}
                </Link>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="font-mono">
                  {escalation.submittal?.submittalNumber}
                </span>
                <span>To: {escalation.recipient}</span>
                <span>{formatDate(escalation.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase"
                style={{
                  backgroundColor: urgencyColor + "18",
                  color: urgencyColor,
                  border: `1px solid ${urgencyColor}40`,
                }}
              >
                {escalation.urgencyLevel}
              </span>
              <span
                className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: statusConf.color + "18",
                  color: statusConf.color,
                  border: `1px solid ${statusConf.color}40`,
                }}
              >
                {statusConf.label}
              </span>
            </div>
          </div>

          {/* Body preview */}
          <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-md p-2.5 line-clamp-2">
            {truncatedPreview}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href={`/escalations/${escalation.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-3.5 w-3.5 mr-1" />
                Review
              </Button>
            </Link>
            {(escalation.status === "draft" ||
              escalation.status === "edited") && (
              <Link href={`/escalations/${escalation.id}`}>
                <Button variant="default" size="sm">
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Approve & Send
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
