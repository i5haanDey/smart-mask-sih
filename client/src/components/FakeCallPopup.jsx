import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, User, Volume2 } from 'lucide-react';

const CALLERS = [
  { name: 'Arun K.', order: '#4521', platform: 'Zomato' },
  { name: 'Priya S.', order: '#8834', platform: 'Swiggy' },
  { name: 'Vikram M.', order: '#1290', platform: 'Dunzo' },
  { name: 'Meera R.', order: '#6653', platform: 'Zomato' },
];

export default function FakeCallPopup() {
  const [status, setStatus] = useState('idle'); // idle | ringing | active | rejected
  const [caller, setCaller] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [ringAnim, setRingAnim] = useState(false);
  const timerRef = useRef(null);
  const rejectTimeout = useRef(null);

  // Listen for voice commands
  useEffect(() => {
    const handler = (e) => {
      const cmd = e.detail?.command;
      if (cmd === 'accept' && status === 'ringing') {
        setStatus('active');
        setElapsed(0);
      } else if (cmd === 'reject' && status === 'ringing') {
        setStatus('rejected');
        rejectTimeout.current = setTimeout(() => setStatus('idle'), 2000);
      } else if (cmd === 'reject' && status === 'active') {
        setStatus('idle');
        clearInterval(timerRef.current);
      }
    };
    window.addEventListener('voice-command', handler);
    return () => window.removeEventListener('voice-command', handler);
  }, [status]);

  // Listen for voice transcripts
  useEffect(() => {
    const handler = (e) => {
      const text = e.detail?.text;
      if (text && status !== 'idle') {
        setTranscript(text);
      }
    };
    window.addEventListener('voice-transcript', handler);
    return () => window.removeEventListener('voice-transcript', handler);
  }, [status]);

  // Listen for fake call trigger
  useEffect(() => {
    const handler = () => {
      const c = CALLERS[Math.floor(Math.random() * CALLERS.length)];
      setCaller(c);
      setStatus('ringing');
      setTranscript('');
    };
    window.addEventListener('fake-call-trigger', handler);
    return () => window.removeEventListener('fake-call-trigger', handler);
  }, []);

  // Ring animation
  useEffect(() => {
    if (status !== 'ringing') { setRingAnim(false); return; }
    const i = setInterval(() => setRingAnim(p => !p), 800);
    return () => clearInterval(i);
  }, [status]);

  // Active call timer
  useEffect(() => {
    if (status !== 'active') { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [status]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleAccept = () => {
    if (status === 'ringing') {
      setStatus('active');
      setElapsed(0);
    }
  };

  const handleReject = () => {
    if (status === 'ringing' || status === 'active') {
      setStatus('rejected');
      clearInterval(timerRef.current);
      rejectTimeout.current = setTimeout(() => setStatus('idle'), 2000);
    }
  };

  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4">

        {/* REJECTED */}
        {status === 'rejected' && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center">
              <PhoneOff size={36} className="text-white" />
            </div>
            <p className="text-xl font-semibold text-white">Call Rejected</p>
            <p className="text-sm text-gray-400">{caller?.name} - {caller?.platform}</p>
          </div>
        )}

        {/* RINGING */}
        {status === 'ringing' && (
          <div className="flex flex-col items-center gap-5 animate-fade-in">
            {/* Caller Avatar */}
            <div className="relative">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl transition-shadow duration-700 ${ringAnim ? 'shadow-cyan-400/60 shadow-[0_0_60px_rgba(34,211,238,0.4)]' : 'shadow-cyan-400/20'}`}>
                <User size={44} className="text-white" />
              </div>
              {/* Ripple rings */}
              <div className={`absolute inset-0 rounded-full border-2 border-cyan-400/40 ${ringAnim ? 'animate-ping' : ''}`} style={{ animationDuration: '1.6s' }} />
              <div className={`absolute inset-0 rounded-full border border-cyan-400/20 ${ringAnim ? 'animate-ping' : ''}`} style={{ animationDuration: '2.4s' }} />
            </div>

            {/* Caller Info */}
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{caller?.name}</p>
              <p className="text-sm text-cyan-400 mt-1">{caller?.platform} • Order {caller?.order}</p>
              <p className="text-xs text-gray-500 mt-2">Incoming call...</p>
            </div>

            {/* Accept / Reject Buttons */}
            <div className="flex items-center gap-10 mt-4">
              <button
                onClick={handleReject}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg shadow-red-600/30 transition active:scale-90"
              >
                <PhoneOff size={28} className="text-white" />
              </button>
              <button
                onClick={handleAccept}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center shadow-lg shadow-green-500/30 transition active:scale-90 animate-pulse"
                style={{ animationDuration: '1.5s' }}
              >
                <Phone size={28} className="text-white" />
              </button>
            </div>

            {/* Voice hint */}
            <p className="text-[11px] text-gray-500 mt-2">Say <span className="text-green-400 font-medium">"accept"</span> or <span className="text-red-400 font-medium">"reject"</span></p>

            {/* Live Transcript Box */}
            <div className="w-full mt-2 bg-gray-900/80 rounded-xl border border-gray-700/50 p-3 min-h-[60px]">
              <div className="flex items-center gap-2 mb-1.5">
                <Mic size={12} className="text-cyan-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Voice Transcript</span>
              </div>
              {transcript ? (
                <p className="text-sm text-white/90 leading-relaxed">{transcript}</p>
              ) : (
                <p className="text-xs text-gray-600 italic">Listening for commands...</p>
              )}
            </div>
          </div>
        )}

        {/* ACTIVE CALL */}
        {status === 'active' && (
          <div className="flex flex-col items-center gap-5 animate-fade-in">
            {/* Caller Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30">
              <User size={44} className="text-white" />
            </div>

            {/* Caller Info + Timer */}
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{caller?.name}</p>
              <p className="text-sm text-green-400 mt-1">{caller?.platform} • Order {caller?.order}</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-lg font-mono text-green-400 font-semibold">{formatTime(elapsed)}</p>
              </div>
            </div>

            {/* End Call Button */}
            <button
              onClick={handleReject}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg shadow-red-600/30 transition active:scale-90 mt-2"
            >
              <PhoneOff size={28} className="text-white" />
            </button>

            {/* Live Transcript */}
            <div className="w-full mt-2 bg-gray-900/80 rounded-xl border border-green-500/20 p-3 min-h-[80px]">
              <div className="flex items-center gap-2 mb-1.5">
                <Volume2 size={12} className="text-green-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Live Transcript</span>
              </div>
              {transcript ? (
                <p className="text-sm text-white/90 leading-relaxed">{transcript}</p>
              ) : (
                <p className="text-xs text-gray-600 italic">Speak to see your words here...</p>
              )}
            </div>

            <p className="text-[11px] text-gray-500">Say <span className="text-red-400 font-medium">"reject"</span> to end call</p>
          </div>
        )}
      </div>
    </div>
  );
}
