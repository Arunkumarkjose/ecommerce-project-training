import { create } from 'zustand';
import { authAPI } from '../api';
import { AuthState, User } from '../types';
import axios from 'axios';
import useCartStore from '../store/cartStore';
import { cartAPI } from '../api';

const ACCESS_TOKEN_EXPIRE_MINUTES = 180;
const REFRESH_TOKEN_EXPIRE_DAYS = 7;

const useAuthStore = create<AuthState>((set) => {
  const token = localStorage.getItem('token');
  let user: User | null = null;
  let isAuthenticated = false;

  function parseJwt(token: string): { sub: string; role: string; customerid: number; firstName: string; lastName: string; phone: string; iat: number } | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Failed to parse JWT:", e);
      return null;
    }
  }

  if (token) {
    try {
      const decoded = parseJwt(token);
      if (decoded) {
        user = { id: decoded.sub, customerid: 0, role: decoded.role, username: '', name: '', email: '' } as User;
      }
      isAuthenticated = true;
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } catch (error) {
      localStorage.removeItem('token');
    }
  }

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      console.log("No refresh token available");
      logout(); // Logout if refresh token is missing
      return;
    }
    try {
      const response = await authAPI.TokenRefresh();
      const newAccessToken = response.data.access_token;
      set({ token: newAccessToken });
      localStorage.setItem("token", newAccessToken);
      console.log("refreshed access")
      console.log(newAccessToken)
      console.log(localStorage.getItem("token"))
      axios.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      logout(); // Logout if refresh token fails
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    const { setItems } = useCartStore.getState();
    setItems([]);
    delete axios.defaults.headers.common["Authorization"];
  };

  // Periodic token refresh
  const startTokenRefresh = () => {
    const accessTokenRefreshInterval = (ACCESS_TOKEN_EXPIRE_MINUTES - 1) * 60 * 1000; // Refresh 1 minute before expiry
    const refreshTokenExpiryTime = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    // Check and refresh access token periodically
    setInterval(async () => {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        logout();
        return;
      }

      const refreshTokenCreatedAt = parseJwt(refreshToken)?.iat || 0;
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if refresh token has expired
      if (currentTime - refreshTokenCreatedAt > refreshTokenExpiryTime / 1000) {
        console.log("Refresh token expired");
        logout();
        return;
      }

      // Refresh access token
      await refreshAccessToken();
    }, accessTokenRefreshInterval);
  };

  // Start token refresh on initialization
  startTokenRefresh();

  return {
    user,
    token,
    isAuthenticated,

    login: async (email, password) => {
      try {
        const response = await authAPI.login(email, password);
        const { access_token, refresh_token, firstname, lastname, customerid, email: userEmail, phone } = response;
        console.log(response);
        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        const decoded = parseJwt(access_token);
        if (decoded) {
          set({
            token: access_token,
            user: { id: decoded.sub, customerid: customerid, username: '', phone: phone, firstName: firstname, lastName: lastname, email: userEmail, role: decoded.role },
            isAuthenticated: true,
          });
          axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

          // Fetch and set cart items
          const { setItems } = useCartStore.getState();
          const cartItems = await cartAPI.getCartItems(customerid);
          setItems(cartItems);
        }
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },

    register: async (firstname: string, lastname: string, email: string, phone: string, password: string) => {
      try {
        const data = await authAPI.register(firstname, lastname, email, phone, password);
        console.log(data);
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    },

    logout,

    setUser: (user: User | null) => set({ user }),

    initializeUser: () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = parseJwt(token);
          if (decoded) {
            const user = { id: "", email: decoded.sub, customerid: decoded.customerid, role: decoded.role, username: '', name: '', firstName: decoded.firstName, lastName: decoded.lastName, phone: decoded.phone } as User;
            set({
              token,
              user,
              isAuthenticated: true,
            });
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

            // Fetch and set cart items
            const { setItems } = useCartStore.getState();
            cartAPI.getCartItems(user.customerid).then(setItems).catch(console.error);
          }
        } catch (error) {
          console.error('Failed to initialize user:', error);
          localStorage.removeItem('token');
        }
      }
    }
  };
});

export default useAuthStore;


