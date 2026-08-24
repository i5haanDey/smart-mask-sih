import { useEffect, useRef, useCallback, useState } from 'react';
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
  'help me': '__SOS__',
  'cancel sos': '__CANCEL_SOS__',
  'cancel emergency': '__CANCEL_SOS__',
  'cancel': '__CANCEL_SOS__',
  'stop sos': '__CANCEL_SOS__',
  'show offers': '__SHOW_OFFERS__',
  'show map': '__SHOW_MAP__',
  'help': '__HELP__',
};

export default function VoiceAutoStart() {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const [active, setActive] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const pausedRef = useRef(false);

  const showFeedback = useCallback((msg) => {
    setLastCommand(msg);
    setTimeout(() => setLastCommand(''), 2500);
  }, []);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      if (pausedRef.current) return;
      const last = event.results[event.results.length - 1];
      const text = last[0].transcript.toLowerCase().trim();

      window.dispatchEvent(new CustomEvent('voice-transcript', { detail: { text, final: last.isFinal } }));

      if (!last.isFinal) return;

      for (const [cmd, action] of Object.entries(COMMANDS)) {
        if (text.includes(cmd)) {
          if (action.startsWith('/')) {
            navigate(action);
            showFeedback(`Navigating to ${cmd}`);
          } else if (action === '__ACCEPT_CALL__') {
            window.dispatchEvent(new CustomEvent('voice-command', { detail: { command: 'accept' } }));
            showFeedback('Call Accepted');
          } else if (action === '__REJECT_CALL__') {
            window.dispatchEvent(new CustomEvent('voice-command', { detail: { command: 'reject' } }));
            showFeedback('Call Rejected');
          } else if (action === '__SOS__') {
            window.dispatchEvent(new CustomEvent('voice-command', { detail: { command: 'sos' } }));
            showFeedback('SOS Activated');
          } else if (action === '__CANCEL_SOS__') {
            window.dispatchEvent(new CustomEvent('voice-command', { detail: { command: 'cancel-sos' } }));
            showFeedback('SOS Cancelled');
          } else if (action === '__SHOW_OFFERS__') {
            window.dispatchEvent(new CustomEvent('voice-command', { detail: { command: 'show-offers' } }));
            showFeedback('Showing Offers');
          } else if (action === '__SHOW_MAP__') {
            window.dispatchEvent(new CustomEvent('voice-command', { detail: { command: 'show-map' } }));
            showFeedback('Showing Map');
          } else if (action === '__HELP__') {
            showFeedback('Say: home, filter, earnings, safety, profile, accept, reject, sos, show offers, show map');
          }
          break;
        }
      }
    };

    recognition.onerror = () => {
      if (pausedRef.current) return;
      setActive(false);
      setTimeout(() => {
        if (!pausedRef.current) {
          try { recognition.start(); setActive(true); } catch(e) {}
        }
      }, 1000);
    };

    recognition.onend = () => {
      if (pausedRef.current) return;
      setTimeout(() => {
        if (!pausedRef.current) {
          try { recognition.start(); } catch(e) {}
        }
      }, 100);
    };

    const handleMicStart = () => {
      pausedRef.current = true;
      try { recognition.stop(); } catch(e) {}
      setActive(false);
    };

    const handleMicStop = () => {
      pausedRef.current = false;
      setTimeout(() => {
        try { recognition.start(); setActive(true); } catch(e) {}
      }, 200);
    };

    window.addEventListener('mic-start', handleMicStart);
    window.addEventListener('mic-stop', handleMicStop);

    try {
      recognition.start();
      setActive(true);
    } catch(e) {}

    return () => {
      window.removeEventListener('mic-start', handleMicStart);
      window.removeEventListener('mic-stop', handleMicStop);
      try { recognition.stop(); } catch(e) {}
    };
  }, [navigate, showFeedback]);

  return (
    <>
      <div className="fixed top-8 right-3 z-[60]">
        <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      </div>

      {lastCommand && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[70] bg-cyan-600/90 backdrop-blur-sm text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg animate-bounce">
          {lastCommand}
        </div>
      )}
    </>
  );
}
