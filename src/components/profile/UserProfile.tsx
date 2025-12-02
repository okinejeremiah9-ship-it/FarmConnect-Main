import React, { useState, useEffect } from "react";
import { useUserSession } from "../../contexts/UserSessionContext"; // ✅ FIXED
import { ProfileEditor } from "./ProfileEditor";
import {
  User,
  MapPin,
  Star,
  CreditCard as Edit,
  Save,
  X,
  Camera,
  Tractor,
  Users,
  Shield,
} from "lucide-react";

interface UserProfileProps {
  userId?: string;
  isOwnProfile?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  isOwnProfile = false,
}) => {
  const { user: currentUser } = useUserSession(); // ✅ FIXED
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const profileUserId = userId || currentUser?.id;

  useEffect(() => {
    if (profileUserId) fetchUserProfile();
  }, [profileUserId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${profileUserId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch profile");

      setUser(data.user);
      setServices(data.services || []);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-profile`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, user_id: profileUserId }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setUser(data.user);
      setEditing(false);
    } catch (error) {
      alert("Failed to update profile");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${
            s <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        Loading profile…
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        <User className="w-12 h-12" />
        <p>User not found.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user.profile_pic ? (
                  <img
                    src={user.profile_pic}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="flex items-center text-gray-600">
                  {user.role}
                  {user.is_verified && (
                    <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      Verified
                    </span>
                  )}
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Edit Profile
              </button>
            )}
          </div>

          {user.total_reviews > 0 && (
            <div className="flex items-center mt-4">
              {renderStars(Math.round(user.rating))}
              <span className="ml-2 text-gray-600">
                {user.rating.toFixed(1)} ({user.total_reviews} reviews)
              </span>
            </div>
          )}

          <div className="mt-4">
            <h3 className="font-medium text-gray-700">Bio</h3>
            <p className="text-gray-600">{user.bio || "No bio provided."}</p>
          </div>

          {user.address && (
            <p className="flex items-center text-gray-600 mt-2">
              <MapPin className="w-4 h-4 mr-1" /> {user.address}
            </p>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">Recent Reviews</h2>
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border-b pb-4 mb-4 last:mb-0 last:border-none"
              >
                {renderStars(review.rating)}
                <p className="text-sm text-gray-600 mt-1">
                  by {review.reviewer?.name || review.reviewer_id} •{" "}
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
                {review.comment && <p className="mt-2">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
