import { createContext, useState, useEffect, ReactNode, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Define User type
type User = {
  userID:number
  email: string;
  role: string;
  name:string
  profile_image:string
  
} | null;

// Define AuthContext type
interface AuthContextType {
  user: User;
  setUser: (user: User | null) => void;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create AuthContext with explicit type
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to parse JWT token
function parseJwt(token: string): { sub: string; role: string } | null {
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

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();

  // State variables with proper types
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("access_token"));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refresh_token"));
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Decode token & set user details
  // useEffect(() => {
  //   if (token) {
  //     try {
  //       const decoded = parseJwt(token);
  //       if (decoded) {
  //         setUser({ email: decoded.sub, role: decoded.role });
  //         axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  //       } else {
  //         logout();
  //       }
  //     } catch (error) {
  //       console.error("Invalid token:", error);
  //       logout();
  //     }
  //   } else {
  //     delete axios.defaults.headers.common["Authorization"];
  //   }
  // }, [token]);

  // Auto refresh token before expiry (every 25 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAccessToken();
    }, 15 * 60 * 1000); // Refresh every 25 minutes

    return () => clearInterval(interval);
  }, [refreshToken]);

  // Auto logout after 30 minutes of inactivity
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivity > 30 * 60 * 1000) {
        logout();
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(checkInactivity);
  }, [lastActivity]);

  // Listen for user activity to reset inactivity timer
  useEffect(() => {
    const resetTimer = () => setLastActivity(Date.now());
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    const savedUser = localStorage.getItem("user");
  
    if (savedToken) {
      setToken(savedToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
    }
  
    if (savedUser) {
      setUser(JSON.parse(savedUser)); // Restore user from localStorage
    }
  }, []);

  
  

  // Login function with explicit parameter types
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post("http://localhost:8000/token", {
        username: email, // FastAPI expects "username"
        password: password
      });
      const { access_token, refresh_token, name, image_path, userID, email: userEmail } = response.data;
      // const newToken = response.data.access_token;
      // const newRefreshToken = response.data.refresh_token;

      setToken(access_token);
      setRefreshToken(refresh_token);
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      const decoded = parseJwt(access_token);
      localStorage.setItem("user", JSON.stringify({ 
        name, 
        email: userEmail, 
        role: decoded?.role, 
        profile_image: image_path, 
        userID:userID
      }));
      
      if (decoded) {
        setUser({ name, email: userEmail, role: decoded.role,profile_image: image_path, userID:userID });
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Invalid credentials");
    }
  };

  // Refresh access token using refresh token
  const refreshAccessToken = async () => {
    if (!refreshToken) 
      { 
        console.log("no token");
        return;}
    try {
      const response = await axios.post("http://localhost:8000/refresh", null, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      });
      const newAccessToken = response.data.access_token;
      setToken(newAccessToken);
      localStorage.setItem("access_token", newAccessToken);
    } catch (error) {
      console.error("Failed to refresh token:", error);
      logout();
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");  
    navigate("/admin/sign-in");
  };
  

  return (
    <AuthContext.Provider value={{ user,setUser, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to use AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider };
export default AuthContext;
