import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { cartAPI } from '../api';

const CartPage: React.FC = () => {
  const { items, setItems, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCartItems = async () => {
      if (isAuthenticated && user) {
        try {
          const cartItems = await cartAPI.getCartItems(user.customerid);
          
          if (Array.isArray(cartItems) && cartItems.length > 0) {
             
          }
          setItems(cartItems);
          
        
        } catch (error) {
          console.error('Failed to fetch cart items:', error);
        }
      }
    };

    fetchCartItems();
  }, [isAuthenticated, user, setItems]);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  const handleRemoveFromCart = async (productID: number) => {
    if (isAuthenticated && user) {
      try {
        await cartAPI.removeCartItem(user.customerid, productID);
        removeFromCart(productID);
      } catch (error) {
        console.error('Failed to remove cart item:', error);
      }
    }
  };

  const handleClearCart = async () => {
    if (isAuthenticated && user) {
      try {
        await cartAPI.clearCart(user.customerid );
        clearCart();
      } catch (error) {
        console.error('Failed to clear cart :', error);
      }
    }
  };

  const handleUpdateCart = async (productID: number, quantity:number) => {
    if (isAuthenticated && user) {
      try {
        await cartAPI.updateCartItem(user.customerid, productID, quantity );
        updateQuantity(productID, quantity);
      } catch (error) {
        console.error('Failed to update cart item:', error);
      }
    }
  };

  const handleQuantityChange = (productID: number, value: string) => {
    var newValue = Math.max(1, parseInt(value, 10)) ;
    // if (newValue === 0 || isNaN(newValue)) {
    //    newValue=null;
    // }
    updateQuantity(productID, newValue);
  };

  const handleQuantityBlur = (productID: number, quantity: number) => {
    if(quantity === 0 || isNaN(quantity)) {
      quantity = 1;

    }
    handleUpdateCart(productID, quantity);
  };
  if(!user){
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-medium text-gray-900 mb-2">Your are not logged in</h2>
        <p className="text-gray-600 mb-6">Log in to view your cart</p>
        <Link
          to="/products"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Start Shopping
        </Link>
      </div>
    </div>
    );
  }
  if (items.length === 0) {
    
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Looks like you haven't added any products to your cart yet.</p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <ul className="divide-y divide-gray-200">
              {items.map((item) => (
                <li key={item.productID} className="p-6">
                  <div className="flex items-center">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={`http://localhost:8000${item.image_path}?t=${new Date().getTime()}`}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                      />
                      
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            <Link to={`/products/${item.productID}`} className="hover:text-indigo-600">
                              {item.product_stock}
                            </Link>
                          </h3>
                          {/* <p className="mt-1 text-sm text-gray-500">{item.category}</p> */}
                        </div>
                        <p className="text-lg font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center border border-gray-300 rounded-md">
  {/* Decrease Quantity Button */}
  <button 
    onClick={() => handleUpdateCart(item.productID, Math.max(1, item.quantity - 1))}
    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
  >
    -
  </button>

  {/* Input Field with Proper Restriction */}
  <input
    type="number"
    min="1"
    max={item.product_stock} // ✅ Ensures max limit is set
    value={item.quantity}
    onChange={(e) => {
      const newQuantity = Number(e.target.value);
      if (newQuantity >= 1 && newQuantity <= item.product_stock) {
        handleQuantityChange(item.productID, String(newQuantity));
      }
    }}
    onBlur={() => {
      if (item.quantity > item.product_stock) {
        handleUpdateCart(item.productID, item.product_stock); // ✅ Corrects overflow
      } else if (item.quantity < 1) {
        handleUpdateCart(item.productID, 1); // ✅ Corrects underflow
      }
    }}
    className="w-12 text-center border-0 focus:ring-0"
  />

  {/* Increase Quantity Button */}
  <button 
    onClick={() => {
      if (item.quantity < item.product_stock) {
        handleUpdateCart(item.productID, item.quantity + 1);
      }
    }}
    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
    disabled={item.quantity >= item.product_stock} // ✅ Disables button when max reached
  >
    +
  </button>
</div>

                        
                        <button
                          onClick={() => handleRemoveFromCart(item.productID)}
                          className="text-red-500 hover:text-red-700 flex items-center"
                        >
                          <Trash2 className="h-5 w-5 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
              <Link to="/products" className="text-indigo-600 hover:text-indigo-800 flex items-center">
                <ChevronLeft className="h-5 w-5 mr-1" />
                Continue Shopping
              </Link>
              <button
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-800"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-base text-gray-600">
                <p>Subtotal</p>
                <p>${getTotalPrice().toFixed(2)}</p>
              </div>
              
              <div className="flex justify-between text-base text-gray-600">
                <p>Shipping</p>
                <p>Calculated at checkout</p>
              </div>
              
              <div className="flex justify-between text-base text-gray-600">
                <p>Tax</p>
                <p>Calculated at checkout</p>
              </div>
              
              <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-medium text-gray-900">
                <p>Total</p>
                <p>${getTotalPrice().toFixed(2)}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleCheckout}
                className="w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Checkout
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>or</p>
              <button
                onClick={() => clearCart()}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;