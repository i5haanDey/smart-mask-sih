import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, X, Phone, MapPin } from 'lucide-react';
import { useDeviceMotion } from '../hooks/useDeviceMotion';
import { findNearestPolice } from '../utils/location';

const COUNTDOWN_SECONDS = 10;
const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.2090;

export default function SOSAutoTrigger() {
  const [phase, setPhase] = useState('idle'); // idle, countdown, active, sent
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [location, setLocation] = useState(null);
  const [nearestPolice, setNearestPolice] = useState(null);
  const [accelMag, setAccelMag] = useState(0);
  const audioRef = useRef(null);
  const sirenRef = useRef(null);
  const speechInterval = useRef(null);

  // Get GPS location
  const getLocation = useCallback(() => {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
          () => resolve([DEFAULT_LAT, DEFAULT_LNG]),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        resolve([DEFAULT_LAT, DEFAULT_LNG]);
      }
    });
  }, []);

  // Play spoken message
  const speakMessage = useCallback((lat, lng) => {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance(
      `An accident has occurred at latitude ${lat.toFixed(6)}, longitude ${lng.toFixed(6)}. Please send help immediately. This is an emergency.`
    );
    msg.rate = 0.9;
    msg.pitch = 1.0;

    // Try to find a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('google'));
    if (femaleVoice) msg.voice = femaleVoice;

    msg.onend = () => {
      // Repeat after 2 seconds
      speechInterval.current = setTimeout(() => {
        if (phase === 'active') speakMessage(lat, lng);
      }, 2000);
    };

    window.speechSynthesis.speak(msg);
  }, [phase]);

  // Trigger SOS
  const triggerSOS = useCallback(async (magnitude) => {
    if (phase !== 'idle') return;

    const [lat, lng] = await getLocation();
    setLocation([lat, lng]);

    const police = findNearestPolice(lat, lng);
    setNearestPolice(police);
    setAccelMag(Math.round(magnitude));
    setCountdown(COUNTDOWN_SECONDS);
    setPhase('countdown');
  }, [phase, getLocation]);

  // Impact detection hook
  const { requestPermission } = useDeviceMotion((magnitude) => {
    triggerSOS(magnitude);
  });

  // Countdown timer
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      activateSOS();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // Activate SOS after countdown
  const activateSOS = useCallback(() => {
    setPhase('active');

    // Notify backend
    fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: location?.[0] || DEFAULT_LAT,
        lng: location?.[1] || DEFAULT_LNG,
        nearestPolice: nearestPolice?.name,
        policePhone: nearestPolice?.phone,
      })
    }).catch(() => {});

    // Start speaking
    speakMessage(location?.[0] || DEFAULT_LAT, location?.[1] || DEFAULT_LNG);

    // Auto-dial emergency after 3 seconds
    setTimeout(() => {
      window.open('tel:112', '_self');
    }, 3000);
  }, [location, nearestPolice, speakMessage]);

  // Cancel SOS
  const cancelSOS = useCallback(() => {
    setPhase('idle');
    window.speechSynthesis.cancel();
    if (speechInterval.current) clearTimeout(speechInterval.current);
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  // Voice command listener
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.command === 'cancel-sos' || e.detail?.command === 'cancel') {
        cancelSOS();
      }
    };
    window.addEventListener('voice-command', handler);
    return () => window.removeEventListener('voice-command', handler);
  }, [cancelSOS]);

  // Load voices on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  if (phase === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      style={{ background: phase === 'countdown' ? 'rgba(0,0,0,0.85)' : 'rgba(180,0,0,0.85)' }}>

      {/* Countdown Phase */}
      {phase === 'countdown' && (
        <div className="text-center w-full max-w-sm">
          <div className="mb-6">
            <AlertTriangle size={48} className="mx-auto text-red-400 animate-bounce" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Accident Detected!</h2>
          <p className="text-gray-300 text-sm mb-1">Impact: {accelMag} m/s²</p>
          <p className="text-gray-400 text-xs mb-6">SOS will be sent in {countdown}s</p>

          {/* Countdown circle */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#374151" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="54" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - countdown / COUNTDOWN_SECONDS)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-red-400">{countdown}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={cancelSOS} className="w-full py-3 bg-gray-700 rounded-xl text-sm font-medium hover:bg-gray-600 transition flex items-center justify-center gap-2">
              <X size={18} /> Cancel (Tap or Say "Cancel")
            </button>
            <button onClick={activateSOS} className="w-full py-3 bg-red-600 rounded-xl text-sm font-bold hover:bg-red-500 transition flex items-center justify-center gap-2">
              <AlertTriangle size={18} /> Send SOS Now
            </button>
          </div>
        </div>
      )}

      {/* Active SOS Phase */}
      {phase === 'active' && (
        <div className="text-center w-full max-w-sm">
          <div className="mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <AlertTriangle size={40} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">SOS ACTIVE</h2>
          <p className="text-red-200 text-sm mb-6">Help is on the way</p>

          <div className="bg-white/10 rounded-xl p-4 mb-4 text-left space-y-3">
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-red-300 shrink-0" />
              <div>
                <p className="text-xs text-red-300">Your Location</p>
                <p className="text-sm text-white">{location?.[0]?.toFixed(6)}, {location?.[1]?.toFixed(6)}</p>
              </div>
            </div>
            {nearestPolice && (
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-red-300 shrink-0" />
                <div>
                  <p className="text-xs text-red-300">Nearest Police Station</p>
                  <p className="text-sm text-white">{nearestPolice.name} ({nearestPolice.distance}m away)</p>
                  <p className="text-xs text-red-200">{nearestPolice.phone}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-red-200 text-xs mb-4 animate-pulse">
            Audio message playing... Auto-dialing 112...
          </p>

          <div className="flex gap-3">
            <a href="tel:112" className="flex-1 py-3 bg-green-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <Phone size={18} /> Call 112
            </a>
            <button onClick={cancelSOS} className="flex-1 py-3 bg-white/20 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
              <X size={18} /> Cancel SOS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
