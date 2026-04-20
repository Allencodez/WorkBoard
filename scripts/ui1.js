import { createTask, getTasks} from "./task-engine.js";

console.log("getTasks import:", getTasks);



// ================= SIDEBAR =================
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const overlay = document.getElementById("overlay");

if (menuBtn && sidebar && overlay) {
  menuBtn.addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.classList.add("show");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });
}

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


const createBtn = document.querySelector(".button-primary");

createBtn?.addEventListener("click", async () => {
  console.log("CREATE BUTTON CLICKED");

  const modalEl = document.getElementById("modal");

  const title = modalEl.querySelector('input[type="text"]').value.trim();
  const desc = modalEl.querySelector("textarea").value.trim();
  const priority = modalEl.querySelectorAll("select")[0].value;
  const dueDate = modalEl.querySelector('input[type="date"]').value;
  const status = modalEl.querySelectorAll("select")[1].value;

  console.log("TITLE VALUE:", title); // debug

  if (!title) {
    alert("Task title is required");
    return;
  }

  await createTask({
    title,
    desc,
    priority,
    dueDate,
    status,
    assignee
  });

  closeModal();
  await loadTasks();


  console.log("REAL TASK SENT");

  // clear fields
  modalEl.querySelector('input[type="text"]').value = "";
  modalEl.querySelector("textarea").value = "";
  modalEl.querySelector('input[type="date"]').value = "";

  closeModal();
});

// ================= ACTIVE SIDEBAR =================
const menuItems = document.querySelectorAll(".menu-item");

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelector(".menu-item.active")?.classList.remove("active");
    item.classList.add("active");
  });
});

const user = JSON.parse(localStorage.getItem("workboard_user"));

const welcomeHeader = document.querySelector(".welcome h1");

if (user && welcomeHeader) {
  welcomeHeader.textContent = `Welcome back, ${user.name}`;
}

const tasksContainer = document.querySelector(".empty-tasks");

async function loadTasks() {
  const tasks = await getTasks();

  console.log("LOADED TASKS:", tasks);

  if (!tasks.length) return;

  tasksContainer.innerHTML = tasks.map(task => {
    return `
      <div class="task-card">
        <h4>${task.title}</h4>
        <p>${task.desc || ""}</p>
      </div>
    `;
  }).join("");
 
  if (emptyState && tasks.length > 0) {
  emptyState.style.display = "none";
}

}