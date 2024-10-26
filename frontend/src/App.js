// App.js
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import SignUp from './components/SignUp/SignUp';
import LogIn from './components/LogIn/LogIn';
import LandingPage from './components/LandingPage/LandingPage';
import Home from './components/Home/Home';
import Friends from './components/Friends/Friends';
import Chat from './components/Chat/Chat';
import PartyManage from './components/PartyManage/PartyMange';
import { useLoadScript } from '@react-google-maps/api';

function App() {
  // Load Google Maps API
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAtWKoDGazzRmKRObAdSvugmlRrKrq_7kQ"
  });

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/home" element={<Home />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/party-manage" element={<PartyManage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
