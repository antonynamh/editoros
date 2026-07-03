
const APP_VERSION = "1.0";
document.getElementById("appVersion").textContent = `v${APP_VERSION}`;

/* =========================
   EDITOR OS - STATE
========================= */

let projects = JSON.parse(localStorage.getItem("projects")) || [];
let ideas = JSON.parse(localStorage.getItem("ideas")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentProject = JSON.parse(localStorage.getItem("currentProject")) || null;
let energyState = JSON.parse(localStorage.getItem("energyState")) || null;
let monthName = localStorage.getItem("monthName") || "";

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  renderAll();
  setupEvents();
});

/* =========================
   NAVIGATION
========================= */

function setupNavigation() {
  const menuItems = document.querySelectorAll(".menu-item");

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      document.querySelector(".menu-item.active").classList.remove("active");
      item.classList.add("active");

      const section = item.getAttribute("data-section");

      document.querySelectorAll(".section").forEach(sec => {
        sec.classList.remove("active");
      });

      document.getElementById(section).classList.add("active");
    });
  });
}

/* =========================
   EVENTS
========================= */

function setupEvents() {

  /* PROJETO */
  document.getElementById("saveProject").addEventListener("click", () => {
    const name = document.getElementById("projectName").value;
    const status = document.getElementById("projectStatus").value;
    const platform = document.getElementById("projectPlatform").value;

    if (!name) return;

    projects.push({ id: Date.now(), name, status, platform });

    saveProjects();
    renderProjects();

    bootstrap.Modal.getInstance(document.getElementById("projectModal")).hide();

    document.getElementById("projectName").value = "";
    document.getElementById("projectStatus").value = "";
    document.getElementById("projectPlatform").value = "";
  });

  /* IDEIA */
  document.getElementById("saveIdea").addEventListener("click", () => {
    const title = document.getElementById("ideaTitle").value;
    if (!title) return;

    ideas.push({ id: Date.now(), title });

    saveIdeas();
    renderIdeas();

    bootstrap.Modal.getInstance(document.getElementById("ideaModal")).hide();
    document.getElementById("ideaTitle").value = "";
  });

  /* MÊS */
  document.getElementById("monthName").value = monthName;

  document.getElementById("monthName").addEventListener("input", (e) => {
    monthName = e.target.value;
    localStorage.setItem("monthName", monthName);
  });

  document.getElementById("addTaskBtn").addEventListener("click", () => {
    const input = document.getElementById("newTaskInput");
    if (!input.value) return;

    tasks.push({
      id: Date.now(),
      text: input.value,
      done: false
    });

    input.value = "";
    saveTasks();
    renderTasks();
  });

  /* ENERGIA */
  document.querySelectorAll(".btn-energy").forEach(btn => {
    btn.addEventListener("click", () => {
      const level = btn.getAttribute("data-energy");

      energyState = level;
      localStorage.setItem("energyState", JSON.stringify(energyState));

      renderEnergy();
    });
  });
}

/* =========================
   RENDER ALL
========================= */

function renderAll() {
  renderProjects();
  renderIdeas();
  renderTasks();
  renderEnergy();
  renderCurrentProject();
   renderStats();
}

/* =========================
   PROJECTS
========================= */

function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

function renderProjects() {
  const table = document.getElementById("projectsTable");
  table.innerHTML = "";

  projects.forEach(p => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${p.name}</td>
      <td>${p.status}</td>
      <td>${p.platform}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="setCurrent(${p.id})">⭐</button>
        <button class="btn btn-sm btn-info" onclick="editProject(${p.id})">✏</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProject(${p.id})">🗑</button>
      </td>
    `;

    table.appendChild(row);
  });

  renderCurrentProject();
}

function setCurrent(id) {
  currentProject = projects.find(p => p.id === id);
  localStorage.setItem("currentProject", JSON.stringify(currentProject));
  renderCurrentProject();
}

function renderCurrentProject() {
  const container = document.getElementById("currentProject");

  if (!currentProject) {
    container.innerHTML = `<p class="muted">Nenhum projeto selecionado</p>`;
    return;
  }

  container.innerHTML = `
    <h5>${currentProject.name}</h5>
    <p>Status: ${currentProject.status}</p>
    <p>Plataforma: ${currentProject.platform}</p>
  `;
}

function deleteProject(id) {
  projects = projects.filter(p => p.id !== id);
  saveProjects();
  renderProjects();
}

function editProject(id) {
  const p = projects.find(p => p.id === id);
  if (!p) return;

  const newName = prompt("Nome:", p.name);
  const newStatus = prompt("Status:", p.status);
  const newPlatform = prompt("Plataforma:", p.platform);

  if (newName) p.name = newName;
  if (newStatus) p.status = newStatus;
  if (newPlatform) p.platform = newPlatform;

  saveProjects();
  renderProjects();
}

/* =========================
   IDEAS
========================= */

function saveIdeas() {
  localStorage.setItem("ideas", JSON.stringify(ideas));
}

function renderIdeas() {
  const container = document.getElementById("ideasContainer");
  container.innerHTML = "";

  ideas.forEach(i => {
    const div = document.createElement("div");
    div.className = "idea-card";

    div.innerHTML = `
      <h5>${i.title}</h5>
      <button class="btn btn-sm btn-info" onclick="editIdea(${i.id})">Editar</button>
      <button class="btn btn-sm btn-danger" onclick="deleteIdea(${i.id})">Excluir</button>
    `;

    container.appendChild(div);
  });
}

function deleteIdea(id) {
  ideas = ideas.filter(i => i.id !== id);
  saveIdeas();
  renderIdeas();
}

function editIdea(id) {
  const i = ideas.find(i => i.id === id);
  const newTitle = prompt("Editar ideia:", i.title);

  if (newTitle) {
    i.title = newTitle;
    saveIdeas();
    renderIdeas();
  }
}

/* =========================
   TASKS (MONTH)
========================= */

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach(t => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div>
        <input type="checkbox" ${t.done ? "checked" : ""} onchange="toggleTask(${t.id})">
        <span style="margin-left:10px">${t.text}</span>
      </div>
      <button class="btn btn-sm btn-danger" onclick="deleteTask(${t.id})">🗑</button>
    `;

    list.appendChild(li);
  });
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  task.done = !task.done;

  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

/* =========================
   ENERGY
========================= */

function renderEnergy() {
  document.querySelectorAll(".btn-energy").forEach(btn => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-energy") === energyState) {
      btn.classList.add("active");
    }
  });

  const container = document.getElementById("energyTasks");

  let map = {
    alta: ["Editar", "Motion", "After Effects", "Sound Design"],
    media: ["Roteiro", "Referências", "Planejamento"],
    baixa: ["Organizar pastas", "Baixar músicas", "Responder clientes"]
  };

  container.innerHTML = "";

  if (!energyState) return;

  map[energyState].forEach(task => {
    const span = document.createElement("span");
    span.className = "energy-tag";
    span.textContent = task;
    container.appendChild(span);
  });
}

function renderStats() {
  const projectsCount = projects.length;
  const ideasCount = ideas.length;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.done).length;
  const taskProgress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const container = document.getElementById("statsContainer");

  container.innerHTML = `
    <div class="card-custom">
      <h4>📁 Projetos</h4>
      <p>Total: ${projectsCount}</p>
      <p>Ativo: ${currentProject ? currentProject.name : "Nenhum"}</p>
    </div>

    <div class="card-custom">
      <h4>💡 Ideias</h4>
      <p>Total: ${ideasCount}</p>
    </div>

    <div class="card-custom">
      <h4>📅 Tarefas do Mês</h4>
      <p>Total: ${totalTasks}</p>
      <p>Concluídas: ${doneTasks}</p>
      <p>Progresso: ${taskProgress}%</p>
    </div>
  `;
}

const sidebar = document.getElementById("sidebar");
const openBtn = document.getElementById("openSidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function toggleSidebar() {
  sidebar.classList.toggle("active");
  sidebarOverlay.classList.toggle("active");
}

function closeSidebar() {
  sidebar.classList.remove("active");
  sidebarOverlay.classList.remove("active");
}

openBtn.addEventListener("click", toggleSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

// fecha o menu ao escolher uma seção (mobile)
document.querySelectorAll(".menu-item").forEach((item) => {
  item.addEventListener("click", () => {
    if (window.innerWidth <= 768) closeSidebar();
  });
});