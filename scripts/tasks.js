import { db } from "./firebase.js";
import { createTask } from "./task-engine.js";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { logActivity } from "./activity-engine.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";



let editingTaskId = null;

const container = document.getElementById("tasksList");

const tasksRef = collection(db, "tasks");

// 🔥 REALTIME LISTENER

let allTasks = [];

const q = query(tasksRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  allTasks = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

   if (allTasks.length === 0) {
    return; 
  }

  if (typeof updateTasksView === "function") {
    updateTasksView();
  } else {
    renderTasks(allTasks);
  }
});

// 🎯 RENDER FUNCTION

function renderTasks(tasks, filterStatus = "all") {
  // 🔥 GROUP TASKS BY STATUS
  const grouped = {
    todo: [],
    "in progress": [],
    done: [],
  };

  tasks.forEach((task) => {
    const status = task.status || "todo";
    if (grouped[status]) {
      grouped[status].push(task);
    }
  });

  // 🎯 RENDER COLUMNS

  let html = `<div class="kanban-board">`;

  // 🔥 ALWAYS WORK WITH ACTUAL TASKS (NOT PRE-GROUPED EMPTY STRUCTURE)
  const hasSearch = currentSearch.length > 0;
  const hasFilter = filterStatus !== "all";

  // 🎯 IF SEARCH OR FILTER IS ACTIVE → FLAT MODE (NO EMPTY COLUMNS)
  if (hasSearch || hasFilter) {
    const visibleTasks = tasks;

    const renderFlatColumn = (title, statusKey) => {
      const filtered = visibleTasks.filter(
        (t) => (t.status || "todo") === statusKey
      );

      if (filtered.length === 0) return "";

      return `
  <div class="kanban-column ${statusKey.replace(" ", " -")}">
    <h3 class="column-title">${title}</h3>

    <div class="column-tasks">
      ${filtered
        .map(
          (task) => `
      <div class="task-card ${task.status}">
        <div class="task-card-inner">

          <div class="task-top">

            <span class="task-priority ${task.priority}">
              ${task.priority}
            </span>

            <div class="task-top-right">
              <span class="task-status">${task.status}</span>

              <div class="task-menu">
                <button class="menu-btn">⋮</button>

                <div class="menu-dropdown">
                  <button onclick="openEditTask('${task.id}')">Edit</button>
                  <button onclick="deleteTask('${
                    task.id
                  }', \`${task.title.replace(/`/g, "")}\`)">Delete</button>
                </div>
              </div>
            </div>

          </div>

          <h4 class="task-title">${task.title}</h4>

          ${task.desc ? `<p class="task-desc">${task.desc}</p>` : ""}

        </div>
      </div>
      `
        )
        .join("")}
    </div>
  </div>
  `;
    };

    html += renderFlatColumn("Todo", "todo") || "";
    html += renderFlatColumn("In Progress", "in progress") || "";
    html += renderFlatColumn("Done", "done") || "";
  } else {
    // 🎯 DEFAULT KANBAN MODE
    html += `
  ${renderColumn("Todo", grouped["todo"], "todo")}

  <div class="kanban-right">
    ${renderColumn("In Progress", grouped["in progress"], "in-progress")}
    ${renderColumn("Done", grouped["done"], "done")}
  </div>
  `;
  }

  html += `
</div>`;
  container.innerHTML = html;
}

function renderColumn(title, tasks, status) {
  return `
<div class="kanban-column ${status.replace(" ", " -")}">

  <h3 class="column-title">${title}</h3>

  <div class="column-tasks">
    ${
      tasks.length === 0
        ? `<div class="empty-column-card">
        <h4>No ${title.toLowerCase()} tasks</h4>
        <p>Tasks in this section will appear here when created or moved.</p>
      </div>`
        : tasks
            .map(
              (task) => `
    <div class="task-card ${task.status} priority-${task.priority}">

      <div class="task-top">

        <span class="task-priority ${task.priority}">
          ${task.priority}
        </span>

        <div class="task-top-right">
          <span class="task-status">${task.status}</span>

          <div class="task-menu">
            <button class="menu-btn">⋮</button>

            <div class="menu-dropdown">
              <button onclick="openEditTask('${task.id}')">Edit</button>
              <button onclick="deleteTask('${task.id}', \`${task.title.replace(
                /`/g,
                ""
              )}\`)">Delete</button>
            </div>
          </div>
        </div>

      </div>

      <h4 class="task-title">${task.title}</h4>

      ${task.desc ? `<p class="task-desc">${task.desc}</p>` : ""}

      <div class="task-bottom">
        <span class="task-date">
          ${
            task.createdAt
              ? new Date(task.createdAt.seconds * 1000).toLocaleDateString()
              : ""
          }
        </span>
      </div>

      <div class="task-actions">
        <button onclick="updateStatus('${
          task.id
        }', 'todo', \`${task.title.replace(/`/g, "")}\`)"> Todo</button>
        <button onclick="updateStatus('${
          task.id
        }', 'in progress', \`${task.title.replace(/`/g, "")}\`)">Start</button>
        <button onclick="updateStatus('${
          task.id
        }', 'done', \`${task.title.replace(/`/g, "")}\`)">Done</button>
      </div>
    </div>

  </div>
  `
            )
            .join("")
    }
</div>

</div>
`;
}

// DELETE FUNCTION

window.deleteTask = async (id, title) => {
  await deleteDoc(doc(db, "tasks", id));

  await logActivity("Task Deleted", title);
};

// UPDATE STATUS

window.updateStatus = async (id, status, title) => {
  await updateDoc(doc(db, "tasks", id), {
    status,
  });

  await logActivity(`Task Updated (${status})`, title);
};

// EDIT TASK
window.openEditTask = (id) => {
  const task = allTasks.find((t) => t.id === id);
  if (!task) return;

  editingTaskId = id;

  document.getElementById("taskTitle").value = task.title || "";
  document.getElementById("taskDescription").value = task.desc || "";
  document.getElementById("taskPriority").value = task.priority || "medium";
  document.getElementById("taskDueDate").value = task.dueDate || "";
  document.getElementById("taskStatus").value = task.status || "todo";

  const modal = document.getElementById("modal");
  if (modal) modal.style.display = "flex";
};

// 🔥 SEARCH & FILTER LISTENER

let currentSearch = "";
let currentFilterStatus = "all";

window.updateTasksView = function () {
  let filtered = allTasks;
  if (currentSearch) {
    filtered = filtered.filter((task) =>
      task.title.toLowerCase().includes(currentSearch)
    );
  }
  if (currentFilterStatus !== "all") {
    filtered = filtered.filter(
      (task) => task.status && task.status.toLowerCase() === currentFilterStatus
    );
  }
  renderTasks(filtered, currentFilterStatus);
};

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentSearch = searchInput.value.toLowerCase();
      updateTasksView();
    });
  }

  const filterSelect = document.getElementById("filterSelect");
  if (filterSelect) {
    filterSelect.addEventListener("change", (e) => {
      if (e.target.value !== "default") {
        currentFilterStatus = e.target.value;
        updateTasksView();
        filterSelect.value = "default";
      }
    });
  }
});

// MENU SWITCH LOGIC

const menuItems = document.querySelectorAll(".menu-item");

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    // remove active from all
    menuItems.forEach((i) => i.classList.remove("active"));

    // add active to clicked
    item.classList.add("active");
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll(".menu-item");

  // detect current page
  const path = window.location.pathname;

  let currentPage = "";

  if (path.includes("index.html") || path === "/") {
    currentPage = "dashboard";
  } else if (path.includes("tasks.html")) {
    currentPage = "tasks";
  } else if (path.includes("team")) {
    currentPage = "team";
  } else if (path.includes("activity")) {
    currentPage = "activity";
  }

  // apply active class
  menuItems.forEach((item) => {
    item.classList.remove("active");

    if (item.dataset.page === currentPage) {
      item.classList.add("active");
    }
  });
});

// ================= MODAL & CREATE TASK =================
const modal = document.getElementById("modal");
const openBtn = document.getElementById("openModal");
const cancelBtn = document.getElementById("cancelModal");

if (openBtn)
  openBtn.addEventListener("click", () => {
    if (modal) modal.style.display = "flex";
  });
if (cancelBtn)
  cancelBtn.addEventListener("click", () => {
    if (modal) modal.style.display = "none";
  });
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

const createBtn = document.getElementById("createTaskBtn");
if (createBtn) {
  createBtn.addEventListener("click", async () => {
    try {
      const title = document.getElementById("taskTitle").value.trim();
      const desc = document.getElementById("taskDescription").value.trim();
      const priority = document.getElementById("taskPriority").value;
      const dueDate = document.getElementById("taskDueDate").value;
      const status = document.getElementById("taskStatus").value;
      const assignee = document.getElementById("taskAssignee").value;

      if (!title) {
        alert("Task title is required");
        return;
      }

      // 🔥 EDIT MODE
      if (editingTaskId) {
        await updateDoc(doc(db, "tasks", editingTaskId), {
          title,
          desc,
          priority,
          dueDate,
          status,
          assignee,
        });

        await logActivity("Task Updated", title);

        editingTaskId = null;
      } else {
        // 🔥 CREATE MODE
        await createTask({ title, desc, priority, dueDate, status, assignee });
      }

      // reset form
      document.getElementById("taskTitle").value = "";
      document.getElementById("taskDescription").value = "";
      document.getElementById("taskDueDate").value = "";

      if (modal) modal.style.display = "none";
    } catch (error) {
      console.error(error);
      alert("Task failed");
    }
  });
}

document.addEventListener("click", (e) => {
  const menu = e.target.closest(".task-menu");

  // close all first
  document
    .querySelectorAll(".task-menu")
    .forEach((m) => m.classList.remove("active"));

  if (menu) {
    menu.classList.add("active");
  }
});


const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  const topbarUser = document.querySelector(".topbar-user");
  const welcomeHeader = document.querySelector(".welcome h1");

  if (user) {
    const name = user.email.split("@")[0];

    // RIGHT CORNER NAVBAR (task page)
    if (topbarUser) {
      topbarUser.textContent = name.toUpperCase();
    }

    // optional: if task page also has welcome text
    if (welcomeHeader) {
      welcomeHeader.textContent = `Welcome back, ${name}`;
    }
  }
});
