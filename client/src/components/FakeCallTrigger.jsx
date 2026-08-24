import { useState } from 'react';
import { Phone, PhoneIncoming } from 'lucide-react';

export default function FakeCallTrigger() {
  const [cooldown, setCooldown] = useState(false);

  const triggerCall = () => {
    if (cooldown) return;
    setCooldown(true);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('fake-call-trigger'));
      setCooldown(false);
    }, 2000);
  };

  return (
    <button
      onClick={triggerCall}
      disabled={cooldown}
      className={`fixed bottom-36 right-20 z-[9998] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition active:scale-90 border-2 ${
        cooldown
          ? 'bg-yellow-600 border-yellow-400 shadow-yellow-600/30 animate-pulse'
          : 'bg-gray-800 border-gray-600 hover:bg-green-700 hover:border-green-500'
      }`}
      title="Simulate incoming call"
    >
      {cooldown ? (
        <PhoneIncoming size={22} className="text-white animate-bounce" />
      ) : (
        <Phone size={22} className="text-green-400" />
      )}
    </button>
  );
}
