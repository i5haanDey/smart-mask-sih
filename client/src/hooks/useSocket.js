import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const [sensorData, setSensorData] = useState(null);
  const [newOffer, setNewOffer] = useState(null);
  const [sosAlert, setSosAlert] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('sensor_update', (data) => setSensorData(data));
    socket.on('new_offer', (data) => setNewOffer(data));
    socket.on('sos_alert', (data) => setSosAlert(data));

    return () => socket.disconnect();
  }, []);

  return { sensorData, newOffer, sosAlert, connected };
}
