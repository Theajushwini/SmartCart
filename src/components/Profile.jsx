import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState("");
  const [sessionActive, setSessionActive] = useState(true);

  useEffect(() => {
    const sessionRef = ref(database, `sessions/${userId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionData = snapshot.val();
        setSessionStartedAt(sessionData.startedAt || "");
        setSessionActive(sessionData.isActive);

        const products = sessionData.products || {};
        const productList = Object.keys(products).map((key) => ({
          id: key,
          ...products[key],
        }));

        setCart(productList);

        const totalPrice = productList.reduce(
          (acc, item) => acc + item.price * item.qty,
          0
        );
        setTotal(totalPrice);
      } else {
        setSessionActive(false);
        setCart([]);
        setTotal(0);
        setSessionStartedAt("");
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleInactivateSession = () => {
    // Redirect to QR scanner to inactivate session via scanning
    navigate("/entry");
  };

  return (
    <div className="container mt-4">
      <h2>User Profile</h2>
      <p><strong>User ID:</strong> {userId}</p>
      <p><strong>Session Started:</strong> {sessionStartedAt ? new Date(sessionStartedAt).toLocaleString() : "N/A"}</p>
      <p>
        <strong>Session Status:</strong>{" "}
        <span className={sessionActive ? "text-success" : "text-danger"}>
          {sessionActive ? "Active" : "Inactive"}
        </span>
      </p>

      <h4>Cart Summary:</h4>
      {cart.length === 0 ? (
        <p>Cart is empty.</p>
      ) : (
        <ul>
          {cart.map((item) => (
            <li key={item.id}>
              {item.name} (Qty: {item.qty}) - ₹{item.price * item.qty}
            </li>
          ))}
        </ul>
      )}
      <h5>Total: ₹{total}</h5>

      <button className="btn btn-warning" onClick={handleInactivateSession}>
        Inactivate Session (via QR Scan)
      </button>
    </div>
  );
};

export default Profile;

