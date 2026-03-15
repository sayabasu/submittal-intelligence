export const RISK_LEVELS = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export type RiskLevel = (typeof RISK_LEVELS)[keyof typeof RISK_LEVELS];

export const RISK_THRESHOLDS = {
  CRITICAL: 0,   // margin < 0
  HIGH: 14,      // margin < 14 days
  MEDIUM: 28,    // margin < 28 days
} as const;

export const SUBMITTAL_STATUSES = {
  NOT_SUBMITTED: "not_submitted",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  APPROVED_AS_NOTED: "approved_as_noted",
  REJECTED: "rejected",
  RESUBMIT: "resubmit",
} as const;

export type SubmittalStatus = (typeof SUBMITTAL_STATUSES)[keyof typeof SUBMITTAL_STATUSES];

export const ESCALATION_STATUSES = {
  DRAFT: "draft",
  EDITED: "edited",
  APPROVED: "approved",
  SENT: "sent",
  DISMISSED: "dismissed",
} as const;

export const URGENCY_LEVELS = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
} as const;

export const DISCIPLINES = [
  "Electrical",
  "Mechanical",
  "Fire Protection",
  "Structural",
  "BMS/Controls",
] as const;

export const APPROVED_STATUSES = [
  SUBMITTAL_STATUSES.APPROVED,
  SUBMITTAL_STATUSES.APPROVED_AS_NOTED,
];

export const AT_RISK_STATUSES = [
  SUBMITTAL_STATUSES.NOT_SUBMITTED,
  SUBMITTAL_STATUSES.SUBMITTED,
  SUBMITTAL_STATUSES.UNDER_REVIEW,
  SUBMITTAL_STATUSES.REJECTED,
  SUBMITTAL_STATUSES.RESUBMIT,
];

export const RISK_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#16a34a",
};

export const STATUS_COLORS: Record<string, string> = {
  not_submitted: "#6b7280",
  submitted: "#3b82f6",
  under_review: "#8b5cf6",
  approved: "#16a34a",
  approved_as_noted: "#059669",
  rejected: "#dc2626",
  resubmit: "#f59e0b",
};

export const STATUS_LABELS: Record<string, string> = {
  not_submitted: "Not Submitted",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  approved_as_noted: "Approved as Noted",
  rejected: "Rejected",
  resubmit: "Resubmit",
};

export const RISK_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

// Minimum days for expedited review when already overdue
export const MIN_EXPEDITED_REVIEW_DAYS = 3;

// Penalty days for resubmission cycle
export const RESUBMISSION_PENALTY_DAYS = 14;
