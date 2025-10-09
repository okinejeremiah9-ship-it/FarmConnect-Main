import React, { useState, useRef } from 'react';
import { X, AlertTriangle, Loader, Mic, MicOff, Play, Pause, Trash2 } from 'lucide-react';
import { uploadFile, STORAGE_BUCKETS } from '../../lib/supabase';
import { escrowAPI } from '../../lib/api';

interface DisputeModalProps {
  escrowId: string;
  userId: string;
  bookingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  escrowId,
  userId,
  bookingId,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const disputeReasons = [
    'Service not provided',
    'Poor quality service',
    'Equipment malfunction',
    'Provider no-show',
    'Service incomplete',
    'Different service than agreed',
    'Safety concerns',
    'Other',
  ];

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
        setAudioUrl(URL.createObjectURL(audioBlob));
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

  const deleteAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const togglePlayAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let audioFileUrl = null;

      // Upload audio if recorded
      if (audioBlob) {
        const fileName = `dispute_${Date.now()}.webm`;
        const filePath = `${bookingId}/${fileName}`;
        audioFileUrl = await uploadFile(STORAGE_BUCKETS.AUDIO, filePath, audioBlob);
      }

      // Submit dispute
      await escrowAPI.dispute(escrowId, userId, reason, details, audioFileUrl);

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-900">Raise Dispute</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm font-medium mb-1">
            Payment will remain secured in escrow
          </p>
          <p className="text-red-700 text-sm">
            An admin will review your dispute along with any audio evidence you provide.
            The escrow funds will be held until the dispute is resolved.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Dispute *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Select a reason</option>
              {disputeReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details *
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide detailed information about the issue..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          {/* Audio Recording Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Evidence (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {!audioBlob ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Record audio to explain your dispute in detail
                  </p>
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 mx-auto ${
                      isRecording
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isRecording ? (
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
                  {isRecording && (
                    <p className="text-sm text-red-600 mt-2 animate-pulse">
                      Recording in progress...
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={togglePlayAudio}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                      <span className="text-sm font-medium text-gray-700">
                        Audio Recorded
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={deleteAudio}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <audio
                    ref={audioRef}
                    src={audioUrl || ''}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Dispute'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
