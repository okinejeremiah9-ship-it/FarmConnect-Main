import React, { useState, useEffect } from 'react';
import { Star, User, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient'; // ✅ make sure this path is correct

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_id: string;
  reviewee_id: string;
  services?: {
    title: string;
    category: string;
  };
  reviewer?: {
    full_name?: string;
    name?: string;
  };
}

interface UserReviewsProps {
  userId: string; // Provider’s ID
  userName?: string;
}

export const UserReviews: React.FC<UserReviewsProps> = ({ userId, userName }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ Fetch reviews on mount and subscribe for real-time updates
  useEffect(() => {
    fetchReviews();

    const channel = supabase
      .channel('realtime-reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        (payload) => {
          console.log('Realtime event received:', payload);
          fetchReviews(); // Refresh reviews on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ✅ Fetch reviews directly from Supabase
  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select(
        `id, rating, comment, created_at, reviewer_id, reviewee_id,
         services (title, category),
         reviewer:users!reviews_reviewer_id_fkey (full_name)`
      )
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Compute rating stats
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    data.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      totalRating += r.rating;
    });

    setReviews(data || []);
    setRatingDistribution(distribution);
    setAverageRating(data.length > 0 ? totalRating / data.length : 0);
    setLoading(false);
  };

  // ✅ Allow logged-in farmers to submit reviews
  const submitReview = async (rating: number, comment: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;
    if (!currentUser) {
      alert('You must log in to post a review.');
      return;
    }

    const { error } = await supabase.from('reviews').insert({
      reviewee_id: userId,
      reviewer_id: currentUser.id,
      rating,
      comment,
    });

    if (error) {
      console.error('Error submitting review:', error);
    } else {
      fetchReviews(); // Refresh
    }
  };

  // ⭐ Star renderer
  const renderStars = (rating: number) => (
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

  // 📅 Date formatter
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  // 🌀 Loading State
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="animate-pulse text-gray-500">Loading reviews...</p>
      </div>
    );
  }

  // ⚠️ Error State
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-red-600">
        Error loading reviews: {error}
      </div>
    );
  }

  // ✅ UI Rendering
  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Reviews for {userName || 'Provider'}
        </h3>

        <div className="flex items-center mb-3">
          {renderStars(Math.round(averageRating))}
          <span className="ml-2 text-xl font-semibold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
          <span className="ml-2 text-gray-600">
            ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
          </span>
        </div>

        {/* Rating Distribution */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Rating Breakdown</h4>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center text-sm mb-1">
              <span className="w-3 text-gray-600">{rating}</span>
              <Star className="w-3 h-3 text-yellow-400 fill-current mx-1" />
              <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${
                      reviews.length > 0
                        ? (ratingDistribution[rating] / reviews.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="w-6 text-gray-600 text-right">
                {ratingDistribution[rating] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="p-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h4>
            <p className="text-gray-600">This provider hasn't received any reviews.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-none">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center mb-1">
                      {renderStars(review.rating)}
                      <span className="ml-2 font-medium text-gray-900">
                        {review.reviewer?.full_name || review.reviewer_id}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(review.created_at)}
                      {review.services?.title && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{review.services.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {review.comment && <p className="text-gray-700">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
