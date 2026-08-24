import { NavLink } from 'react-router-dom';
import { Home, Box, DollarSign, Shield, User } from 'lucide-react';
import VoiceMicButton from './VoiceMicButton';

const links = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/filter', icon: Box, label: 'Filter' },
  { to: '/earnings', icon: DollarSign, label: 'Earnings' },
  { to: '/safety', icon: Shield, label: 'Safety' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-40">
      <div className="flex justify-around py-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs px-3 py-1.5 rounded-xl transition ${
                isActive ? 'text-cyan-400 bg-cyan-400/10' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <Icon size={22} />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
        <VoiceMicButton />
      </div>
    </nav>
  );
}
