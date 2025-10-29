import React, { useState, useEffect, useRef } from "react";
import { X, Send, Phone, Video, Mic, MicOff, Image as ImageIcon, Play, Pause } from "lucide-react";
import { messagesAPI } from "../../lib/api/messagesAPI";
import { uploadFile, STORAGE_BUCKETS } from "../../lib/supabase";
import { useRealtimeMessages } from "../../hooks/useRealtimeSubscription";

interface ChatModalProps {
  service: {
    providerId: string;
    providerName: string;
    title: string;
    providerProfilePic?: string;
  };
  userId: string; // Logged-in user ID
  userName: string; // Logged-in user name
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ Real-time messages
  const { messages, loading } = useRealtimeMessages(userId, service.providerId, null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 🎤 Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone error:", error);
      alert("Microphone access denied");
    }
  };

  // 🛑 Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 📨 Send text message
  const sendTextMessage = async () => {
    if (!messageText.trim()) return;

    try {
      setSending(true);
      await messagesAPI.send({
        sender_id: userId,
        receiver_id: service.providerId,
        message_type: "text",
        content: messageText.trim(),
      });
      setMessageText("");
    } catch (error) {
      console.error("Failed to send text:", error);
    } finally {
      setSending(false);
    }
  };

  // 🖼️ Send image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSending(true);
      const fileName = `image_${Date.now()}_${file.name}`;
      const filePath = `${userId}/${fileName}`;
      const imageUrl = await uploadFile(STORAGE_BUCKETS.IMAGES, filePath, file);

      await messagesAPI.send({
        sender_id: userId,
        receiver_id: service.providerId,
        message_type: "image",
        media_url: imageUrl,
      });
    } catch (error) {
      console.error("Image upload failed:", error);
    } finally {
      setSending(false);
    }
  };

  // 🔊 Send audio
  const sendAudioMessage = async () => {
    if (!audioBlob) return;
    try {
      setSending(true);
      const fileName = `audio_${Date.now()}.webm`;
      const filePath = `${userId}/${fileName}`;
      const audioUrl = await uploadFile(STORAGE_BUCKETS.AUDIO, filePath, audioBlob);

      await messagesAPI.send({
        sender_id: userId,
        receiver_id: service.providerId,
        message_type: "audio",
        media_url: audioUrl,
      });
      setAudioBlob(null);
    } catch (error) {
      console.error("Audio send failed:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
                  alt={service.providerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-green-600 font-semibold">
                  {service.providerName.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{service.providerName}</h3>
              <p className="text-sm text-gray-600">{service.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Video className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No messages yet.</div>
          ) : (
            messages.map((msg) => {
              const isSender = msg.sender_id === userId;
              return (
                <div key={msg.id} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isSender ? "bg-green-600 text-white" : "bg-white border border-gray-200"
                    }`}
                  >
                    {msg.message_type === "text" && <p>{msg.content}</p>}
                    {msg.message_type === "image" && (
                      <img src={msg.media_url} alt="sent" className="rounded-lg max-w-full" />
                    )}
                    {msg.message_type === "audio" && <AudioPlayer src={msg.media_url} />}
                    <div className={`text-xs mt-1 ${isSender ? "text-green-100" : "text-gray-500"}`}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Audio Preview */}
        {audioBlob && (
          <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 flex justify-between items-center">
            <span className="text-sm text-gray-700">Audio recorded</span>
            <div className="space-x-2">
              <button onClick={() => setAudioBlob(null)} className="px-3 py-1 bg-gray-200 rounded">
                Cancel
              </button>
              <button
                onClick={sendAudioMessage}
                disabled={sending}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Send Audio
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-2">
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

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-lg ${
                isRecording ? "bg-red-100 text-red-600" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendTextMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={sending || isRecording}
            />

            <button
              onClick={sendTextMessage}
              disabled={!messageText.trim() || sending}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          {isRecording && (
            <p className="text-sm text-red-600 mt-2 animate-pulse">Recording... Click mic to stop</p>
          )}
        </div>
      </div>
    </div>
  );
};

const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <button onClick={togglePlay} className="p-1 rounded-full bg-gray-200">
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <audio ref={audioRef} src={src} onEnded={() => setPlaying(false)} />
      <span className="text-xs text-gray-600">Voice Message</span>
    </div>
  );
};
