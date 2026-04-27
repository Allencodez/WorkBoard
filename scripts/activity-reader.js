import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

export function listenToActivities(limitCount, callback) {
  const q = query(
    collection(db, "activities"),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    callback(limitCount ? data.slice(0, limitCount) : data);
  });
}