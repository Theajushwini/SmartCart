import { useState, useEffect } from "react";
import QrScanner from "react-qr-scanner";
import { database } from "../firebase";
import { ref, get, update, onValue } from "firebase/database";
import { useParams } from "react-router-dom";

export default function ProductScanner() {
  const { userId } = useParams();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [sessionActive, setSessionActive] = useState(true);

  // Real-time session active check
  useEffect(() => {
    const sessionRef = ref(database, `sessions/${userId}/isActive`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      setSessionActive(snapshot.val());
    });

    return () => unsubscribe();
  }, [userId]);

  const handleScan = async (data) => {
    if (!data || !sessionActive) return;

    const raw = data.text || data;
    const productId = String(raw).replace(/[.#$/[\]]/g, "_").trim();

    if (productId === scannedCode) return; // Avoid duplicate scan

    setScannedCode(productId);
    setMessage("Processing...");
    setMessageType("info");

    const productRef = ref(database, `products/${productId}`);
    const snapshot = await get(productRef);

    if (!snapshot.exists()) {
      setMessage("❌ Product not found.");
      setMessageType("error");
      return;
    }

    const product = snapshot.val();

    if (product.stock <= 0) {
      setMessage("⚠️ Out of stock.");
      setMessageType("warning");
      return;
    }

    await update(productRef, { stock: product.stock - 1 });

    const cartItemRef = ref(database, `sessions/${userId}/products/${productId}`);
    const existingItem = await get(cartItemRef);
    const currentQty = existingItem.exists() ? existingItem.val().qty : 0;

    await update(cartItemRef, {
      name: product.name,
      price: product.price,
      qty: currentQty + 1,
    });

    setMessage(`✅ Added ${product.name} to cart.`);
    setMessageType("success");
  };

  const previewStyle = {
    height: 240,
    width: 320,
  };

  if (!sessionActive) {
    return (
      <div className="session-inactive-message">
        <h2>Session Inactive</h2>
        <p>Your session is currently inactive. Please activate it to scan products.</p>
      </div>
    );
  }

  return (
    <div className="product-scanner">
      <h3>Scan Product QR</h3>
      <div className="qr-preview-container">
        <QrScanner
          delay={300}
          onError={(err) => console.error(err)}
          onScan={handleScan}
          style={previewStyle}
        />
      </div>
      {message && (
        <div className={`scanner-message ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
