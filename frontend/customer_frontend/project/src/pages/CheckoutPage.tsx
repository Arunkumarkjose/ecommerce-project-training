import { useEffect, useState } from "react";
import useAuthStore from "../store/authStore"; // Import auth store
import useCartStore from "../store/cartStore"; // Import cart store
import { Address, Order, CartItem } from "../types";
import { addressAPI, ordersAPI } from "../api";
import { useNavigate } from "react-router-dom";

const CheckoutPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { items } = useCartStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [newAddress, setNewAddress] = useState<Omit<Address, "addressID">>({
    customerID: user?.customerid || 0,
    name: "",
    country: "",
    countryID:0,
    state: "",
    district: "",
    city: "",
    street: "",
    building_name: "",
    pincode: "",
    phone_number: "",
  });
  const [orderSummary, setOrderSummary] = useState<Order | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0); // Assuming you have a base total cost



  useEffect(() => {
  const fetchCountries = async () => {
    try {
      const response = await addressAPI.getCountries();
      setCountries(response);
      console.log(response);
    } catch (error) {
      console.error("Error fetching countries", error);
    }
  };

  fetchCountries();
}, []);

  useEffect(() => {
    if (user?.customerid) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      if (user) {
        const data = await addressAPI.getAddresses(user.customerid);
        setAddresses(data);
      }
    } catch (error) {
      console.error("Error fetching addresses", error);
    }
  };

  const handleContinueToReviewOrder = async () => {
    if (!selectedAddress) return;
  
    try {
      const response = await addressAPI.getShippingCharges(selectedAddress.countryID) ;
      console.log(response);
      
      
      
      setShippingCost(response.shipping_cost);
      const itemsprice = items.reduce((total, item) => total + item.price * item.quantity, 0);
      setTotalCost(itemsprice + response.shipping_cost); // Add shipping cost to total
      setStep(2); // Move to the next step
    } catch (error) {
      console.error("Error fetching shipping rate:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    setNewAddress((prev) => ({
      ...prev,
      [name]: name === "countryID" ? Number(value) : value // Ensure countryID is a number
    }));
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addressAPI.addAddress(newAddress);
      fetchAddresses();
      setNewAddress({
        customerID: user?.customerid ?? 0,
        name: "",
        country: "",
        countryID:0,
        state: "",
        district: "",
        city: "",
        street: "",
        building_name: "",
        pincode: "",
        phone_number: "",
      });
      setIsAddressModalOpen(false);
    } catch (error) {
      console.error("Error adding address", error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert("Please select a shipping address");
      return;
    }
    try {
      const orderData = {
        customerID: user?.customerid,  // ✅ Send customer ID
        addressID: selectedAddress.addressID,  // ✅ Send address ID
      };
  
      const response = await ordersAPI.createOrder(orderData); // ✅ Call API
      setOrderSummary(response);
      setStep(3);  // ✅ Move to order confirmation step
    } catch (error) {
      console.error("Error placing order", error);
    }
  };

  const handleOrderPayment = async (orderID: number) => {
    try {
      // Call API to update the order status to "confirmed"
      const response = await ordersAPI.updateOrder(orderID, "confirmed");
      console.log(response)
      if (response.status_code === 200) {
        alert("Payment successful! Order confirmed.");
        // Optionally, refresh the order list or update UI
      } else {
        alert("Failed to confirm order. Please try again.");
      }
      navigate(`/orders/${orderID}`);

      
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("An error occurred while processing payment.");
    }
  };
  
  

  

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h2>

      {/* Step Indicator */}
      <div className="flex justify-between mb-6">
        <span className={`px-4 py-2 rounded ${step === 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}>1. Select Address</span>
        <span className={`px-4 py-2 rounded ${step === 2 ? "bg-blue-500 text-white" : "bg-gray-200"}`}>2. Review Order</span>
        <span className={`px-4 py-2 rounded ${step === 3 ? "bg-blue-500 text-white" : "bg-gray-200"}`}>3. Payment</span>
      </div>

      {/* Step 1: Select Address */}
      {step === 1 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Select a Shipping Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div key={address.addressID} className={`border p-4 rounded shadow-md ${selectedAddress?.addressID === address.addressID ? "border-blue-500" : ""}`}>
                <p>{`${address.name}, ${address.building_name}, ${address.street}, ${address.city}, ${address.district}, ${address.state}, ${address.country}, ${address.pincode}`}</p>
                <p className="text-gray-600">Phone: {address.phone_number}</p>
                <button onClick={() => setSelectedAddress(address)} className="bg-blue-500 text-white px-4 py-2 mt-2 rounded hover:bg-blue-600">
                  Use this Address
                </button>
              </div>
            ))}
          </div>

          <button onClick={() => setIsAddressModalOpen(true)} className="bg-green-500 text-white px-4 py-2 mt-4 rounded hover:bg-green-600">
            Add New Address
          </button>

          <button onClick={handleContinueToReviewOrder} disabled={!selectedAddress} className="bg-indigo-500 text-white px-4 py-2 mt-4 rounded hover:bg-indigo-600 ml-4">
            Continue to Review Order
          </button>
        </div>
      )}

      {/* Step 2: Review Order */}
      {step === 2 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Review Your Order</h3>
          <p className="text-gray-700">Shipping to: {selectedAddress?.name}, {selectedAddress?.street}, {selectedAddress?.city}, {selectedAddress?.pincode}</p>

          {/* Order Items */}
          <div className="border rounded-md p-4 mt-4">
            <h4 className="text-lg font-semibold mb-2">Order Summary</h4>
            <ul>
              {items.map((item) => (
                <li key={item.productID} className="flex justify-between border-b py-2">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            {shippingCost !== null && (
      <div className="mt-4">
        <p className="text-lg">Shipping Cost: <span className="font-bold">${shippingCost.toFixed(2)}</span></p>
      </div>
    )}
           {/* Display Total Price */}
    <div className="mt-4">
      <p className="text-lg">Total Price: <span className="font-bold">${totalCost.toFixed(2)}</span></p>
    </div>
          </div>

          <button onClick={handlePlaceOrder} className="bg-indigo-500 text-white px-4 py-2 mt-4 rounded hover:bg-indigo-600">
            Proceed to Payment
          </button>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && orderSummary && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Payment Details</h3>
          <p>Order ID: {orderSummary.orderID}</p>
          <p>Total: ${orderSummary.total_price}</p>
          <p>Status: {orderSummary.status}</p>
          <button onClick={() => handleOrderPayment(Number(orderSummary.orderID))} className="bg-green-500 text-white px-4 py-2 mt-4 rounded hover:bg-green-600">
            Confirm Payment
          </button>
        </div>
      )}

{/* Modal for adding new address */}
{isAddressModalOpen && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
        <h3 className="text-xl font-semibold mb-4">Add New Address</h3>
        <form onSubmit={handleAddAddress}>
          <div className="grid grid-cols-1 gap-4">
            <input type="text" name="name" value={newAddress.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded" required />
            <label className="block">
                      <span className="text-gray-700">Country</span>
                       <select 
                          name="countryID" 
                          value={newAddress.countryID || ""} 
                          onChange={handleChange} 
                          className="border p-2 rounded w-full mt-1" 
                           required
                         >
                          <option value="">Select Country</option>
                            {countries.map((country) => (
                              <option key={country.id} value={country.id}>
                               {country.name}
                            </option>
                               ))}
                          </select>
                       </label>               <input type="text" name="state" value={newAddress.state} onChange={handleChange} placeholder="State" className="border p-2 rounded" required />
            <input type="text" name="district" value={newAddress.district} onChange={handleChange} placeholder="District" className="border p-2 rounded" required />
            <input type="text" name="city" value={newAddress.city} onChange={handleChange} placeholder="City" className="border p-2 rounded" required />
            <input type="text" name="street" value={newAddress.street} onChange={handleChange} placeholder="Street" className="border p-2 rounded" required />
            <input type="text" name="building_name" value={newAddress.building_name} onChange={handleChange} placeholder="Building Name" className="border p-2 rounded" required />
            <input type="text" name="pincode" value={newAddress.pincode} onChange={handleChange} placeholder="Pincode" className="border p-2 rounded" required />
            <input type="text" name="phone_number" value={newAddress.phone_number} onChange={handleChange} placeholder="Phone Number" className="border p-2 rounded" required />
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => setIsAddressModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600">
              Cancel
            </button>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Add Address
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

    </div>


   
  

  );

};

export default CheckoutPage;
