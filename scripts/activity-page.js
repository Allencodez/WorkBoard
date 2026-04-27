import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

  // ================= AUTH =================
  const auth = getAuth();

  onAuthStateChanged(auth, (user) => {
    const topbarUser = document.getElementById("navUsername");

    if (user && topbarUser) {
      const name = user.email.split("@")[0];
      topbarUser.textContent = name.toUpperCase();
    }
  });

  // ================= ACTIVITY FEED =================
  // ❌ REMOVED: Firestore listener (now handled by activity-ui.js)

  const container = document.getElementById("activityFeedList");

  if (!container) {
    console.error("Activity container not found");
    return;
  }

  // 🔥 NOTE:
  // Activity rendering is now controlled by activity-ui.js only.
  // This page does NOT fetch or render activities anymore.

});



