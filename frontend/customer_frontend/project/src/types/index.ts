export interface User {
  id: string;
  customerid: number;
  username: string;
  role: string;
  email: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  initializeUser: () => void; 
  login: (email: string, password: string) => Promise<void>;
  register: (firstname: string, lastname: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface Product {
  productID: number;
  name: string;
  description: string;
  price: number;
  image_path: string;
  category: string;
  quantity: number;
  inStock: boolean;
  rating: number;
  reviews: Review[];
  product_stock:number
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CartItem {
  productID: number;
  name: string;
  image_path: string;
  quantity: number;
  price: number;
  product_stock:number
}

export interface CartState {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export interface Address {
  addressID: number;
  customerID: number;
  name: string;
  country: string;
  state: string;
  district: string;
  city: string;
  street: string;
  building_name: string;
  pincode: string;
  phone_number: string;
}


export interface Order {
  orderID: string;
  userId: string;
  products: CartItem[];
  total_price: number;
  status: 'pending' | 'cancelled' | 'shipped' | 'delivered' | 'return_requested' | 'returned' | "return_approved" | "picked_up";
  created_at: string;
  shippingAddress: string;
  paymentMethod: string;
  delivery_address:string
  rejected:boolean
  rejected_reason:string
}

export interface Category {
  categoryID: number;
  parentID: number;
  name: string;
}

export interface Filter {
  category_id: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  rating: number | null;
  sortBy: 'price-asc' | 'price-desc' | 'rating' | 'newest';
}