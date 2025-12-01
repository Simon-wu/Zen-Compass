import { useRef, useCallback, useEffect } from 'react';

export const useFeedback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastHapticTime = useRef<number>(0);

  // Helper function to safely resume audio context
  const resumeAudioContext = useCallback(async () => {
    const ctx = audioContextRef.current;
    if (ctx && (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted')) {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('Failed to resume audio context:', err);
      }
    }
  }, []);

  // Initialize Audio Context (must be called after user gesture)
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContext();
      }
    }
    resumeAudioContext();
  }, [resumeAudioContext]);

  // Watch for visibility changes and user interactions to keep audio alive
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resumeAudioContext();
      }
    };

    // iOS often requires a user interaction to resume audio after a lock screen
    // We bind to a generic touchstart to wake it up immediately if the visibility change failed
    const handleInteraction = () => {
       resumeAudioContext();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('click', handleInteraction, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, [resumeAudioContext]);

  // Synthesize a short mechanical "tick" sound
  const playClick = useCallback((strength: 'light' | 'medium' | 'heavy' = 'light') => {
    // If context doesn't exist, try to init it (though strictly this needs user gesture)
    if (!audioContextRef.current) {
         const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
         if (AudioContextClass) {
            audioContextRef.current = new AudioContext();
         }
    }

    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Try to resume if suspended (best effort)
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {}); 
    }

    // If still suspended (e.g. browser blocked auto-resume), we can't play sound yet
    if (ctx.state !== 'running') return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Mechanical click sound profile
    if (strength === 'heavy') {
      // North crossing - deeper thud
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    } else {
      // Regular tick - higher, lighter
      osc.type = 'sine';
      osc.frequency.setValueAtTime(strength === 'medium' ? 800 : 1200, ctx.currentTime);
      gainNode.gain.setValueAtTime(strength === 'medium' ? 0.05 : 0.02, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    }

    // Filter to dampen the sound for a "quality" feel
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, []);

  // Haptic feedback wrapper
  const triggerHaptic = useCallback((pattern: 'light' | 'medium' | 'heavy') => {
    // Throttle haptics slightly
    const now = Date.now();
    if (now - lastHapticTime.current < 50) return;
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      switch (pattern) {
        case 'heavy':
          navigator.vibrate(40); // North crossing
          break;
        case 'medium':
          navigator.vibrate(15); // Cardinal crossing
          break;
        case 'light':
          navigator.vibrate(5); // Degree tick (Android only mostly)
          break;
      }
    }
    lastHapticTime.current = now;
  }, []);

  return { initAudio, playClick, triggerHaptic };
};