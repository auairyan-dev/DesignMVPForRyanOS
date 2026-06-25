import { useEffect, useState } from "react";
import { ACTION_ITEMS, INBOX, JOBS, QUOTES } from "@/data/seed";
import { listActionItems, listConversations, listJobs, listQuotes } from "@/lib/api";
import type { ActionItem, Conversation, Job, Quote } from "@/types/ryanos";

export function useActionItems() {
  const [actionItems, setActionItems] = useState<ActionItem[]>(ACTION_ITEMS);
  const refresh = () => { void listActionItems().then(setActionItems); };
  useEffect(() => { refresh(); }, []);
  return { actionItems, setActionItems, refresh };
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(INBOX);
  const refresh = () => { void listConversations().then(setConversations); };
  useEffect(() => { refresh(); }, []);
  return { conversations, setConversations, refresh };
}


export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>(JOBS);
  const refresh = () => { void listJobs().then(setJobs); };
  useEffect(() => { refresh(); }, []);
  return { jobs, setJobs, refresh };
}

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>(QUOTES);
  const refresh = () => { void listQuotes().then(setQuotes); };
  useEffect(() => { refresh(); }, []);
  return { quotes, setQuotes, refresh };
}
