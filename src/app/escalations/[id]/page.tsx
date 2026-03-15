"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";
import {
  ArrowLeft,
  ChevronRight,
  Send,
  XCircle,
  Edit3,
  CheckCircle,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Mail,
  User,
  FileText,
} from "lucide-react";

interface EscalationDetail {
  id: string;
  subject: string;
  body: string;
  editedBody: string | null;
  recipient: string;
  recipientEmail: string | null;
  urgencyLevel: string;
  status: string;
  aiModel: string | null;
  generationTimeMs: number | null;
  approvedAt: string | null;
  approvedBy: string | null;
  sentAt: string | null;
  dismissedAt: string | null;
  dismissReason: string | null;
  createdAt: string;
  submittal: {
    submittalNumber: string;
    description: string;
    vendor: string;
    reviewer: string;
    reviewerEmail: string | null;
    riskLevel: string | null;
    specSection: string;
  };
}

const URGENCY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  edited: "#3b82f6",
  approved: "#16a34a",
  sent: "#059669",
  dismissed: "#9ca3af",
};

export default function EscalationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [escalation, setEscalation] = useState<EscalationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedBody, setEditedBody] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEscalation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/escalations/${id}`);
      if (!res.ok) throw new Error("Failed to fetch escalation");
      const data = await res.json();
      setEscalation(data);
      setEditedBody(data.editedBody || data.body);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load escalation"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEscalation();
  }, [fetchEscalation]);

  const handleAction = async (action: string, extraData?: Record<string, unknown>) => {
    setActionLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/escalations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraData }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Action failed");
      }

      const updated = await res.json();
      setEscalation(updated);
      setEditMode(false);
      setEditedBody(updated.editedBody || updated.body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-4xl">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!escalation) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-medium">Escalation not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The escalation you are looking for does not exist.
        </p>
        <Link href="/escalations">
          <Button variant="outline" className="mt-4">
            Back to Escalations
          </Button>
        </Link>
      </div>
    );
  }

  const urgencyColor = URGENCY_COLORS[escalation.urgencyLevel] || "#6b7280";
  const statusColor = STATUS_COLORS[escalation.status] || "#6b7280";
  const isEditable =
    escalation.status === "draft" || escalation.status === "edited";
  const currentBody = escalation.editedBody || escalation.body;
  const hasEdits =
    escalation.editedBody !== null && escalation.editedBody !== escalation.body;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/escalations"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Escalations
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate max-w-xs">
          {escalation.subject}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {escalation.subject}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              To: {escalation.recipient}
              {escalation.recipientEmail && (
                <span className="text-xs">({escalation.recipientEmail})</span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Re: {escalation.submittal.submittalNumber}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase"
            style={{
              backgroundColor: urgencyColor + "18",
              color: urgencyColor,
              border: `1px solid ${urgencyColor}40`,
            }}
          >
            {escalation.urgencyLevel}
          </span>
          <span
            className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium capitalize"
            style={{
              backgroundColor: statusColor + "18",
              color: statusColor,
              border: `1px solid ${statusColor}40`,
            }}
          >
            {escalation.status}
          </span>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Email body */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Draft
            </CardTitle>
            {isEditable && !editMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
              >
                <Edit3 className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            )}
            {editMode && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditMode(false);
                    setEditedBody(currentBody);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={actionLoading === "edit"}
                  onClick={() =>
                    handleAction("edit", { editedBody })
                  }
                >
                  {actionLoading === "edit" ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
          {escalation.aiModel && (
            <CardDescription>
              Generated by {escalation.aiModel}
              {escalation.generationTimeMs &&
                ` in ${(escalation.generationTimeMs / 1000).toFixed(1)}s`}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {editMode ? (
            <Textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 rounded-lg p-4 border">
              {currentBody}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show original vs edited if there are edits */}
      {hasEdits && !editMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Original AI Draft
            </CardTitle>
            <CardDescription>
              Showing the original AI-generated draft before edits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground bg-muted/20 rounded-lg p-4 border border-dashed">
              {escalation.body}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submittal context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Submittal Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Submittal:</span>{" "}
              <span className="font-mono font-medium">
                {escalation.submittal.submittalNumber}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Spec Section:</span>{" "}
              {escalation.submittal.specSection}
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Description:</span>{" "}
              {escalation.submittal.description}
            </div>
            <div>
              <span className="text-muted-foreground">Vendor:</span>{" "}
              {escalation.submittal.vendor}
            </div>
            <div>
              <span className="text-muted-foreground">Reviewer:</span>{" "}
              {escalation.submittal.reviewer}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status history */}
      {(escalation.approvedAt || escalation.sentAt || escalation.dismissedAt) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Activity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              {formatDate(escalation.createdAt)}
            </div>
            {escalation.approvedAt && (
              <div>
                <span className="text-muted-foreground">Approved:</span>{" "}
                {formatDate(escalation.approvedAt)}{" "}
                {escalation.approvedBy && `by ${escalation.approvedBy}`}
              </div>
            )}
            {escalation.sentAt && (
              <div>
                <span className="text-muted-foreground">Sent:</span>{" "}
                {formatDate(escalation.sentAt)}
              </div>
            )}
            {escalation.dismissedAt && (
              <div>
                <span className="text-muted-foreground">Dismissed:</span>{" "}
                {formatDate(escalation.dismissedAt)}
                {escalation.dismissReason && (
                  <span className="text-xs ml-1">
                    ({escalation.dismissReason})
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {isEditable && (
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={actionLoading === "dismiss"}
            onClick={() => handleAction("dismiss")}
          >
            {actionLoading === "dismiss" ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5 mr-1" />
            )}
            Dismiss
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={actionLoading === "approve"}
              onClick={() =>
                handleAction("approve", {
                  editedBody: editMode ? editedBody : undefined,
                })
              }
            >
              {actionLoading === "approve" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Approve & Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
