import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Image as ImageIcon, Play, Pause } from 'lucide-react';
import { messagesAPI } from '../../lib/api';
import { uploadFile, STORAGE_BUCKETS } from '../../lib/supabase';
import { useRealtimeMessages } from '../../hooks/useRealtimeSubscription';

interface ChatWindowProps {
  bookingId: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  bookingId,
  userId,
  otherUserId,
  otherUserName,
}) => {
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading } = useRealtimeMessages(userId, otherUserId, bookingId);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendTextMessage = async () => {
    if (!messageText.trim()) return;

    try {
      setSending(true);
      await messagesAPI.send({
        booking_id: bookingId,
        sender_id: userId,
        receiver_id: otherUserId,
        message_type: 'text',
        content: messageText.trim(),
      });
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const sendAudioMessage = async () => {
    if (!audioBlob) return;

    try {
      setSending(true);
      const fileName = `audio_${Date.now()}.webm`;
      const filePath = `${bookingId}/${fileName}`;
      const audioUrl = await uploadFile(STORAGE_BUCKETS.AUDIO, filePath, audioBlob);

      await messagesAPI.send({
        booking_id: bookingId,
        sender_id: userId,
        receiver_id: otherUserId,
        message_type: 'audio',
        media_url: audioUrl,
      });

      setAudioBlob(null);
    } catch (error) {
      console.error('Failed to send audio:', error);
      alert('Failed to send audio message');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSending(true);
      const fileName = `image_${Date.now()}_${file.name}`;
      const filePath = `${bookingId}/${fileName}`;
      const imageUrl = await uploadFile(STORAGE_BUCKETS.IMAGES, filePath, file);

      await messagesAPI.send({
        booking_id: bookingId,
        sender_id: userId,
        receiver_id: otherUserId,
        message_type: 'image',
        media_url: imageUrl,
      });
    } catch (error) {
      console.error('Failed to send image:', error);
      alert('Failed to send image');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-md">
      <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl">
        <h3 className="font-semibold">Chat with {otherUserName}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => {
            const isSender = msg.sender_id === userId;
            return (
              <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isSender ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {msg.message_type === 'text' && <p>{msg.content}</p>}
                  {msg.message_type === 'audio' && (
                    <AudioPlayer src={msg.media_url} isSender={isSender} />
                  )}
                  {msg.message_type === 'image' && (
                    <img src={msg.media_url} alt="Shared" className="rounded max-w-full" />
                  )}
                  <div className={`text-xs mt-1 ${isSender ? 'text-green-100' : 'text-gray-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {audioBlob && (
        <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Audio recorded</span>
            <div className="flex gap-2">
              <button
                onClick={() => setAudioBlob(null)}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={sendAudioMessage}
                disabled={sending}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Send Audio
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-2">
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

          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-lg transition ${
              isRecording ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={sending || isRecording}
          />

          <button
            onClick={sendTextMessage}
            disabled={!messageText.trim() || sending}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        {isRecording && (
          <p className="text-sm text-red-600 mt-2 animate-pulse">Recording... Click mic to stop</p>
        )}
      </div>
    </div>
  );
};

const AudioPlayer: React.FC<{ src: string; isSender: boolean }> = ({ src, isSender }) => {
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
    <div className="flex items-center gap-2">
      <button
        onClick={togglePlay}
        className={`p-1 rounded-full ${isSender ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <span className="text-xs">Audio Message</span>
      <audio ref={audioRef} src={src} onEnded={() => setPlaying(false)} />
    </div>
  );
};
