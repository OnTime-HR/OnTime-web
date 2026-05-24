// src/services/geofenceService.js
import { db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  GeoPoint, 
  collectionGroup, 
  query, 
  where,
  getDoc
} from 'firebase/firestore';

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