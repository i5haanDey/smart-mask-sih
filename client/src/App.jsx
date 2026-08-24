import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Filter from './pages/Filter';
import Earnings from './pages/Earnings';
import Safety from './pages/Safety';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import SOSStrip from './components/SOSStrip';
import SOSAutoTrigger from './components/SOSAutoTrigger';
import VoiceAutoStart from './components/VoiceAutoStart';

function App() {
  return (
    <Router>
      <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
        <SOSStrip />
        <div className="flex-1 min-h-0 pt-7 pb-16 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/filter" element={<Filter />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
        <Navbar />
        <VoiceAutoStart />
        <SOSAutoTrigger />
      </div>
    </Router>
  );
}

export default App;
