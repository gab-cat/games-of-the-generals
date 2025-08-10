import { useEffect, useState } from "react";

interface ImageBackgroundProps {
  overlayOpacity?: number;
  className?: string;
  leftFeatherOnly?: boolean;
}

export default function ImageBackground({ overlayOpacity = 0.5, className = "", leftFeatherOnly = false }: ImageBackgroundProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => {
      console.warn("Failed to load main background image, falling back to gradient");
      setImageLoaded(false);
    };
    img.src = "/main-bg.webp";
  }, []);

  return (
    <div className={`w-full h-full relative overflow-hidden ${className}`}>
      {/* Background Image */}
      {imageLoaded ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/main-bg.webp")',
          }}
        />
      ) : (
        // Fallback gradient background
        <div className="absolute inset-0 bg-gradient-to-br from-amber-800 via-orange-900 to-amber-900" />
      )}
      
      {/* Black transparent overlay with optional left feather */}
      {leftFeatherOnly ? (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to right, rgba(0,0,0,${overlayOpacity * 1.2}) 0%, rgba(0,0,0,${overlayOpacity * 0.8}) 60%, rgba(0,0,0,${overlayOpacity * 0.3}) 100%)`,
          }}
        />
      ) : (
        <div 
          className="absolute inset-0 bg-black pointer-events-none"
          style={{
            opacity: overlayOpacity,
          }}
        />
      )}
    </div>
  );
}
