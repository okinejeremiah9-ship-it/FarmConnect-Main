// src/components/chat/MessagesList.tsx

import React, { useEffect, useState } from "react";
import { messagesAPI } from "../../lib/api";
import { MessageSquare, Search, Loader2, ChevronRight } from "lucide-react";

interface Conversation {
  other_user_id: string;
  other_user_name: string;
  last_message: string | null;
  last_message_type: "text" | "image" | "audio";
  last_message_at: string;
  last_sender_is_self: boolean;
  unread_count: number;
}

interface MessagesListProps {
  userId: string;
  onOpenChat: (otherUserId: string, otherUserName: string) => void;
}

export const MessagesList: React.FC<MessagesListProps> = ({
  userId,
  onOpenChat,
}) => {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!userId) return;
      setLoading(true);
      try {
        const convos = await messagesAPI.listConversations(userId);
        if (mounted) setConversations(convos || []);
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    return c.other_user_name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      {/* Search */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading conversations…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium mb-1">No conversations yet</p>
          <p className="text-sm">Start by booking a service or messaging a provider/farmer.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {filtered.map((c) => {
            const time = new Date(c.last_message_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            const preview =
              c.last_message_type === "text"
                ? c.last_message || "…"
                : c.last_message_type === "image"
                ? "📷 Image"
                : "🎙️ Audio";

            return (
              <button
                key={c.other_user_id}
                onClick={() => onOpenChat(c.other_user_id, c.other_user_name)}
                className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-700">
                    {c.other_user_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + preview */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {c.other_user_name}
                      </p>

                      {c.unread_count > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                          {c.unread_count} new
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[220px] sm:max-w-[320px]">
                      {c.last_sender_is_self ? "You: " : ""}
                      {preview}
                    </p>
                  </div>
                </div>

                {/* Time + chevron */}
                <div className="flex flex-col items-end gap-1 min-w-[64px]">
                  <span className="text-[10px] sm:text-xs text-gray-500">{time}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessagesList;
