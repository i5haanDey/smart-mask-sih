import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../hooks/useSocket';
import { Car, Wind, Eye, DollarSign, MapPin, Clock, Navigation } from 'lucide-react';
import VoiceMicButton from '../components/VoiceMicButton';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_LAT = 12.9692;
const DEFAULT_LNG = 79.1559;

const vehicleIcon = new L.DivIcon({
  html: `<div style="background:#ef4444;width:28px;height:28px;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(239,68,68,0.5)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
  </div>`,
  iconSize: [32, 32], iconAnchor: [16, 16], className: ''
});

const userIcon = new L.DivIcon({
  html: `<div style="width:20px;height:20px;background:#22c55e;border-radius:50%;border:3.5px solid white;box-shadow:0 0 16px rgba(34,197,94,0.7)"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10], className: ''
});

const pickupIcon = new L.DivIcon({
  html: `<div style="width:24px;height:24px;background:#22c55e;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><div style="width:8px;height:8px;background:white;border-radius:50%"></div></div>`,
  iconSize: [24, 24], iconAnchor: [12, 12], className: ''
});

const dropIcon = new L.DivIcon({
  html: `<div style="width:24px;height:24px;background:#ef4444;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><div style="width:8px;height:8px;background:white;border-radius:50%"></div></div>`,
  iconSize: [24, 24], iconAnchor: [12, 12], className: ''
});

const DUMMY_OFFERS = [
  { id: 'd1', from: 'T. Nagar Branch', platform: 'Zomato', icon: 'Z', color: '#ef4444', earnings: '₹142', perKm: '₹28', pickupKm: 1.2, dropKm: 3.8, time: '18 min', pickupLat: 28.6149, pickupLng: 77.2095, dropLat: 28.6260, dropLng: 77.2180 },
  { id: 'd2', from: 'Adyar outlet', platform: 'Swiggy', icon: 'S', color: '#fc8019', earnings: '₹98', perKm: '₹22', pickupKm: 2.5, dropKm: 5.1, time: '24 min', pickupLat: 28.6080, pickupLng: 77.2150, dropLat: 28.6190, dropLng: 77.2250 },
  { id: 'd3', from: 'Velachery Main Rd', platform: 'Dunzo', icon: 'D', color: '#00c853', earnings: '₹210', perKm: '₹35', pickupKm: 0.8, dropKm: 6.2, time: '32 min', pickupLat: 28.6170, pickupLng: 77.2020, dropLat: 28.6300, dropLng: 77.2100 },
  { id: 'd4', from: 'Anna Nagar West', platform: 'Zomato', icon: 'Z', color: '#ef4444', earnings: '₹175', perKm: '₹30', pickupKm: 3.1, dropKm: 4.5, time: '22 min', pickupLat: 28.6210, pickupLng: 77.2130, dropLat: 28.6320, dropLng: 77.2200 },
  { id: 'd5', from: 'OMR Food Court', platform: 'Swiggy', icon: 'S', color: '#fc8019', earnings: '₹156', perKm: '₹26', pickupKm: 1.9, dropKm: 5.8, time: '28 min', pickupLat: 28.6020, pickupLng: 77.2060, dropLat: 28.6140, dropLng: 77.2180 },
];

function Recenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function Home() {
  const { sensorData, newOffer, connected } = useSocket();
  const [userLocation, setUserLocation] = useState([DEFAULT_LAT, DEFAULT_LNG]);
  const [gotLocation, setGotLocation] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [bottomTab, setBottomTab] = useState('map');
  const [offers, setOffers] = useState(DUMMY_OFFERS);
  const [newOfferBadge, setNewOfferBadge] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [activeOffer, setActiveOffer] = useState(null);

  const loc = userLocation;

  useEffect(() => {
    if (gotLocation) return;
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLocation([pos.coords.latitude, pos.coords.longitude]); setGotLocation(true); },
        () => { setGotLocation(true); },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } catch(e) { setGotLocation(true); }
  }, [gotLocation]);

  useEffect(() => {
    fetch(`/api/vehicles?lat=${loc[0]}&lng=${loc[1]}`)
      .then(r => r.json())
      .then(d => { setVehicles(d.vehicles || []); setVehicleCount(d.total || 0); })
      .catch(() => {});
  }, [loc[0], loc[1]]);

  useEffect(() => {
    fetch(`/api/rides?lat=${loc[0]}&lng=${loc[1]}`)
      .then(r => r.json())
      .then(d => {
        if (d.offers && d.offers.length > 0) setOffers(d.offers);
      })
      .catch(() => {});
  }, [loc[0], loc[1]]);

  useEffect(() => {
    if (newOffer) {
      setOffers(prev => [newOffer, ...prev].slice(0, 8));
      setNewOfferBadge(true);
      setBottomTab('offers');
    }
  }, [newOffer]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.command === 'show-offers') setBottomTab('offers');
      if (e.detail?.command === 'show-map') setBottomTab('map');
    };
    window.addEventListener('voice-command', handler);
    return () => window.removeEventListener('voice-command', handler);
  }, []);

  const acceptOffer = useCallback(async (offer) => {
    setActiveOffer(offer);
    setBottomTab('map');
    try {
      const res = await fetch(`/api/route?origin=${loc[1]},${loc[0]}&destination=${offer.pickupLng},${offer.pickupLat}`);
      const data = await res.json();
      if (data.coordinates) setRouteCoords(data.coordinates.map(c => [c[1], c[0]]));
    } catch(e) {}
  }, [loc]);

  const clearRoute = () => { setRouteCoords([]); setActiveOffer(null); };

  const aqi = sensorData?.aqi || '--';
  const level = sensorData?.level || 'Loading';
  const color = sensorData?.color || '#666';
  const visibility = sensorData?.visibility || '--';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-cyan-500/20">R</div>
          <div>
            <p className="text-sm font-semibold">Good morning, Rohit</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[11px] text-gray-400">Mask Connected</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg">
          <Wind size={14} style={{ color }} />
          <div>
            <span className="text-xs font-bold" style={{ color }}>AQI {aqi}</span>
            <span className="text-[10px] ml-1.5" style={{ color }}>{level}</span>
          </div>
        </div>
      </div>

      {/* TOP MAP — wrapped in clipping div */}
      <div className="mx-3 rounded-2xl shadow-lg shrink-0 overflow-hidden border border-gray-700/50 relative" style={{ height: '30vh' }}>
        <div className="absolute inset-0">
          <MapContainer center={loc} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false} key="top-map">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <Recenter center={loc} zoom={13} />
            <Marker position={loc} icon={userIcon} />
            <Circle center={loc} radius={500} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.04, weight: 1.5, dashArray: '10,8' }} />
            {routeCoords.length > 0 && (
              <Polyline positions={routeCoords} pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.85, dashArray: '12,6' }} />
            )}
            {activeOffer && (
              <>
                <Marker position={[activeOffer.pickupLat, activeOffer.pickupLng]} icon={pickupIcon} />
                <Marker position={[activeOffer.dropLat, activeOffer.dropLng]} icon={dropIcon} />
              </>
            )}
          </MapContainer>
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 z-[1000] bg-white/95 backdrop-blur-sm text-gray-800 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg text-[10px] font-semibold">
          <Car size={12} className="text-red-500" />
          {vehicleCount} vehicles nearby
        </div>
        <div className="absolute top-2 right-2 z-[1000] bg-white/95 backdrop-blur-sm text-gray-800 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg text-[10px] font-semibold">
          <Eye size={12} className="text-blue-500" />
          Visibility: {visibility}m
        </div>
        {activeOffer && (
          <div className="absolute bottom-2 left-2 z-[1000] bg-blue-600 text-white rounded-xl px-3 py-2 shadow-lg text-[11px]">
            <p className="font-semibold">{activeOffer.from}</p>
            <p className="opacity-80 mt-0.5">{activeOffer.platform} pickup</p>
            <button onClick={clearRoute} className="mt-1.5 text-[10px] underline opacity-70 hover:opacity-100">Clear route</button>
          </div>
        )}
      </div>

      {/* Toggle Tabs */}
      <div className="flex items-center justify-center gap-2 py-1 shrink-0">
        <button
          onClick={() => setBottomTab('map')}
          className={`flex items-center gap-1.5 px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            bottomTab === 'map' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Car size={14} /> Vehicles
        </button>
        <button
          onClick={() => { setBottomTab('offers'); setNewOfferBadge(false); }}
          className={`flex items-center gap-1.5 px-5 py-1.5 rounded-full text-xs font-semibold transition-all relative ${
            bottomTab === 'offers' ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <DollarSign size={14} /> Offers
          {newOfferBadge && bottomTab !== 'offers' && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse border-2 border-gray-950" />
          )}
        </button>
        <VoiceMicButton />
      </div>

      {/* BOTTOM SECTION — wrapped in clipping div */}
      <div className="mx-3 mb-2 rounded-2xl overflow-hidden border border-gray-700/50 shadow-lg shrink-0" style={{ height: '25vh' }}>
        {bottomTab === 'map' ? (
          <div className="relative w-full h-full overflow-hidden">
            <div className="absolute inset-0">
              <MapContainer center={loc} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false} key="bottom-map">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <Marker position={loc} icon={userIcon} />
                <Circle center={loc} radius={150} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.1, weight: 1.5 }} />
                {vehicles.map((v) => (
                  <Marker key={v.id} position={[v.lat, v.lng]} icon={vehicleIcon}>
                    <Popup>
                      <div className="text-center p-1">
                        <p className="font-bold capitalize text-sm">{v.type}</p>
                        <p className="text-xs">{v.distance}m away</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto bg-gray-950 p-3 space-y-2.5">
            {offers.map((offer, i) => (
              <div key={offer.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800/80 hover:border-gray-700 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg" style={{ backgroundColor: offer.color }}>
                      {offer.icon}
                    </div>
                    {i === 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[8px] font-bold text-black">1</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{offer.from}</p>
                    <p className="text-[11px] text-gray-400">{offer.platform} pickup</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-green-400">{offer.earnings}</p>
                    <p className="text-[10px] text-cyan-400 font-medium">{offer.perKm}/km</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-gray-400 mb-3 pl-1">
                  <span className="flex items-center gap-1"><MapPin size={11} /> {offer.pickupKm} km</span>
                  <span className="flex items-center gap-1"><Navigation size={11} /> {offer.dropKm} km</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {offer.time}</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => acceptOffer(offer)} className="flex-1 py-2 bg-green-600 rounded-xl text-xs font-semibold hover:bg-green-500 transition-all active:scale-[0.97] shadow-lg shadow-green-600/20">
                    Redirect
                  </button>
                  <button className="px-4 py-2 bg-gray-800 rounded-xl text-xs font-medium text-gray-300 hover:bg-gray-700 transition-all">
                    Skip
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
