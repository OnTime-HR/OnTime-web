// src/routes/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth'; // Added for safe session tracking
import { doc, getDoc } from 'firebase/firestore';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Track user safely in state

  useEffect(() => {
    // 1. Setup an active listener to catch the real Firebase Auth engine boot timing
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setCurrentUser(firebaseUser);

      try {
        // 2. Pointing directly to your standalone 'admins' collection schema
        const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
        
        if (adminDoc.exists() && adminDoc.data().role === "Admin") {
          setIsAdmin(true);
        } else {
          console.warn(`Unauthorized access attempt: UID ${firebaseUser.uid} not verified in 'admins' collection.`);
        }
      } catch (err) {
        console.error("Administrative role cross-examination failed:", err);
      }
      
      setLoading(false);
    });

    // Clean up the memory subscription listener on component unmount
    return () => unsubscribe();
  }, []);

  // 3. Show a clean loading state while the authentication state initializes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
        Verifying Administrative Credentials...
      </div>
    );
  }

  // 4. If completely unauthenticated, bounce back to the login page safely
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 5. If role matches, render layouts cleanly, otherwise lock them out completely
  return isAdmin ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;