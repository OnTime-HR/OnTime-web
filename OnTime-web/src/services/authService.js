// src/services/authService.js
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Step 1: Core Password & Location Validation Gate
 */
export const loginAdminPrimary = async (email, password) => {
  // 1. Authenticate credentials via Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Pull the user's matching Firestore document profile parameters
  const userDocRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    await signOut(auth);
    throw new Error("Unauthorized: No profile records found for this account.");
  }

  const userData = userSnap.data();

  // 3. Strict Role-Based Check: Block everyone except explicitly marked Admins
  if (userData.role !== "Admin") {
    await signOut(auth);
    throw new Error("Access Denied: Web console access restricted to Admins only.");
  }

  // 4. Location Restriction Option: Verify public network parameters
  if (userData.allowedIP && userData.allowedIP !== "ANY" && userData.allowedIP !== "") {
    try {
      // Fetch public client IP using a secure, lightweight endpoint lookup
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      if (ipData.ip !== userData.allowedIP) {
        await signOut(auth);
        throw new Error(`Location Blocked: Access not permitted from IP address ${ipData.ip}.`);
      }
    } catch (ipErr) {
      await signOut(auth);
      throw new Error("Security Check Failed: Unable to verify connection network location.");
    }
  }

  // 5. Generate a lightweight custom 6-digit MFA temporary token via Firestore
  const generatedMfaToken = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set an expiration deadline timestamp (valid for exactly 5 minutes)
  const tokenExpiry = Date.now() + (5 * 60 * 1000); 

  await updateDoc(userDocRef, {
    "webMfaToken": generatedMfaToken,
    "webMfaExpiry": tokenExpiry
  });

  // Log to terminal for local debugging / SMS backend router delivery link
  console.log(`[MFA SIMULATION LOG] Secure OTP sent to ${userData.mfaPhone}: ${generatedMfaToken}`);

  return {
    uid: user.uid,
    companyCode: userData.company_code,
    phoneMask: userData.mfaPhone ? `******${userData.mfaPhone.substring(userData.mfaPhone.length - 4)}` : "Registered Device"
  };
};

/**
 * Step 2: Validate the 6-Digit MFA Session Token
 */
export const verifyMfaToken = async (userId, inputtedToken) => {
  const userDocRef = doc(db, "users", userId);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) throw new Error("Verification profile not found.");
  
  const userData = userSnap.data();

  // Validate presence and matches
  if (!userData.webMfaToken || userData.webMfaToken !== inputtedToken) {
    throw new Error("Invalid verification code. Please check and try again.");
  }

  // Verify expiration window timing limits
  if (Date.now() > userData.webMfaExpiry) {
    throw new Error("Verification code has expired. Please log in again to request a new code.");
  }

  // Clear token fields inside document upon successful validation to prevent reuse attacks
  await updateDoc(userDocRef, {
    "webMfaToken": null,
    "webMfaExpiry": null
  });

  return userData;
};