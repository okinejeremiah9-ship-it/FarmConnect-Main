import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Play,
  Pause,
} from "lucide-react";
import {
  uploadFile,
  STORAGE_BUCKETS,
  getOrCreateChatSession,
  sendMessage,
  getChatMessages,
  subscribeToMessages,
} from "../../lib/supabase";

interface ChatModalProps {
  service: {
    providerId: string;
    providerName: string;
    title: string;
    providerProfilePic?: string;
  };
  userId: string;
  userName: string;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  service,
  userId,
  userName,
  onClose,
}) => {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------------------
  // INIT CHAT SESSION + REAL-TIME SUBSCRIPTION
  // ------------------------------------------------------
  useEffect(() => {
    const initChat = async () => {
      try {
        const session = await getOrCreateChatSession(
          userId,
          service.providerId
        );
        setSessionId(session.id);

        // Load existing chat messages
        const initialMessages = await getChatMessages(session.id);
        setMessages(initialMessages);

        // Subscribe to new real-time messages
        const subscription = subscribeToMessages(session.id, (newMsg) => {
          setMessages((prev) => [...prev, newMsg]);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Chat initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [userId, service.providerId]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ------------------------------------------------------
  // VOICE RECORDING
  // ------------------------------------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

      recorder.onstop = () => {
        const audio = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audio);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // ------------------------------------------------------
  // SEND TEXT
  // ------------------------------------------------------
  const sendTextMessage = async () => {
    if (!messageText.trim() || !sessionId) return;

    setSending(true);
    try {
      await sendMessage(
        sessionId,
        userId,
        service.providerId,
        messageText.trim()
      );
      setMessageText("");
    } catch (e) {
      console.error("Send text failed:", e);
    } finally {
      setSending(false);
    }
  };

  // ------------------------------------------------------
  // SEND IMAGE
  // ------------------------------------------------------
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;

    setSending(true);
    try {
      const path = `${userId}/img_${Date.now()}_${file.name}`;
      const imageUrl = await uploadFile(
        STORAGE_BUCKETS.IMAGES,
        path,
        file
      );
      await sendMessage(
        sessionId,
        userId,
        service.providerId,
        "",
        "image",
        imageUrl
      );
    } catch (e) {
      console.error("Image upload failed:", e);
    } finally {
      setSending(false);
    }
  };

  // ------------------------------------------------------
  // SEND AUDIO
  // ------------------------------------------------------
  const sendAudioMessage = async () => {
    if (!audioBlob || !sessionId) return;

    setSending(true);
    try {
      const path = `${userId}/audio_${Date.now()}.webm`;
      const audioUrl = await uploadFile(
        STORAGE_BUCKETS.AUDIO,
        path,
        audioBlob
      );
      await sendMessage(
        sessionId,
        userId,
        service.providerId,
        "",
        "audio",
        audioUrl
      );

      setAudioBlob(null);
    } catch (e) {
      console.error("Audio send failed:", e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  // ------------------------------------------------------
  // UI
  // ------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
              {service.providerProfilePic ? (
                <img
                  src={service.providerProfilePic}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-green-600 font-semibold">
                  {service.providerName.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {service.providerName}
              </h3>
              <p className="text-sm text-gray-600">{service.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet.
            </div>
          ) : (
            messages.map((msg) => {
              const isSender = msg.sender_id === userId;

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isSender ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isSender
                        ? "bg-green-600 text-white"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    {msg.message_type === "text" && <p>{msg.content}</p>}
                    {msg.message_type === "image" && (
                      <img
                        src={msg.media_url}
                        className="rounded-lg max-w-full"
                      />
                    )}
                    {msg.message_type === "audio" && (
                      <AudioPlayer src={msg.media_url} />
                    )}

                    <div className="text-xs mt-1 text-gray-400">
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-2">
            {/* Image Upload */}
            <input
              type="file"
              accept="image/*"
              id="image-upload"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label
              htmlFor="image-upload"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <ImageIcon className="h-5 w-5" />
            </label>

            {/* Voice */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-lg ${
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
              onKeyDown={(e) => e.key === "Enter" && sendTextMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={sending || isRecording}
            />

            {/* Send */}
            <button
              onClick={sendTextMessage}
              disabled={!messageText.trim() || sending}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          {/* Recording status */}
          {isRecording && (
            <p className="text-sm text-red-600 mt-2 animate-pulse">
              Recording... Click mic to stop
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// AUDIO PLAYER COMPONENT
// ------------------------------------------------------
const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLAudioElement>(null);

  return (
    <div className="flex items-center gap-2 mt-1">
      <button
        onClick={() => {
          if (!ref.current) return;
          if (playing) ref.current.pause();
          else ref.current.play();
          setPlaying(!playing);
        }}
        className="p-1 rounded-full bg-gray-200"
      >
        {playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>

      <audio
        ref={ref}
        src={src}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
};
