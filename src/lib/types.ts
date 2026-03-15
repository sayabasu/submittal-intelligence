import type { RiskLevel } from "./constants";

export interface RiskBreakdown {
  remainingReviewDays: number;
  poProcessingDays: number;
  manufacturingDays: number;
  shippingDays: number;
  resubmissionPenaltyDays: number;
  totalNeededDays: number;
  daysAvailable: number;
}

export interface RiskResult {
  level: RiskLevel;
  score: number;
  marginDays: number;
  daysUntilCritical: number;
  breakdown: RiskBreakdown;
  narrative: string;
}

export interface SubmittalWithRisk {
  id: string;
  projectId: string;
  submittalNumber: string;
  specSection: string;
  description: string;
  equipmentCategory: string;
  submittalType: string;
  discipline: string;
  status: string;
  revision: number;
  submittedDate: string | null;
  reviewDueDate: string | null;
  approvedDate: string | null;
  linkedPoDate: string | null;
  manufacturingLeadTimeWeeks: number;
  requiredOnSiteDate: string;
  shippingBufferDays: number;
  poProcessingDays: number;
  vendor: string;
  vendorContact: string | null;
  vendorEmail: string | null;
  reviewer: string;
  reviewerEmail: string | null;
  submitter: string | null;
  riskLevel: string | null;
  riskScore: number | null;
  daysUntilCritical: number | null;
  riskNotes: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  description: string | null;
  location: string | null;
  capacityMw: number | null;
  owner: string | null;
  epc: string | null;
  noticeToProceedDate: string | null;
  targetCompletionDate: string | null;
  totalSubmittals: number;
  statusCounts: Record<string, number>;
  riskCounts: Record<string, number>;
  disciplineCounts: Record<string, number>;
}

export interface EscalationDraft {
  id: string;
  submittalId: string;
  submittalNumber: string;
  submittalDescription: string;
  subject: string;
  body: string;
  recipient: string;
  recipientEmail: string | null;
  urgencyLevel: string;
  status: string;
  editedBody: string | null;
  createdAt: string;
}

export interface ColumnMapping {
  [fileColumn: string]: string;
}

export interface ParsedFile {
  headers: string[];
  sampleRows: string[][];
  totalRows: number;
  detectedMapping: ColumnMapping;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}
