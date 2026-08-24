import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function FloatingSOS() {
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
      {/* Floating SOS Button */}
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-36 right-4 z-50 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-90 transition border-2 border-red-400"
      >
        <AlertTriangle size={24} className="text-white" />
      </button>

      {/* SOS Modal */}
      {show && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-red-400">Emergency SOS</h3>
              <button onClick={cancel} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {sent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-400" />
                </div>
                <p className="text-lg font-bold text-red-400">SOS Sent!</p>
                <p className="text-gray-400 text-sm mt-1">Emergency contacts notified</p>
                <p className="text-gray-500 text-xs mt-1">Location: 12.9692 N, 79.1559 E</p>
                <button onClick={cancel} className="mt-4 px-6 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
                  Close
                </button>
              </div>
            ) : countdown !== null ? (
              <div className="text-center py-6">
                <div className="text-7xl font-bold text-red-400 animate-pulse mb-4">{countdown}</div>
                <p className="text-gray-400 text-sm">SOS activating in {countdown}s</p>
                <button onClick={cancel} className="mt-4 px-6 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-4">This will alert your emergency contacts with your live location.</p>
                <button
                  onClick={handlePress}
                  className="w-full py-3 bg-red-600 rounded-xl font-bold hover:bg-red-500 transition active:scale-95"
                >
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
