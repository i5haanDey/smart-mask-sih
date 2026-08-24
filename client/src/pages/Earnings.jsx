import { useFetch } from '../hooks/useFetch';
import { DollarSign, Navigation, TrendingUp, Clock } from 'lucide-react';

export default function Earnings() {
  const { data: rideData, loading: rideLoading } = useFetch('/api/rides');
  const { data: exposure } = useFetch('/api/exposure', 30000);

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

      {/* Daily Summary */}
      {exposure && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
            <DollarSign size={16} className="mx-auto text-green-400 mb-1" />
            <p className="text-lg font-bold text-green-400">{exposure.totalEarnings}</p>
            <p className="text-[10px] text-gray-500">Today's Earnings</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
            <Navigation size={16} className="mx-auto text-cyan-400 mb-1" />
            <p className="text-lg font-bold">{exposure.totalOrders}</p>
            <p className="text-[10px] text-gray-500">Orders Done</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
            <Clock size={16} className="mx-auto text-purple-400 mb-1" />
            <p className="text-lg font-bold">{exposure.onlineTime}</p>
            <p className="text-[10px] text-gray-500">Online Time</p>
          </div>
        </div>
      )}

      {/* Ride Offers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Available Rides</h2>
          <span className="text-xs text-gray-500">Ranked by earnings/km</span>
        </div>

        {rideLoading ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : (
          <div className="space-y-3">
            {rideData?.offers?.map((ride, i) => (
              <div key={ride.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-600">#{i + 1}</span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: ride.color }}
                    >
                      {ride.icon}
                    </div>
                    <span className="font-medium text-sm">{ride.platform}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1 bg-green-900/30 px-2 py-0.5 rounded-full">
                    <TrendingUp size={12} className="text-green-400" />
                    <span className="text-xs font-medium text-green-400">{ride.perKm}/km</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-2">
                  <div>
                    <p className="text-xs text-gray-400">Pickup / Drop</p>
                    <p>{ride.pickupKm} km / {ride.dropKm} km</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Est. Time</p>
                    <p className="font-medium">{ride.time}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-green-400">{ride.earnings}</p>
                  <button className="px-4 py-1.5 bg-gray-800 rounded-lg text-xs font-medium hover:bg-gray-700 transition">
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
