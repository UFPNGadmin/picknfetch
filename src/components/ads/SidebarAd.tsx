import { useEffect } from 'react';

const SidebarAd = () => {
  useEffect(() => {
    (window as any).atOptions = {
      key: '12f8afa438cd9c820be7ba3d998a3d2f',
      format: 'iframe',
      height: 250,
      width: 300,
      params: {},
    };

    const script = document.createElement('script');
    script.src = 'https://www.highperformanceformat.com/12f8afa438cd9c820be7ba3d998a3d2f/invoke.js';
    script.async = true;
    script.type = 'text/javascript';

    const container = document.getElementById('adsterra-sidebar');
    if (container) container.appendChild(script);

    return () => {
      if (container && container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, []);

  return (
    <div
      id="adsterra-sidebar"
      style={{ width: 300, height: 250, margin: '0 auto', overflow: 'hidden' }}
      className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
    />
  );
};

export default SidebarAd;
