import { differenceInCalendarDays, format } from "date-fns";
import type { RiskResult } from "./types";
import {
  RISK_LEVELS,
  RISK_THRESHOLDS,
  APPROVED_STATUSES,
  MIN_EXPEDITED_REVIEW_DAYS,
  RESUBMISSION_PENALTY_DAYS,
} from "./constants";

interface SubmittalForRisk {
  submittalNumber: string;
  description: string;
  equipmentCategory: string;
  status: string;
  reviewDueDate: Date | string | null;
  requiredOnSiteDate: Date | string;
  manufacturingLeadTimeWeeks: number;
  shippingBufferDays: number;
  poProcessingDays: number;
  reviewer: string;
  vendor: string;
}

function toDate(d: Date | string | null): Date | null {
  if (!d) return null;
  return typeof d === "string" ? new Date(d) : d;
}

export function calculateRisk(
  submittal: SubmittalForRisk,
  referenceDate: Date = new Date()
): RiskResult {
  const reviewDueDate = toDate(submittal.reviewDueDate);
  const requiredOnSiteDate = toDate(submittal.requiredOnSiteDate)!;

  // Step 1: Remaining review time
  let remainingReviewDays = 0;

  if ((APPROVED_STATUSES as readonly string[]).includes(submittal.status)) {
    remainingReviewDays = 0;
  } else if (reviewDueDate) {
    const daysUntilDue = differenceInCalendarDays(reviewDueDate, referenceDate);
    if (daysUntilDue > 0) {
      remainingReviewDays = daysUntilDue;
    } else {
      // Overdue — still need minimum expedited review time
      remainingReviewDays = MIN_EXPEDITED_REVIEW_DAYS;
    }
  } else {
    // Not yet submitted — estimate full review cycle (~21 days)
    remainingReviewDays = 21;
  }

  // Step 2: Resubmission penalty
  let resubmissionPenaltyDays = 0;
  if (["rejected", "resubmit", "revise_and_resubmit"].includes(submittal.status)) {
    resubmissionPenaltyDays = RESUBMISSION_PENALTY_DAYS;
  }

  // Step 3: Calculate total pipeline
  const poProcessingDays = submittal.poProcessingDays;
  const manufacturingDays = submittal.manufacturingLeadTimeWeeks * 7;
  const shippingDays = submittal.shippingBufferDays;

  const totalNeededDays =
    remainingReviewDays +
    resubmissionPenaltyDays +
    poProcessingDays +
    manufacturingDays +
    shippingDays;

  const daysAvailable = differenceInCalendarDays(requiredOnSiteDate, referenceDate);
  const margin = daysAvailable - totalNeededDays;

  // Step 4: Classify risk
  let level: RiskResult["level"];
  let score: number;

  if ((APPROVED_STATUSES as readonly string[]).includes(submittal.status)) {
    // Approved items are low risk unless PO/delivery is at risk
    if (margin < 0) {
      level = RISK_LEVELS.HIGH;
      score = 70;
    } else {
      level = RISK_LEVELS.LOW;
      score = Math.max(0, 20 - margin * 0.3);
    }
  } else if (margin < RISK_THRESHOLDS.CRITICAL) {
    level = RISK_LEVELS.CRITICAL;
    score = Math.min(100, 80 + Math.abs(margin) * 0.5);
  } else if (margin < RISK_THRESHOLDS.HIGH) {
    level = RISK_LEVELS.HIGH;
    score = 65 + ((RISK_THRESHOLDS.HIGH - margin) * 15) / RISK_THRESHOLDS.HIGH;
  } else if (margin < RISK_THRESHOLDS.MEDIUM) {
    level = RISK_LEVELS.MEDIUM;
    score = 35 + ((RISK_THRESHOLDS.MEDIUM - margin) * 30) / (RISK_THRESHOLDS.MEDIUM - RISK_THRESHOLDS.HIGH);
  } else {
    level = RISK_LEVELS.LOW;
    score = Math.max(0, 35 - (margin - RISK_THRESHOLDS.MEDIUM) * 0.5);
  }

  score = Math.round(Math.min(100, Math.max(0, score)));

  // Step 5: Generate narrative
  const narrative = generateNarrative(submittal, {
    margin,
    remainingReviewDays,
    resubmissionPenaltyDays,
    totalNeededDays,
    daysAvailable,
    reviewDueDate,
    requiredOnSiteDate,
  }, referenceDate);

  return {
    level,
    score,
    marginDays: margin,
    daysUntilCritical: Math.max(0, margin),
    breakdown: {
      remainingReviewDays,
      poProcessingDays,
      manufacturingDays,
      shippingDays,
      resubmissionPenaltyDays,
      totalNeededDays,
      daysAvailable,
    },
    narrative,
  };
}

function generateNarrative(
  submittal: SubmittalForRisk,
  data: {
    margin: number;
    remainingReviewDays: number;
    resubmissionPenaltyDays: number;
    totalNeededDays: number;
    daysAvailable: number;
    reviewDueDate: Date | null;
    requiredOnSiteDate: Date;
  },
  referenceDate: Date
): string {
  const parts: string[] = [];

  if ((APPROVED_STATUSES as readonly string[]).includes(submittal.status)) {
    parts.push(`This submittal has been approved.`);
    if (data.margin < 0) {
      parts.push(
        `However, the procurement pipeline (PO + manufacturing + shipping) still requires ${data.totalNeededDays} days, but only ${data.daysAvailable} days remain until the required on-site date of ${format(data.requiredOnSiteDate, "MMM d, yyyy")}. Expedited procurement may be needed.`
      );
    } else {
      parts.push(`The procurement timeline has ${data.margin} days of margin.`);
    }
    return parts.join(" ");
  }

  // Review status
  if (data.reviewDueDate) {
    const daysOverdue = differenceInCalendarDays(referenceDate, data.reviewDueDate);
    if (daysOverdue > 0) {
      parts.push(
        `This submittal is ${daysOverdue} days overdue for review (due ${format(data.reviewDueDate, "MMM d, yyyy")}).`
      );
    } else {
      parts.push(
        `Review is due in ${Math.abs(daysOverdue)} days (${format(data.reviewDueDate, "MMM d, yyyy")}).`
      );
    }
  } else {
    parts.push(`This submittal has not yet been submitted for review.`);
  }

  // Resubmission
  if (data.resubmissionPenaltyDays > 0) {
    parts.push(`An additional ${data.resubmissionPenaltyDays}-day resubmission cycle is required.`);
  }

  // Pipeline
  parts.push(
    `Full procurement pipeline requires ${data.totalNeededDays} days (${data.remainingReviewDays}d review + ${submittal.poProcessingDays}d PO + ${submittal.manufacturingLeadTimeWeeks}wk manufacturing + ${submittal.shippingBufferDays}d shipping).`
  );

  // Margin
  if (data.margin < 0) {
    const weeksLate = Math.ceil(Math.abs(data.margin) / 7);
    parts.push(
      `Equipment delivery will be approximately ${Math.abs(data.margin)} days (${weeksLate} weeks) late, missing the required on-site date of ${format(data.requiredOnSiteDate, "MMM d, yyyy")}.`
    );
  } else if (data.margin < 14) {
    parts.push(
      `Only ${data.margin} days of margin remain before the required on-site date of ${format(data.requiredOnSiteDate, "MMM d, yyyy")}. Any further delay is likely to cause a miss.`
    );
  } else if (data.margin < 28) {
    parts.push(
      `${data.margin} days of margin remain. Timeline is tight but manageable if review is completed on schedule.`
    );
  }

  return parts.join(" ");
}

export function calculateRiskBatch(
  submittals: SubmittalForRisk[],
  referenceDate: Date = new Date()
): Map<string, RiskResult> {
  const results = new Map<string, RiskResult>();
  for (const s of submittals) {
    results.set(s.submittalNumber, calculateRisk(s, referenceDate));
  }
  return results;
}
