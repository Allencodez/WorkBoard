import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ================= LOG ACTIVITY =================
export async function logActivity(action, taskTitle, projectCtx = null) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.warn("No authenticated user, activity not logged.");
      return;
    }

       await addDoc(collection(db, "activities"), {
        action: action,
        taskTitle: taskTitle,
        userEmail: user.email,

         // 🔐 project context (optional)
       projectId: projectCtx?.projectId || null,
       projectName: projectCtx?.projectName || null,

       timestamp: serverTimestamp()
    });


    console.log("Activity logged:", action, taskTitle);
  } catch (err) {
    console.error("LOG ACTIVITY ERROR:", err);
  }
}
