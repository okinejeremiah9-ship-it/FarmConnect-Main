// Location: src/components/chat/ChatScreen.tsx

import React, { useEffect, useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { supabase } from "../../lib/supabaseClient";

interface ChatScreenProps {
  userId: string;
  otherUserId: string;
  otherUserName?: string;
  onBack: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  userId,
  otherUserId,
  otherUserName,
  onBack,
}) => {
  const [online, setOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  // Helper: User considered online if last message < 5 mins ago
  const isRecentlyActive = (timestamp: string) => {
    const last = new Date(timestamp).getTime();
    const now = Date.now();
    const diffMin = (now - last) / 1000 / 60;
    return diffMin <= 5;
  };

  // Load last active time based on latest message between users
  async function loadStatus() {
    const { data, error } = await supabase
      .from("messages")
      .select("created_at")
      .or(
        `sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`
      )
      .order("created_at", { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      setOnline(false);
      setLastSeen(null);
      return;
    }

    const lastMsg = data[0].created_at;
    setLastSeen(lastMsg);
    setOnline(isRecentlyActive(lastMsg));
  }

  useEffect(() => {
    loadStatus(); // initial load

    // realtime listener for new messages
    const channel = supabase
      .channel(`chat-presence-${otherUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const m = payload.new;
          if (m.sender_id === otherUserId || m.receiver_id === otherUserId) {
            loadStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [otherUserId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4 bg-white shadow justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-600 mr-1">
            ← Back
          </button>

          <div>
            <h2 className="font-semibold text-lg">
              {otherUserName ? otherUserName : "Chat"}
            </h2>

            {/* ONLINE/OFFLINE STATUS */}
            <div className="flex items-center gap-1 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  online ? "bg-green-500" : "bg-gray-400"
                }`}
              ></span>

              {online ? (
                <span className="text-green-600">Online</span>
              ) : (
                <span className="text-gray-500">
                  Last seen{" "}
                  {lastSeen
                    ? new Date(lastSeen).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "a while ago"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 p-4">
        <ChatWindow
          userId={userId}
          otherUserId={otherUserId}
          otherUserName={otherUserName}
        />
      </div>
    </div>
  );
};

export default ChatScreen;
