import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const CheckoutPopup = ({ 
  show, 
  handleClose, 
  cartItems, 
  totalPrice, 
  handleCheckout, 
  updateQuantity, 
  removeItem, 
  quantityOptions 
}) => {
  
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

  const handleQuantityDropdownChange = (productId, newQuantity) => {
    updateQuantity(productId, parseInt(newQuantity));
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Checkout Confirmation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="checkout-items">
          <h5 className="mb-3">Review Your Order:</h5>
          {cartItems.map((item) => (
            <div key={item.id} className="checkout-item">
              <div className="checkout-item-info">
                <strong className="item-name">{item.name}</strong>
                <div className="item-price">₹{item.price} each</div>
              </div>
              
              <div className="quantity-controls">
                <button 
                  className="quantity-btn minus-btn"
                  onClick={() => decrementQuantity(item.id, item.qty)}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                
                <select 
                  className="quantity-dropdown"
                  value={item.qty}
                  onChange={(e) => handleQuantityDropdownChange(item.id, e.target.value)}
                >
                  {quantityOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  {/* Add current quantity if it's not in the preset options */}
                  {!quantityOptions.includes(item.qty) && (
                    <option value={item.qty}>{item.qty}</option>
                  )}
                </select>
                
                <button 
                  className="quantity-btn plus-btn"
                  onClick={() => incrementQuantity(item.id, item.qty)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              
              <div className="item-subtotal">
                <strong>₹{item.qty * item.price}</strong>
              </div>
              
              <button 
                className="remove-item-btn"
                onClick={() => removeItem(item.id)}
                aria-label="Remove item"
                title="Remove item"
              >
                🗑️
              </button>
            </div>
          ))}
          
          <div className="checkout-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{totalPrice}</span>
            </div>
            <div className="summary-row">
              <span>Tax (0%):</span>
              <span>₹0</span>
            </div>
            <div className="summary-row total-row">
              <strong>Total: ₹{totalPrice}</strong>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Continue Shopping
        </Button>
        <Button variant="primary" onClick={handleCheckout} size="lg">
          Confirm Order (₹{totalPrice})
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CheckoutPopup;
