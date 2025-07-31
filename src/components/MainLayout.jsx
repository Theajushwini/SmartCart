import { Outlet, NavLink, useParams, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaQrcode, FaMapMarkedAlt } from 'react-icons/fa';
import '../styles.css';
import { useEffect, useState } from 'react';
import { database, ref, onValue } from '../firebase';

export default function MainLayout() {
  const { userId } = useParams();
  const location = useLocation();
  const isBaseRoute = location.pathname === `/main/${userId}`;
  const [sessionActive, setSessionActive] = useState(true);

  useEffect(() => {
    const sessionRef = ref(database, `sessions/${userId}/isActive`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      setSessionActive(snapshot.val());
    });

    return () => unsubscribe();
  }, [userId]);

  if (!sessionActive) {
    return (
      <div className="session-closed-container">
        <h2>Session Closed</h2>
        <p>Your shopping session has been closed.</p>
        <p>Please scan the entry QR code again to start a new session.</p>
        <NavLink to="/">
          <button>Back to Home</button>
        </NavLink>
      </div>
    );
  }

  return (
    <div className="main-layout">
      <div className="content" style={{ paddingBottom: '60px' }}>
        {isBaseRoute && (
          <>
            <h1>Hi {userId} !!</h1>
            <NavLink to="scan">
              <button style={{marginLeft:"100px"}}>Start Shopping</button>
            </NavLink>
          </>
        )}
        <Outlet />
      </div>
      <nav className="bottom-nav">
        <NavLink to="cart"><FaShoppingCart /><span>Cart</span></NavLink>
        <NavLink to="scan"><FaQrcode /><span>Scan</span></NavLink>
        <NavLink to="map"><FaMapMarkedAlt /><span>Map</span></NavLink>
        <NavLink to="profile"><FaUser /><span>Profile</span></NavLink>
      </nav>
    </div>
  );
}
