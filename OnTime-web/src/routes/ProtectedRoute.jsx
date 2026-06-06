// src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../services/firebase';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const currentUser = auth.currentUser;

  // Retrieve temporary session status tracking variables from memory storage
  const isMfaVerified = sessionStorage.getItem("isMfaVerified") === "true";

  if (!currentUser) {
    // If not logged in at all, force redirect back to primary login gate
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isMfaVerified) {
    // If authenticated via password but hasn't completed secondary challenge step yet
    return <Navigate to="/verify-mfa" replace />;
  }

  return children;
};

export default ProtectedRoute;