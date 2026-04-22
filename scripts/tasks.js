import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const container = document.getElementById("tasksList");

const tasksRef = collection(db, "tasks");


// 🔥 REALTIME LISTENER

let allTasks = [];

onSnapshot(tasksRef, (snapshot) => {
  allTasks = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  renderTasks(allTasks);
});

// 🎯 RENDER FUNCTION
function renderTasks(tasks) {
  container.innerHTML = tasks
    .map(
      (task) => `
    <div class="task-card ${task.status}">
      
      <div class="task-card-inner">

        <div class="task-top">
          <span class="task-priority ${task.priority}">
            ${task.priority}
          </span>

          <span class="task-status">
            ${task.status}
          </span>
        </div>

        <h4 class="task-title">${task.title}</h4>

        <div class="task-bottom">
          <span class="task-date">${task.dueDate || ""}</span>
        </div>

        <!-- ACTIONS -->
        <div class="task-actions">
          <button onclick="updateStatus('${
            task.id
          }', 'in progress')">Start</button>
          <button onclick="updateStatus('${task.id}', 'done')">Done</button>
          <button onclick="deleteTask('${task.id}')">Delete</button>
        </div>

      </div>

    </div>
  `
    )
    .join("");
}

// DELETE FUNCTION

window.deleteTask = async (id) => {
  await deleteDoc(doc(db, "tasks", id));
};

// UPDATE STATUS

window.updateStatus = async (id, status) => {
  await updateDoc(doc(db, "tasks", id), {
    status,
  });
};

// 🔥 SEARCH LISTENER

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();

    if (!value) {
      renderTasks(allTasks); // 🔥 RESET
      return;
    }

    const filtered = allTasks.filter((task) =>
      task.title.toLowerCase().includes(value)
    );

    renderTasks(filtered);
  });
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
