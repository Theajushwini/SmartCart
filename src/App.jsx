import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import QRScanner from './components/QRScanner';
import ProductScanner from './components/ProductScanner';
import Cart from './components/CartView';
import Profile from './components/Profile';
import StoreMap from './components/StoreMap';
import MainLayout from './components/MainLayout';
import './styles.css'; // Import the new enhanced styles

function App() {
  return (
    <div className="phone-container">
      <Router>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/entry" element={<QRScanner />} />

          <Route path="/main/:userId" element={<MainLayout />}>
            <Route path="scan" element={<ProductScanner />} />
            <Route path="cart" element={<Cart />} />
            <Route path="profile" element={<Profile />} />
            <Route path="map" element={<StoreMap />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;