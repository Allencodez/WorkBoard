import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const activityFeedList = document.getElementById("activityFeedList");
const emptyActivity = document.querySelector(".empty-activity");

function formatTimestamp(timestamp) {
  if (!timestamp) return "Just now";

  const date = timestamp.toDate();

  // 🔥 Force both values into UTC-based comparison
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

function renderActivities(activities, currentUserEmail) {
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

    // Highlight "You" if it's the current user, otherwise show their username
    const displayActor = isCurrentUser
      ? `<strong>You</strong>`
      : `<strong>${actorEmail.split('@')[0]}</strong>`;

    let actionMap = {
      "Task Created": "created",
      "Task Updated": "updated",
      "Task Deleted": "deleted",
      "Task Completed": "completed"
    };

    let actionText = actionMap[act.action] || act.action; // e.g. "created", "deleted", "updated to in progress"

    return `
  <div class="activity-item ${actionText}">
    
    <div class="activity-left">

      <div class="activity-icon">
        ${getActivityIcon(act.action)}
      </div>

      <div class="activity-text">
        ${displayActor} <span>${actionText}</span> 
        <strong>“${act.taskTitle}”</strong>
      </div>

    </div>

    <div class="activity-time">
      ${formatTimestamp(act.timestamp)}
    </div>

  </div>
`;

  }).join("");
}

// Listen for Auth to know who "You" is
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  const currentUserEmail = user ? user.email : null;

  // Real-time listener for activities
  const q = query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(5));

  onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // ✅ DEBUG LOGS (PUT HERE)
    console.log("RAW ACTIVITIES:", activities);

    activities.forEach(act => {
      console.log("TIMESTAMP RAW:", act.timestamp);
      console.log("TIMESTAMP CONVERTED:", act.timestamp?.toDate?.());
    });

    renderActivities(activities, currentUserEmail);
  }, (error) => {
    console.error("Activity fetch error:", error);
  });

});

// GET ACTIVITY FUNCTION

function getActivityIcon(action) {
  if (!action) return "📌";

  const normalized = action.toLowerCase().trim();

  if (normalized.includes("created")) return "🟢";
  if (normalized.includes("updated")) return "🟡";
  if (normalized.includes("deleted")) return "🔴";
  if (normalized.includes("completed")) return "✅";

  return "📌";
}
