// src/components/chat/MessagesList.tsx
import React, { useEffect, useState } from "react";
import { messagesAPI } from "../../lib/api";
import { MessageSquare, Search, Loader2, ChevronRight } from "lucide-react";

interface Conversation {
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageType: "text" | "audio" | "image";
  lastMessageAt: string;
  lastSenderIsSelf: boolean;
  unreadCount: number;
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
        if (mounted) setConversations(convos);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    // you could add a polling or realtime hook later if needed
    return () => {
      mounted = false;
    };
  }, [userId]);

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    return c.otherUserName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      {/* Search + hint */}
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

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading conversations…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium mb-1">No conversations yet</p>
          <p className="text-sm">
            Start by booking a service or messaging a provider/farmer.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {filtered.map((c) => {
            const time = new Date(c.lastMessageAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            const preview =
              c.lastMessageType === "text"
                ? c.lastMessage || "…"
                : c.lastMessageType === "image"
                ? "📷 Image"
                : "🎙️ Audio";

            return (
              <button
                key={c.otherUserId}
                onClick={() => onOpenChat(c.otherUserId, c.otherUserName)}
                className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-700">
                    {c.otherUserName.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + preview */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {c.otherUserName}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                          {c.unreadCount} new
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[220px] sm:max-w-[320px]">
                      {c.lastSenderIsSelf ? "You: " : ""}
                      {preview}
                    </p>
                  </div>
                </div>

                {/* Time + chevron */}
                <div className="flex flex-col items-end gap-1 min-w-[64px]">
                  <span className="text-[10px] sm:text-xs text-gray-500">
                    {time}
                  </span>
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
