// src/services/approvalService.js
import { db } from './firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';

/**
 * Live streams all pending leave and medical requests
 * Collection: leave_requests
 */
export const streamPendingRequests = (callback) => {
  const requestsRef = collection(db, "leave_requests");
  // Query to filter only requests that are waiting for approval
  const q = query(requestsRef, where("status", "==", "Pending"));

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(document => ({
      id: document.id,
      ...document.data()
    }));
    callback(data);
  }, (error) => {
    console.error("Error streaming pending requests: ", error);
  });
};

/**
 * Updates a request status and automatically adjusts employee leave balance if approved
 */
export const updateRequestStatus = async (requestId, employeeId, leaveType, totalDays, newStatus) => {
  const requestDocRef = doc(db, "leave_requests", requestId);
  const employeeDocRef = doc(db, "users", employeeId);

  try {
    // 1. Update the request status to approved or rejected
    await updateDoc(requestDocRef, {
      status: newStatus,
      reviewedAt: new Date(),
      reviewedBy: "manager" // Static fallback until Web Auth is added
    });

    // 2. If approved, deduct the requested days from the employee's balance in Firestore
    if (newStatus === "Approved") {
      await updateDoc(employeeDocRef, {
        // Uses standard field from your ER diagram: leave_bal
        leave_bal: increment(-totalDays)
      });
    }
  } catch (error) {
    console.error(`Failed to execute request decision workflow:`, error);
    throw error;
  }
};