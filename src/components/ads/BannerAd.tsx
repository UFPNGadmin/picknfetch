import React, { useEffect, useRef } from "react";

const AdsterraBannerAd2 = () => {
  const adContainerRef = useRef(null);

  useEffect(() => {
    window.atOptions = {
      key: "d76fd4f5b553216c3d535fd5bbfad2f6",
      format: "iframe",
      height: 90,
      width: 728,
      params: {}
    };

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "//www.highperformanceformat.com/d76fd4f5b553216c3d535fd5bbfad2f6/invoke.js";
    script.async = true;

    if (adContainerRef.current) {
      adContainerRef.current.innerHTML = "";
      adContainerRef.current.appendChild(script);
    }

    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = "";
      }
      delete window.atOptions;
    };
  }, []);

  return (
    <div
      ref={adContainerRef}
      style={{
        width: 728,
        height: 90,
        margin: "0 auto",
        textAlign: "center",
      }}
    />
  );
};

export default AdsterraBannerAd2;
