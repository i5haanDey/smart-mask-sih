import { useFetch } from '../hooks/useFetch';
import { Shield, AlertTriangle, CheckCircle, Wind } from 'lucide-react';

export default function Filter() {
  const { data, loading } = useFetch('/api/cartridge', 10000);

  if (loading) return <div className="p-4 text-gray-400">Loading...</div>;

  const getColor = () => {
    if (data.percent > 60) return { text: 'text-green-400', bg: 'bg-green-500', ring: '#22c55e' };
    if (data.percent > 20) return { text: 'text-yellow-400', bg: 'bg-yellow-500', ring: '#eab308' };
    return { text: 'text-red-400', bg: 'bg-red-500', ring: '#ef4444' };
  };

  const colors = getColor();
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (data.percent / 100) * circumference;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
          R
        </div>
        <div>
          <p className="text-sm font-semibold">Active Duty</p>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>
            <span className="text-xs text-gray-400">Mask Connected</span>
          </div>
        </div>
      </div>

      {/* Circular Progress */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 flex flex-col items-center">
        <p className="text-xs text-gray-400 mb-4 tracking-wider uppercase">Smart Mask Filter</p>
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#1f2937" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={colors.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`text-3xl font-bold ${colors.text}`}>{data.percent}%</p>
            <p className="text-xs text-gray-400">{data.percent > 60 ? 'Good' : data.percent > 20 ? 'Low' : 'Critical'}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-400">CO2 Level</p>
          <p className="text-xl font-bold">{data.co2} <span className="text-sm text-gray-400">ppm</span></p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-400">Hours Used</p>
          <p className="text-xl font-bold">{data.hoursUsed} <span className="text-sm text-gray-400">hrs</span></p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-400">Remaining</p>
          <p className={`text-xl font-bold ${colors.text}`}>{data.remaining} <span className="text-sm text-gray-400">hrs</span></p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-400">Total Life</p>
          <p className="text-xl font-bold">{data.totalLife} <span className="text-sm text-gray-400">hrs</span></p>
        </div>
      </div>

      {/* Warning */}
      {data.needsReplacement && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">Replace Cartridge Soon</p>
            <p className="text-xs text-gray-400">Filter efficiency degraded below 20%</p>
          </div>
        </div>
      )}

      {/* Filtration Stages */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <p className="text-xs text-gray-400 mb-3 tracking-wider uppercase">Filtration Stages</p>
        <div className="space-y-2">
          {[
            { name: 'Cotton/Sponge Pre-filter', desc: 'Blocks dust & large particles', icon: '1' },
            { name: 'N95/HEPA Filter', desc: 'Captures PM2.5 & PM10', icon: '2' },
            { name: 'Activated Carbon Layer', desc: 'Absorbs VOC & NO2', icon: '3' },
          ].map((stage, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-xs font-bold text-cyan-400">
                {stage.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{stage.name}</p>
                <p className="text-xs text-gray-500">{stage.desc}</p>
              </div>
              <CheckCircle size={16} className="text-green-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
