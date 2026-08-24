// Haversine formula to calculate distance between two GPS coordinates
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Tamil Nadu police stations (client-side copy for nearest calc)
export const policeStations = [
  { name: 'T Nagar Police Station', lat: 13.0418, lng: 80.2341, phone: '044-28341416', district: 'Chennai' },
  { name: 'Adyar Police Station', lat: 13.0063, lng: 80.2574, phone: '044-24912525', district: 'Chennai' },
  { name: 'Mylapore Police Station', lat: 13.0339, lng: 80.2676, phone: '044-24984388', district: 'Chennai' },
  { name: 'Kodambakkam Police Station', lat: 13.0525, lng: 80.2264, phone: '044-24831030', district: 'Chennai' },
  { name: 'Nungambakkam Police Station', lat: 13.0604, lng: 80.2496, phone: '044-28274197', district: 'Chennai' },
  { name: 'Egmore Police Station', lat: 13.0710, lng: 80.2530, phone: '044-23461847', district: 'Chennai' },
  { name: 'Central Crime Branch', lat: 13.0878, lng: 80.2100, phone: '044-23452338', district: 'Chennai' },
  { name: 'Royapuram Police Station', lat: 13.1075, lng: 80.2967, phone: '044-25951410', district: 'Chennai' },
  { name: 'Tondiarpet Police Station', lat: 13.1204, lng: 80.2824, phone: '044-25951305', district: 'Chennai' },
  { name: 'Mambalam Police Station', lat: 13.0376, lng: 80.2163, phone: '044-24861225', district: 'Chennai' },
  { name: 'Guindy Police Station', lat: 13.0064, lng: 80.2206, phone: '044-22342246', district: 'Chennai' },
  { name: 'Velachery Police Station', lat: 12.9815, lng: 80.2180, phone: '044-22441537', district: 'Chennai' },
  { name: 'Sholinganallur Police Station', lat: 12.9024, lng: 80.2280, phone: '044-24531002', district: 'Chennai' },
  { name: 'Tambaram Police Station', lat: 12.9247, lng: 80.0994, phone: '044-22383202', district: 'Chengalpattu' },
  { name: 'Chromepet Police Station', lat: 12.9516, lng: 80.1410, phone: '044-22381425', district: 'Chengalpattu' },
  { name: 'Ambattur Police Station', lat: 13.1143, lng: 80.1548, phone: '044-26271459', district: 'Thiruvallur' },
  { name: 'Madhavaram Police Station', lat: 13.1492, lng: 80.2332, phone: '044-25530304', district: 'Chennai' },
  { name: 'Perambur Police Station', lat: 13.1086, lng: 80.2375, phone: '044-25515057', district: 'Chennai' },
  { name: 'Anna Nagar Police Station', lat: 13.0850, lng: 80.2103, phone: '044-26212201', district: 'Chennai' },
  { name: 'Kodungaiyur Police Station', lat: 13.1310, lng: 80.2448, phone: '044-25560143', district: 'Chennai' },
  { name: 'K.K. Nagar Police Station', lat: 13.0356, lng: 80.1945, phone: '044-23661228', district: 'Chennai' },
  { name: 'Ashok Nagar Police Station', lat: 13.0371, lng: 80.2123, phone: '044-24892234', district: 'Chennai' },
  { name: 'Madurai City Police', lat: 9.9252, lng: 78.1198, phone: '0452-2335011', district: 'Madurai' },
  { name: 'Salem City Police', lat: 11.6643, lng: 78.1460, phone: '0427-2211100', district: 'Salem' },
  { name: 'Tiruchirappalli City Police', lat: 10.7905, lng: 78.7047, phone: '0431-2411500', district: 'Tiruchirappalli' },
  { name: 'Coimbatore City Police', lat: 11.0168, lng: 76.9558, phone: '0422-2303700', district: 'Coimbatore' },
  { name: 'Vellore City Police', lat: 12.9165, lng: 79.1325, phone: '0416-2220055', district: 'Vellore' },
  { name: 'Erode City Police', lat: 11.3410, lng: 77.7172, phone: '0424-2266100', district: 'Erode' },
  { name: 'Thanjavur City Police', lat: 10.7870, lng: 79.1378, phone: '04362-220055', district: 'Thanjavur' },
  { name: 'Kanyakumari District Police HQ', lat: 8.0883, lng: 77.5385, phone: '04652-246200', district: 'Kanyakumari' },
];

export function findNearestPolice(lat, lng) {
  let nearest = policeStations[0];
  let minDist = Infinity;
  for (const ps of policeStations) {
    const dist = haversine(lat, lng, ps.lat, ps.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = ps;
    }
  }
  return { ...nearest, distance: Math.round(minDist) };
}
