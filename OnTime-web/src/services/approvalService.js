// src/services/approvalService.js
import { db } from './firebase';
// REMOVED arrayUnion, ADDED getDoc
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';

export const streamPendingRequests = (callback) => {
  const requestsRef = collection(db, "leave_requests");
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

export const updateRequestStatus = async (requestId, employeeId, leaveType, totalDays, newStatus, actionReason = "", previousStatus = "Pending") => {
  const requestDocRef = doc(db, "leave_requests", requestId);
  const employeeDocRef = doc(db, "users", employeeId);

  try {
    // 1. Securely fetch the current document first
    const requestSnap = await getDoc(requestDocRef);
    const currentData = requestSnap.exists() ? requestSnap.data() : {};
    
    // Grab the old history list (or start a fresh empty list if it's the first decision)
    const existingHistory = currentData.decisionHistory || []; 

    // 2. Create our new historical log entry
    const newLog = {
      action: newStatus,
      reviewer: "System Admin",
      reason: actionReason || "No reason provided",
      timestamp: new Date().toISOString()
    };

    // 3. Update the request and securely overwrite the history with our combined list
    const updatePayload = {
      status: newStatus,
      reviewedAt: serverTimestamp(), 
      reviewedBy: "System Admin",
      actionReason: actionReason || "", // Keep for fallback purposes
      decisionHistory: [...existingHistory, newLog] // Safely pushes the new log onto the end!
    };

    await updateDoc(requestDocRef, updatePayload);

    // 4. LEAVE BALANCE MATH LOGIC
    let balanceAdjustment = 0;

    if (previousStatus !== "Approved" && newStatus === "Approved") {
      balanceAdjustment = -totalDays; // Deduct
    } else if (previousStatus === "Approved" && newStatus === "Rejected") {
      balanceAdjustment = totalDays;  // Refund
    }

    if (balanceAdjustment !== 0) {
      await updateDoc(employeeDocRef, {
        leave_bal: increment(balanceAdjustment)
      });
    }

    // 5. Fire a notification directly to the employee's account
    const notificationsRef = collection(db, "users", employeeId, "notifications");
    
    await addDoc(notificationsRef, {
      title: `Leave Request ${newStatus}`,
      message: newStatus === "Approved" 
        ? `Your request for ${totalDays} day(s) of ${leaveType} has been approved.` 
        : `Your request for ${leaveType} was rejected/revoked. Reason: ${actionReason}`,
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