import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, X } from 'lucide-react';

export default function VoiceMicButton() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [history, setHistory] = useState([]);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch (e) {}
    setListening(false);
    setInterim('');
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += t;
        } else {
          interimText += t;
        }
      }
      if (finalText) {
        setTranscript(finalText.trim());
        setHistory(prev => [...prev, finalText.trim()].slice(-20));
      }
      setInterim(interimText);
    };

    recognition.onerror = () => {
      listeningRef.current = false;
      setListening(false);
      setInterim('');
    };

    recognition.onend = () => {
      if (listeningRef.current) {
        try { recognition.start(); } catch (e) {}
      }
    };

    try {
      listeningRef.current = true;
      recognition.start();
      setListening(true);
      setTranscript('');
      setInterim('');
    } catch (e) {}
  }, []);

  useEffect(() => {
    return () => { listeningRef.current = false; try { recognitionRef.current?.stop(); } catch (e) {} };
  }, []);

  const toggle = () => {
    if (listening) stopListening();
    else startListening();
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
              <button onClick={stopListening} className="text-gray-400 hover:text-white">
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
