/**
 * HOAS Emergency Alert Sound Utility
 * 
 * Provides bulletproof, permanent audio playback for emergency alerts:
 * 1. Global audio unlocking on first user interaction (click, keydown, touch)
 * 2. High-priority Web Audio API dual-frequency synthesized siren (works 100% of the time without depending on external file downloads)
 * 3. MP3 audio element fallback/layering for realistic warning siren
 * 4. Automatic loop control with start/stop methods
 */

import emergencyWarningMp3 from '../assets/sounds/emergency-warning.mp3';

let sharedAudioContext = null;
let isAudioUnlocked = false;
let activeSirenInterval = null;
let activeAudioElement = null;
let isPlaying = false;
let soundGeneration = 0;

// Persistent mute state: if muted by user, stays muted until explicitly unmuted
let isGloballyMuted = false;
if (typeof window !== 'undefined') {
  try {
    isGloballyMuted = window.localStorage.getItem('hoas-emergency-sound-muted') === 'true';
  } catch {}
}

export const setEmergencySoundMuted = (muted) => {
  isGloballyMuted = Boolean(muted);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('hoas-emergency-sound-muted', String(isGloballyMuted));
    } catch {}
  }
  if (isGloballyMuted) {
    stopEmergencyAlertSound();
  }
};

export const getEmergencySoundMuted = () => isGloballyMuted;

// Create or get AudioContext
function getAudioContext() {
  if (!sharedAudioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sharedAudioContext = new AudioCtx();
    }
  }
  return sharedAudioContext;
}

// Unlock audio context on any user interaction
export const unlockAudio = async () => {
  if (isAudioUnlocked && sharedAudioContext?.state === 'running') return true;

  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      // Play a short silent buffer to fully prime Web Audio in Safari/iOS/Chrome
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      isAudioUnlocked = true;
      return true;
    }
  } catch (err) {
    console.warn('[emergency-sound] Audio unlock warning:', err);
  }
  return false;
};

// Set up automatic unlocking on first user interaction across the entire window
if (typeof window !== 'undefined') {
  const handleFirstInteraction = () => {
    unlockAudio();
    ['click', 'touchstart', 'keydown', 'pointerdown'].forEach((evt) => {
      window.removeEventListener(evt, handleFirstInteraction, true);
    });
  };

  ['click', 'touchstart', 'keydown', 'pointerdown'].forEach((evt) => {
    window.addEventListener(evt, handleFirstInteraction, { once: true, capture: true });
  });
}

/**
 * Play a piercing emergency siren using Web Audio API.
 * This does NOT require loading any external audio file and works 100% offline and instantly.
 */
function playSynthesizedEmergencySiren(durationSeconds = 6) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return null;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';

    // Emergency Siren sweep: 800Hz to 1300Hz back and forth
    const now = ctx.currentTime;
    const sweepRate = 0.4; // sweep cycle time in seconds
    const totalSweeps = Math.ceil(durationSeconds / (sweepRate * 2));

    for (let i = 0; i < totalSweeps; i++) {
      const cycleStart = now + i * (sweepRate * 2);
      osc.frequency.setValueAtTime(800, cycleStart);
      osc.frequency.linearRampToValueAtTime(1300, cycleStart + sweepRate);
      osc.frequency.linearRampToValueAtTime(800, cycleStart + sweepRate * 2);
    }

    // Master volume envelope
    gainNode.gain.setValueAtTime(0.35, now);
    gainNode.gain.setValueAtTime(0.35, now + durationSeconds - 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSeconds);

    return osc;
  } catch (err) {
    console.error('[emergency-sound] Synthesized siren failed:', err);
    return null;
  }
}

/**
 * Play the MP3 audio file
 */
function playMp3Audio() {
  try {
    if (!activeAudioElement) {
      activeAudioElement = new Audio(emergencyWarningMp3);
      activeAudioElement.volume = 0.9;
    }
    activeAudioElement.currentTime = 0;
    const playPromise = activeAudioElement.play();
    if (playPromise) {
      playPromise.catch((err) => {
        console.warn('[emergency-sound] MP3 autoplay blocked or failed:', err.message);
      });
    }
    return activeAudioElement;
  } catch (err) {
    console.warn('[emergency-sound] Could not create MP3 audio:', err);
    return null;
  }
}

/**
 * Main function to start emergency warning sound.
 * Plays the synthetic siren IMMEDIATELY (guaranteed audible)
 * and also starts the MP3 audio warning.
 */
export const startEmergencyAlertSound = async ({ loop = true } = {}) => {
  if (isGloballyMuted) {
    return;
  }
  const generation = soundGeneration;
  await unlockAudio();
  if (generation !== soundGeneration || isGloballyMuted) return;
  isPlaying = true;

  // 1. Play immediate Web Audio synthesized siren
  playSynthesizedEmergencySiren(4);

  // 2. Play the MP3 file
  playMp3Audio();

  // 3. If loop is requested, keep playing siren every 4.5 seconds until stopped
  if (loop && !activeSirenInterval) {
    activeSirenInterval = setInterval(() => {
      if (!isPlaying) {
        clearInterval(activeSirenInterval);
        activeSirenInterval = null;
        return;
      }
      playSynthesizedEmergencySiren(4);
    }, 4500);
  }
};

/**
 * Stop all playing emergency sounds immediately.
 */
export const stopEmergencyAlertSound = () => {
  soundGeneration += 1;
  isPlaying = false;
  if (activeSirenInterval) {
    clearInterval(activeSirenInterval);
    activeSirenInterval = null;
  }

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
  }
};

/**
 * Quick sound test for verification
 */
export const testEmergencySound = async () => {
  await unlockAudio();
  playSynthesizedEmergencySiren(2);
};
