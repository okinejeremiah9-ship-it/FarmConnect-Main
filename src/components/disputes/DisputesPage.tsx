import React, { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  FileText,
  ArrowLeft,
  Mic,
  MicOff,
  Trash2,
  Send,
} from "lucide-react";
import { disputeAPI } from "../../lib/api";
import { uploadFile, STORAGE_BUCKETS } from "../../lib/supabase";

interface DisputesPageProps {
  userId: string;
  userRole: string;
  onBack: () => void;
}

export const DisputesPage: React.FC<DisputesPageProps> = ({
  userId,
  userRole,
  onBack,
}) => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Reply state (text + audio + images)
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [isReplyRecording, setIsReplyRecording] = useState(false);
  const [replyAudioBlob, setReplyAudioBlob] = useState<Blob | null>(null);
  const [replyAudioUrl, setReplyAudioUrl] = useState<string | null>(null);
  const [isReplyAudioPlaying, setIsReplyAudioPlaying] = useState(false);
  const replyAudioRef = useRef<HTMLAudioElement>(null);
  const replyMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const replyAudioChunksRef = useRef<Blob[]>([]);

  // ✅ STEP A — image reply state
  const [replyImages, setReplyImages] = useState<File[]>([]);
  const [replyImagePreviews, setReplyImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const data = await disputeAPI.listForUser(userId);
      if (data?.success) {
        setDisputes(data.disputes || []);
      } else {
        console.error("Failed to fetch disputes:", data?.error);
      }
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAudioPlayback = (audioUrl: string) => {
    if (!audioUrl) return;

    if (playingAudio === audioUrl) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingAudio(audioUrl);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            Open
          </span>
        );
      case "investigating":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            Under Review
          </span>
        );
      case "resolved":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Resolved
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            {status}
          </span>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "investigating":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "resolved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  // ------------------------------
  // Reply audio recording controls
  // ------------------------------
  const startReplyRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      replyMediaRecorderRef.current = mediaRecorder;
      replyAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        replyAudioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(replyAudioChunksRef.current, {
          type: "audio/webm",
        });
        setReplyAudioBlob(blob);
        setReplyAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsReplyRecording(true);
    } catch (err) {
      console.error("Failed to start reply recording:", err);
      alert("Microphone access denied");
    }
  };

  const stopReplyRecording = () => {
    if (replyMediaRecorderRef.current && isReplyRecording) {
      replyMediaRecorderRef.current.stop();
      setIsReplyRecording(false);
    }
  };

  const deleteReplyAudio = () => {
    setReplyAudioBlob(null);
    setReplyAudioUrl(null);
    setIsReplyAudioPlaying(false);
  };

  const toggleReplyAudioPlay = () => {
    if (!replyAudioRef.current || !replyAudioUrl) return;
    if (isReplyAudioPlaying) {
      replyAudioRef.current.pause();
      setIsReplyAudioPlaying(false);
    } else {
      replyAudioRef.current.play();
      setIsReplyAudioPlaying(true);
    }
  };

  // -------------------------------------------------------------
  // STEP B — image picker handlers
  // -------------------------------------------------------------
  const handleReplyImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const previews = files.map((file) => URL.createObjectURL(file));
    setReplyImages((prev) => [...prev, ...files]);
    setReplyImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeReplyImage = (index: number) => {
    setReplyImages((prev) => prev.filter((_, i) => i !== index));
    setReplyImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ------------------------------
  // Handle send reply (UPDATED)
  // ------------------------------
  const handleSendReply = async () => {
    if (!selectedDispute) return;
    if (!replyText.trim() && !replyAudioBlob && replyImages.length === 0) {
      setReplyError("Please type a message, record audio, or attach images.");
      return;
    }

    setReplyError("");
    setSendingReply(true);

    try {
      let audioFileUrl: string | null = null;

      // Upload audio
      if (replyAudioBlob) {
        const ext = "webm";
        const fileName = `dispute_reply_${Date.now()}.${ext}`;
        const filePath = `${selectedDispute.id}/${fileName}`;
        audioFileUrl = await uploadFile(
          STORAGE_BUCKETS.CHAT_AUDIO, // ✅ existing audio bucket
          filePath,
          replyAudioBlob as any
        );
      }

      // -------------------------------------------------------------
      // STEP C — Upload images BEFORE sending message
      // -------------------------------------------------------------
      let uploadedImages: string[] = [];

      if (replyImages.length > 0) {
        for (const img of replyImages) {
          const ext = img.name.split(".").pop();
          const filePath = `${selectedDispute.id}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${ext}`;

          const url = await uploadFile(
            STORAGE_BUCKETS.CHAT_IMAGES, // ✅ existing image bucket
            filePath,
            img
          );

          uploadedImages.push(url);
        }
      }

      const response = await disputeAPI.addMessage(
        selectedDispute.id,
        userId,
        replyText.trim() || undefined,
        audioFileUrl,
        uploadedImages.length > 0 ? uploadedImages : null
      );

      if (!response?.success) {
        throw new Error(response?.error || "Failed to send reply");
      }

      const saved = response.message;

      const newMessage = {
        ...saved,
        sender: {
          id: userId,
          name: "You",
          role: userRole,
        },
      };

      setSelectedDispute((prev: any) =>
        prev
          ? { ...prev, messages: [...(prev.messages || []), newMessage] }
          : prev
      );

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === selectedDispute.id
            ? { ...d, messages: [...(d.messages || []), newMessage] }
            : d
        )
      );

      // Reset inputs
      setReplyText("");
      deleteReplyAudio();
      setReplyImages([]);
      setReplyImagePreviews([]);
    } catch (err: any) {
      console.error("Reply failed:", err);
      setReplyError(err.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  // ------------------------------
  // RENDER
  // ------------------------------
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Clock className="w-12 h-12 text-green-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading disputes...</p>
        </div>
      </div>
    );
  }

  // DETAIL VIEW WITH CHAT
  if (selectedDispute) {
    const messages = (selectedDispute.messages || [])
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => setSelectedDispute(null)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Disputes
        </button>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Dispute Details
              </h2>
              {getStatusBadge(selectedDispute.status)}
            </div>
            {getStatusIcon(selectedDispute.status)}
          </div>

          <div className="space-y-6">
            {/* Booking Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Booking Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Service:</span>{" "}
                  <span className="font-medium">
                    {selectedDispute.escrow?.booking?.service?.title}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>{" "}
                  <span className="font-medium">
                    GH₵
                    {parseFloat(
                      selectedDispute.escrow?.amount || "0"
                    ).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Farmer:</span>{" "}
                  <span className="font-medium">
                    {selectedDispute.escrow?.farmer?.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Provider:</span>{" "}
                  <span className="font-medium">
                    {selectedDispute.escrow?.provider?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Dispute Details */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Reason</h3>
              <p className="text-lg text-gray-800">{selectedDispute.reason}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Details</h3>
              <p className="text-gray-700 leading-relaxed">
                {selectedDispute.details}
              </p>
            </div>

            {/* Original Audio Evidence */}
            {selectedDispute.audio_url && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Audio Evidence
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      toggleAudioPlayback(selectedDispute.audio_url)
                    }
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                  >
                    {playingAudio === selectedDispute.audio_url ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {playingAudio === selectedDispute.audio_url
                        ? "Playing audio..."
                        : "Click to play original audio evidence"}
                    </p>
                    <p className="text-xs text-gray-600">
                      Recorded by {selectedDispute.raised_by_user?.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Resolution */}
            {selectedDispute.status === "resolved" &&
              selectedDispute.resolution && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Admin Resolution
                  </h3>
                  <p className="text-gray-700">
                    {selectedDispute.resolution}
                  </p>
                  <div className="mt-3 text-sm text-gray-600">
                    <p>
                      Resolved by:{" "}
                      {selectedDispute.resolved_by_user?.name}
                    </p>
                    <p>
                      Date:{" "}
                      {new Date(
                        selectedDispute.resolved_at
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

            {/* Timeline */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Dispute Raised
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(
                        selectedDispute.created_at
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
                {selectedDispute.status === "resolved" && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Dispute Resolved
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(
                          selectedDispute.resolved_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Conversation Thread */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Conversation
              </h3>
              <div className="border rounded-lg max-h-64 overflow-y-auto p-3 bg-gray-50 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No replies yet. You can send a reply below.
                  </p>
                ) : (
                  messages.map((msg: any) => {
                    const isSelf = msg.sender_id === userId;
                    const senderName =
                      msg.sender?.name || (isSelf ? "You" : "User");
                    const createdAt = msg.created_at
                      ? new Date(msg.created_at).toLocaleString()
                      : "";

                    return (
                      <div key={msg.id}>
                        <div
                          className={`flex ${
                            isSelf ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                              isSelf
                                ? "bg-green-600 text-white"
                                : "bg-white text-gray-900"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-xs">
                                {senderName}
                              </span>
                              <span className="text-[10px] opacity-75">
                                {createdAt}
                              </span>
                            </div>

                            {msg.message && (
                              <p className="whitespace-pre-wrap">
                                {msg.message}
                              </p>
                            )}

                            {msg.audio_url && (
                              <button
                                type="button"
                                onClick={() =>
                                  toggleAudioPlayback(msg.audio_url)
                                }
                                className={`mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  isSelf
                                    ? "bg-green-700 text-white"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {playingAudio === msg.audio_url ? (
                                  <Pause className="w-3 h-3 mr-1" />
                                ) : (
                                  <Play className="w-3 h-3 mr-1" />
                                )}
                                Audio
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Images below bubble */}
                        {msg.image_urls &&
                          Array.isArray(msg.image_urls) && (
                            <div
                              className={`mt-2 flex flex-wrap gap-2 ${
                                isSelf ? "justify-end" : "justify-start"
                              }`}
                            >
                              {msg.image_urls.map(
                                (url: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    className="w-28 h-28 object-cover rounded-lg border cursor-pointer"
                                    onClick={() =>
                                      window.open(url, "_blank")
                                    }
                                  />
                                )
                              )}
                            </div>
                          )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Reply Composer */}
            {selectedDispute.status !== "resolved" && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Reply to this dispute
                </h3>

                {replyError && (
                  <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {replyError}
                  </div>
                )}

                <div className="mb-3">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Explain your side of the issue..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Image attachments */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attach Images (optional)
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReplyImageSelect}
                    className="text-sm"
                  />

                  {replyImagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {replyImagePreviews.map((src, index) => (
                        <div key={index} className="relative">
                          <img
                            src={src}
                            className="w-24 h-24 object-cover rounded-lg border"
                          />
                          <button
                            onClick={() => removeReplyImage(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audio Reply */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Audio Reply (optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                    {!replyAudioBlob ? (
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-2">
                          Record audio to support your reply
                        </p>
                        <button
                          type="button"
                          onClick={
                            isReplyRecording
                              ? stopReplyRecording
                              : startReplyRecording
                          }
                          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto ${
                            isReplyRecording
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {isReplyRecording ? (
                            <>
                              <MicOff className="h-4 w-4" />
                              Stop Recording
                            </>
                          ) : (
                            <>
                              <Mic className="h-4 w-4" />
                              Start Recording
                            </>
                          )}
                        </button>
                        {isReplyRecording && (
                          <p className="text-xs text-red-600 mt-2 animate-pulse">
                            Recording in progress...
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={toggleReplyAudioPlay}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                          >
                            {isReplyAudioPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>
                          <span className="text-sm font-medium text-gray-700">
                            Audio reply recorded
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={deleteReplyAudio}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <audio
                      ref={replyAudioRef}
                      src={replyAudioUrl || ""}
                      onEnded={() => setIsReplyAudioPlaying(false)}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    disabled={sendingReply}
                    onClick={handleSendReply}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {sendingReply ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global audio player */}
        <audio
          ref={audioRef}
          onEnded={() => setPlayingAudio(null)}
          className="hidden"
        />
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {userRole === "farmer" ? "My Disputes" : "Disputes Against Me"}
        </h1>
        <p className="text-gray-600 mt-2">
          {userRole === "farmer"
            ? "View and track disputes you have raised"
            : "View disputes raised against your services"}
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Disputes
          </h3>
          <p className="text-gray-600">
            You don't have any disputes at the moment
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedDispute(dispute)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(dispute.status)}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {dispute.reason}
                    </h3>
                  </div>
                  <p className="text-gray-600 line-clamp-2">
                    {dispute.details}
                  </p>
                </div>
                {getStatusBadge(dispute.status)}
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Service:</span>{" "}
                  <span className="font-medium">
                    {dispute.escrow?.booking?.service?.title}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>{" "}
                  <span className="font-medium">
                    GH₵
                    {parseFloat(dispute.escrow?.amount || "0").toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>{" "}
                  <span className="font-medium">
                    {new Date(dispute.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  {dispute.audio_url && (
                    <div className="flex items-center text-blue-600">
                      <Play className="w-4 h-4 mr-1" />
                      <span>Audio evidence attached</span>
                    </div>
                  )}
                  {Array.isArray(dispute.messages) &&
                    dispute.messages.length > 0 && (
                      <div className="flex items-center text-gray-500">
                        <FileText className="w-4 h-4 mr-1" />
                        <span>{dispute.messages.length} replies</span>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudio(null)}
        className="hidden"
      />
    </div>
  );
};
