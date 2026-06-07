// src/services/employeeService.js
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

/**
 * Streams all employee documents from the "users" collection, ordered by name.
 */
export const streamEmployees = (callback) => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("name", "asc"));
  
  return onSnapshot(q, (snapshot) => {
    const employees = snapshot.docs.map(document => {
      const data = document.data();
      return {
        id: document.id,
        ...data,
        // Ensure standard formatting for lastActive if it's a Firestore Timestamp
        lastActiveStr: data.lastActive
          ? (data.lastActive.toDate ? data.lastActive.toDate().toLocaleDateString() : String(data.lastActive))
          : 'Never'
      };
    });
    callback(employees);
  }, (error) => {
    console.error("Error streaming employees: ", error);
  });
};

/**
 * Invites a single user. Creates a new user document with status "Pending".
 */
export const inviteUser = async ({ email, phone, role }) => {
  const usersRef = collection(db, "users");
  
  // Generate a friendly initial name based on the email prefix
  const emailPrefix = email.split('@')[0];
  const name = emailPrefix
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return await addDoc(usersRef, {
    name,
    email,
    phone: phone || "",
    role: role || "Viewer",
    status: "Pending",
    leave_bal: 20,
    createdAt: serverTimestamp(),
    lastActive: null
  });
};

/**
 * Updates an employee's role in Firestore.
 */
export const updateUserRole = async (userId, newRole) => {
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, { role: newRole });
};

/**
 * Updates an employee's status in Firestore.
 */
export const updateUserStatus = async (userId, newStatus) => {
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, { status: newStatus });
};

/**
 * Deletes an employee document from Firestore.
 */
export const deleteUser = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  await deleteDoc(userDocRef);
};

/**
 * Performs a bulk import of multiple employees using a Firestore writeBatch.
 */
export const bulkImportEmployees = async (employees) => {
  const batch = writeBatch(db);
  const usersRef = collection(db, "users");
  
  employees.forEach(emp => {
    const newDocRef = doc(usersRef);
    batch.set(newDocRef, {
      name: emp.name || "Unnamed Employee",
      email: emp.email,
      phone: emp.phone || "",
      role: emp.role || "Employee",
      status: emp.status || "Active",
      leave_bal: 20,
      createdAt: serverTimestamp(),
      lastActive: null
    });
  });
  
  await batch.commit();
};
