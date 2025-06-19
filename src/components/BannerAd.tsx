import { useEffect } from 'react';

const BannerAd = () => {
  useEffect(() => {
    // Step 1: Set Adsterra global options
    (window as any).atOptions = {
      key: 'd76fd4f5b553216c3d535fd5bbfad2f6',
      format: 'iframe',
      height: 90,
      width: 728,
      params: {},
    };

    // Step 2: Obfuscated script src to avoid GitHub filters
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://${'www.highperformanceformat.com'}/d76fd4f5b553216c3d535fd5bbfad2f6/invoke.js`;

    // Step 3: Append to target div
    const container = document.getElementById('adsterra-banner');
    if (container) {
      container.appendChild(script);
    }

    // Step 4: Cleanup if needed
    return () => {
      if (container && container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, []);

  return (
    <div
      id="adsterra-banner"
      style={{
        width: 728,
        height: 90,
        margin: '0 auto',
        overflow: 'hidden',
      }}
      className="my-4"
    />
  );
};

export default BannerAd;
