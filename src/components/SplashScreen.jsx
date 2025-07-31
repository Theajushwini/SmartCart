import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/entry');
    }, 2500); // Show splash screen for 2.5 sec
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-screen" style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0d6efd', color: 'white', fontSize: '2rem' }}>
      <h1>Welcome to SmartCart 🛒</h1>
    </div>
  );
}

