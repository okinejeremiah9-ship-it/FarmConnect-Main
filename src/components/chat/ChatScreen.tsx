// Location: src/components/chat/ChatScreen.tsx

import React from "react";
import { ChatWindow } from "./ChatWindow";

interface ChatScreenProps {
  userId: string;
  otherUserId: string;
  onBack: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ userId, otherUserId, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center p-4 bg-white shadow">
        <button onClick={onBack} className="text-gray-600 mr-3">← Back</button>
        <h2 className="font-semibold text-xl">Chat</h2>
      </div>

      {/* Chat Window */}
      <ChatWindow
        userId={userId}
        otherUserId={otherUserId}
      />
    </div>
  );
};

export default ChatScreen;
