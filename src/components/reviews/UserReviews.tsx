import React, { useState, useEffect } from "react";
import { Star, User, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: { name?: string };
  services?: { title: string };
}

export const UserReviews = ({ userId, userName }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();

    const channel = supabase
      .channel("reviews")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, fetchReviews)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  async function fetchReviews() {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `id, rating, comment, created_at,
         reviewer:users!reviews_reviewer_id_fkey (name),
         services (title)`
      )
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data);
      const total = data.reduce((s, r) => s + r.rating, 0);
      setAverageRating(data.length ? total / data.length : 0);
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-bold mb-2">Reviews for {userName}</h3>
      <p className="flex items-center mb-4">
        <span className="font-semibold mr-2">{averageRating.toFixed(1)}</span>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}`} />
        ))}
      </p>

      {reviews.length === 0 ? (
        <p className="text-gray-600">No reviews yet.</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="border-b pb-4 mb-4 last:border-none">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < r.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
              />
            ))}
            <p className="text-sm text-gray-600 mt-1">
              by {r.reviewer?.name || "Unknown"} • {new Date(r.created_at).toLocaleDateString()}
            </p>
            {r.comment && <p className="text-gray-700 mt-2">{r.comment}</p>}
          </div>
        ))
      )}
    </div>
  );
};
