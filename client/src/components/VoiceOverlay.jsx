import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, X, Phone, PhoneOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COMMANDS = {
  'go home': '/',
  'home': '/',
  'go to filter': '/filter',
  'filter': '/filter',
  'open filter': '/filter',
  'go to earnings': '/earnings',
  'earnings': '/earnings',
  'open earnings': '/earnings',
  'go to safety': '/safety',
  'safety': '/safety',
  'open safety': '/safety',
  'go to profile': '/profile',
  'profile': '/profile',
  'open profile': '/profile',
  'accept call': '__ACCEPT_CALL__',
  'accept': '__ACCEPT_CALL__',
  'reject call': '__REJECT_CALL__',
  'reject': '__REJECT_CALL__',
  'decline': '__REJECT_CALL__',
  'sos': '__SOS__',
  'emergency': '__SOS__',
  'help': '__HELP__',
};

export default function VoiceOverlay() {
  const [show, setShow] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [callStatus, setCallStatus] = useState('idle');
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const feedbackTimeout = useRef(null);

  const showFeedback = useCallback((msg) => {
    setFeedback(msg);
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setFeedback(''), 3000);
  }, []);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-IN';

    recognitionRef.current.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const text = last[0].transcript.toLowerCase().trim();
      setTranscript(text);

      if (last.isFinal) {
        // Check commands
        for (const [cmd, action] of Object.entries(COMMANDS)) {
          if (text.includes(cmd)) {
            if (action.startsWith('/')) {
              navigate(action);
              showFeedback(`Navigating to ${cmd}`);
            } else if (action === '__ACCEPT_CALL__') {
              setCallStatus('active');
              showFeedback('Call Accepted');
            } else if (action === '__REJECT_CALL__') {
              setCallStatus('idle');
              showFeedback('Call Rejected');
            } else if (action === '__SOS__') {
              showFeedback('SOS Activated');
              fetch('/api/sos', { method: 'POST' });
            } else if (action === '__HELP__') {
              showFeedback('Say: home, filter, earnings, safety, profile, accept, reject, sos');
            }
            break;
          }
        }
      }
    };

    recognitionRef.current.onerror = () => {
      setListening(false);
    };

    recognitionRef.current.onend = () => {
      if (listening && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch(e) {}
      }
    };
  }, [listening, navigate, showFeedback]);

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      try { recognitionRef.current?.start(); setListening(true); } catch(e) {}
    }
  };

  return (
    <>
      {/* Floating Mic Button */}
      <button
        onClick={() => { setShow(true); toggleListening(); }}
        className={`fixed bottom-24 left-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition active:scale-90 border-2 ${
          listening
            ? 'bg-cyan-600 border-cyan-400 shadow-cyan-600/30 animate-pulse'
            : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
        }`}
      >
        {listening ? <Mic size={24} className="text-white" /> : <MicOff size={24} className="text-gray-400" />}
      </button>

      {/* Voice Overlay */}
      {show && (
        <div className="fixed inset-0 z-[90] bg-black/70 flex items-end p-4">
          <div className="bg-gray-900 rounded-2xl p-4 w-full border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${listening ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'}`} />
                <span className="text-sm font-medium">{listening ? 'Listening...' : 'Voice off'}</span>
              </div>
              <button onClick={() => { recognitionRef.current?.stop(); setListening(false); setShow(false); }} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Call Status */}
            {callStatus === 'active' && (
              <div className="bg-green-900/30 border border-green-500 rounded-xl p-3 mb-3 flex items-center gap-3">
                <Phone size={18} className="text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-400">Call Active</p>
                  <p className="text-xs text-gray-400">Say "reject" to end</p>
                </div>
                <button onClick={() => setCallStatus('idle')} className="p-2 bg-red-600 rounded-full">
                  <PhoneOff size={14} />
                </button>
              </div>
            )}

            {/* Transcript */}
            {transcript && (
              <div className="bg-gray-800 rounded-lg p-2 mb-3">
                <p className="text-xs text-gray-500">Heard:</p>
                <p className="text-sm">{transcript}</p>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className="bg-cyan-900/30 border border-cyan-500 rounded-lg p-2 mb-3">
                <p className="text-sm text-cyan-400 font-medium">{feedback}</p>
              </div>
            )}

            {/* Commands Help */}
            <div className="text-xs text-gray-500">
              <p>Say: <span className="text-gray-300">home</span> | <span className="text-gray-300">filter</span> | <span className="text-gray-300">earnings</span> | <span className="text-gray-300">safety</span> | <span className="text-gray-300">profile</span> | <span className="text-gray-300">accept</span> | <span className="text-gray-300">reject</span> | <span className="text-gray-300">sos</span> | <span className="text-gray-300">help</span></p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
