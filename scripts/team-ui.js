import { db } from "./firebase.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { createProject, joinProject } from "./team-engine.js";

// ================= SCOPE IDENTITY =================

let currentProjectId = null;
let currentUserId = null;

// ================= DOM =================
const auth = getAuth();
const formContainer = document.getElementById("teamFormContainer");
const newProjectBtn = document.getElementById("newProjectBtn");
const joinProjectBtn = document.getElementById("joinProjectBtn");
const list = document.getElementById("projectList");

// ================= AUTH =================
document.addEventListener("DOMContentLoaded", () => {

  onAuthStateChanged(auth, (user) => {
    const topbarUser = document.getElementById("navUsername");

    if (user) {
      // ================= UI =================
      if (topbarUser) {
        const name = user.email.split("@")[0];
        topbarUser.textContent = name.toUpperCase();
      }

      // ================= GLOBAL STATE =================
      currentUserId = user.uid;

      // 🔥 IMPORTANT: only load data AFTER user is known
      loadProjects();

    } else {
      currentUserId = null;

      // optional safety reset
      list.innerHTML = "";
      showEmptyState();
    }
  });

});

// ================= BUTTON EVENTS =================
newProjectBtn?.addEventListener("click", showCreateForm);
joinProjectBtn?.addEventListener("click", showJoinForm);

// ================= CREATE FORM =================
function showCreateForm() {
  formContainer.innerHTML = `
    <div class="team-form-card">
      <h3>Create New Project</h3>

      <input id="projectName" placeholder="Project name" />
      <textarea id="projectDesc" placeholder="Project description..."></textarea>

      <div class="team-form-actions">
        <button class="btn-3" id="cancelBtn">Cancel</button>
        <button class="btn-4" id="createBtn">Create</button>
      </div>
    </div>
  `;

  document.getElementById("cancelBtn").onclick = clearForm;

  document.getElementById("createBtn").onclick = async () => {
    const name = document.getElementById("projectName").value.trim();
    const desc = document.getElementById("projectDesc").value.trim();
    const user = auth.currentUser;

    if (!name) return alert("Project name required");

    try {
      await createProject(name, desc, user); // 🔥 ENGINE CALL
      clearForm();
    } catch (err) {
      console.error(err);
      alert("Failed to create project");
    }
  };
}

// ================= JOIN FORM =================
function showJoinForm() {
  formContainer.innerHTML = `
    <div class="team-form-card">
      <h3>Join a Project</h3>

      <input id="inviteCode" placeholder="Enter invite code" />

      <div class="team-form-actions">
        <button class="btn-3" id="cancelBtn">Cancel</button>
        <button class="btn-4" id="joinBtn">Join</button>
      </div>
    </div>
  `;

  document.getElementById("cancelBtn").onclick = clearForm;

  document.getElementById("joinBtn").onclick = async () => {
    const code = document.getElementById("inviteCode").value.trim();
    const user = auth.currentUser;

    if (!code) return alert("Invite code required");

    try {
      await joinProject(code, user); // 🔥 ENGINE CALL
      clearForm();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
}

// ================= CLEAR FORM =================
function clearForm() {
  formContainer.innerHTML = "";
}

// ================= RENDER PROJECT =================

function renderProject(project) {
  const div = document.createElement("div");
  div.className = "project-card";

  // ✅ normalize data safely
  const description = project.description || "";
  const code = project.inviteCode || "NO-CODE";

  const members = Array.isArray(project.members)
    ? project.members.length
    : 0;

  const currentUser = auth.currentUser?.email;

  const isAdmin = project.owner === currentUser;

  const isMember =
    Array.isArray(project.members) &&
    project.members.includes(currentUser);

  // ================= BADGES =================

  const adminBadge = isAdmin
    ? `
      <div class="project-role-badge admin">
        <img src="../Assets/icons/icons8-shield-48.png" class="role-icon" />
        <span>Admin</span>
      </div>
    `
    : "";

  const memberBadge = isMember && !isAdmin
    ? `
      <div class="project-role-badge member">
        <img src="../Assets/icons/icons8-member-48.png" class="role-icon" />
        <span>Member</span>
      </div>
    `
    : "";

  // ================= RENDER =================

  div.innerHTML = `
    ${adminBadge}
    ${memberBadge}

    <h3>${project.name}</h3>
    <p>${description}</p>

    <div class="project-bottom">

      <div class="project-code-wrapper">
        <span class="project-code">
          Code: <strong>${code}</strong>
        </span>

        <img src="../Assets/icons/icons8-copy-24.png"
             class="copy-icon"
             data-code="${code}" />
      </div>

      <div class="project-members">
        <img src="../Assets/icons/icons8-add-user-male-48.png" class="members-icon" />
        <span>${members}</span>
      </div>

    </div>
  `;

   div.addEventListener("click", () => {
  currentProjectId = project.id;

  console.log("Active Project:", currentProjectId);

  // 🔥 optional (next step later)
  // window.location.href = "./project.html";
});

  list.appendChild(div);
}

// ================= COPY =================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("copy-icon")) {
    const icon = e.target;
    const code = icon.dataset.code;

    navigator.clipboard.writeText(code);

    icon.classList.add("copied");
    setTimeout(() => icon.classList.remove("copied"), 300);
  }
});

// ================= EMPTY STATE =================
function hideEmptyState() {
  const empty = document.getElementById("emptyProject");
  if (empty) empty.style.display = "none";
}

function showEmptyState() {
  const empty = document.getElementById("emptyProject");
  if (empty) empty.style.display = "flex";
}

// ================= LOAD PROJECTS =================
function loadProjects() {
  const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    list.innerHTML = "";

    const userEmail = auth.currentUser?.email;

    if (!userEmail) {
      showEmptyState();
      return;
    }

    let hasProjects = false;

    snapshot.forEach(docSnap => {
      const project = docSnap.data();

      const isOwner = project.owner === userEmail;

      const isMember =
        Array.isArray(project.members) &&
        project.members.includes(userEmail);

      // 🔥 ONLY SHOW IF USER BELONGS
      if (isOwner || isMember) {
        hasProjects = true;

        
        renderProject({
  id: docSnap.id, // 🔥 THIS IS CRITICAL
  name: project.name,
  description: project.description,
  inviteCode: project.inviteCode,
  members: project.members,
  owner: project.owner
});
        
      }
    });

    if (!hasProjects) {
      showEmptyState();
    } else {
      hideEmptyState();
    }
  });
}

// ================= ACTIVITY BUTTON =================
const activityBtn = document.getElementById("activityBtn");

activityBtn?.addEventListener("click", () => {
  activityBtn.style.transform = "scale(0.95)";

  setTimeout(() => {
    window.location.href = "./activity.html";
  }, 100);
});