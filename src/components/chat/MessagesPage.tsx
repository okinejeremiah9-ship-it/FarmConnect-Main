import React, { useEffect, useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface MessagesPageProps {
  userId: string;
  onOpenChat: (otherUserId: string, otherUserName?: string) => void;
  onBack?: () => void;
}

interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserRole?: string;
  lastMessageSnippet: string;
  lastMessageAt: string;
  lastMessageType: "text" | "audio" | "image";
}

const MessagesPage: React.FC<MessagesPageProps> = ({
  userId,
  onOpenChat,
  onBack,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Online presence (Realtime) – set of userIds that are currently online
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    let messagesChannel: ReturnType<typeof supabase.channel> | null = null;
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

    async function loadConversations() {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          sender_id,
          receiver_id,
          message_type,
          content,
          created_at,
          sender:sender_id ( id, name, role ),
          receiver:receiver_id ( id, name, role )
        `
        )
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error("Error loading conversations:", error);
        setConversations([]);
        setLoading(false);
        return;
      }

      const map = new Map<string, Conversation>();

      (data || []).forEach((m: any) => {
        const isSender = m.sender_id === userId;
        const other = isSender ? m.receiver : m.sender;
        if (!other || !other.id) return;

        // Already have this other user, skip older messages
        if (map.has(other.id)) return;

        let snippet = "";
        if (m.message_type === "text" && m.content) {
          snippet =
            m.content.length > 80
              ? m.content.slice(0, 77) + "..."
              : m.content;
        } else if (m.message_type === "image") {
          snippet = "📷 Image";
        } else if (m.message_type === "audio") {
          snippet = "🎙️ Audio message";
        }

        map.set(other.id, {
          otherUserId: other.id,
          otherUserName: other.name || "User",
          otherUserRole: other.role,
          lastMessageSnippet: snippet,
          lastMessageAt: m.created_at,
          lastMessageType: m.message_type,
        });
      });

      setConversations(Array.from(map.values()));
      setLoading(false);
    }

    // 🔁 Initial load
    loadConversations();

    // 💬 Realtime: new messages → refresh inbox
    messagesChannel = supabase
      .channel(`messages-inbox:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const m: any = payload.new;
          if (!m) return;
          if (m.sender_id !== userId && m.receiver_id !== userId) return;

          // Re-fetch to keep logic simple and correct
          loadConversations();
        }
      )
      .subscribe();

    // 🟢 Presence: global "online-users" channel
    presenceChannel = supabase
      .channel(`online-users`, {
        config: {
          presence: {
            key: userId, // this user’s unique key
          },
        },
      })
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel!.presenceState() as Record<
          string,
          any[]
        >;

        // Keys are userIds we tracked
        const ids = Object.keys(state);
        setOnlineUserIds(ids);
      });

    presenceChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // Announce that THIS user is online
        presenceChannel!.track({
          user_id: userId,
          last_seen: new Date().toISOString(),
        });
      }
    });

    return () => {
      mounted = false;
      if (messagesChannel) supabase.removeChannel(messagesChannel);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, [userId]);

  const getPresenceLabel = (c: Conversation) => {
    const isOnline = onlineUserIds.includes(c.otherUserId);
    const last = new Date(c.lastMessageAt);
    const diffMs = Date.now() - last.getTime();
    const activeRecently = diffMs < 10 * 60 * 1000; // 10 minutes

    if (isOnline) return { text: "Online", color: "text-green-600" };
    if (activeRecently)
      return { text: "Active recently", color: "text-amber-600" };

    return {
      text: `Last message ${last.toLocaleDateString()} ${last.toLocaleTimeString(
        [],
        { hour: "2-digit", minute: "2-digit" }
      )}`,
      color: "text-gray-400",
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="text-gray-600 mr-1">
              ←
            </button>
          )}
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Messages
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading conversations...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm">
            <MessageSquare className="w-9 h-9 mb-2 text-gray-400" />
            <p>No messages yet.</p>
            <p>Start a booking or open a provider profile to say hello.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => {
              const isOnline = onlineUserIds.includes(c.otherUserId);
              const presence = getPresenceLabel(c);

              return (
                <button
                  key={c.otherUserId}
                  onClick={() =>
                    onOpenChat(c.otherUserId, c.otherUserName)
                  }
                  className="w-full bg-white rounded-lg shadow-sm p-3 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3 text-left">
                    {/* Presence dot */}
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        isOnline ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></span>

                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">
                        {c.otherUserName}
                        {c.otherUserRole && (
                          <span className="ml-1 text-xs text-gray-500 uppercase">
                            ({c.otherUserRole})
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {c.lastMessageSnippet}
                      </span>
                      <span
                        className={`text-[11px] mt-0.5 ${presence.color}`}
                      >
                        {presence.text}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end text-xs text-gray-400">
                    <span>
                      {new Date(c.lastMessageAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
