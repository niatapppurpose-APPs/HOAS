import { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Volume2, X } from 'lucide-react';
import emergencyWarning from '../../assets/sounds/emergency-warning-opt.m4a';

const playAlert = (audioRef, repeatCount = 3) => {
  try {
    // Play the emergency warning audio file
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error('Audio playback failed:', err);
        // Fallback to synthetic alert if audio file fails
        playSyntheticAlert(repeatCount);
      });
    }
  } catch (err) {
    console.error('Alert sound failed:', err);
    playSyntheticAlert(repeatCount);
  }
};

const playSyntheticAlert = (repeatCount = 3) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const pattern = [
      { freq: 1047, duration: 0.15 }, // High C
      { freq: 0, duration: 0.1 },     // silence
      { freq: 1047, duration: 0.15 }, // High C
      { freq: 0, duration: 0.1 },     // silence
      { freq: 1320, duration: 0.2 },  // High E (urgent)
    ];

    const schedulePattern = (repeat) => {
      let time = audioContext.currentTime;
      for (let r = 0; r < repeat; r++) {
        pattern.forEach(({ freq, duration }) => {
          if (freq > 0) {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
            osc.start(time);
            osc.stop(time + duration);
          }
          time += duration;
        });
      }
    };

    schedulePattern(repeatCount);
  } catch (err) {
    console.error('Synthetic alert sound failed:', err);
  }
};

const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

const HighAlertNotification = ({ studentName, isActive = true, onDismiss }) => {
  const [pulseCount, setPulseCount] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    requestNotificationPermission();
    playAlert(audioRef, 1);

    const handleAudioEnd = () => {
      playAlert(audioRef, 1);
      setPulseCount((c) => c + 1);
    };

    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('ended', handleAudioEnd);
    }

    return () => {
      if (audio) {
        audio.removeEventListener('ended', handleAudioEnd);
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      {/* Hidden audio element for emergency warning sound */}
      <audio ref={audioRef} src={emergencyWarning} preload="none" />

      <div className="relative bottom-0 inset-0 z-50 flex items-start justify-center pt-4">
        <div className="bg-gradient-to-b from-red-600 to-red-700 text-white rounded-2xl shadow-2xl p-6 max-w-md w-11/12">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">EMERGENCY ALERT</h2>
                <p className="text-sm mt-1 opacity-90">Student Request Activated</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 hover:bg-red-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 bg-red-500 bg-opacity-30 rounded-lg p-4">
            <p className="text-lg font-bold">{studentName}</p>
            <p className="text-sm mt-2 opacity-90">Has activated emergency location sharing</p>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm opacity-90">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Sound alert active ({pulseCount} repeats)</span>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full mt-6 bg-white text-red-600 font-bold py-3 rounded-lg hover:bg-opacity-90 transition"
          >
            Acknowledge & View Location
          </button>
        </div>
      </div>
    </>
  );
};

export default HighAlertNotification;
