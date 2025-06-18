
const SidebarAd = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="text-center">
        <div className="w-full h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 shadow-inner">
          <span className="text-white text-sm font-semibold tracking-wide">PREMIUM AD SPACE</span>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-800">Featured Content</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Your advertisement could be here. Reach thousands of users exploring ZIP files daily.
          </p>
          <div className="pt-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              300×250 Format
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarAd;
