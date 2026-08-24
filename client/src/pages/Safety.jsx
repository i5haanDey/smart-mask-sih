import { useSocket } from '../hooks/useSocket';
import { useFetch } from '../hooks/useFetch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { AlertTriangle, Wind, Eye, Thermometer, Droplets, Clock, Shield } from 'lucide-react';

export default function Safety() {
  const { sensorData } = useSocket();
  const { data: exposure } = useFetch('/api/exposure', 15000);
  const { data: history } = useFetch('/api/aqi/history', 5000);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (history) {
      setChartData(history.map((r, i) => ({ time: i + 1, pm25: r.pm25, aqi: r.aqi })));
    }
  }, [history]);

  useEffect(() => {
    if (sensorData) {
      setChartData(prev => {
        const next = [...prev, { time: prev.length + 1, pm25: sensorData.pm25, aqi: sensorData.aqi }];
        return next.slice(-20);
      });
    }
  }, [sensorData]);

  const aqi = sensorData?.aqi || 186;
  const level = sensorData?.level || 'Poor';
  const color = sensorData?.color || '#ff7e00';

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-sm font-bold">R</div>
          <div>
            <p className="text-sm font-semibold">Active Duty</p>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>
              <span className="text-xs text-gray-400">Mask Connected</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
          </div>
        </div>
      </div>

      {/* Current Air Quality Card */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400 tracking-wider uppercase">Current Air Quality</p>
            <p className="text-2xl font-bold mt-1" style={{ color }}>AQI {aqi} <span className="text-lg">{level}</span></p>
          </div>
          <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle size={20} className="text-yellow-400" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <p className="text-[10px] text-gray-500">PM2.5</p>
            <p className="text-sm font-bold">{sensorData?.pm25 || '--'} <span className="text-[10px] text-gray-500">ug/m3</span></p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">PM10</p>
            <p className="text-sm font-bold">{sensorData?.pm10 || '--'} <span className="text-[10px] text-gray-500">ug/m3</span></p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Visibility</p>
            <p className="text-sm font-bold" style={{ color }}>{sensorData?.visibility || '--'} <span className="text-[10px] text-gray-500">m</span></p>
          </div>
        </div>

        {/* AQI Bar */}
        <div className="h-2 rounded-full overflow-hidden bg-gradient-to-r from-green-500 via-yellow-400 via-orange-500 via-red-500 to-purple-900 mb-2">
          <div className="h-full w-1 bg-white rounded-full shadow-lg transition-all duration-500" style={{ marginLeft: `${Math.min(aqi / 5, 100)}%` }} />
        </div>

        {aqi > 150 && (
          <div className="bg-yellow-900/20 rounded-lg p-2 flex items-center gap-2 mt-2">
            <AlertTriangle size={12} className="text-yellow-400" />
            <p className="text-[11px] text-yellow-400">{sensorData?.advice || 'High pollution - reduce exposure where possible'}</p>
          </div>
        )}
      </div>

      {/* Smart Mask Health */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-cyan-400" />
          <p className="text-xs text-gray-400 tracking-wider uppercase">Smart Mask</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">CO2</p>
            <p className="text-lg font-bold">{sensorData?.co2 || '--'} <span className="text-xs text-gray-500">ppm</span></p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Temp</p>
            <p className="text-lg font-bold">{sensorData?.temp || '--'} <span className="text-xs text-gray-500">C</span></p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Humidity</p>
            <p className="text-lg font-bold">{sensorData?.humidity || '--'} <span className="text-xs text-gray-500">%</span></p>
          </div>
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Status</p>
            <p className="text-lg font-bold text-green-400">Active</p>
          </div>
        </div>
      </div>

      {/* Exposure Today */}
      {exposure && (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-orange-400" />
            <p className="text-xs text-gray-400 tracking-wider uppercase">Exposure Today</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400">Time in Poor AQI</p>
              <p className="text-xl font-bold text-orange-400">{exposure.hoursPoorAQI}h</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Exposure Score</p>
              <p className="text-xl font-bold">{exposure.score}/100</p>
            </div>
          </div>

          <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                exposure.score > 70 ? 'bg-green-500' : exposure.score > 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${exposure.score}%` }}
            />
          </div>

          {exposure.score < 70 && (
            <div className="bg-orange-900/20 rounded-lg p-2 flex items-center gap-2">
              <AlertTriangle size={12} className="text-orange-400" />
              <p className="text-[11px] text-orange-400">Your exposure is higher than your daily target.</p>
            </div>
          )}
        </div>
      )}

      {/* PM2.5 Chart */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <p className="text-xs text-gray-400 mb-4 tracking-wider uppercase">PM2.5 History</p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={10} />
            <YAxis stroke="#6b7280" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: 12 }} />
            <Line type="monotone" dataKey="pm25" stroke="#06b6d4" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
