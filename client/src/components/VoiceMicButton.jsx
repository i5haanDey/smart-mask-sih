import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { startMicCapture, stopMicCapture } from './VoiceAutoStart';

export default function VoiceMicButton() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const handleStarted = () => setListening(true);
    const handleStopped = () => { setListening(false); setInterim(''); };
    const handleTranscript = (e) => {
      const { text, final: isFinal } = e.detail;
      if (isFinal) {
        setTranscript(text);
        setHistory(prev => [...prev, text].slice(-20));
        setInterim('');
      } else {
        setInterim(text);
      }
    };

    window.addEventListener('mic-started', handleStarted);
    window.addEventListener('mic-stopped', handleStopped);
    window.addEventListener('mic-transcript', handleTranscript);
    return () => {
      window.removeEventListener('mic-started', handleStarted);
      window.removeEventListener('mic-stopped', handleStopped);
      window.removeEventListener('mic-transcript', handleTranscript);
    };
  }, []);

  const toggle = () => {
    if (listening) {
      stopMicCapture();
    } else {
      setHistory([]);
      setTranscript('');
      setInterim('');
      startMicCapture();
    }
  };

  return (
    <>
      <button onClick={toggle} className="flex flex-col items-center gap-1 text-xs px-3 py-1.5 rounded-xl transition text-gray-500 hover:text-gray-300">
        {listening ? <MicOff size={22} className="text-red-400 animate-pulse" /> : <Mic size={22} />}
        <span className={`font-medium ${listening ? 'text-red-400' : ''}`}>{listening ? 'Stop' : 'Mic'}</span>
      </button>

      {listening && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-end justify-center p-4 pb-20">
          <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-white">Listening...</span>
              </div>
              <button onClick={stopMicCapture} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="px-4 py-3 max-h-60 overflow-y-auto space-y-2">
              {history.length === 0 && !interim && (
                <p className="text-gray-500 text-sm italic">Speak something...</p>
              )}
              {history.map((line, i) => (
                <p key={i} className="text-sm text-green-400 leading-relaxed">{line}</p>
              ))}
              {interim && (
                <p className="text-sm text-gray-300 leading-relaxed italic">{interim}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
