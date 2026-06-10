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

    // 🔥 REAL SOURCE OF TRUTH
    const isProjectTask = !!task.projectId;

    const docRef = await addDoc(collection(db, "tasks"), {
      ...task,

      // override safely
      projectId: task.projectId || null,
      isProjectTask,

      createdAt: new Date()
    });

    console.log("TASK CREATED:", docRef.id);

    await logActivity("created", task.title);

    return docRef.id;

  } catch (err) {
  console.error("CREATE TASK ERROR:", err);
  throw err; // 🔥 CRITICAL: propagate failure
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