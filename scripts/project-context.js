import { db } from "./firebase.js";
import { 
  doc, 
  getDoc,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export const projectContext = {
  projectId: null,
  projectData: null,
  currentUserEmail: null,
  isOwner: false,
  isMember: false,
  membersList: [],
  tasksList: [],
  userMap: {} // 🔥 ADDED
};

export async function loadProjectContext(projectId) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("No user logged in");

  const ref = doc(db, "projects", projectId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Project not found");

  const data = snap.data();

  // ================= BASIC PROJECT STATE =================
  projectContext.projectId = projectId;
  projectContext.projectData = data;
  projectContext.currentUserEmail = user.email;

  projectContext.membersList = data.members || [];

  // ================= TASKS =================
const tasksRef = collection(db, "tasks");

const q = query(tasksRef, where("projectId", "==", projectId));

const taskSnap = await getDocs(q);

const tasks = taskSnap.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));

projectContext.tasksList = tasks;

  projectContext.isOwner = data.owner === user.email;

  projectContext.isMember =
    (data.members || []).includes(user.email);

  // ================= USER MAP (🔥 FIX YOU WERE MISSING) =================
  const usersSnap = await getDocs(collection(db, "users"));

  const userMap = {};

  usersSnap.forEach((docSnap) => {
    const u = docSnap.data();

    userMap[u.email] =
      u.username || u.email.split("@")[0];
  });

  projectContext.userMap = userMap;

  return projectContext;
}