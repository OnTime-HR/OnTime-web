// src/services/approvalService.js
import { db } from './firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';

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
 * Updates a request status, adjusts employee leave balance, and fires a notification
 */
// NEW: Added rejectionReason as the 6th parameter
export const updateRequestStatus = async (requestId, employeeId, leaveType, totalDays, newStatus, rejectionReason = "") => {
  const requestDocRef = doc(db, "leave_requests", requestId);
  const employeeDocRef = doc(db, "users", employeeId);

  try {
    // 1. Update the request status
    const updatePayload = {
      status: newStatus,
      reviewedAt: serverTimestamp(), // Much more accurate than new Date()
      reviewedBy: "System Admin"     // FIXED: Upgraded from "manager"
    };

    // If rejected, attach the reason so the employee can read it later
    if (newStatus === "Rejected" && rejectionReason) {
      updatePayload.rejectionReason = rejectionReason;
    }

    await updateDoc(requestDocRef, updatePayload);

    // 2. If approved, deduct the requested days from the employee's balance
    if (newStatus === "Approved") {
      await updateDoc(employeeDocRef, {
        leave_bal: increment(-totalDays)
      });
    }

    // 3. NEW: Fire a notification directly to the employee's account!
    // This targets the specific sub-collection your Flutter app is likely listening to
    const notificationsRef = collection(db, "users", employeeId, "notifications");
    
    await addDoc(notificationsRef, {
      title: `Leave Request ${newStatus}`,
      message: newStatus === "Approved" 
        ? `Your request for ${totalDays} day(s) of ${leaveType} has been approved.` 
        : `Your request for ${leaveType} was rejected. Reason: ${rejectionReason}`,
      type: "leave_update",
      isRead: false,
      createdAt: serverTimestamp(),
      relatedRequestId: requestId
    });

  } catch (error) {
    console.error(`Failed to execute request decision workflow:`, error);
    throw error;
  }
};