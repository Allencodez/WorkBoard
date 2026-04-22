import { createTask } from "./task-engine.js";
import { db } from "./firebase.js";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";



// ================= MODAL =================
const modal = document.getElementById("modal");
const openBtn1 = document.getElementById("openModal");
const openBtn2 = document.getElementById("openModal2");
const cancelBtn = document.getElementById("cancelModal");

function openModal() {
  if (modal) modal.style.display = "flex";
}

function closeModal() {
  if (modal) modal.style.display = "none";
}

if (openBtn1) openBtn1.addEventListener("click", openModal);
if (openBtn2) openBtn2.addEventListener("click", openModal);

if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

const createBtn = document.getElementById("createTaskBtn");

createBtn?.addEventListener("click", async () => {
  console.log("CREATE CLICKED");

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

    // 🔥 WAIT for Firebase
    await createTask({
      title,
      desc,
      priority,
      dueDate,
      status,
      assignee
    });

    console.log("TASK CREATED SUCCESS");

    // ✅ clear inputs
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDescription").value = "";
    document.getElementById("taskDueDate").value = "";

    // ✅ CLOSE MODAL
    closeModal();

  } catch (error) {
    console.error("CREATE ERROR:", error);
    alert("Task failed to create");
  }
});


// RENDER FUNCTION

function renderTasks(tasks) {
  const container = document.querySelector(".empty-tasks");

  if (!tasks.length) {
    container.innerHTML = `
      <h4>No tasks yet</h4>
      <p>Start organizing your work by creating your first task.</p>
      <button class="cta-btn" id="openModal2">+ Create Task</button>
    `;
    return;
  }

  container.innerHTML = ""; // 🔥 clears duplicates

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = `task-card ${task.status.toLowerCase().replace(" ", "-")}`;

   div.innerHTML = `
  <div class="task-card-inner">

    <div class="task-top">
   <span class="task-priority ${task.priority}">${task.priority}</span>
     <span class="task-status ${task.status.toLowerCase()}">${task.status}</span>
    </div>

    <div class="task-title">
      ${task.title}
    </div>

    <div class="task-bottom">
      <span class="task-date">
       ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ""}
      </span>
    </div>

  </div>
`;

    container.appendChild(div);
  });
}


// ONSNAPSHOT

 const tasksContainer = document.querySelector(".empty-tasks");

const tasksRef = collection(db, "tasks");

const q = query(tasksRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  const tasks = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  const limitedTasks = tasks.slice(0, 5);
renderTasks(limitedTasks);

});

// NOMENCLATURE

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  const welcomeHeader = document.querySelector(".welcome h1");

  if (user && welcomeHeader) {
    const name = user.email.split("@")[0];
    welcomeHeader.textContent = `Welcome back, ${name}`;
  }
});

// AUTO SWITCH ACTRIVE MENU

document.addEventListener("DOMContentLoaded", () => {

  const menuItems = document.querySelectorAll(".menu-item");

  // detect current page
  const path = window.location.pathname;

  let currentPage = "";

  if (path.includes("dashboard.html") || path === "/") {
    currentPage = "dashboard";
  } 
  else if (path.includes("tasks.html")) {
    currentPage = "tasks";
  } 
  else if (path.includes("team")) {
    currentPage = "team";
  } 
  else if (path.includes("activity")) {
    currentPage = "activity";
  }

  // apply active class
  menuItems.forEach(item => {
    item.classList.remove("active");

    if (item.dataset.page === currentPage) {
      item.classList.add("active");
    }
  });

});