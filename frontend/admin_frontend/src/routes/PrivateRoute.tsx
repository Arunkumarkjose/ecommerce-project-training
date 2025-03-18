import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { token } = useAuth();

  if (!token) {
    // If no token is found, redirect to the sign-in page
    return <Navigate to="/admin/sign-in" replace />;
  }

  // If a token is found, render the requested component
  return children;
};

export default PrivateRoute;