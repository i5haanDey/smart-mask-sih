import { useFetch } from '../hooks/useFetch';
import { useSocket } from '../hooks/useSocket';
import { User, Shield, Wind, Bell, Settings, LogOut, ChevronRight } from 'lucide-react';

export default function Profile() {
  const { data: user } = useFetch('/api/user');
  const { sensorData, connected } = useSocket();

  const aqi = sensorData?.aqi || 42;
  const level = sensorData?.level || 'Good';

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Profile Header */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-xl font-bold">
            {user?.name?.[0] || 'R'}
          </div>
          <div>
            <p className="text-lg font-bold">{user?.name || 'Rohit'}</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-green-400 font-medium">Active Duty</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>
              <span className="text-xs text-gray-400">Mask Connected</span>
            </div>
          </div>
        </div>

        {/* Quick AQI badge */}
        <div className="mt-4 inline-flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1.5">
          <Wind size={14} className="text-green-400" />
          <span className="text-sm font-medium">AQI: {aqi} ({level})</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <QuickAction
          icon={<Shield size={20} className="text-red-400" />}
          title="SOS Alert"
          subtitle="Send emergency alert"
          bg="bg-red-900/30"
          border="border-red-500/30"
        />
        <QuickAction
          icon={<Wind size={20} className="text-green-400" />}
          title="Filter Health"
          subtitle="82% Life Remaining"
          bg="bg-green-900/30"
          border="border-green-500/30"
        />
        <QuickAction
          icon={<Wind size={20} className="text-orange-400" />}
          title="Current Air Quality"
          subtitle={`AQI ${aqi} - ${level}`}
          bg="bg-orange-900/30"
          border="border-orange-500/30"
        />
      </div>

      {/* Menu Items */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <MenuItem icon={<Shield size={18} />} title="Safety Dashboard" subtitle="AQI, exposure & health" />
        <MenuItem icon={<Wind size={18} />} title="AQI History" subtitle="Past readings & trends" />
        <MenuItem icon={<Settings size={18} />} title="Route Settings" subtitle="Default routes & prefs" />
        <div className="border-t border-gray-800" />
        <MenuItem icon={<Bell size={18} />} title="Notifications" subtitle="Alert preferences" />
        <MenuItem icon={<LogOut size={18} />} title="Sign Out" subtitle="Log out of account" danger />
      </div>
    </div>
  );
}

function QuickAction({ icon, title, subtitle, bg, border }) {
  return (
    <div className={`${bg} ${border} border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:opacity-90 transition`}>
      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

function MenuItem({ icon, title, subtitle, danger }) {
  return (
    <div className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-800 transition ${danger ? 'text-red-400' : ''}`}>
      <div className="text-gray-400">{icon}</div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${danger ? 'text-red-400' : ''}`}>{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-gray-600" />
    </div>
  );
}
