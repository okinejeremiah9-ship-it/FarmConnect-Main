import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserStats } from '../../hooks/useUserStats';
import { ServiceRequest } from '../../types/auth';
import { ServiceMarketplace } from '../marketplace/ServiceMarketplace';
import { EscrowStatusBadge } from '../escrow/EscrowStatusBadge';
import { DisputeModal } from '../escrow/DisputeModal';
import { ReviewModal } from '../reviews/ReviewModal';
import { useRealtimeBookingUpdates } from '../../hooks/useRealtimeSubscription';
import { escrowAPI, disputeAPI } from '../../lib/api';
import {
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  DollarSign,
  Tractor,
  Wrench,
  MessageSquare,
  Search,
  X,
  Loader2
} from 'lucide-react';

interface FarmerDashboardProps {
  onNavigate: (view: string, providerId?: string, sessionId?: string) => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ onNavigate }) => {

  const { user } = useAuth();
  const { stats, loading: statsLoading, refreshStats } = useUserStats(user?.id);
  const { bookings, loading: bookingsLoading } = useRealtimeBookingUpdates(user?.id ?? '');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'marketplace'>('dashboard');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [releasingEscrowId, setReleasingEscrowId] = useState<string | null>(null);

  const farmerBookings = useMemo(() => {
    if (!user?.id) return [];

    return (bookings || [])
      .filter((booking) => booking.farmer_id === user.id)
      .map((booking) => {
        const escrowRecords = Array.isArray(booking.escrow_wallet)
          ? booking.escrow_wallet
          : booking.escrow_wallet
          ? [booking.escrow_wallet]
          : [];

        const escrowRecord = escrowRecords[0] || null;

        const request: ServiceRequest = {
          id: booking.id,
          farmerId: booking.farmer_id,
          farmerName: booking.farmer?.name || user.name || 'Farmer',
          serviceId: booking.service_id,
          serviceTitle: booking.service?.title || booking.service_title || 'Service Request',
          providerId: booking.provider_id,
          providerName: booking.provider?.name || booking.provider_name || 'Provider',
          status: (booking.status ?? 'pending') as ServiceRequest['status'],
          location: booking.service_location || 'Not specified',
          dateNeeded: booking.scheduled_date,
          message: booking.notes || '',
          price: Number(booking.total_price ?? 0),
          createdAt: booking.created_at,
          updatedAt: booking.updated_at || booking.created_at,
          escrowStatus: escrowRecord?.status,
          escrowId: escrowRecord?.id,
          canReview: booking.status === 'completed',
        };

        return {
          booking,
          request,
          escrowRecord,
        };
      });
  }, [bookings, user?.id, user?.name]);

  const activeRequests = useMemo(() => {
    return farmerBookings.filter(({ request }) =>
      ['pending', 'requested', 'accepted', 'in-progress'].includes(request.status)
    );
  }, [farmerBookings]);

  const escrowActions = useMemo(() => {
    return farmerBookings.filter(
      ({ booking, escrowRecord }) =>
        escrowRecord &&
        escrowRecord.status === 'funded' &&
        booking.status === 'completed'
    );
  }, [farmerBookings]);

  const openDisputes = useMemo(() => {
    return disputes.filter((dispute) => dispute.status !== 'resolved');
  }, [disputes]);

  const loadDisputes = useCallback(async () => {
    if (!user?.id) return;

    try {
      setDisputesLoading(true);
      const data = await disputeAPI.listForUser(user.id);

      if (data.success) {
        setDisputes(data.disputes || []);
      }
    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setDisputesLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleRaiseDispute = (booking: any, escrowRecord: any) => {
    if (!escrowRecord?.id) {
      alert('Escrow details are not available for this booking yet.');
      return;
    }

    setSelectedEscrow({
      id: escrowRecord.id,
      amount: Number(escrowRecord.amount ?? 0),
      bookingId: booking.id,
    });
    setShowDisputeModal(true);
  };

  const handleDisputeCreated = () => {
    setShowDisputeModal(false);
    loadDisputes();
    refreshStats();
  };

  const handleReviewService = (booking: any) => {
    setSelectedBookingForReview({
      id: booking.id,
      serviceTitle: booking.service?.title || booking.service_title || 'Service',
      providerName: booking.provider?.name,
      providerId: booking.provider_id,
      farmerId: booking.farmer_id,
      serviceId: booking.service_id,
    });
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    // Refresh the requests to update the UI
    refreshStats();
  };

  const handleReleaseEscrow = async (escrowId: string) => {
    if (!user?.id) return;

    const confirmRelease = window.confirm('Release payment to the provider for this completed service?');
    if (!confirmRelease) return;

    try {
      setReleasingEscrowId(escrowId);
      await escrowAPI.release(escrowId, user.id);
      refreshStats();
    } catch (error: any) {
      console.error('Failed to release escrow:', error);
      alert(error?.message || 'Failed to release payment');
    } finally {
      setReleasingEscrowId(null);
    }
  };

  const getStatusIcon = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'pending':
      case 'requested':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'in-progress':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'pending':
      case 'requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisputeBadgeStyle = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (currentView === 'marketplace') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="text-green-600 hover:text-green-700 font-medium mb-2"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Service Marketplace</h1>
                <p className="text-gray-600">Find and book agricultural services</p>
              </div>
            </div>
          </div>
        </div>
        <ServiceMarketplace />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name}
              </h1>
              <p className="text-gray-600">Manage your farm services and requests</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentView('marketplace')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center"
              >
                <Search className="w-5 h-5 mr-2" />
                Browse Services
              </button>
              <button
                onClick={() => setShowRequestForm(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Request Service
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats.activeRequests}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats.completedServices}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : `₵${stats.totalSpent.toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Tractor className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Services Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats.servicesUsed}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Requests */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Service Requests</h2>
            <p className="text-gray-600">Track the status of your ongoing service requests</p>
          </div>

          <div className="p-6">
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-600">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading your requests...
              </div>
            ) : activeRequests.length === 0 ? (
              <div className="text-center py-12">
                <Tractor className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active requests</h3>
                <p className="text-gray-600 mb-4">Start by requesting a service for your farm</p>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Request Service
                </button>
                <button
                  onClick={() => setCurrentView('marketplace')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 ml-3"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRequests.map(({ booking, request, escrowRecord }) => {
                  const isTractor = request.serviceTitle?.toLowerCase().includes('tractor');
                  const canReleaseEscrow =
                    escrowRecord?.status === 'funded' && booking.status === 'completed';

                  return (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            {isTractor ? (
                              <Tractor className="w-6 h-6 text-green-600" />
                            ) : (
                              <Wrench className="w-6 h-6 text-green-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.serviceTitle}
                            </h3>
                            <p className="text-gray-600">by {request.providerName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('-', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="text-sm">{request.location}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm">{new Date(request.dateNeeded).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span className="text-sm">₵{request.price.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <p className="text-gray-600 text-sm flex-1">{request.message || 'No additional notes'}</p>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            onClick={() => onNavigate('bookings')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message Provider
                          </button>
                          {request.escrowStatus && (
                            <EscrowStatusBadge
                              status={request.escrowStatus}
                              amount={request.price}
                            />
                          )}
                          {canReleaseEscrow && request.escrowId && (
                            <button
                              onClick={() => handleReleaseEscrow(request.escrowId!)}
                              disabled={releasingEscrowId === request.escrowId}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-60 flex items-center"
                            >
                              {releasingEscrowId === request.escrowId ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  Releasing...
                                </>
                              ) : (
                                'Release Payment'
                              )}
                            </button>
                          )}
                          {escrowRecord && (
                            <button
                              onClick={() => handleRaiseDispute(booking, escrowRecord)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                            >
                              Report Issue
                            </button>
                          )}
                          {request.status === 'completed' && request.canReview && (
                            <button
                              onClick={() => handleReviewService(booking)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                            >
                              Rate Service
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Escrow Actions */}
        <div className="bg-white rounded-xl shadow-sm mt-8">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Escrow Actions</h2>
              <p className="text-gray-600">Release funds once you are satisfied with completed services.</p>
            </div>
            <button
              onClick={() => onNavigate('bookings')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Manage Bookings
            </button>
          </div>
          <div className="p-6">
            {escrowActions.length === 0 ? (
              <p className="text-gray-600">No escrow payments are waiting for release right now.</p>
            ) : (
              <div className="space-y-3">
                {escrowActions.map(({ booking, request, escrowRecord }) => (
                  <div
                    key={`${booking.id}-escrow`}
                    className="border border-gray-100 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{request.serviceTitle}</h3>
                      <p className="text-sm text-gray-600">
                        Provider: {request.providerName} • Completed on{' '}
                        {new Date(request.dateNeeded).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 font-medium">
                        Amount: ₵{Number(escrowRecord?.amount ?? request.price).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleReleaseEscrow(request.escrowId!)}
                        disabled={releasingEscrowId === request.escrowId}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 flex items-center"
                      >
                        {releasingEscrowId === request.escrowId ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Releasing...
                          </>
                        ) : (
                          'Release Payment'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Disputes */}
        <div className="bg-white rounded-xl shadow-sm mt-8">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Disputes</h2>
              <p className="text-gray-600">Monitor any issues raised for your bookings and follow their progress.</p>
            </div>
            <button
              onClick={() => onNavigate('disputes')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View All Disputes
            </button>
          </div>
          <div className="p-6">
            {disputesLoading ? (
              <div className="flex items-center text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading disputes...
              </div>
            ) : openDisputes.length === 0 ? (
              <p className="text-gray-600">You have no active disputes at the moment.</p>
            ) : (
              <div className="space-y-3">
                {openDisputes.slice(0, 3).map((dispute) => (
                  <div
                    key={dispute.id}
                    className="border-l-4 border-red-500 bg-red-50 p-4 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{dispute.reason}</p>
                        <p className="text-sm text-gray-600">
                          Service: {dispute.escrow?.booking?.service?.title || 'Booking'}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getDisputeBadgeStyle(dispute.status)}`}
                      >
                        {dispute.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                      <span>
                        Amount:{' '}
                        ₵{Number(dispute.escrow?.amount ?? 0).toLocaleString()}
                      </span>
                      <span>
                        Raised:{' '}
                        {new Date(dispute.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        Raised by: {dispute.raised_by_user?.name || 'You'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Service Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Request a Service</h3>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                  <option>Tractor Rental</option>
                  <option>Equipment Repair</option>
                  <option>Agricultural Advisory</option>
                  <option>Harvester Rental</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your farm location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Needed
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Details
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Describe your requirements..."
                ></textarea>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && selectedEscrow && (
        <DisputeModal
          escrowId={selectedEscrow.id}
          userId={user?.id || ''}
          bookingId={selectedEscrow.bookingId}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={handleDisputeCreated}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedBookingForReview && (
        <ReviewModal
          booking={selectedBookingForReview}
          currentUserId={user?.id || ''}
          onClose={() => setShowReviewModal(false)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};