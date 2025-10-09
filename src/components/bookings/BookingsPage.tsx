import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRealtimeBookingUpdates } from '../../hooks/useRealtimeSubscription';
import { bookingAPI, escrowAPI } from '../../lib/api';
import { Clock, CheckCircle, XCircle, AlertTriangle, MessageCircle, DollarSign } from 'lucide-react';
import { EscrowStatusBadge } from '../escrow/EscrowStatusBadge';
import { ChatWindow } from '../chat/ChatWindow';
import { DisputeModal } from '../escrow/DisputeModal';

interface BookingsPageProps {
  userId: string;
  userRole: string;
  onNavigate: (view: string, id?: string) => void;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({ userId, userRole, onNavigate }) => {
  const { bookings, loading } = useRealtimeBookingUpdates(userId);
  const [filter, setFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedBookingForChat, setSelectedBookingForChat] = useState<any | null>(null);
  const [selectedBookingForDispute, setSelectedBookingForDispute] = useState<any | null>(null);

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      setUpdating(bookingId);
      await bookingAPI.updateStatus(bookingId, userId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update booking status');
    } finally {
      setUpdating(null);
    }
  };

  const handleEscrowDeposit = async (booking: any) => {
    if (!confirm(`Deposit GH₵${booking.total_price} to escrow?`)) return;

    try {
      setUpdating(booking.id);
      await escrowAPI.deposit(booking.id, userId, booking.total_price);
      alert('Funds deposited to escrow successfully');
    } catch (error: any) {
      console.error('Deposit failed:', error);
      alert(error.message || 'Failed to deposit funds');
    } finally {
      setUpdating(null);
    }
  };

  const handleEscrowRelease = async (escrowId: string) => {
    if (!confirm('Release payment to provider? Service must be completed.')) return;

    try {
      setUpdating(escrowId);
      await escrowAPI.release(escrowId, userId);
      alert('Payment released successfully');
    } catch (error: any) {
      console.error('Release failed:', error);
      alert(error.message || 'Failed to release payment');
    } finally {
      setUpdating(null);
    }
  };

  const filteredBookings = bookings.filter((booking: any) => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Clock className="w-12 h-12 text-green-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'accepted', 'in-progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Found</h3>
          <p className="text-gray-600 mb-6">You don't have any bookings yet.</p>
          {userRole === 'farmer' && (
            <button
              onClick={() => onNavigate('marketplace')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Browse Services
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking: any) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {booking.service?.title || 'Service'}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">
                        {userRole === 'farmer' ? 'Provider:' : 'Farmer:'}
                      </span>{' '}
                      {userRole === 'farmer' ? booking.provider?.name : booking.farmer?.name}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {new Date(booking.scheduled_date).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span> {booking.service_location}
                    </p>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      Total: GH₵{parseFloat(booking.total_price).toFixed(2)}
                    </p>
                  </div>

                  {/* Escrow Status */}
                  {booking.escrow_wallet?.[0] && (
                    <div className="mt-3">
                      <EscrowStatusBadge
                        status={booking.escrow_wallet[0].status}
                        amount={parseFloat(booking.escrow_wallet[0].amount)}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {/* Status Badge */}
                  <span
                    className={`px-4 py-2 rounded-lg text-sm font-medium text-center ${
                      booking.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : booking.status === 'accepted'
                        ? 'bg-cyan-100 text-cyan-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {booking.status}
                  </span>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {/* Farmer Actions */}
                    {userRole === 'farmer' && (
                      <>
                        {booking.status === 'accepted' && !booking.escrow_wallet?.[0] && (
                          <button
                            onClick={() => handleEscrowDeposit(booking)}
                            disabled={updating === booking.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <DollarSign className="h-4 w-4" />
                            Pay Escrow
                          </button>
                        )}
                        {booking.status === 'completed' && booking.escrow_wallet?.[0]?.status === 'funded' && (
                          <button
                            onClick={() => handleEscrowRelease(booking.escrow_wallet[0].id)}
                            disabled={updating === booking.escrow_wallet[0].id}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            Release Payment
                          </button>
                        )}
                      </>
                    )}

                    {/* Provider Actions */}
                    {userRole === 'provider' && (
                      <>
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'accepted')}
                              disabled={updating === booking.id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'declined')}
                              disabled={updating === booking.id}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {booking.status === 'accepted' && booking.escrow_wallet?.[0]?.status === 'funded' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'in-progress')}
                            disabled={updating === booking.id}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            Start Service
                          </button>
                        )}
                        {booking.status === 'in-progress' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                            disabled={updating === booking.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                          >
                            Mark Complete
                          </button>
                        )}
                      </>
                    )}

                    {/* Chat Button */}
                    <button
                      onClick={() => setSelectedBookingForChat(booking)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat
                    </button>

                    {/* Dispute Button */}
                    {booking.escrow_wallet?.[0] && booking.escrow_wallet[0].status === 'funded' && (
                      <button
                        onClick={() => setSelectedBookingForDispute(booking)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Dispute
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Notes:</span> {booking.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {selectedBookingForChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full h-[600px] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                Chat - {selectedBookingForChat.service?.title}
              </h2>
              <button
                onClick={() => setSelectedBookingForChat(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                bookingId={selectedBookingForChat.id}
                userId={userId}
                otherUserId={
                  userRole === 'farmer'
                    ? selectedBookingForChat.provider_id
                    : selectedBookingForChat.farmer_id
                }
                otherUserName={
                  userRole === 'farmer'
                    ? selectedBookingForChat.provider?.name || 'Provider'
                    : selectedBookingForChat.farmer?.name || 'Farmer'
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {selectedBookingForDispute && selectedBookingForDispute.escrow_wallet?.[0] && (
        <DisputeModal
          escrowId={selectedBookingForDispute.escrow_wallet[0].id}
          userId={userId}
          bookingId={selectedBookingForDispute.id}
          onClose={() => setSelectedBookingForDispute(null)}
          onSuccess={() => {
            setSelectedBookingForDispute(null);
            alert('Dispute submitted successfully. An admin will review it.');
          }}
        />
      )}
    </div>
  );
};
