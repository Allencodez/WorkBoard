import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { logActivity } from "./activity-engine.js";

// ================= CREATE TASK =================
export async function createTask(task) {
  try {
    const docRef = await addDoc(collection(db, "tasks"), {
      ...task,
      createdAt: new Date()
    });

    console.log("TASK CREATED:", docRef.id);
    
    // Log the activity
    await logActivity("created", task.title);

    return docRef.id;

  } catch (err) {
    console.error("CREATE TASK ERROR:", err);
  }
}



// ================= GET TASKS =================
export async function getTasks() {
  const snapshot = await getDocs(collection(db, "tasks"));

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}


// ================= DELETE TASK =================
export async function deleteTask(taskId) {
  try {
    await deleteDoc(doc(db, "tasks", taskId));
    console.log("TASK DELETED:", taskId);
  } catch (err) {
    console.error(err);
  }
}