export async function loadSidebar() {
  const sidebarContainer = document.getElementById("sidebar-container");

  if (!sidebarContainer) return;

  const basePath = window.location.pathname.includes('/pages/') ? '../pages/' : './pages/';
const res = await fetch(basePath + 'sidebar.html');

  const html = await res.text();

  sidebarContainer.innerHTML = html;

  initSidebarLogic();

}


function initSidebarLogic() {
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const overlay = document.getElementById("overlay");

  // OPEN / CLOSE
  menuBtn?.addEventListener("click", () => {
    console.log("Clicked");
    sidebar.classList.add("open");
    overlay.classList.add("show");
  });

  overlay?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });

  // ACTIVE STATE BASED ON URL
  const path = window.location.pathname;

  let page = "";

  if (path.includes("dashboard") || path === "/") page = "dashboard";
  if (path.includes("tasks")) page = "tasks";
  if (path.includes("team")) page = "team";
  if (path.includes("activity")) page = "activity";

  document.querySelectorAll(".menu-item").forEach(item => {
    item.classList.remove("active");

    if (item.dataset.page === page) {
      item.classList.add("active");
    }
  });
}