/**
 * useMessageNotifications — global hook that:
 *   1. Subscribes to all incoming `messages` rows (RLS limits us to our own
 *      conversations) via Supabase Realtime.
 *   2. Maintains an unread counter in React state, which the Navbar reads
 *      to render a badge on the Messages icon.
 *   3. Pops a toast for each new message and (if the user has granted
 *      Notification permission) shows a browser push notification.
 *
 * The unread counter is reset whenever the user opens /messages — the
 * Messages page calls `clearUnread()` on mount.
 *
 * NOTE: This is best-effort, in-app notification only. True background push
 * (when the tab is closed) requires a service worker + a push provider
 * (FCM/APNs) and a server function — out of scope for the MVP.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

let globalUnread = 0;
const listeners = new Set<(n: number) => void>();
const setGlobal = (n: number) => { globalUnread = n; listeners.forEach(l => l(n)); };

export function useMessageNotifications() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(globalUnread);
  const navigate = useNavigate();

  useEffect(() => {
    listeners.add(setUnread);
    return () => { listeners.delete(setUnread); };
  }, []);

  // Ask the browser for notification permission once.
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Subscribe to ALL message inserts; RLS ensures we only see ones that
  // belong to conversations we participate in.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-messages:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as { sender_id: string; content: string; conversation_id: string };
          // Don't notify on our own messages.
          if (msg.sender_id === user.id) return;

          // Skip if we're already viewing this exact conversation.
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (url.pathname === "/messages" && url.searchParams.get("c") === msg.conversation_id) return;
          }

          setGlobal(globalUnread + 1);

          // Look up the sender's display name for a friendlier toast.
          const { data: sender } = await supabase
            .from("profiles").select("full_name").eq("id", msg.sender_id).maybeSingle();
          const name = sender?.full_name || "Someone";

          toast.message(`New message from ${name}`, {
            description: msg.content.slice(0, 80),
            action: {
              label: "Open",
              onClick: () => navigate(`/messages?c=${msg.conversation_id}`),
            },
          });

          // Fire a browser-level notification if permission granted.
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              new Notification(`Bashabari — ${name}`, {
                body: msg.content.slice(0, 120),
                icon: "/placeholder.svg",
                tag: msg.conversation_id, // collapses repeated msgs from same convo
              });
            } catch {/* ignore */}
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, navigate]);

  const clearUnread = useCallback(() => setGlobal(0), []);
  return { unread, clearUnread };
}
