import React, { useState, useEffect,useCallback } from "react";
import { useParams } from "react-router-dom";
import { ref, get, remove, update, onValue } from "firebase/database";
import { database } from "../firebase";
import CheckoutPopup from "./CheckoutPopup";
import { Button } from "react-bootstrap";

const CartView = () => {
  const { userId } = useParams();
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState(null);

  const quantityOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50];

  useEffect(() => {
    const sessionRef = ref(database, `sessions/${userId}/isActive`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      setSessionActive(snapshot.val());
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!sessionActive) return;

    const fetchCart = async () => {
      const cartRef = ref(database, `sessions/${userId}/products`);
      const snapshot = await get(cartRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formatted = Object.entries(data).map(([key, val]) => ({
          id: key,
          ...val,
        }));
        setCartItems(formatted);
      } else {
        setCartItems([]);
      }
    };

    fetchCart();
  }, [userId, sessionActive]);

  useEffect(() => {
    const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
    setTotalPrice(total);
  }, [cartItems]);

  const fetchRecommendations = useCallback(async () => {
    setLoadingRecommendations(true);
    setRecommendationsError(null);

    try {
      const response = await fetch("http://localhost:5000/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartItems }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations || []);
      } else {
        setRecommendationsError(data.error || "Failed to fetch recommendations");
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommendationsError("Unable to load recommendations. Please check if the recommendation service is running.");
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [cartItems]);
   useEffect(() => {
  if (cartItems.length > 0 && sessionActive) {
    fetchRecommendations();
  } else {
    setRecommendations([]);
  }
}, [cartItems, sessionActive, fetchRecommendations]);



  const updateQuantity = async (productId, newQty) => {
    if (newQty <= 0) {
      await removeItem(productId);
      return;
    }

    try {
      const cartItemRef = ref(database, `sessions/${userId}/products/${productId}`);
      await update(cartItemRef, { qty: newQty });

      setCartItems((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, qty: newQty } : item
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (productId) => {
    try {
      const cartItemRef = ref(database, `sessions/${userId}/products/${productId}`);
      await remove(cartItemRef);
      setCartItems((prev) => prev.filter((item) => item.id !== productId));
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const incrementQuantity = (productId, currentQty) => {
    updateQuantity(productId, currentQty + 1);
  };

  const decrementQuantity = (productId, currentQty) => {
    if (currentQty > 1) {
      updateQuantity(productId, currentQty - 1);
    } else {
      removeItem(productId);
    }
  };

  const handleQuantityDropdownChange = (productId, newQty) => {
    updateQuantity(productId, parseInt(newQty));
  };

  const handleCheckout = async () => {
    try {
      const cartRef = ref(database, `sessions/${userId}/products`);
      await remove(cartRef);
      const sessionRef = ref(database, `sessions/${userId}`);
      await update(sessionRef, {
        checkedOut: true,
        checkoutAt: new Date().toISOString(),
      });

      setShowModal(false);
      setCartItems([]);
      setRecommendations([]);
      alert("✅ Thank you for shopping!");
    } catch (error) {
      console.error("Checkout failed:", error);
    }
  };

  const addRecommendationToCart = async (rec) => {
    try {
      const cartItemRef = ref(database, `sessions/${userId}/products/${rec.name.replace(/[.#$/[\]]/g, "_")}`);
      const existingItem = await get(cartItemRef);
      const currentQty = existingItem.exists() ? existingItem.val().qty : 0;

      await update(cartItemRef, {
        name: rec.name,
        price: rec.price,
        qty: currentQty + 1,
      });

      const snapshot = await get(ref(database, `sessions/${userId}/products`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formatted = Object.entries(data).map(([key, val]) => ({
          id: key,
          ...val,
        }));
        setCartItems(formatted);
      }

      alert(`✅ Added ${rec.name} to cart!`);
    } catch (error) {
      console.error("Error adding recommendation:", error);
      alert("❌ Failed to add item to cart");
    }
  };

  if (!sessionActive) {
    return (
      <div className="session-inactive-message">
        <h2>Session Inactive</h2>
        <p>Your session is currently inactive. Please activate it to view your cart.</p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>🛒 Your cart is empty.</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p className="item-price">₹{item.price} each</p>
                </div>

                <div className="quantity-controls">
                  <button className="qty-btn minus" onClick={() => decrementQuantity(item.id, item.qty)}>−</button>

                  <select
                    className="qty-dropdown"
                    value={item.qty}
                    onChange={(e) => handleQuantityDropdownChange(item.id, e.target.value)}
                  >
                    {quantityOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {!quantityOptions.includes(item.qty) && (
                      <option value={item.qty}>{item.qty}</option>
                    )}
                  </select>

                  <button className="qty-btn plus" onClick={() => incrementQuantity(item.id, item.qty)}>+</button>
                  <div className="item-total">
                  <p>₹{item.price * item.qty}</p>
                </div>

                <button className="remove-btn" onClick={() => removeItem(item.id)} title="Remove item">🗑️</button>
                </div>

                
              </div>
            ))}
          </div>
        <div class="payment">
          <div className="cart-total-1" style={{fontSize:"20px"}}>
            <h5>Total: ₹{totalPrice}</h5>
          </div>

          <div className="checkout-section">
            <Button  className="checkout-btn" onClick={() => setShowModal(true)}>
              Checkout
            </Button>
          </div>
          </div>
        </>
      )}

      {/* Recommendations Section */}
      {cartItems.length > 0 && (
        <div className="recommendations-section">
          <h3>🎯 Recommended for You</h3>

          {loadingRecommendations && (
            <div className="recommendations-loading">
              <div className="loading-spinner"></div>
              <p>Finding perfect recommendations...</p>
            </div>
          )}

          {recommendationsError && (
            <div className="recommendations-error">
              <p>⚠️ {recommendationsError}</p>
              <button className="retry-btn" onClick={fetchRecommendations}>Try Again</button>
            </div>
          )}

          {!loadingRecommendations && !recommendationsError && recommendations.length > 0 && (
            <div className="recommendations-grid">
              {recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <div className="rec-info">
                    <h5>{rec.name}</h5>
                    <p className="rec-category">{rec.category}</p>
                    <p className="rec-price">₹{rec.price}</p>
                    <p className="rec-stock">{rec.stock} in stock</p>
                  </div>
                  <button className="add-rec-btn" onClick={() => addRecommendationToCart(rec)}>Add to Cart</button>
                </div>
              ))}
            </div>
          )}

          {!loadingRecommendations && !recommendationsError && recommendations.length === 0 && (
            <div className="no-recommendations">
              <p>No recommendations available at the moment.</p>
            </div>
          )}
        </div>
      )}

      <CheckoutPopup
        show={showModal}
        handleClose={() => setShowModal(false)}
        cartItems={cartItems}
        totalPrice={totalPrice}
        handleCheckout={handleCheckout}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
        quantityOptions={quantityOptions}
      />
    </div>
  );
};

export default CartView;
