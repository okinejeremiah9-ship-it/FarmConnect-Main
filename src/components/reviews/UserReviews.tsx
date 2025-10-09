import React, { useState, useEffect } from 'react';
import { Star, User, Calendar } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    id: string;
    name: string;
  };
  service: {
    title: string;
    category: string;
  };
}

interface UserReviewsProps {
  userId: string;
  userName?: string;
}

export const UserReviews: React.FC<UserReviewsProps> = ({ userId, userName }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [ratingDistribution, setRatingDistribution] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserReviews();
  }, [userId]);

  const fetchUserReviews = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-reviews/${userId}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      setUserInfo(data.user);
      setReviews(data.reviews);
      setRatingDistribution(data.ratingDistribution);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center text-red-600">
          <p>Error loading reviews: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Reviews for {userName || userInfo?.name}
        </h3>
        
        {userInfo && (
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className="flex items-center mr-2">
                {renderStars(Math.round(userInfo.averageRating))}
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {userInfo.averageRating.toFixed(1)}
              </span>
              <span className="text-gray-600 ml-2">
                ({userInfo.totalReviews} review{userInfo.totalReviews !== 1 ? 's' : ''})
              </span>
            </div>
          </div>
        )}

        {/* Rating Distribution */}
        {userInfo && userInfo.totalReviews > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Rating Distribution</h4>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center text-sm">
                  <span className="w-3 text-gray-600">{rating}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-current mx-1" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${userInfo.totalReviews > 0 
                          ? (ratingDistribution[rating] / userInfo.totalReviews) * 100 
                          : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="w-8 text-gray-600 text-right">
                    {ratingDistribution[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="p-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h4>
            <p className="text-gray-600">This user hasn't received any reviews.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center mb-2">
                      {renderStars(review.rating)}
                      <span className="ml-2 font-medium text-gray-900">
                        {review.reviewer.name}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(review.created_at)}
                      <span className="mx-2">•</span>
                      <span>{review.service.title}</span>
                    </div>
                  </div>
                </div>
                
                {review.comment && (
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};