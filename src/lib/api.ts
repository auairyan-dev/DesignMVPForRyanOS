import { ACTION_ITEMS, CALLS, CUSTOMERS, INBOX, JOBS, QUOTES } from "@/data/seed";
import type { ActionItem, Call, Conversation, Customer, Job, Quote } from "@/types/ryanos";

export function listCustomers(): Promise<Customer[]> { return Promise.resolve(CUSTOMERS); }
export function listJobs(): Promise<Job[]> { return Promise.resolve(JOBS); }
export function listCalls(): Promise<Call[]> { return Promise.resolve(CALLS); }
export function listQuotes(): Promise<Quote[]> { return Promise.resolve(QUOTES); }
export function listConversations(): Promise<Conversation[]> { return Promise.resolve(INBOX); }
export function listActionItems(): Promise<ActionItem[]> { return Promise.resolve(ACTION_ITEMS); }
export function getConversation(id: string): Promise<Conversation | undefined> { return Promise.resolve(INBOX.find(x => x.id === id)); }
export function getJob(id: string): Promise<Job | undefined> { return Promise.resolve(JOBS.find(x => x.id === id)); }
export function getQuote(id: string): Promise<Quote | undefined> { return Promise.resolve(QUOTES.find(x => x.id === id)); }
