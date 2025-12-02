import React from "react";
import { X } from "lucide-react";

interface CompletionReviewModalProps {
  booking: any;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
}

export const CompletionReviewModal: React.FC<CompletionReviewModalProps> = ({
  booking,
  onClose,
  onApprove,
  onReject,
  loading = false,
}) => {

  // ✅ FIX: Support BOTH field names
  const images =
    booking?.completion_images ||
    booking?.completion_photos ||
    [];

  const notes = booking?.completion_notes ?? "";
  const providerName =
    booking?.providerName ||
    booking?.provider_name ||
    "Provider";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-xl p-6 shadow-xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-2">Verify Completed Service</h2>
        <p className="text-gray-600 text-sm mb-4">
          Submitted by <span className="font-semibold">{providerName}</span>
        </p>

        {/* Provider Notes */}
        {notes && (
          <div className="mb-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
            <span className="font-semibold">Provider note:</span> {notes}
          </div>
        )}

        {/* Images Section */}
        <div className="mb-6">
          {images.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No completion photos were uploaded.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {images.map((url: string, index: number) => (
                <div
                  key={index}
                  className="rounded-lg border overflow-hidden bg-gray-100"
                >
                  <img
                    src={url}
                    alt={`completion-${index}`}
                    className="w-full h-40 object-cover cursor-pointer"
                    onClick={() => window.open(url, "_blank")}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approve / Reject Buttons */}
        <div className="mt-4 flex gap-4">
          <button
            disabled={loading}
            onClick={onReject}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Reject Work"}
          </button>

          <button
            disabled={loading}
            onClick={onApprove}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Approve Work"}
          </button>
        </div>

      </div>
    </div>
  );
};
