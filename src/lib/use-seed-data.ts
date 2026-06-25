import { useEffect, useState } from "react";
import { ACTION_ITEMS, INBOX, JOBS, QUOTES } from "@/data/seed";
import { listActionItems, listConversations, listJobs, listQuotes } from "@/lib/api";
import type { ActionItem, Conversation, Job, Quote } from "@/types/ryanos";

export function useActionItems() {
  const [actionItems, setActionItems] = useState<ActionItem[]>(ACTION_ITEMS);
  useEffect(() => { void listActionItems().then(setActionItems); }, []);
  return { actionItems, setActionItems };
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(INBOX);
  useEffect(() => { void listConversations().then(setConversations); }, []);
  return { conversations, setConversations };
}


export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>(JOBS);
  useEffect(() => { void listJobs().then(setJobs); }, []);
  return { jobs, setJobs };
}

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>(QUOTES);
  useEffect(() => { void listQuotes().then(setQuotes); }, []);
  return { quotes, setQuotes };
}
