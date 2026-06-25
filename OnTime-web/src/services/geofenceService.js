// src/services/geofenceService.js
import { db } from './firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  GeoPoint,
  setDoc,
  collectionGroup,
  query,
  where,
  getDoc,
  deleteDoc // FIXED: Added missing deleteDoc import
} from 'firebase/firestore';

export const deleteOfficeZone = async (officeId) => {
  const officeDocRef = doc(db, "offices", officeId);
  await deleteDoc(officeDocRef);
};

export const streamOfficeZones = (callback) => {
  const officesCollectionRef = collection(db, "offices");
  return onSnapshot(officesCollectionRef, (snapshot) => {
    const offices = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        radius: data.radius || 0,
        latitude: data.location ? data.location.latitude : 0,
        longitude: data.location ? data.location.longitude : 0
      };
    });
    callback(offices);
  }, (error) => {
    console.error("Error streaming offices collection: ", error);
  });
};

export const streamTodayCheckedInStaff = (dateStr, callback) => {
  const attendanceGroupRef = collectionGroup(db, "attendance");

  const q = query(
    attendanceGroupRef,
    where("date", "==", dateStr),
    where("status", "==", "Present")
  );

  return onSnapshot(q, (snapshot) => {
    const staffList = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const userDocRef = docSnap.ref.parent.parent;
      const userId = userDocRef ? userDocRef.id : 'Unknown ID';

      return {
        id: docSnap.id,
        userId: userId,
        employeeName: "Fetching profile...",
        assignedOfficeId: "",
        checkInTime: data.checkInTime || 'N/A',
        checkInLat: data.checkInLocation ? data.checkInLocation.latitude : null,
        checkInLon: data.checkInLocation ? data.checkInLocation.longitude : null,
        userDocRef: userDocRef
      };
    });

    // Send the base log items to UI immediately
    callback(staffList);

    // Fetch user profiles in background to append real names & assigned locations
    staffList.forEach((staff, index) => {
      if (staff.userDocRef) {
        getDoc(staff.userDocRef).then((userSnap) => {
          if (userSnap.exists()) {
            const userData = userSnap.data();
            staffList[index].employeeName = userData.name || "Unnamed Employee";
            staffList[index].assignedOfficeId = userData.assignedOfficeId || "";
            callback([...staffList]);
          }
        }).catch(err => console.error("Profile sync lookup failed: ", err));
      }
    });

  }, (error) => {
    console.error("Error streaming collectionGroup logs: ", error);
  });
};

export const updateOfficeZone = async (officeId, updatedData) => {
  const officeDocRef = doc(db, "offices", officeId);
  try {
    await updateDoc(officeDocRef, {
      name: updatedData.name,
      radius: Number(updatedData.radius),
      location: new GeoPoint(Number(updatedData.latitude), Number(updatedData.longitude))
    });
  } catch (error) {
    console.error(`Error updating office document ${officeId}:`, error);
    throw error;
  }
};

/**
 * Creates a brand new office zone deployment document in Firestore
 * @param {string} customId - The unique ID for the office (e.g., "FOC_CAMPUS_2")
 * @param {Object} zoneData - Object containing name, radius, latitude, and longitude
 */
export const createOfficeZone = async (customId, zoneData) => {
  // Enforce uppercase formatting with no spaces for document IDs
  const cleanId = customId.trim().toUpperCase().replace(/\s+/g, '_');
  const officeDocRef = doc(db, "offices", cleanId);

  // Verify if an office with this ID already exists
  const docSnap = await getDoc(officeDocRef);
  if (docSnap.exists()) {
    throw new Error(`A zone with the ID "${cleanId}" already exists in the database.`);
  }

  try {
    await setDoc(officeDocRef, {
      name: zoneData.name,
      radius: Number(zoneData.radius),
      location: new GeoPoint(Number(zoneData.latitude), Number(zoneData.longitude))
    });
  } catch (error) {
    console.error(`Error creating new office document ${cleanId}:`, error);
    throw error;
  }
};