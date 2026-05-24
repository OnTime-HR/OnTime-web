// src/services/shiftService.js
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';

/**
 * Saves a new shift template directly into the nested subcollection structure
 * Path: schedules -> [companyCode] -> days -> [dateStr] -> entries
 */
export const saveShiftTemplate = async (companyCode, dateStr, shiftName) => {
  try {
    const entriesRef = collection(
      db, 
      "schedules", companyCode, 
      "days", dateStr, 
      "entries"
    );

    return await addDoc(entriesRef, {
      createdAt: serverTimestamp(),
      createdBy: "manager", 
      detail: shiftName,
      employeeName: "Unassigned",
      employeePhone: "",
      status: "approved",
      type: "shift"
    });
  } catch (error) {
    console.error("Error writing nested shift document: ", error);
    throw error;
  }
};

/**
 * Sets up a live stream listener for shifts on a specific date path
 */
export const streamShiftsByDate = (companyCode, dateStr, callback) => {
  const entriesRef = collection(db, "schedules", companyCode, "days", dateStr, "entries");
  const q = query(entriesRef, orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const shifts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(shifts);
  }, (error) => {
    console.error(`Error streaming shifts for ${dateStr}: `, error);
  });
};