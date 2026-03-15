import type { RiskResult } from "./types";
import { format } from "date-fns";

interface EscalationContext {
  projectName: string;
  submittalNumber: string;
  description: string;
  equipmentCategory: string;
  specSection: string;
  status: string;
  vendor: string;
  reviewer: string;
  reviewerEmail: string | null;
  reviewDueDate: Date | string | null;
  requiredOnSiteDate: Date | string;
  manufacturingLeadTimeWeeks: number;
  risk: RiskResult;
  senderName: string;
}

export function buildEscalationPrompt(ctx: EscalationContext): string {
  const reviewDueStr = ctx.reviewDueDate
    ? format(new Date(ctx.reviewDueDate), "MMMM d, yyyy")
    : "not set";
  const requiredOnSiteStr = format(new Date(ctx.requiredOnSiteDate), "MMMM d, yyyy");

  const daysOverdue = ctx.risk.breakdown.remainingReviewDays <= 3 && ctx.reviewDueDate
    ? Math.max(0, Math.round((Date.now() - new Date(ctx.reviewDueDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return `You are an AI assistant helping a Project Engineer manage submittals for a data center construction project. Generate a professional escalation email.

CONTEXT:
- Project: ${ctx.projectName}
- Submittal: ${ctx.submittalNumber} — ${ctx.description}
- Spec Section: ${ctx.specSection}
- Equipment Category: ${ctx.equipmentCategory}
- Current Status: ${ctx.status}
- Vendor: ${ctx.vendor}
- Reviewer: ${ctx.reviewer}

RISK ANALYSIS:
- Review due date: ${reviewDueStr}${daysOverdue > 0 ? ` (${daysOverdue} days overdue)` : ""}
- Required on site: ${requiredOnSiteStr}
- Manufacturing lead time: ${ctx.manufacturingLeadTimeWeeks} weeks
- Current margin: ${ctx.risk.marginDays} days (${ctx.risk.level.toUpperCase()})
- Days available: ${ctx.risk.breakdown.daysAvailable}
- Total pipeline needed: ${ctx.risk.breakdown.totalNeededDays} days

INSTRUCTIONS:
- Write a professional email to ${ctx.reviewer.split(" - ")[0]} requesting expedited action on this submittal review
- Urgency level: ${ctx.risk.level.toUpperCase()}
- Be direct but respectful — no blame, focus on schedule impact
- Include specific dates and consequences
- Explain what happens if review is not completed soon (in terms of equipment delivery delay)
- Suggest a concrete next step with a deadline
- Keep it under 200 words
- Sign off as ${ctx.senderName}

Output format — provide EXACTLY this format with no additional text:
SUBJECT: [subject line]
BODY:
[email body]`;
}

export function parseEscalationResponse(response: string): {
  subject: string;
  body: string;
} {
  const subjectMatch = response.match(/SUBJECT:\s*(.+)/);
  const bodyMatch = response.match(/BODY:\s*([\s\S]+)/);

  return {
    subject: subjectMatch?.[1]?.trim() || "Urgent: Submittal Review Required",
    body: bodyMatch?.[1]?.trim() || response,
  };
}
