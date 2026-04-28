import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { logActivity } from "./activity-engine.js";

// 🔥 generate invite code
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ================= CREATE PROJECT =================
export async function createProject(name, description, user) {
  const code = generateCode();

  const ref = await addDoc(collection(db, "projects"), {
    name,
    description,
    inviteCode: code,
    owner: user.email,
    members: [user.email],
    createdAt: serverTimestamp()
  });

  await logActivity("Created project", name);

  return ref.id;
}

// ================= JOIN PROJECT =================
export async function joinProject(inviteCode, user) {
  const q = query(
    collection(db, "projects"),
    where("inviteCode", "==", inviteCode)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("Invalid invite code");
  }

  const projectDoc = snap.docs[0];
  const projectData = projectDoc.data();

  const currentMembers = projectData.members || [];

  // 🔥 CHECK: already a member
  if (currentMembers.includes(user.email)) {
    throw new Error("You're already in this project");
  }

  // 🔥 ADD USER
  await updateDoc(doc(db, "projects", projectDoc.id), {
    members: arrayUnion(user.email)
  });

  await logActivity("Joined project", projectData.name);

  return projectDoc.id;
}