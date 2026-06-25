import { useEffect, useState } from "react";
import { ACTION_ITEMS, INBOX } from "@/data/seed";
import { listActionItems, listConversations } from "@/lib/api";
import type { ActionItem, Conversation } from "@/types/ryanos";

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
