
const InlineAd = () => {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 my-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-semibold">AD</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-800 mb-1">Sponsored Content</h4>
            <p className="text-xs text-gray-600 leading-relaxed mb-2">
              Discover amazing tools and services that enhance your file management experience.
            </p>
            <div className="flex items-center space-x-2">
              <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                728×90 Banner
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-500">Learn More</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:block w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-400 rounded-lg opacity-20"></div>
      </div>
    </div>
  );
};

export default InlineAd;
