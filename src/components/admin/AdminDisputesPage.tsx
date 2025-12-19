import React, { useState, useEffect, useRef } from 'react';
import { disputeAPI } from '../../lib/api';
import { AlertTriangle, Clock, CheckCircle, Play, Pause, Loader, X } from 'lucide-react';

interface AdminDisputesPageProps {
  adminId: string;
}

export const AdminDisputesPage: React.FC<AdminDisputesPageProps> = ({ adminId }) => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [resolutionAction, setResolutionAction] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolving, setResolving] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadDisputes();
  }, [adminId]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const data = await disputeAPI.getAll(adminId);
      if (data.success) {
        setDisputes(data.disputes || []);
      }
    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAudioPlayback = (audioUrl: string) => {
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

  const handleResolve = async () => {
    if (!selectedDispute || !resolutionAction || !resolutionNotes) {
      alert('Please fill in all resolution fields');
      return;
    }

    try {
      setResolving(true);
      await disputeAPI.resolve(
        selectedDispute.id,
        adminId,
        resolutionNotes,
        resolutionAction
      );

      alert('Dispute resolved successfully');
      setSelectedDispute(null);
      setResolutionAction('');
      setResolutionNotes('');
      loadDisputes();
    } catch (error: any) {
      console.error('Failed to resolve dispute:', error);
      alert(error.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Loader className="w-12 h-12 text-green-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading disputes...</p>
        </div>
      </div>
    );
  }

  const openDisputes = disputes.filter(d => d.status === 'open' || d.status === 'investigating');
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dispute Management</h1>

      {/* Open Disputes */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          Open Disputes ({openDisputes.length})
        </h2>

        {openDisputes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Open Disputes</h3>
            <p className="text-gray-600">All disputes have been resolved</p>
          </div>
        ) : (
          <div className="space-y-4">
            {openDisputes.map((dispute) => (
              <div key={dispute.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        {dispute.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(dispute.created_at).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {dispute.reason}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Farmer:</span>{' '}
                        <span className="text-gray-900">{dispute.escrow?.farmer?.name}</span>
                        <br />
                        <span className="text-gray-500">{dispute.escrow?.farmer?.phone}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Provider:</span>{' '}
                        <span className="text-gray-900">{dispute.escrow?.provider?.name}</span>
                        <br />
                        <span className="text-gray-500">{dispute.escrow?.provider?.phone}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Raised by:</span>{' '}
                        {dispute.raised_by_user?.name} ({dispute.raised_by_user?.role})
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Service:</span>{' '}
                        {dispute.escrow?.booking?.service?.title}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Amount:</span>{' '}
                        GH₵{parseFloat(dispute.escrow?.amount || '0').toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Details:</p>
                      <p className="text-sm text-gray-800">{dispute.details}</p>
                    </div>

                    {/* 💬 Dispute Conversation */}
{Array.isArray(dispute.messages) && dispute.messages.length > 0 && (
  <div className="mt-4 bg-white border rounded-lg p-4">
    <h4 className="text-sm font-semibold text-gray-800 mb-3">
      Conversation
    </h4>

    <div className="space-y-3">
      {dispute.messages.map((msg: any) => {
        const isFarmer = msg.sender?.role === "farmer";
        const isProvider = msg.sender?.role === "provider";

        return (
          <div
            key={msg.id}
            className={`p-3 rounded-lg text-sm ${
              isFarmer
                ? "bg-green-50 border border-green-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            <div className="flex justify-between mb-1">
              <span className="font-medium text-gray-900">
                {msg.sender?.name} ({msg.sender?.role})
              </span>
              <span className="text-xs text-gray-500">
                {new Date(msg.created_at).toLocaleString()}
              </span>
            </div>

            {msg.message && (
              <p className="text-gray-800 mb-2">{msg.message}</p>
            )}

            {msg.audio_url && (
              <audio controls className="w-full mt-2">
                <source src={msg.audio_url} />
              </audio>
            )}

            {Array.isArray(msg.image_urls) && msg.image_urls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {msg.image_urls.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    alt="Dispute evidence"
                    className="rounded border object-cover h-24 w-full"
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}


                    {/* Audio Evidence */}
                    {dispute.audio_url && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Audio Evidence:</p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleAudioPlayback(dispute.audio_url)}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                          >
                            {playingAudio === dispute.audio_url ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>
                          <span className="text-sm text-gray-700">
                            {playingAudio === dispute.audio_url ? 'Playing...' : 'Click to play audio evidence'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedDispute(dispute)}
                    className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Disputes */}
      {resolvedDisputes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Resolved Disputes ({resolvedDisputes.length})
          </h2>

          <div className="space-y-4">
            {resolvedDisputes.map((dispute) => (
              <div key={dispute.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 opacity-75">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Resolved
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(dispute.resolved_at).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {dispute.reason}
                    </h3>

                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Resolution:</span> {dispute.resolution}
                    </p>

                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Resolved by:</span> {dispute.resolved_by_user?.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Resolve Dispute</h2>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-gray-900 mb-2">{selectedDispute.reason}</p>
              <p className="text-sm text-gray-700">{selectedDispute.details}</p>
              {selectedDispute.audio_url && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => toggleAudioPlayback(selectedDispute.audio_url)}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                  >
                    {playingAudio === selectedDispute.audio_url ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <span className="text-sm text-gray-700">Audio Evidence</span>
                </div>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Action *
                </label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select action</option>
                  <option value="refund_farmer">Refund Farmer (100%)</option>
                  <option value="release_provider">Release to Provider (100%)</option>
                  <option value="split">Split Payment (50/50)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes *
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain your decision..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedDispute(null)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving || !resolutionAction || !resolutionNotes}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {resolving ? (
                  <>
                    <Loader className="inline h-5 w-5 mr-2 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  'Resolve Dispute'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudio(null)}
        className="hidden"
      />
    </div>
  );
};
