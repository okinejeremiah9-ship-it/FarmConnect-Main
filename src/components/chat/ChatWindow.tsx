// src/components/chat/ChatWindow.tsx

import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Image as ImageIcon, Play, Pause } from "lucide-react";

import { messagesAPI } from "../../lib/api";
import { uploadFile, STORAGE_BUCKETS } from "../../lib/supabase";
import { supabase } from "../../lib/supabase";

import { useRealtimeMessages } from "../../hooks/useRealtimeSubscription";

// -----------------------------
// Types
// -----------------------------

interface ChatWindowProps {
  bookingId?: string | null; // optional, for booking-specific chats
  userId: string; // current logged-in user
  otherUserId: string; // the person you're chatting with
  otherUserName?: string; // optional display name

  // NEW (optional): enable booking button from parent
  canBookFromChat?: boolean;
  onBookFromChat?: () => void;
}

interface Message {
  id: string;
  booking_id?: string | null;
  sender_id: string;
  receiver_id: string;
  message_type: "text" | "audio" | "image";
  content: string | null;
  media_url?: string | null;
  created_at: string;
}

// -----------------------------
// Component
// -----------------------------

export const ChatWindow: React.FC<ChatWindowProps> = ({
  bookingId = null,
  userId,
  otherUserId,
  otherUserName,
  canBookFromChat,
  onBookFromChat,
}) => {
  const [messageText, setMessageText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading }: { messages: Message[]; loading: boolean } =
    useRealtimeMessages(userId, otherUserId, bookingId ?? null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ------------------------------------------------------------------
  // 🎙️ AUDIO RECORDING
  // ------------------------------------------------------------------
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Audio recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Recording error:", error);
      alert("Please allow microphone access to send audio messages.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // ------------------------------------------------------------------
  // 🔔 PUSH NOTIFICATION TRIGGER (non-blocking)
  // ------------------------------------------------------------------
  const triggerPushNotification = async (
    kind: "text" | "audio" | "image",
    preview: string
  ) => {
    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-message-notification`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient_id: otherUserId,
            title: "New message on FarmConnect",
            body:
              kind === "text"
                ? preview
                : kind === "image"
                ? "📷 Sent an image"
                : "🎙️ Sent an audio message",
            url: window.location.origin,
          }),
        }
      );
    } catch (err) {
      console.warn("Push notification failed:", err);
    }
  };

  // ------------------------------------------------------------------
  // ✉️ SEND TEXT MESSAGE
  // ------------------------------------------------------------------
  const sendTextMessage = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || sending) return;

    try {
      setSending(true);

      // payload matches messages table exactly
      await messagesAPI.send({
        booking_id: bookingId ?? null,
        sender_id: userId,
        receiver_id: otherUserId,
        message_type: "text",
        content: trimmed,
        media_url: null,
      });

      setMessageText("");
      await triggerPushNotification("text", trimmed);
    } catch (error) {
      console.error("Text message send failed:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ------------------------------------------------------------------
  // 🎙️ SEND AUDIO MESSAGE
  // ------------------------------------------------------------------
  const sendAudioMessage = async () => {
    if (!audioBlob || sending) return;

    try {
      setSending(true);

      const fileName = `audio_${Date.now()}.webm`;
      const filePath = `${bookingId ?? "direct"}/${userId}/${fileName}`;

      const audioUrl = await uploadFile(
        STORAGE_BUCKETS.CHAT_AUDIO,
        filePath,
        audioBlob
      );

      await messagesAPI.send({
        booking_id: bookingId ?? null,
        sender_id: userId,
        receiver_id: otherUserId,
        message_type: "audio",
        content: null,
        media_url: audioUrl,
      });

      setAudioBlob(null);
      await triggerPushNotification("audio", "");
    } catch (error) {
      console.error("Audio message send failed:", error);
      alert("Failed to send audio message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ------------------------------------------------------------------
  // 📷 SEND IMAGE MESSAGE
  // ------------------------------------------------------------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || sending) return;

    try {
      setSending(true);

      const filePath = `${bookingId ?? "direct"}/${userId}/${Date.now()}-${file.name}`;

      const imageUrl = await uploadFile(
        STORAGE_BUCKETS.CHAT_IMAGES,
        filePath,
        file
      );

      await messagesAPI.send({
        booking_id: bookingId ?? null,
        sender_id: userId,
        receiver_id: otherUserId,
        message_type: "image",
        content: null,
        media_url: imageUrl,
      });

      await triggerPushNotification("image", "");
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to send image. Please try again.");
    } finally {
      setSending(false);
      e.target.value = "";
    }
  };

  // ------------------------------------------------------------------
  // RENDER UI
  // ------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-md">
      {/* Header */}
      <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl">
        <h3 className="font-semibold text-sm sm:text-base">
          {otherUserName ? `Chat with ${otherUserName}` : "Conversation"}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="text-center text-gray-500 py-8 text-sm">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">
            No messages yet. Start chatting!
          </div>
        ) : (
          messages.map((msg) => {
            const isSender = msg.sender_id === userId;

            return (
              <div
                key={msg.id}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                    isSender
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-900 shadow"
                  }`}
                >
                  {msg.message_type === "text" && <p>{msg.content}</p>}

                  {msg.message_type === "audio" && msg.media_url && (
                    <AudioPlayer src={msg.media_url} isSender={isSender} />
                  )}

                  {msg.message_type === "image" && msg.media_url && (
                    <img
                      src={msg.media_url}
                      alt="Shared"
                      className="rounded mt-1 max-w-full"
                    />
                  )}

                  <div
                    className={`text-[10px] mt-1 ${
                      isSender ? "text-green-100" : "text-gray-500"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* NEW: Book button bar (only shows if parent enables it) */}
      {canBookFromChat && onBookFromChat && (
        <div className="border-t border-gray-200 px-4 py-2 bg-white">
          <button
            onClick={onBookFromChat}
            className="w-full text-sm font-semibold bg-green-600 text-white rounded-lg py-2 hover:bg-green-700 transition"
          >
            Book this provider
          </button>
        </div>
      )}

      {/* Pending Audio Banner */}
      {audioBlob && (
        <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Audio recorded</span>
            <div className="flex gap-2">
              <button
                onClick={() => setAudioBlob(null)}
                className="px-3 py-1 text-xs sm:text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={sendAudioMessage}
                disabled={sending}
                className="px-3 py-1 text-xs sm:text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Send Audio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="border-t border-gray-200 p-3 sm:p-4 bg-white rounded-b-xl">
        <div className="flex items-center gap-2">
          {/* Image Upload */}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition"
          >
            <ImageIcon className="h-5 w-5" />
          </label>

          {/* Mic */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-lg transition ${
              isRecording
                ? "bg-red-100 text-red-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendTextMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={sending || isRecording}
          />

          {/* Send */}
          <button
            onClick={sendTextMessage}
            disabled={!messageText.trim() || sending}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {isRecording && (
          <p className="text-xs text-red-600 mt-1 animate-pulse">
            Recording… tap the mic to stop.
          </p>
        )}
      </div>
    </div>
  );
};

// --------------------------------------------------
// Small AudioPlayer helper
// --------------------------------------------------
const AudioPlayer: React.FC<{ src: string; isSender: boolean }> = ({
  src,
  isSender,
}) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying((prev) => !prev);
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <button
        onClick={togglePlay}
        className={`p-1.5 rounded-full ${
          isSender ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <span className="text-xs">Audio message</span>
      <audio ref={audioRef} src={src} onEnded={() => setPlaying(false)} />
    </div>
  );
};
