import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function SOSStrip() {
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      fetch('/api/sos', { method: 'POST' });
      setSent(true);
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handlePress = () => {
    setSent(false);
    setCountdown(5);
  };

  const cancel = () => {
    setCountdown(null);
    setSent(false);
    setShow(false);
  };

  return (
    <>
      {/* Thin SOS Strip */}
      <div
        onClick={() => setShow(true)}
        className="fixed top-0 left-0 right-0 z-[9999] bg-red-600/90 backdrop-blur-sm flex items-center justify-center gap-2 py-1.5 cursor-pointer hover:bg-red-500 transition active:scale-[0.98]"
      >
        <AlertTriangle size={12} className="text-white" />
        <span className="text-[11px] font-bold text-white tracking-wider">SOS - Emergency</span>
      </div>

      {/* SOS Modal */}
      {show && (
        <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-red-400">Emergency SOS</h3>
              <button onClick={cancel} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            {sent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-400" />
                </div>
                <p className="text-lg font-bold text-red-400">SOS Sent!</p>
                <p className="text-gray-400 text-sm mt-1">Emergency contacts notified</p>
                <button onClick={cancel} className="mt-4 px-6 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">Close</button>
              </div>
            ) : countdown !== null ? (
              <div className="text-center py-6">
                <div className="text-7xl font-bold text-red-400 animate-pulse mb-4">{countdown}</div>
                <p className="text-gray-400 text-sm">SOS activating in {countdown}s</p>
                <button onClick={cancel} className="mt-4 px-6 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-4">This will alert your emergency contacts with your live location.</p>
                <button onClick={handlePress} className="w-full py-3 bg-red-600 rounded-xl font-bold hover:bg-red-500 transition active:scale-95">
                  Activate SOS
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
