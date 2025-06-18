import React, { useEffect, useRef } from "react";

const SidebarAdsterra = () => {
  const adRef = useRef(null);

  useEffect(() => {
    window.atOptions = {
      key: "12f8afa438cd9c820be7ba3d998a3d2f",
      format: "iframe",
      height: 250,
      width: 300,
      params: {},
    };

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "//www.highperformanceformat.com/12f8afa438cd9c820be7ba3d998a3d2f/invoke.js";
    script.async = true;

    if (adRef.current) {
      adRef.current.innerHTML = ""; // clear any previous content
      adRef.current.appendChild(script);
    }

    return () => {
      if (adRef.current) adRef.current.innerHTML = "";
      delete window.atOptions;
    };
  }, []);

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
          <div className="pt-2 flex justify-center">
            <div
              ref={adRef}
              style={{ width: 300, height: 250 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarAdsterra;
