export type Screen =
  | "dashboard" | "inbox"
  | "calls" | "call-detail"
  | "jobs" | "job-detail"
  | "customers" | "customer-detail"
  | "quotes" | "quote-detail" | "quote-builder"
  | "calendar" | "ai-assistant"
  | "settings" | "go-live" | "invoice-upload";

export interface Job {
  id: string; title: string; customer: string; customerId: string;
  suburb: string; address: string; time: string; date: string;
  status: string; type: string; value: [number, number];
  tech: string; urgency: string; source: string; confidence: number;
  aiNote: string;
}

export interface CallTranscriptLine { speaker: "AI" | "Customer"; text: string; time: string; }

export interface Call {
  id: string; caller: string; phone: string; time: string; duration: string;
  outcome: string; jobType: string; urgency: string; confidence: number;
  jobCreated: boolean; jobId?: string; customerId?: string; needsReview: boolean;
  summary: string;
  transcript: CallTranscriptLine[];
  extracted: { name: string; phone: string; address: string; jobType: string; urgency: string; range: [number, number]; };
}

export interface Customer {
  id: string; name: string; phone: string; email: string; suburb: string;
  type: string; lastContact: string; lifetimeValue: number; openJobs: number;
  tags: string[];
  timeline: Array<{ type: string; desc: string; time: string }>;
  aiSummary: string;
}

export interface Quote {
  id: string; num: string; customer: string; customerId: string;
  jobType: string; amount: [number, number]; status: string;
  created: string; sent?: string; followUp?: string;
  confidence: number; aiReason: string;
}

export interface InboxMsg {
  id: string;
  from: "ai" | "customer" | "system";
  text: string;
  time: string;
}

export interface JourneyRecord {
  type: "quote" | "job" | "customer";
  label: string;
  screen: Screen;
  id?: string;
}

export interface ConversationJourney {
  stages: string[];
  currentStage: string;
  nextAction: string;
  blocker?: string;
  paymentStatus?: "ready-to-invoice" | "invoice-sent" | "paid" | "overdue" | "deposit-due" | "deposit-paid";
  paymentNote?: string;
  linkedRecords: JourneyRecord[];
}

export interface Conversation {
  id: string;
  name: string;
  customerId?: string;
  phone?: string;
  channel: "sms" | "email" | "call" | "web" | "handoff";
  status: "unread" | "needs-human" | "ai-handled" | "urgent" | "quote-reply" | "done";
  preview: string;
  time: string;
  unread: number;
  linkedJobId?: string;
  linkedQuoteId?: string;
  aiSummary: string;
  suggestedActions: string[];
  messages: InboxMsg[];
  journey: ConversationJourney;
}

export interface QuoteLineItem {
  id: string;
  category: "labour" | "materials" | "travel" | "extra";
  desc: string;
  qty: number;
  rate: number;
}

export interface ActionItem {
  id: string;
  priority: "urgent" | "accepted" | "quote-reply" | "needs-review" | "missed-call" | "ready-invoice";
  label: string;
  customer: string;
  phone?: string;
  summary: string;
  why: string;
  linkedScreen?: Screen;
  linkedId?: string;
  linkedLabel?: string;
  confidence?: string;
  primaryAction: string;
  secondaryActions: string[];
}

export interface NavItem {
  id: Screen;
  label: string;
  badge?: number;
}

export interface AIPricingSuggestion {
  range: [number, number]; confidence: number;
  jobs: Array<{ desc: string; amount: number; date: string }>;
}

export interface OutboxItem {
  outboxId: string;
  jobId: string;
  invoiceId: string | null;
  customerId: string | null;
  customer: string;
  kind: "invoice";
  channel: "email";
  status: "draft" | "ready";
  subject: string | null;
  body: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
  approvedAt: number | null;
  approvedByOperatorId?: string | null;
  approvedByName?: string | null;
}

export interface Operator {
  operatorId: string;
  businessId: string;
  email: string;
  name: string;
}

export interface AuthMeResponse {
  ok: true;
  operator: Operator | null;
}

export interface SendAttempt {
  attemptId: string;
  outboxId: string;
  jobId: string;
  invoiceId: string | null;
  customerId: string | null;
  customer: string;
  kind: "invoice";
  channel: "email";
  transport: "mock";
  status: "dry-run" | "failed";
  target: string | null;
  subject: string | null;
  body: string;
  notes: string;
  requestedByOperatorId: string;
  requestedByName: string;
  approvedByOperatorId: string | null;
  approvedByName: string | null;
  approvedAt: number | null;
  createdAt: number;
  updatedAt: number;
  attemptedAt: number | null;
  failedAt: number | null;
  providerMessageId: string | null;
  providerStatus: string | null;
  providerErrorCode: string | null;
  providerErrorMessage: string | null;
  dryRun: boolean;
}

export type RevenueChartDatum = { day: string; revenue: number; color: string };
