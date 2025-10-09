import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserStats } from '../../hooks/useUserStats';
import { Service, ServiceRequest } from '../../types/auth';
import { EscrowStatusBadge } from '../escrow/EscrowStatusBadge';
import { ReviewModal } from '../reviews/ReviewModal';
import { UserReviews } from '../reviews/UserReviews';
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
  Check,
  X
} from 'lucide-react';

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, loading: statsLoading, refreshStats } = useUserStats(user?.id);
  const [services, setServices] = useState<Service[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ServiceRequest[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    // Mock data for services
    const mockServices: Service[] = [
      {
        id: 'service-1',
        title: 'John Deere Tractor Rental',
        description: 'Modern tractor available for land preparation and farming',
        category: 'tractor',
        price: 150,
        providerId: user?.id || '1',
        providerName: user?.name || 'Jane Provider',
        location: 'Kumasi, Ashanti Region',
        isAvailable: true,
        createdAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'service-2',
        title: 'Farm Equipment Repair',
        description: 'Professional repair services for all farm equipment',
        category: 'repair',
        price: 80,
        providerId: user?.id || '1',
        providerName: user?.name || 'Jane Provider',
        location: 'Accra, Greater Accra',
        isAvailable: true,
        createdAt: '2025-01-02T00:00:00Z',
      },
    ];

    const mockRequests: ServiceRequest[] = [
      {
        id: 'req-1',
        farmerId: 'farmer-1',
        farmerName: 'John Farmer',
        serviceId: 'service-1',
        serviceTitle: 'John Deere Tractor Rental',
        providerId: user?.id || '1',
        providerName: user?.name || 'Jane Provider',
        status: 'requested',
        location: 'Kumasi, Ashanti Region',
        dateNeeded: '2025-01-15',
        message: 'Need tractor for 2 days of land preparation',
        price: 300,
        createdAt: '2025-01-10T10:00:00Z',
        updatedAt: '2025-01-10T10:00:00Z',
        escrowStatus: 'funded',
      },
      {
        id: 'req-2',
        farmerId: 'farmer-2',
        farmerName: 'Mary Farmer',
        serviceId: 'service-2',
        serviceTitle: 'Farm Equipment Repair',
        providerId: user?.id || '1',
        providerName: user?.name || 'Jane Provider',
        status: 'requested',
        location: 'Tamale, Northern Region',
        dateNeeded: '2025-01-12',
        message: 'Irrigation pump needs urgent repair',
        price: 120,
        createdAt: '2025-01-09T14:00:00Z',
        updatedAt: '2025-01-09T14:00:00Z',
        escrowStatus: 'pending',
      },
      {
        id: 'req-3',
        farmerId: 'farmer-3',
        farmerName: 'David Farmer',
        serviceId: 'service-1',
        serviceTitle: 'John Deere Tractor Rental',
        providerId: user?.id || '1',
        providerName: user?.name || 'Jane Provider',
        status: 'completed',
        location: 'Kumasi, Ashanti Region',
        dateNeeded: '2025-01-08',
        message: 'Completed tractor rental service',
        price: 450,
        createdAt: '2025-01-08T08:00:00Z',
        updatedAt: '2025-01-08T18:00:00Z',
        escrowStatus: 'released',
        canReview: true,
      },
    ];

    setServices(mockServices);
    setIncomingRequests(mockRequests);
  }, [user]);

  const handleAcceptRequest = (requestId: string) => {
    setIncomingRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'accepted', updatedAt: new Date().toISOString() }
          : req
      )
    );
    refreshStats(); // Refresh stats when request is accepted
  };

  const handleDeclineRequest = (requestId: string) => {
    setIncomingRequests(prev => 
      prev.filter(req => req.id !== requestId)
    );
    refreshStats(); // Refresh stats when request is declined
  };

  const handleReviewService = (request: any) => {
    setSelectedBookingForReview({
      id: request.id,
      serviceTitle: request.serviceTitle,
      farmerName: request.farmerName,
      providerId: request.providerId,
      farmerId: request.farmerId,
      serviceId: request.serviceId,
    });
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    refreshStats();
  };

  const getServiceIcon = (category: Service['category']) => {
    switch (category) {
      case 'tractor':
        return <Tractor className="w-6 h-6 text-green-600" />;
      case 'repair':
        return <Wrench className="w-6 h-6 text-blue-600" />;
      case 'advisory':
        return <MessageSquare className="w-6 h-6 text-purple-600" />;
      default:
        return <Tractor className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Provider Dashboard
              </h1>
              <p className="text-gray-600">Manage your services and incoming requests</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 flex items-center"
              >
                {showReviews ? 'Hide Reviews' : 'View Reviews'}
              </button>
              <button
                onClick={() => setShowServiceForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                List Service
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
                <Tractor className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats.servicesUsed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Requests</p>
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
                <p className="text-sm text-gray-600">Completed Jobs</p>
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
                <p className="text-sm text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : `₵${stats.totalSpent.toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Incoming Requests */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Incoming Requests</h2>
              <p className="text-gray-600">New service requests from farmers</p>
            </div>

            <div className="p-6">
              {incomingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600">New requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.serviceTitle}</h3>
                          <p className="text-sm text-gray-600">by {request.farmerName}</p>
                        </div>
                        <span className="text-lg font-bold text-green-600">₵{request.price}</span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {request.location}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(request.dateNeeded).toLocaleDateString()}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-4">{request.message}</p>

                      {request.status === 'requested' ? (
                        <div className="flex space-x-2">
                          {request.escrowStatus && (
                            <div className="flex-1">
                              <EscrowStatusBadge 
                                status={request.escrowStatus} 
                                amount={request.price}
                                className="mb-2"
                              />
                            </div>
                          )}
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 flex items-center justify-center"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-green-50 text-green-800 py-2 px-4 rounded-lg text-sm text-center">
                            Request Accepted
                          </div>
                          {request.escrowStatus && (
                            <EscrowStatusBadge 
                              status={request.escrowStatus} 
                              amount={request.price}
                            />
                          )}
                        </div>
                      )}
                      {request.status === 'completed' && request.canReview && (
                        <button
                          onClick={() => handleReviewService(request)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 mt-2"
                        >
                          Rate Farmer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Your Services */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Your Services</h2>
              <p className="text-gray-600">Manage your listed services</p>
            </div>

            <div className="p-6">
              {services.length === 0 ? (
                <div className="text-center py-8">
                  <Tractor className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No services listed</h3>
                  <p className="text-gray-600 mb-4">Start by listing your first service</p>
                  <button
                    onClick={() => setShowServiceForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    List Service
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getServiceIcon(service.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900">{service.title}</h3>
                            <span className="text-lg font-bold text-green-600">₵{service.price}/day</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            {service.location}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          service.isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {showReviews && (
          <div className="mt-8">
            <UserReviews userId={user?.id || ''} userName={user?.name} />
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {showServiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">List New Service</h3>
              <button
                type="button"
                onClick={() => setShowServiceForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Title
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., John Deere Tractor Rental"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="tractor">Tractor Rental</option>
                  <option value="harvester">Harvester Rental</option>
                  <option value="repair">Equipment Repair</option>
                  <option value="advisory">Agricultural Advisory</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Day (₵)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="City, Region"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe your service..."
                ></textarea>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowServiceForm(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  List Service
                </button>
              </div>
            </form>
          </div>
        </div>
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