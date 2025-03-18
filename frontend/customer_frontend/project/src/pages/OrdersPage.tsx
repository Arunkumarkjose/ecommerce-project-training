import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Search } from 'lucide-react';
import { ordersAPI } from '../api';
import { Order } from '../types';
import useAuthStore from '../store/authStore';
const OrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if(user){
          const data = await ordersAPI.getOrders(user.customerid);
  
          // ✅ Sort orders by latest created_at timestamp (newest first)
          const sortedOrders = data.sort((a: Order, b: Order) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
  
          setOrders(sortedOrders);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchOrders();
  }, []);
  

  const filteredOrders = orders.filter(order => 
    order.orderID.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h1>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search orders by ID..."
          />
        </div>
      </div>
      
      {filteredOrders.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <li key={order.orderID}>
                <Link to={`/orders/${order.orderID}`} className="block hover:bg-gray-50">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Package className="h-6 w-6 text-indigo-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Order #{order.orderID}</p>
                          <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className="ml-4 text-sm font-medium text-gray-900">
  ${Number(order.total_price).toFixed(2)}
</span>
                        <ChevronRight className="ml-4 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {/* {order.items.length} {order.items.length === 1 ? 'item' : 'items'} */}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">No orders found</h2>
          {searchQuery ? (
            <p className="text-gray-600 mb-6">
              No orders match your search. Try a different search term or clear the search.
            </p>
          ) : (
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Start shopping to place your first order!
            </p>
          )}
          <Link
            to="/products"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Browse Products
          </Link>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;