import React, { useState } from 'react';
import { UserPlus, Copy, Check, Loader, Clock } from 'lucide-react';
import { useUserSession } from '../../contexts/UserSessionContext';

export const AdminInviteGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const { user } = useUserSession();

  const generateInvite = async () => {
    setLoading(true);
    setError('');

    try {
      if (!user?.id) {
        throw new Error('You must be logged in as an administrator to generate invite links.');
      }

      if (user.role !== 'admin') {
        throw new Error('Only administrators can generate invite links.');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-admin-invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate invite');
      }

      setInviteUrl(data.invite_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invite');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <UserPlus className="w-6 h-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Generate Admin Invite</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Create a secure invite link for new administrators. The link will be valid for 24 hours.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={generateInvite}
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                Generate Invite Link
              </>
            )}
          </button>

          {inviteUrl && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Admin Invite Link</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  Expires in 24 hours
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inviteUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mt-2">
                Share this link with the person you want to make an administrator. 
                They will need to complete phone verification to activate their account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};