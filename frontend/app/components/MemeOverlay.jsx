'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * MemeOverlay Component
 * Displays a meme video on top of a specific chess square
 */
export default function MemeOverlay({ 
  memeData,      // {videoUrl, square, reason}
  onComplete,    // Callback when video finishes
  boardSize,     // Width of the chess board in pixels
}) {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-play and handle completion
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      video.play().catch(err => {
        console.error('Video play failed:', err);
      });
    };

    const handleEnded = () => {
      console.log('🎬 Meme video ended:', memeData.reason);
      onComplete();
    };

    const handleError = (e) => {
      console.error('Video loading error:', e);
      onComplete(); // Continue game even if video fails
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Preload the video
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [memeData, onComplete]);

  if (!memeData) return null;

  // Calculate square position on the board
  const squareSize = boardSize / 8;
  const file = memeData.square.charCodeAt(0) - 'a'.charCodeAt(0); // a=0, b=1, ..., h=7
  const rank = 8 - parseInt(memeData.square[1]); // 8=0, 7=1, ..., 1=7

  const left = file * squareSize;
  const top = rank * squareSize;

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${squareSize}px`,
        height: `${squareSize}px`,
      }}
    >
      {/* Loading spinner while video loads */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
          <div className="animate-spin h-8 w-8 border-4 border-yellow-400 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-lg shadow-2xl"
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
        muted={false}
        playsInline
        preload="auto"
      >
        <source src={memeData.videoUrl} type="video/mp4" />
      </video>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-6 left-0 text-xs text-yellow-400 bg-black px-2 py-1 rounded">
          {memeData.reason} @ {memeData.square}
        </div>
      )}
    </div>
  );
}