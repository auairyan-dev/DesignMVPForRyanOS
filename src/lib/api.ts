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
export function listJobs(): Promise<Job[]> { return Promise.resolve(JOBS); }
export function listCalls(): Promise<Call[]> { return Promise.resolve(CALLS); }
export function listQuotes(): Promise<Quote[]> { return Promise.resolve(QUOTES); }
export function listConversations(): Promise<Conversation[]> { return fetchJson("/api/v1/conversations", INBOX); }
export function listActionItems(): Promise<ActionItem[]> { return fetchJson("/api/v1/action-items", ACTION_ITEMS); }
export function getConversation(id: string): Promise<Conversation | undefined> { return Promise.resolve(INBOX.find(x => x.id === id)); }
export function getJob(id: string): Promise<Job | undefined> { return Promise.resolve(JOBS.find(x => x.id === id)); }
export function getQuote(id: string): Promise<Quote | undefined> { return Promise.resolve(QUOTES.find(x => x.id === id)); }
