import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserStats } from '../../hooks/useUserStats';
import { ServiceRequest } from '../../types/auth';
import { ServiceMarketplace } from '../marketplace/ServiceMarketplace';
import { EscrowStatusBadge } from '../escrow/EscrowStatusBadge';
import { DisputeModal } from '../escrow/DisputeModal';
import { ReviewModal } from '../reviews/ReviewModal';
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
  X
} from 'lucide-react';

export const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, loading: statsLoading, refreshStats } = useUserStats(user?.id);
  const [activeRequests, setActiveRequests] = useState<ServiceRequest[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'marketplace'>('dashboard');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);

  useEffect(() => {
    // Mock data for active requests
    const mockRequests: ServiceRequest[] = [
      {
        id: '1',
        farmerId: user?.id || '1',
        farmerName: user?.name || 'John Farmer',
        serviceId: 'tractor-001',
        serviceTitle: 'John Deere Tractor Rental',
        providerId: 'provider-1',
        providerName: 'AgriEquip Services',
        status: 'accepted',
        location: 'Kumasi, Ashanti Region',
        dateNeeded: '2025-01-15',
        message: 'Need tractor for land preparation',
        price: 150,
        createdAt: '2025-01-10T10:00:00Z',
        updatedAt: '2025-01-10T14:30:00Z',
      },
      {
        id: '2',
        farmerId: user?.id || '1',
        farmerName: user?.name || 'John Farmer',
        serviceId: 'repair-001',
        serviceTitle: 'Irrigation System Repair',
        providerId: 'provider-2',
        providerName: 'Farm Tech Solutions',
        status: 'in-progress',
        location: 'Tamale, Northern Region',
        dateNeeded: '2025-01-12',
        message: 'Irrigation pump not working properly',
        price: 80,
        createdAt: '2025-01-08T09:00:00Z',
        updatedAt: '2025-01-12T08:00:00Z',
        escrowStatus: 'funded',
        escrowId: 'escrow-123',
      },
      {
        id: '3',
        farmerId: user?.id || '1',
        farmerName: user?.name || 'John Farmer',
        serviceId: 'advisory-001',
        serviceTitle: 'Crop Advisory Session',
        providerId: 'provider-3',
        providerName: 'Dr. Kwame Asante',
        status: 'completed',
        location: 'Tamale, Northern Region',
        dateNeeded: '2025-01-05',
        message: 'Need advice on pest management',
        price: 200,
        createdAt: '2025-01-05T09:00:00Z',
        updatedAt: '2025-01-05T16:00:00Z',
        escrowStatus: 'released',
        escrowId: 'escrow-456',
        canReview: true, // This service can be reviewed
      },
    ];
    setActiveRequests(mockRequests);
  }, [user]);

  const handleRaiseDispute = (request: any) => {
    setSelectedEscrow({
      id: request.escrowId,
      amount: request.price,
    });
    setShowDisputeModal(true);
  };

  const handleDisputeCreated = () => {
    // Refresh requests or update status
    console.log('Dispute created successfully');
    refreshStats(); // Refresh stats when dispute is created
  };

  const handleReviewService = (request: any) => {
    setSelectedBookingForReview({
      id: request.id,
      serviceTitle: request.serviceTitle,
      providerName: request.providerName,
      providerId: request.providerId,
      farmerId: request.farmerId,
      serviceId: request.serviceId,
    });
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    // Refresh the requests to update the UI
    refreshStats();
  };

  const handleBookingComplete = () => {
    refreshStats(); // Refresh stats when booking is completed
  };

  const getStatusIcon = (status: ServiceRequest['status']) => {
    switch (status) {
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
            {activeRequests.length === 0 ? (
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
                {activeRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          {request.serviceTitle.includes('Tractor') ? (
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
                        <span className="text-sm">₵{request.price}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-gray-600 text-sm">{request.message}</p>
                      <div className="flex space-x-2">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Chat
                        </button>
                        {request.escrowStatus && (
                          <EscrowStatusBadge 
                            status={request.escrowStatus} 
                            amount={request.price}
                          />
                        )}
                        {request.escrowStatus === 'funded' && (
                          <button 
                            onClick={() => handleRaiseDispute(request)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                          >
                            Report Issue
                          </button>
                        )}
                        {request.status === 'completed' && (
                          <>
                            {request.canReview && (
                              <button 
                                onClick={() => handleReviewService(request)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                              >
                                Rate Service
                              </button>
                            )}
                          </>
                        )}
                      </div>
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
          farmerId={user?.id || ''}
          amount={selectedEscrow.amount}
          onClose={() => setShowDisputeModal(false)}
          onDisputeCreated={handleDisputeCreated}
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