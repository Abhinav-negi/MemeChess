'use client';

import { useEffect, useRef } from 'react';

/**
 * MemeOverlay Component
 * Displays a meme video on top of a specific chess square
 * Supports multiple simultaneous memes (checkmate, stalemate, etc.)
 */
export default function MemeOverlay({ 
  memeData,      // {videoUrl, square, reason}
  onComplete,    // Callback when video finishes
  boardSize,     // Width of the chess board in pixels
}) {
  const videoRef = useRef(null);

  // Auto-play and handle completion
// Auto-play and handle completion
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  let hasCompleted = false; // Prevent double-calling onComplete

  const completeOnce = () => {
    if (!hasCompleted) {
      hasCompleted = true;
      onComplete();
    }
  };

  const handleCanPlay = () => {
    video.play().catch(err => {
      console.error('Video play failed:', err);
      completeOnce();
    });
  };

  const handleEnded = () => {
    console.log('🎬 Meme video ended naturally:', memeData.reason);
    completeOnce();
  };

  const handleError = (e) => {
    console.error('❌ Video loading error:', e);
    completeOnce(); // Skip meme, continue game
  };

  // ✅ HARD TIMEOUT: Force stop after 4 seconds
  const forceTimeout = setTimeout(() => {
    if (video && !video.ended) {
      console.log('⏱️ 4-second timeout - stopping video:', memeData.reason);
      video.pause();
      completeOnce();
    }
  }, 4000);

  video.addEventListener('canplay', handleCanPlay);
  video.addEventListener('ended', handleEnded);
  video.addEventListener('error', handleError);

  // Preload the video
  video.load();

  return () => {
    clearTimeout(forceTimeout);
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
      {/* Video element - clean UI, no spinners */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-lg shadow-2xl"
        muted={false}
        playsInline
        preload="auto"
      >
        <source src={memeData.videoUrl} type="video/mp4" />
      </video>
    </div>
  );
}