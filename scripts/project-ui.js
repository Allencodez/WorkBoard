import { db } from "./firebase.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { logActivity } from "./activity-engine.js";
import { loadProjectContext } from "./project-context.js";
import { createTask } from "./task-engine.js";

import { animateCount } from "./anime.js";

const projectId = localStorage.getItem("activeProjectId");
// ✅ SAFER EXIT
if (!projectId) {
  alert("No project selected");
  window.location.href = "./team.html";
  throw new Error("Missing projectId");
}

// ================= AUTH =================
const auth = getAuth();

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    const topbarUser = document.getElementById("navUsername");

    if (user && topbarUser) {
      const username = user.email.split("@")[0];
      topbarUser.textContent = username.toUpperCase();

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          username: username,
          createdAt: new Date(),
        });
      }
    }

    if (user) {
      loadProject(user);
    } else {
      alert("You are not logged in");
      window.location.href = "./login.html";
    }
  });
});


// MEMBER RENDERING


function renderMembers(members, ctx, countMap) {
  const membersList = document.getElementById("membersList");
  membersList.innerHTML = "";

  members.forEach((memberEmail) => {
    const isAdmin = memberEmail === ctx.projectData.owner;

    const username =
      ctx.userMap?.[memberEmail] || memberEmail.split("@")[0];

    const div = document.createElement("div");
    div.className = "member-item";

    div.innerHTML = `
      <div class="member-left">
        <span class="member-name">
          ${username}
          ${isAdmin ? `<span class="admin-tag">(Admin)</span>` : ""}
        </span>
      </div>

      <div class="member-right">
        <span class="member-tasks">0 tasks</span>
      </div>
    `;

    membersList.appendChild(div);

    // ✅ SAFE ANIMATION LAYER (no core logic touched)
    const span = div.querySelector(".member-tasks");
    const target = countMap[memberEmail] || 0;

    span.dataset.value = "0";
    span.textContent = "0 tasks";

    requestAnimationFrame(() => {
      animateCount(span, target);
    });
  });
}

// ================= LOAD PROJECT =================
async function loadProject() {
  try {
    const ctx = await loadProjectContext(projectId);

    window.currentCtx = ctx;

    ctx.currentUserEmail = auth.currentUser?.email || null;

    const data = ctx.projectData;

    // 🔥 get selected project
    localStorage.setItem("activeProjectId", projectId);

    // PROJECT CONTEXT FOR LOGACTIVITY

    const projectCtx = {
      projectId: projectId,
      projectName: data.name
    };

    // make it globally accessible
    window.projectCtx = projectCtx;

    const assignTaskBtn = document.getElementById("assignTaskBtn");

    if (assignTaskBtn) {
      if (!ctx.isOwner) {
        assignTaskBtn.disabled = true;
        assignTaskBtn.classList.add("disabled-btn");
        assignTaskBtn.title = "Only admins can assign tasks";
      }
    }


    // ================= OWNER =================
    const ownerEl = document.getElementById("projectOwner");
    if (ownerEl) {
      const ownerEmail = data.owner;
      const ownerName = ctx.userMap?.[ownerEmail] || ownerEmail.split("@")[0];

      ownerEl.textContent = ownerName;
    }

    // ================= DETAILS =================
    document.getElementById("projectDesc").textContent =
      data.description || "No description provided";

    document.getElementById("projectCode").textContent =
      data.inviteCode || "N/A";

    const dateEl = document.getElementById("projectDate");
    if (dateEl && data.createdAt) {
      const date = data.createdAt.toDate
        ? data.createdAt.toDate()
        : new Date(data.createdAt);

      dateEl.textContent = date.toLocaleDateString();
    }

    // ================= ROLE BADGE =================
    const badgeEl = document.getElementById("projectRoleBadge");
    if (badgeEl) {
      if (ctx.isOwner) {
        badgeEl.className = "role-badge admin";
        badgeEl.innerHTML = `
          <img src="../Assets/icons/icons8-shield-48.png" />
          <span>Admin</span>
        `;
      } else if (ctx.isMember) {
        badgeEl.className = "role-badge member";
        badgeEl.innerHTML = `
          <img src="../Assets/icons/icons8-member-48.png" />
          <span>Member</span>
        `;
      } else {
        badgeEl.style.display = "none";
      }
    }

    // ================= TITLE =================
    document.getElementById("projectTitle").textContent = data.name;

    // ================= MEMBERS =================
    const membersList = document.getElementById("membersList");
    const membersCountEl = document.getElementById("memberCount");

    membersList.innerHTML = "";

    const rawMembers = ctx.membersList || [];
    const members = [...new Set(rawMembers)];

    if (!members.includes(data.owner)) {
      members.unshift(data.owner);
    }

    if (membersCountEl) {
      const target = members.length;

      const current = parseInt(membersCountEl.dataset.value || "0");

      // if no change, just ensure correct display
      if (current === target) {
        membersCountEl.textContent = `(${target})`;
        return;
      }

      let start = current;

      const duration = 400;
      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = (target - current) / steps;

      const interval = setInterval(() => {
        start += increment;

        if ((increment > 0 && start >= target) || (increment < 0 && start <= target)) {
          start = target;
          clearInterval(interval);
        }

        membersCountEl.textContent = `(${Math.round(start)})`;
      }, stepTime);

      membersCountEl.dataset.value = target;
    }


    // ================= TASKS (REALTIME) =================
    const taskList = document.getElementById("taskList");

    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId)
    );

    onSnapshot(q, (snapshot) => {

      taskList.innerHTML = "";

      const tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 🔥 CACHE TASKS FOR CANCEL BUTTON
      ctx.tasks = tasks;


      const memberStats = getMemberTaskDisplayCounts(
        tasks,
        ctx.userMap
      );

      const countMap = {};

      memberStats.forEach(member => {
        countMap[member.email] = member.count;
      });


      renderMembers(members, ctx, countMap);

      const taskCountEl = document.getElementById("taskCount");

      if (taskCountEl) {
        const current = parseInt(taskCountEl.dataset.value || "0");

        let start = current;
        const target = tasks.length;

        const duration = 400;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = (target - current) / steps;

        const interval = setInterval(() => {
          start += increment;

          if ((increment > 0 && start >= target) || (increment < 0 && start <= target)) {
            start = target;
            clearInterval(interval);
          }

          taskCountEl.textContent = `(${Math.round(start)})`;
        }, stepTime);

        taskCountEl.dataset.value = target;
      }
      tasks.forEach((task) => renderTaskCard(task, ctx));

    });

  } catch (err) {
    console.error("PROJECT LOAD ERROR:", err);
  }
}

// ================= TASK CARD =================
function renderTaskCard(task, ctx) {
  const taskList = document.getElementById("taskList");

  // ONLY ASSIGNED MEMBERS CAN EDIT TASKS

  const canEdit =
    ctx.isOwner ||
    task.assignee === ctx.currentUserEmail;

  const username =
    ctx.userMap?.[task.assignee] ||
    task.assignee?.split("@")[0] ||
    "Unassigned";

  const statusClass = (task.status || "todo").replace(" ", "-");

  const div = document.createElement("div");
  div.className = `task-card ${statusClass}`; // 🔥 KEY FIX
  div.dataset.id = task.id;
  div.dataset.assignee = task.assignee || "";

  div.innerHTML = `
    <div class="task-card-top" style="justify-content: space-between; align-items: flex-start; display: flex;">
      <div class="tag-actions" style="display: flex; gap: 8px;">
        <span class="priority ${task.priority}">
          ${task.priority}
        </span>
        <span class="status-badge ${statusClass}">
          ${task.status || "todo"}
        </span>
      </div>

      ${canEdit ? `
      <div class="task-actions" style="position: relative;">
        <button class="menu-btn">⋮</button>
        <div class="task-menu hidden">
          <div class="menu-items" data-status="todo">To Do</div>
          <div class="menu-items" data-status="in progress">In Progress</div>
          <div class="menu-items" data-status="done">Done</div>
          ${ctx.isOwner ? '<div class=" menu-delete">Delete</div>' : ""}
        </div>
      </div>
      ` : ""}
    </div>

    <div class="task-card-middle" style="margin-top: 12px; margin-bottom: 12px;">
      <h4 class="task-title">${task.title}</h4>
      <p class="task-desc">${task.desc || ""}</p>
    </div>

    <div class="task-card-bottom">
      <span>Assigned to <strong>${username}</strong></span>
      <span>${task.dueDate ? "Due " + task.dueDate : ""}</span>
    </div>
  `;

  taskList.appendChild(div);
}

// ================= TOGGLE INTERACTION =================

import { updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// TOGGLE MENU
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("menu-btn")) {
    const menu = e.target.nextElementSibling;
    menu.classList.toggle("hidden");
  } else {
    document.querySelectorAll(".task-menu").forEach((menu) => {
      menu.classList.add("hidden");
    });
  }
});

// STATUS UPDATE
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("menu-items")) {

    // STATUS UPDATE PERMISSIONS

    const card = e.target.closest(".task-card");

    const newStatus = e.target.dataset.status;

    console.log("clicked element:", e.target);
    console.log("status:", newStatus);

    if (!newStatus) {
      console.warn("Invalid status click:", e.target);
      return;
    }

    const taskId = card.dataset.id;

    const ctx = window.currentCtx;
    const isOwner = ctx?.isOwner;

    // get assignee from UI (temporary method)
    const taskAssignee = card.dataset.assignee;

    // 🔐 permission check
    const canEdit = isOwner || taskAssignee;

    if (!canEdit) {
      console.warn("Blocked unauthorized status update");
      return;
    }

    // 🔥 UI UPDATE (instant feedback)
    card.classList.remove("todo", "in-progress", "done");
    card.classList.add((newStatus || "").replace(" ", "-"));

    // 🔥 FIRESTORE UPDATE
    await updateDoc(doc(db, "tasks", taskId), {
      status: newStatus,
    });

    await logActivity(
      `moved task to ${newStatus}`,
      card.querySelector(".task-title")?.textContent || "Untitled",
      window.projectCtx
    );
  }

  if (e.target.classList.contains("menu-delete")) {
    const card = e.target.closest(".task-card");
    const taskId = card.dataset.id;

    const ctx = window.currentCtx;

    // 🔐 Admin check
    if (!ctx?.isOwner) {
      console.warn("Unauthorized delete attempt");
      return;
    }

    const modal = document.getElementById("deleteModal");
    const confirmBtn = document.getElementById("confirmDelete");
    const cancelBtn = document.getElementById("cancelDelete");

    // show modal
    modal.classList.remove("hidden");

    // store current task temporarily
    modal.dataset.taskId = taskId;
    modal.dataset.cardId = card.dataset.id;
  }

});


const modal = document.getElementById("deleteModal");
const confirmBtn = document.getElementById("confirmDelete");
const cancelBtn = document.getElementById("cancelDelete");

// ✅ Cancel
cancelBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// ✅ Confirm delete
confirmBtn.addEventListener("click", async () => {
  const taskId = modal.dataset.taskId;

  if (!taskId) return;

  const card = document.querySelector(
    `.task-card[data-id="${taskId}"]`
  );

  const taskTitle =
    card?.querySelector(".task-title")?.textContent || "Untitled";

  // delete from Firestore
  await deleteDoc(doc(db, "tasks", taskId));

  await logActivity(
    "deleted task",
    taskTitle,
    window.projectCtx
  );

  // remove from UI
  if (card) card.remove();

  modal.classList.add("hidden");
});



// ================= BACK NAV =================
document.getElementById("backToProjects")?.addEventListener("click", (e) => {
  e.currentTarget.style.transform = "scale(0.95)";
  // 🔥 CLEAR PROJECT CONTEXT
  localStorage.removeItem("activeProjectId");

  setTimeout(() => {
    window.location.href = "./team.html";
  }, 100);
});

// ================= COPY =================
document.getElementById("copyCodeBtn")?.addEventListener("click", () => {
  const code = document.getElementById("projectCode").textContent;
  navigator.clipboard.writeText(code);
});

// ================= INLINE FORM =================
const assignTaskBtn = document.getElementById("assignTaskBtn");

function showTaskInlineForm(ctx) {
  const taskList = document.getElementById("taskList");

  const members = [...new Set(ctx.membersList || [])];

  if (!members.includes(ctx.projectData.owner)) {
    members.unshift(ctx.projectData.owner);
  }

  const options = members
    .map((email) => {
      const name = ctx.userMap?.[email] || email.split("@")[0];

      return `<option value="${email}">${name}</option>`;
    })
    .join("");

  taskList.innerHTML = `
  <div class="task-form-card">

    <div class="form-group">
      <input id="inlineTaskTitle" class="task-input" placeholder="Task title" />
    </div>

    <div class="form-group">
      <textarea id="inlineTaskDesc" class="task-textarea" placeholder="Description..."></textarea>
    </div>

    <div class="task-form-row">
      <div class="form-group">
        <label>Assign</label>
        <select id="inlineTaskAssignee" class="task-select">
          <option value="">Assign to...</option>
          ${options}
        </select>
      </div>

      <div class="form-group">
        <label>Priority</label>
        <select id="inlineTaskPriority" class="task-select">
          <option value="low">Low</option>
          <option value="medium" selected>Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>

    <div class="task-form-row">
      <div class="form-group">
        <label>Status</label>
        <select id="inlineTaskStatus" class="task-select">
          <option value="todo">To Do</option>
          <option value="in progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div class="form-group">
        <label>Due Date</label>
        <input id="inlineTaskDue" type="date" class="task-date" />
      </div>
    </div>

    <div class="task-form-actions">
      <button id="cancelTask" type="button" class="btn-cancel">Cancel</button>
      <button id="saveTask" type="button" class="btn-create">Create</button>
    </div>

  </div>
`;
}

assignTaskBtn?.addEventListener("click", () => {
  showTaskInlineForm(window.currentCtx); // or store ctx globally
});

// ================= CREATE TASK =================
document.addEventListener("click", async (e) => {
  if (e.target.id === "saveTask") {
    const title = document.getElementById("inlineTaskTitle").value.trim();
    const desc = document.getElementById("inlineTaskDesc").value.trim();
    const priority = document.getElementById("inlineTaskPriority").value;
    const dueDate = document.getElementById("inlineTaskDue").value;
    const assignee = document.getElementById("inlineTaskAssignee").value;

    if (!title) return alert("Task title required");
    if (!desc) return alert("Task description required");

    await createTask({
      title,
      desc,
      priority,
      dueDate,
      status: "todo",
      assignee: assignee,
      projectId,
    });

    loadProject();
  }

  if (e.target.id === "cancelTask") {
    const taskList = document.getElementById("taskList");
    if (taskList) {
      taskList.innerHTML = "";
    }
    
    // Restore the tasks from cache
    if (window.currentCtx && window.currentCtx.tasks) {
      window.currentCtx.tasks.forEach(task => renderTaskCard(task, window.currentCtx));
    }
  }
});

// ================= TASK COUNT IMPLEMENTATION =================

function getMemberTaskCounts(tasks) {
  const counts = {};

  tasks.forEach((task) => {
    const member = task.assignee;

    if (!member) return;

    if (!counts[member]) {
      counts[member] = 0;
    }

    counts[member] += 1;
  });

  return counts;
}

// ================= TASK COUNT + USERMAP IMPLEMENTATION =================

function getMemberTaskDisplayCounts(tasks, userMap) {
  const counts = {};

  tasks.forEach((task) => {
    const email = task.assignee;

    if (!email) return;

    if (!counts[email]) {
      counts[email] = 0;
    }

    counts[email] += 1;
  });

  return Object.keys(counts).map((email) => ({
    email,
    name: userMap?.[email] || email.split("@")[0],
    count: counts[email],
  }));
}

// ================= RENDER TASK COUNT PER MEMBER =================

function renderMemberStats(stats) {
  const container = document.getElementById("memberStatsContainer");

  container.innerHTML = stats.map(member => `
    <div class="member-stat-card">
      <div class="member-name">${member.name}</div>
      <div class="member-count">${member.count} tasks</div>
    </div>
  `).join("");
}

// ================= ACTIVITY =================
document.getElementById("activityBtn")?.addEventListener("click", () => {
  window.location.href = "./activity.html";
});
