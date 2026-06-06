// src/services/authService.js
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Validates administrative credentials against Firebase Auth,
 * automates profile seeding into a dedicated 'admins' collection,
 * and executes corporate network location restriction gates.
 * * @param {string} email 
 * @param {string} password 
 * @returns {object} adminData
 */
export const loginAdmin = async (email, password) => {
  // 1. Authenticate login credentials against Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. THE SEPARATE COLLECTION GATE: Read directly from the dedicated 'admins' collection
  const adminDocRef = doc(db, "admins", user.uid);
  const adminSnap = await getDoc(adminDocRef);

  let adminData;

  // 3. THE AUTOMATION STEP: If no admin document exists yet, initialize it inside 'admins'
  if (!adminSnap.exists()) {
    // Generate the initial corporate head profile schema properties
    const newAdminProfile = {
      name: email.split('@')[0], // Falls back to email prefix as a temporary name
      email: email,
      role: "Admin",             // Hardcoded safety assignment
      company_code: "COM100",    // Corporate operational scope token
      allowedIP: "ANY",          // Default configuration to prevent immediate lockout
      createdAt: new Date().toISOString()
    };

    try {
      // Automate document creation inside the 'admins' collection using the User UID as Document ID
      await setDoc(adminDocRef, newAdminProfile);
      adminData = newAdminProfile;
      console.log("Automated Onboarding: Standalone 'admins' collection record created for UID:", user.uid);
    } catch (createErr) {
      // Force signout from Firebase Auth state to maintain system security rules boundaries
      await signOut(auth);
      console.error("Failed to automate profile creation inside 'admins':", createErr);
      throw new Error("Initialization Error: Unable to provision your dedicated admin workspace profile structures.");
    }
  } else {
    // If the profile already exists inside the 'admins' collection, fetch it
    adminData = adminSnap.data();
  }

  // 4. Strict Role Validation: Ensure consistency within the dedicated collection
  if (adminData.role !== "Admin") {
    await signOut(auth);
    throw new Error("Access Denied: Web console access restricted to authorized Admins only.");
  }

  // 5. Network Location Restriction Check
  if (adminData.allowedIP && adminData.allowedIP !== "ANY" && adminData.allowedIP !== "") {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      if (ipData.ip !== adminData.allowedIP) {
        await signOut(auth);
        throw new Error(`Location Blocked: Access not permitted from IP address ${ipData.ip}.`);
      }
    } catch (ipErr) {
      await signOut(auth);
      throw new Error("Security Check Failed: Unable to verify network location bounds.");
    }
  }

  // Return the admin profile metrics to your frontend application state
  return adminData;
};

// Add this to the bottom of src/services/authService.js
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

/**
 * Programmatically invites a new company head.
 * Creates their Auth container, generates their custom 'admins' collection 
 * record, and fires the invitation email template to their inbox automatically.
 * * @param {string} adminEmail 
 * @param {string} companyCode 
 */
export const inviteNewAdmin = async (adminEmail, companyCode = "COM100") => {
  try {
    // 1. Generate a complex temporary secure password string under the hood
    const temporarySecurePassword = Math.random().toString(36).slice(-10) + "A1!_temp";

    // 2. Provision the new account container inside Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, temporarySecurePassword);
    const uid = userCredential.user.uid;

    // 3. Automate profile creation inside your separate 'admins' collection immediately
    const adminDocRef = doc(db, "admins", uid);
    await setDoc(adminDocRef, {
      name: adminEmail.split('@')[0],
      email: adminEmail,
      role: "Admin",
      company_code: companyCode.toUpperCase(),
      allowedIP: "ANY",
      createdAt: new Date().toISOString()
    });

    // 4. Automatically trigger the invitation email link using Firebase's native messaging server
    await sendPasswordResetEmail(auth, adminEmail);

    console.log(`Automated Invite: Link successfully dispatched to ${adminEmail}`);
    return { success: true, message: `Invitation link sent to ${adminEmail}` };
  } catch (error) {
    console.error("Automated Invitation process failed:", error);
    throw new Error(error.message || "Failed to successfully execute invitation routine.");
  }
};