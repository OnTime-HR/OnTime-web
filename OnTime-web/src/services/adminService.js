// src/services/adminService.js
import { auth, db } from './firebase';
import { updateEmail, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

export const reauthenticateAdmin = async (currentPassword) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  return await reauthenticateWithCredential(user, credential);
};

export const updateAdminProfileData = async (newName, newEmail, newPassword, currentPassword, newPhotoUrl) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized access.");

  // 1. Update Profile (Name & PhotoURL)
  await updateProfile(user, { 
    displayName: newName,
    photoURL: newPhotoUrl 
  });

  // 2. Sensitive Updates (Email/Password)
  if ((newEmail && newEmail !== user.email) || newPassword) {
    await reauthenticateAdmin(currentPassword);
    if (newEmail && newEmail !== user.email) {
      await updateEmail(user, newEmail);
    }
    if (newPassword) {
      await updatePassword(user, newPassword);
    }
  }

  // 3. FORCE SYNC to Firestore 'admins' collection
  // This uses the UID from the screenshot 'A80Mubt...' to find the correct doc
  const adminDocRef = doc(db, "admins", user.uid);
  await updateDoc(adminDocRef, {
    name: newName,
    email: newEmail,
    updatedAt: new Date().toISOString()
  });
};