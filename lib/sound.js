'use client';

import { useSyncExternalStore } from 'react';

// Two per-browser settings: `muted` silences everything (effects, memes, music);
// `music` toggles only the background track. Music pauses while memes play.
const KEYS = { muted: 'memechess:muted', music: 'memechess:music' };
const MUSIC_VOLUME = 0.25;

const state = { muted: false, music: true };
const listeners = new Set();
const cache = {};
let musicEl = null;
let ducked = false; // a meme is playing

if (typeof window !== 'undefined') {
  try {
    state.muted = localStorage.getItem(KEYS.muted) === '1';
    state.music = localStorage.getItem(KEYS.music) !== '0';
  } catch {}
}

function set(key, value) {
  state[key] = value;
  try {
    localStorage.setItem(KEYS[key], value ? '1' : '0');
  } catch {}
  syncMusic();
  listeners.forEach((l) => l());
}

export const setMuted = (v) => set('muted', v);
export const setMusic = (v) => set('music', v);

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const useMuted = () => useSyncExternalStore(subscribe, () => state.muted, () => false);
export const useMusic = () => useSyncExternalStore(subscribe, () => state.music, () => true);

export function playSound(name) {
  if (state.muted || typeof window === 'undefined') return;
  cache[name] ??= new Audio(`/sounds/${name}.mp3`);
  const audio = cache[name];
  audio.currentTime = 0;
  audio.play().catch(() => {}); // autoplay can be blocked before the first click
}

function syncMusic() {
  if (typeof window === 'undefined') return;
  const shouldPlay = state.music && !state.muted && !ducked;
  if (!shouldPlay) {
    musicEl?.pause();
    return;
  }
  if (!musicEl) {
    musicEl = new Audio('/sounds/background-music.mp3');
    musicEl.loop = true;
    musicEl.volume = MUSIC_VOLUME;
  }
  musicEl.play().catch(() => {}); // retried on the next user gesture
}

/** Browsers only allow audio after a user gesture: start music on the first one. */
export function startMusicOnFirstGesture() {
  const start = () => syncMusic();
  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('keydown', start, { once: true });
  return () => {
    window.removeEventListener('pointerdown', start);
    window.removeEventListener('keydown', start);
  };
}

/** Memes have their own audio: pause the music while they play. */
export function setMemePlaying(playing) {
  if (ducked === playing) return;
  ducked = playing;
  syncMusic();
}
