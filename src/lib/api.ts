import { ACTION_ITEMS, CALLS, CUSTOMERS, INBOX, JOBS, QUOTES } from "@/data/seed";
import type { ActionItem, AuthMeResponse, Call, Conversation, Customer, Job, Operator, OutboxItem, Quote, SendAttempt } from "@/types/ryanos";

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { credentials: "include" });
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

async function postJson(url: string, body?: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
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

export async function getJobInvoiceDraft(jobId: string): Promise<any | null> {
  try {
    const res = await fetch(`/api/v1/jobs/${encodeURIComponent(jobId)}/invoice-draft`, { credentials: "include" });
    if (!res.ok) return null;
    const body = await res.json() as { ok?: boolean; draft?: any | null };
    return body.draft ?? null;
  } catch {
    return null;
  }
}

export async function createJobOutboxItem(jobId: string, opts: { kind: "invoice"; channel: "email" }): Promise<OutboxItem | null> {
  try {
    const res = await fetch(`/api/v1/jobs/${encodeURIComponent(jobId)}/outbox`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    if (!res.ok) return null;
    const body = await res.json() as { item?: OutboxItem | null };
    return body.item ?? null;
  } catch {
    return null;
  }
}

export async function listJobOutboxItems(jobId: string): Promise<OutboxItem[]> {
  try {
    const res = await fetch(`/api/v1/jobs/${encodeURIComponent(jobId)}/outbox`, { credentials: "include" });
    if (!res.ok) return [];
    const body = await res.json() as { items?: OutboxItem[] };
    return body.items ?? [];
  } catch {
    return [];
  }
}

export async function markOutboxItemReady(outboxId: string): Promise<OutboxItem | null> {
  try {
    const res = await fetch(`/api/v1/outbox/${encodeURIComponent(outboxId)}/ready`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const body = await res.json() as { item?: OutboxItem | null };
    return body.item ?? null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<Operator | null> {
  try {
    const res = await fetch('/api/v1/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const body = await res.json() as { operator?: Operator | null };
    return body.operator ?? null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/logout', {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getMe(): Promise<Operator | null> {
  try {
    const res = await fetch('/api/v1/me', { credentials: 'include' });
    if (!res.ok) return null;
    const body = await res.json() as AuthMeResponse;
    return body.operator;
  } catch {
    return null;
  }
}

export async function attemptSendOutboxItem(outboxId: string, opts?: { transport?: "mock" }): Promise<SendAttempt | null> {
  try {
    const res = await fetch(`/api/v1/outbox/${encodeURIComponent(outboxId)}/attempt-send`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transport: opts?.transport ?? 'mock' }),
    });
    if (!res.ok) return null;
    const body = await res.json() as { attempt?: SendAttempt | null };
    return body.attempt ?? null;
  } catch {
    return null;
  }
}

export async function listOutboxSendAttempts(outboxId: string): Promise<SendAttempt[]> {
  try {
    const res = await fetch(`/api/v1/outbox/${encodeURIComponent(outboxId)}/attempts`, {
      credentials: 'include',
    });
    if (!res.ok) return [];
    const body = await res.json() as { attempts?: SendAttempt[] };
    return body.attempts ?? [];
  } catch {
    return [];
  }
}
