import axios from 'axios';

// Base API URL - replace with your FastAPI backend URL
const API_URL = 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiWithoutInterceptor = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/token', { username:email, password });
    return response.data;
  },
  register: async (firstname: string, lastname: string,email: string,phone:string, password: string) => {
    const response = await api.post('/add-customer', { firstname,lastname, email,phone, password });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (userData: { customerid: number, firstname: string, lastname: string, email: string, phone: string }) => {
    const response = await api.put(`/update-customer/${userData.customerid}`, {
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      phone: userData.phone,
    });
    return response.data;
  },
  TokenRefresh: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await apiWithoutInterceptor.post('/customer-token-refresh', null, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    return response;
  }
};


// Products API
export const productsAPI = {
  getProducts: async (filters?: any) => {
    const response = await api.get('/customer-view-products', { params: filters });
    return response.data;
  },
  getProductById: async (id: number) => {
    const response = await api.get('/customer-view-products', {
      params: { product_id: id }
    });
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get('/customer-view-categories');
    return response.data;
  },
  searchProducts: async (query: string) => {
    const response = await api.get(`/products/search?q=${query}`);
    return response.data;
  },
};

// Cart API
export const cartAPI = {

  
  addProductToCart: async (customerID: number, productID: number, quantity: number, price: number) => {
    const response = await api.post('/add-product-cart', {
      customerID,
      productID,
      quantity,
      price,
    });
    return response.data;
  },


  getCartItems: async (customerID: number) => {
    const response = await api.get('/cart', {
      params: { customerID }
    });
    return response.data;
  },

  removeCartItem: async (customerID:number,productID: number ) => {
    const response = await api.delete('/remove-cart-item', {
      params: {  productID:productID,customerID:customerID }
    });
    return response.data;
  },

  updateCartItem: async (customerID:number, productID: number, quantity: number) => {
    console.log(customerID, productID, quantity);
    const response = await api.put('/update-cart-item', { 
      customerID, 
      productID, 
      quantity 
    });
    return response.data;
  },

  clearCart: async (customerID:number) => {
    const response = await api.put('/clear-cart', { 
      customerID, 
    });
    return response.data;
  },


};

 

// Orders API
export const ordersAPI = {
  createOrder: async (orderData: any) => {
    const response = await api.post('/create-order', orderData);
    return response.data;
  },
  getOrders: async (customerID:number) => {
    const response = await api.get('/view-orders/', {
      params: { customerID }
    });
    return response.data;
  },
  getOrderById: async (id: string) => {
    const response = await api.get(`/view-order/${id}`);
    return response.data;
  },

  updateOrder: async (orderID: number,status:string) => {
    const response = await api.put(`/update-order-status/${orderID}`, {
      status 
    });
    return response.data;
  },
  viewRefund:async(orderID:number)=>{
    const response=await api.get(`/view-refund/${orderID}`,);
    return response.data;
  }
};

export const addressAPI = {
  getAddresses: async (customerID: number) => {
    const response = await api.get('/view-addresses', {
      params: { customerID }
    });
    return response.data;
  },
  getCountries: async () => {
    const response = await api.get('/countries');
    return response.data;
  },
  addAddress: async (addressData: any) => {
    const response = await api.post('/add-address', addressData);
    return response.data;
  },
  deleteAddress: async (addressID: number) => {
    const response = await api.delete(`/delete-address/${addressID}`);
    return response.data;
  },
  updateAddress: async (addressID: number, addressData: any) => {
    const response = await api.put(`/update-address/${addressID}`, addressData);
    return response.data;
  },
  getShippingCharges: async (countryID: number) => {
    const response = await api.get(`/shipping-rate/${countryID}`)
    ;
    return response.data;
  }
};




export default api;


