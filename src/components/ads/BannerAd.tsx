import { useEffect } from 'react';

const BannerAd = () => {
  useEffect(() => {
    // 1. Set up Adsterra options BEFORE loading the script
    (window as any).atOptions = {
      key: 'd76fd4f5b553216c3d535fd5bbfad2f6',
      format: 'iframe',
      height: 90,
      width: 728,
      params: {}
    };

    // 2. Create and load the Adsterra script dynamically
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.highperformanceformat.com/d76fd4f5b553216c3d535fd5bbfad2f6/invoke.js';
    script.async = true;

    // 3. Append to the ad container
    const container = document.getElementById('adsterra-banner');
    if (container) container.appendChild(script);

    // Optional cleanup
    return () => {
      if (container && script.parentNode === container) {
        container.removeChild(script);
      }
    };
  }, []);

  return (
    <div
      id="adsterra-banner"
      style={{ width: 728, height: 90, margin: '0 auto' }}
    />
  );
};

export default BannerAd;
