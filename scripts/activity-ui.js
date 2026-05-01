import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const activityFeedList = document.getElementById("activityFeedList");
const emptyActivity = document.querySelector(".empty-activity");

let activityFilter = "all";
let allActivities = [];
let userMapCache = {};
let userProjectIds = [];

const fromProject = document.referrer.includes("project");

if (!fromProject) {
  localStorage.removeItem("activeProjectId");
}



/* ===============================
   🟢 SECTION 1: HELPERS
   (Formatting + Icons)
================================ */

function formatTimestamp(timestamp) {
  if (!timestamp) return "Just now";

  const date = timestamp.toDate();

  const now = Date.now();
  const time = date.getTime();

  const diffMs = now - time;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
}

function getActivityIcon(action) {
  if (!action) return "📌";

  const normalized = action.toLowerCase().trim();

  if (normalized.includes("created")) return "🟢";
  if (normalized.includes("updated")) return "🟡";
  if (normalized.includes("deleted")) return "🔴";
  if (normalized.includes("completed")) return "✅";

  return "📌";
}

/* ===============================
   🟡 SECTION 2: UI RENDERING
   (DOM rendering only)
================================ */

function renderActivities(activities, currentUserEmail, userMap) {
  
  if (!activityFeedList) return;

  if (activities.length === 0) {
    if (emptyActivity) emptyActivity.style.display = "flex";
    activityFeedList.innerHTML = "";
    return;
  }

  if (emptyActivity) emptyActivity.style.display = "none";

  activityFeedList.innerHTML = activities.map(act => {
    const actorEmail = act.userEmail || "";
    const isCurrentUser = currentUserEmail && actorEmail === currentUserEmail;

          const username = userMap?.[actorEmail] || actorEmail.split("@")[0];

const displayActor = isCurrentUser
  ? `<strong>You</strong>`
  : `<strong>${username}</strong>`;



    let actionMap = {
      "Task Created": "created",
      "Task Updated": "updated",
      "Task Deleted": "deleted",
      "Task Completed": "completed"
    };

    let actionText = actionMap[act.action] || act.action;

    return `
      <div class="activity-item ${actionText}">
        <div class="activity-left">

          <div class="activity-icon">
            ${getActivityIcon(act.action)}
          </div>

          <div class="activity-text">
            ${displayActor} <span>${actionText}</span> 
             <p>
                    “${act.taskTitle}”
                   ${act.projectName ? `<span class="activity-project">in ${act.projectName}</span>` : ""}
            </p>
          </div>

        </div>

        <div class="activity-time">
          ${formatTimestamp(act.timestamp)}
        </div>

      </div>
    `;
  }).join("");
}


      // USERNAME FETCHER

async function getUserMap() {
  const snap = await getDocs(collection(db, "users"));
  const map = {};
  snap.forEach(doc => {
    const data = doc.data();
    map[data.email] = data.username || data.email.split("@")[0];
  });
  return map;
}

// PROJECT FETCHER
async function loadUserProjects(userEmail) {
  const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const projects = [];
  snap.forEach(docSnap => {
    const project = docSnap.data();
    const isOwner = project.owner === userEmail;
    const isMember = Array.isArray(project.members) && project.members.includes(userEmail);
    if (isOwner || isMember) {
      projects.push({ id: docSnap.id, name: project.name });
    }
  });
  return projects;
}

function populateFilterDropdown(projects) {
  const select = document.getElementById("activityFilter");
  if (!select) return;
  
  if (projects.length > 0) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = "Projects";
    projects.forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  }
}


// REPLACEMENT OF FILTERED DATA


function applyActivityFilter() { 
  if (activityFilter === "personal") {
    return allActivities.filter(act => act.userEmail === window.currentUserEmail && !act.projectId);
  }

  if (activityFilter === "all") {
    return allActivities.filter(act => {
      if (act.userEmail === window.currentUserEmail && !act.projectId) return true;
      if (userProjectIds.includes(act.projectId)) return true;
      return false;
    });
  }

  // specific project selected
  return allActivities.filter(act => act.projectId === activityFilter);
}

  function renderFiltered() {
  const filtered = applyActivityFilter().slice(0, 10);

  console.log("ALL:", allActivities.length);
  console.log("FILTER:", activityFilter);
  console.log("RESULT:", filtered.length);

  renderActivities(filtered, window.currentUserEmail, userMapCache);
}


/* ===============================
   🔵 SECTION 3: APP LOGIC
   (Auth + Firestore listener)
================================ */

const auth = getAuth();

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  
  const currentUserEmail = user.email;
  window.currentUserEmail = currentUserEmail;

  userMapCache = await getUserMap(); // 🔥 LOAD USERNAMES ONCE

  const projects = await loadUserProjects(currentUserEmail);
  userProjectIds = projects.map(p => p.id);
  populateFilterDropdown(projects);

  const select = document.getElementById("activityFilter");
  const initialProjectId = localStorage.getItem("activeProjectId");

  if (initialProjectId && userProjectIds.includes(initialProjectId)) {
    activityFilter = initialProjectId;
    if (select) select.value = initialProjectId;
  } else {
    activityFilter = "all";
    if (select) select.value = "all";
  }

  const q = query(
    collection(db, "activities"),
    orderBy("timestamp", "desc"),
    limit(50)
  );

  select?.addEventListener("change", (e) => {
    activityFilter = e.target.value;
    renderFiltered();
  });

  onSnapshot(q, (snapshot) => {
    allActivities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderFiltered(); 
  });
}); 