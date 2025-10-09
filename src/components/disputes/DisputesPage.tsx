import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, Play, Pause, FileText, ArrowLeft } from 'lucide-react';

interface DisputesPageProps {
  userId: string;
  userRole: string;
  onBack: () => void;
}

export const DisputesPage: React.FC<DisputesPageProps> = ({ userId, userRole, onBack }) => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchDisputes();
  }, [userId]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disputes-list`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setDisputes(data.disputes || []);
      } else {
        console.error('Failed to fetch disputes:', data.error);
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Open</span>;
      case 'investigating':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Under Review</span>;
      case 'resolved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Resolved</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'investigating':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-600" />;
    }
  };

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

  if (selectedDispute) {
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Dispute Details</h2>
              {getStatusBadge(selectedDispute.status)}
            </div>
            {getStatusIcon(selectedDispute.status)}
          </div>

          <div className="space-y-6">
            {/* Booking Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Information</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Service:</span>{' '}
                  <span className="font-medium">{selectedDispute.escrow?.booking?.service?.title}</span>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>{' '}
                  <span className="font-medium">GH₵{parseFloat(selectedDispute.escrow?.amount || '0').toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Farmer:</span>{' '}
                  <span className="font-medium">{selectedDispute.escrow?.farmer?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Provider:</span>{' '}
                  <span className="font-medium">{selectedDispute.escrow?.provider?.name}</span>
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
              <p className="text-gray-700 leading-relaxed">{selectedDispute.details}</p>
            </div>

            {/* Audio Evidence */}
            {selectedDispute.audio_url && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Audio Evidence</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleAudioPlayback(selectedDispute.audio_url)}
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
                      {playingAudio === selectedDispute.audio_url ? 'Playing audio...' : 'Click to play audio evidence'}
                    </p>
                    <p className="text-xs text-gray-600">Recorded by {selectedDispute.raised_by_user?.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Resolution */}
            {selectedDispute.status === 'resolved' && selectedDispute.resolution && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Admin Resolution</h3>
                <p className="text-gray-700">{selectedDispute.resolution}</p>
                <div className="mt-3 text-sm text-gray-600">
                  <p>Resolved by: {selectedDispute.resolved_by_user?.name}</p>
                  <p>Date: {new Date(selectedDispute.resolved_at).toLocaleString()}</p>
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
                    <p className="text-sm font-medium text-gray-900">Dispute Raised</p>
                    <p className="text-xs text-gray-600">{new Date(selectedDispute.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {selectedDispute.status === 'resolved' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dispute Resolved</p>
                      <p className="text-xs text-gray-600">{new Date(selectedDispute.resolved_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          onEnded={() => setPlayingAudio(null)}
          className="hidden"
        />
      </div>
    );
  }

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
          {userRole === 'farmer' ? 'My Disputes' : 'Disputes Against Me'}
        </h1>
        <p className="text-gray-600 mt-2">
          {userRole === 'farmer'
            ? 'View and track disputes you have raised'
            : 'View disputes raised against your services'}
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Disputes</h3>
          <p className="text-gray-600">You don't have any disputes at the moment</p>
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
                    <h3 className="text-lg font-semibold text-gray-900">{dispute.reason}</h3>
                  </div>
                  <p className="text-gray-600 line-clamp-2">{dispute.details}</p>
                </div>
                {getStatusBadge(dispute.status)}
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Service:</span>{' '}
                  <span className="font-medium">{dispute.escrow?.booking?.service?.title}</span>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>{' '}
                  <span className="font-medium">GH₵{parseFloat(dispute.escrow?.amount || '0').toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>{' '}
                  <span className="font-medium">{new Date(dispute.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {dispute.audio_url && (
                <div className="mt-4 flex items-center text-blue-600">
                  <Play className="w-4 h-4 mr-1" />
                  <span className="text-sm">Audio evidence attached</span>
                </div>
              )}

              {dispute.status === 'resolved' && dispute.resolution && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-900 font-medium">Resolution: {dispute.resolution}</p>
                </div>
              )}
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
