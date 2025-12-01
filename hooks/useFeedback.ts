import { useRef, useCallback } from 'react';

export const useFeedback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastHapticTime = useRef<number>(0);

  // Initialize Audio Context (must be called after user gesture)
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContext();
      }
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // Synthesize a short mechanical "tick" sound
  const playClick = useCallback((strength: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
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
    
    if (navigator.vibrate) {
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