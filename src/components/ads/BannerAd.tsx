
const BannerAd = () => {
  return (
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center">
          <div className="bg-white rounded-lg px-6 py-3 border border-gray-300 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">AD</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Advertisement Space</p>
                <p className="text-xs text-gray-500">Banner ad placement - 728x90</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerAd;
