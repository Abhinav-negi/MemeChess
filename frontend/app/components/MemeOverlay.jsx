'use client';

import { useEffect, useRef } from 'react';

/**
 * MemeOverlay Component
 * Displays a meme video on top of a specific chess square
 * Supports board flipping for Black's perspective
 */
export default function MemeOverlay({ 
  memeData,           // {videoUrl, square, reason}
  onComplete,         // Callback when video finishes
  boardSize,          // Width of the chess board in pixels
  boardOrientation = 'white',  // ✅ ADD: 'white' or 'black'
}) {
  const videoRef = useRef(null);

  // Auto-play and handle completion
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hasCompleted = false;

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
      completeOnce();
    };

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
    video.load();

    return () => {
      clearTimeout(forceTimeout);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [memeData, onComplete]);

  if (!memeData) return null;

  // ✅ Calculate square position with board orientation
  const squareSize = boardSize / 8;
  const file = memeData.square.charCodeAt(0) - 'a'.charCodeAt(0); // a=0, b=1, ..., h=7
  const rank = parseInt(memeData.square[1]) - 1; // 1=0, 2=1, ..., 8=7

  // ✅ Flip coordinates if playing as black
  let left, top;
  
  if (boardOrientation === 'black') {
    // Black's perspective: flip both file and rank
    left = (7 - file) * squareSize;
    top = rank * squareSize;
  } else {
    // White's perspective: normal calculation
    left = file * squareSize;
    top = (7 - rank) * squareSize;
  }

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