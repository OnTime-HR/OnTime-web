// src/routes/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const checkAdminRole = async () => {
      // If no authenticated session exists, stop immediately
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        // FIXED: Pointing directly to your new, standalone 'admins' collection schema
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        
        if (adminDoc.exists() && adminDoc.data().role === "Admin") {
          setIsAdmin(true);
        } else {
          console.warn(`Unauthorized access attempt: UID ${user.uid} not verified in 'admins' collection.`);
        }
      } catch (err) {
        console.error("Administrative role cross-examination failed:", err);
      }
      setLoading(false);
    };

    checkAdminRole();
  }, [user]);

  // If completely unauthenticated, bounce back to the login page card wall
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show a clean, minimalist loading state while Firestore fetches the document profiles
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest">
        Verifying Administrative Credentials...
      </div>
    );
  }

  // If role matches, render layout, otherwise force bounce them out
  return isAdmin ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;