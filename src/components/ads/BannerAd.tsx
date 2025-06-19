import { useEffect } from 'react';

const BannerAd = () => {
  useEffect(() => {
    // Define the global atOptions object
    (window as any).atOptions = {
      key: 'd76fd4f5b553216c3d535fd5bbfad2f6',
      format: 'iframe',
      height: 90,
      width: 728,
      params: {}
    };

    // Create script element to load external ad script
    const script = document.createElement('script');
    script.src = '//www.highperformanceformat.com/d76fd4f5b553216c3d535fd5bbfad2f6/invoke.js';
    script.async = true;
    document.body.appendChild(script);

    // Cleanup: remove script on unmount
    return () => {
      document.body.removeChild(script);
      delete (window as any).atOptions;
    };
  }, []);

  return (
    <div
      style={{ width: 728, height: 90, margin: '0 auto' }}
      id="adsterra-banner"
    />
  );
};

export default BannerAd;
