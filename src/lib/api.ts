import { ACTION_ITEMS, CALLS, CUSTOMERS, INBOX, JOBS, QUOTES } from "@/data/seed";
import type { ActionItem, Call, Conversation, Customer, Job, Quote } from "@/types/ryanos";

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return await res.json() as T;
  } catch {
    return fallback;
  }
}

export function listCustomers(): Promise<Customer[]> { return Promise.resolve(CUSTOMERS); }
export function listJobs(): Promise<Job[]> { return fetchJson("/api/v1/jobs", JOBS); }
export function listCalls(): Promise<Call[]> { return Promise.resolve(CALLS); }
export function listQuotes(): Promise<Quote[]> { return fetchJson("/api/v1/quotes", QUOTES); }
export function listConversations(): Promise<Conversation[]> { return fetchJson("/api/v1/conversations", INBOX); }
export function listActionItems(): Promise<ActionItem[]> { return fetchJson("/api/v1/action-items", ACTION_ITEMS); }
export function getConversation(id: string): Promise<Conversation | undefined> { return Promise.resolve(INBOX.find(x => x.id === id)); }
export function getJob(id: string): Promise<Job | undefined> { return Promise.resolve(JOBS.find(x => x.id === id)); }
export function getQuote(id: string): Promise<Quote | undefined> { return Promise.resolve(QUOTES.find(x => x.id === id)); }

// Phase 2: action item mutations. Best-effort — UI keeps optimistic local
// state, so a failed call should not break the user experience. We swallow
// errors deliberately and surface only via the boolean return value.
async function postJson(url: string, body?: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function completeActionItem(id: string): Promise<boolean> {
  return postJson(`/api/v1/action-items/${encodeURIComponent(id)}/complete`);
}

export function snoozeActionItem(id: string, minutes: number = 60): Promise<boolean> {
  return postJson(`/api/v1/action-items/${encodeURIComponent(id)}/snooze`, { minutes });
}

export function sendConversationMessage(id: string, text: string): Promise<boolean> {
  return postJson(`/api/v1/conversations/${encodeURIComponent(id)}/messages`, { text });
}

export function updateJobStatus(id: string, status: string): Promise<boolean> {
  return postJson(`/api/v1/jobs/${encodeURIComponent(id)}/status`, { status });
}

export function convertQuoteToJob(id: string, opts?: { date?: string; time?: string }): Promise<boolean> {
  return postJson(`/api/v1/quotes/${encodeURIComponent(id)}/convert-to-job`, opts ?? {});
}

export function updateJobInvoiceStatus(id: string, status: "draft" | "sent" | "paid" | "overdue"): Promise<boolean> {
  return postJson(`/api/v1/jobs/${encodeURIComponent(id)}/invoice-status`, { status });
}
