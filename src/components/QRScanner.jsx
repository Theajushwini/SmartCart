import "../styles.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import QrScanner from "react-qr-scanner";
import { database, ref, set, get, update } from "../firebase";

const QRScanner = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("environment");
  const [startScan, setStartScan] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scannedText, setScannedText] = useState("");
  const [scanned, setScanned] = useState(false); // prevent multiple scans

  const sanitizeForFirebasePath = (str) => {
    return str.replace(/[.#$/[\]]/g, "_").trim();
  };

  const handleScan = async (scanData) => {
    if (!scanData || scanned) return;

    const raw = scanData.text || scanData;
    const userId = sanitizeForFirebasePath(raw);
    setScanned(true);
    setScannedText(raw);
    setLoadingScan(true);

    const sessionRef = ref(database, `sessions/${userId}`);
    const productsRef = ref(database, `sessions/${userId}/products`);

    try {
      const snapshot = await get(sessionRef);

      if (snapshot.exists()) {
        const sessionData = snapshot.val();

        if (sessionData.isActive) {
          // ✅ Session is active → close it and clear cart
          await update(sessionRef, {
            isActive: false,
            closedAt: new Date().toISOString(),
            exited: true,
            exitVerificationStatus: "simulated_closed_by_qr"
          });

          // 🧹 Clear the cart products
          await set(productsRef, null);

          alert(`🛑 Session for ${userId} closed and cart cleared.`);
          navigate("/");
        } else {
          // 🔄 Reactivate session
          await update(sessionRef, {
            isActive: true,
            startedAt: new Date().toISOString(),
            closedAt: null,
            exited: false,
            exitVerificationStatus: null
          });

          alert(`✅ Session for ${userId} reactivated.`);
          navigate(`/main/${userId}`);
        }
      } else {
        // 🆕 Create new session
        await set(sessionRef, {
          original: raw,
          startedAt: new Date().toISOString(),
          isActive: true,
          checkedOut: false,
          exited: false
        });
        navigate(`/main/${userId}`);
      }
    } catch (err) {
      console.error("Error handling session:", err);
      setScanned(false);
    } finally {
      setLoadingScan(false);
    }
  };

  const handleError = (err) => {
    console.error("QR Scan error:", err);
  };

  const previewStyle = {
    height: 240,
    width: 320,
  };

  const constraints = {
    video: { facingMode: selected },
  };

  return (
    <div className="App">
      <h1>|SmartCart|</h1>
      <h2>Login/Logout Scan</h2>

      <button onClick={() => setStartScan(!startScan)}>
        {startScan ? "Stop Scan" : "Start Scan"}
      </button>

      {startScan && (
        <>
          <select onChange={(e) => setSelected(e.target.value)} value={selected}>
            <option value="environment">Back Camera</option>
            <option value="user">Front Camera</option>
          </select>

          <QrScanner
            delay={300}
            style={previewStyle}
            onScan={handleScan}
            onError={handleError}
            constraints={constraints}
          />
        </>
      )}

      {loadingScan && <p>Loading session...</p>}
      {scannedText && <p>Scanned: {scannedText}</p>}
    </div>
  );
};

export default QRScanner;
