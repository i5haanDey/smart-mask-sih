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

let recognitionInstance = null;
let micMode = false;

export function startMicCapture() {
  micMode = true;
  window.dispatchEvent(new CustomEvent('mic-started'));
  if (recognitionInstance) {
    try { recognitionInstance.stop(); } catch(e) {}
  }
}

export function stopMicCapture() {
  micMode = false;
  window.dispatchEvent(new CustomEvent('mic-stopped'));
  if (recognitionInstance) {
    try { recognitionInstance.start(); } catch(e) {}
  }
}

export default function VoiceAutoStart() {
  const navigate = useNavigate();
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
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognitionInstance = recognition;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        const isFinal = event.results[i].isFinal;

        if (micMode) {
          window.dispatchEvent(new CustomEvent('mic-transcript', {
            detail: { text: t.trim(), final: isFinal }
          }));
          continue;
        }

        const text = t.toLowerCase().trim();
        window.dispatchEvent(new CustomEvent('voice-transcript', { detail: { text, final: isFinal } }));

        if (!isFinal) continue;

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
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'aborted' || micMode) return;
      setActive(false);
      setTimeout(() => {
        if (!micMode) {
          try { recognition.start(); setActive(true); } catch(e) {}
        }
      }, 1000);
    };

    recognition.onend = () => {
      if (micMode) return;
      setTimeout(() => {
        if (!micMode) {
          try { recognition.start(); } catch(e) {}
        }
      }, 100);
    };

    try {
      recognition.start();
      setActive(true);
    } catch(e) {}

    return () => {
      try { recognition.stop(); } catch(e) {}
      recognitionInstance = null;
    };
  }, [navigate, showFeedback]);

  return (
    <>
      <div className="fixed top-8 right-3 z-[60]">
        <div className={`w-2.5 h-2.5 rounded-full ${active && !micMode ? 'bg-green-500 animate-pulse' : micMode ? 'bg-red-500 animate-pulse' : 'bg-red-500'}`} />
      </div>

      {lastCommand && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[70] bg-cyan-600/90 backdrop-blur-sm text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg animate-bounce">
          {lastCommand}
        </div>
      )}
    </>
  );
}
