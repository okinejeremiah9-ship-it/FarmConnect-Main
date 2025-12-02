export const SkeletonServiceCard = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse overflow-hidden">
      <div className="h-48 bg-gray-200 w-full"></div>

      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};
