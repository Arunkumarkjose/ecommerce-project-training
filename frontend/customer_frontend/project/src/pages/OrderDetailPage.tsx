import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ordersAPI } from "../api";
import { Order } from "../types";
import axios from "axios";

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [returning, setReturning] = useState(false);
  const [refundDetails, setRefundDetails] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;

      try {
        const data = await ordersAPI.getOrderById(id);
        setOrder(data);
        console.log("$$$$$$$$$",data)
        console.log("^^^^",data.status)
        if (data.status === "returned" || data.status==="cancelled") {
          console.log("******* refuned")
          fetchRefundDetails(data.orderID);
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const fetchRefundDetails = async (orderID: number) => {
    try {
      const response = await ordersAPI.viewRefund(orderID);
  
      if (response && response.refund_amount) {
        setRefundDetails(response);
      } else {
        setRefundDetails(null);  // Ensure state is null if no valid refund details
      }
  
      console.log("Fetched Refund Details:", response);
    } catch (error) {
      console.error("Failed to fetch refund details:", error);
      setRefundDetails(null);  // Ensure state is null in case of error
    }
  };
  

  const handleUpdateOrder = async (status:string) => {
    if (!order) return;
    
    if (status=="cancelled"){
        const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
        if (!confirmCancel) return;

    setCancelling(true);
    }
    try {
      await ordersAPI.updateOrder(Number(order.orderID),status );
      setOrder((prevOrder) => (prevOrder ? { ...prevOrder, status: status||""} : null));
      if(status=='confirmed'){ 
        alert("Payment successful! Order confirmed.");
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert("Failed to cancel the order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const handleReturnOrder = async () => {
    if (!order) return;

    const confirmReturn = window.confirm("Are you sure you want to return this order?");
    if (!confirmReturn) return;

    setReturning(true);

    try {
      await ordersAPI.updateOrder(Number(order.orderID), "return_requested");
      setOrder((prevOrder) => (prevOrder ? { ...prevOrder, status: "return_requested" } : null));
    } catch (error) {
      console.error("Failed to return order:", error);
      alert("Failed to return the order. Please try again.");
    } finally {
      setReturning(false);
    }
  };

  const handleCancelReturnOrder = async () => {
    if (!order) return;

    const cancelReturn = window.confirm("Are you sure you want to cancel the return?");
    if (!cancelReturn) return;

    try {
      const response = await ordersAPI.updateOrder(Number(order.orderID), "delivered");
      
      // ✅ Check for 303 response
      if (response.status === 303) {
        alert("Return already processed. You can't cancel it at this time.");
        return;
      }

      setOrder((prevOrder) => (prevOrder ? { ...prevOrder, status: "delivered" } : null));
    } catch (error) {
      console.error("Failed to cancel return order:", error);
      alert("Failed to cancel the return. Please try again.");
    }
};


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
        <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or has been removed.</p>
        <Link to="/orders" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/orders" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Orders
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderID}</h1>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100">
              {order.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Delivery charge: <span className="font-bold text-black">${order.ShippingRate}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
  Total amount: <span className="font-bold text-black">${order.total_price}</span>
</p>

          <p className="text-sm text-gray-600 mt-1">Delivery address: {order.delivery_address}</p>
        </div>
        {/* Order Items */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
                  <ul className="divide-y divide-gray-200">
                    {order.products.map((item) => (
                      <li key={item.productID} className="py-4 flex">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                          <img
                            src={`http://localhost:8000${item.image_path}?t=${new Date().getTime()}`}
                            alt={item.name}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                        <div className="ml-4 flex-1 flex flex-col">
                          <div>
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <h3>
                                <Link to={`/products/${item.productID}`} className="hover:text-indigo-600">
                                  {item.name}
                                </Link>
                              </h3>
                              <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex-1 flex items-end justify-between text-sm">
                            <p className="text-gray-500">Qty {item.quantity}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

        {/* Display Status Messages */}
        {order.status === "return_requested" && (
          <p className="px-6 py-4 text-yellow-700 bg-yellow-100 text-center">
            Your return request is waiting to be approved.
          </p>
        )}
        {order.status === "return_approved" && (
          <p className="px-6 py-4 text-blue-700 bg-blue-100 text-center">
            Your return is approved and is waiting to be picked up. Once picked up, the refund will be initiated.
          </p>
        )}
        {order.status === "returned" && refundDetails && (
          <div className="px-6 py-4 bg-green-100 text-green-700 text-center">
            <p>Your refund has been completed.</p>
            <p>
              <strong>Refunded Amount:</strong> ${refundDetails.refund_amount}
            </p>
            <p>
              <strong>Refund Processed On:</strong>{" "}
              {new Date(refundDetails.processed_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {(order.status === "cancelled" )&& (refundDetails != null) && (
          <div className="px-6 py-4 bg-green-100 text-green-700 text-center">
            <p>Your refund has been completed.</p>
            <p>
              <strong>Refunded Amount:</strong> ${refundDetails.refund_amount}
            </p>
            <p>
              <strong>Refund Processed On:</strong>{" "}
              {new Date(refundDetails.processed_at).toLocaleDateString()}
            </p>
          </div>
        )}
        
        
        {order.rejected===true &&(
          <p className="px-6 py-4 text-yellow-700 bg-yellow-100 text-center">
          Your previous return was rejected due to the following reason: 
          <p>{order.rejected_reason}</p>
        </p>
        )}

       {/* Cancel Return Button */}
{(order.status === "return_requested" || order.status === "return_approved") && (
  <div className="px-6 py-4">
    <button
      onClick={handleCancelReturnOrder}
      className="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700"
    >
      Cancel Return
    </button>
  </div>
)}


        {/* Cancel Order Button */}
        {order.status !== 'cancelled' && 
          order.status !== 'delivered' && 
          order.status !== 'return_requested' && 
          order.status !== 'returned' &&
          order.status !== 'return_approved' &&
          order.status !=='picked_up'&& (
          <div className="px-6 py-4">
            <button
              onClick={() => handleUpdateOrder("cancelled")} 
              className="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700"
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          </div>
        )}

        {order.status=='pending' &&(
          <div>
          <p className="px-6 py-4 text-yellow-700 bg-yellow-100 text-center">
          Your payment is pending.
        </p>
          <button
          onClick={() => handleUpdateOrder("confirmed")} 
          className="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          PAY NOW
        </button>
        </div>
        )}

        {/* Request Return Button */}
        {order.status === "delivered" && (
          <div className="px-6 py-4">
            <button
              onClick={handleReturnOrder}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={returning}
            >
              {returning ? "Returning..." : "Return Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;
