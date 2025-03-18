import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore";

const ProtectedRoute: React.FC = () => {
  const { user } = useAuthStore(); // Get the authenticated user from the store

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
