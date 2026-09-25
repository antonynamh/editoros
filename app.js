/* =========================
   PERSONAL OS - CONTROLADOR PRINCIPAL
========================= */

const STATUS_META = {
  started: { label: "No começo", dot: "status-dot-started" },
  progress: { label: "Em desenvolvimento", dot: "status-dot-progress" },
  done: { label: "Finalizado", dot: "status-dot-done" },
};

const PRIORITY_META = {
  low: { label: "Baixa" },
  normal: { label: "Normal" },
  high: { label: "Alta" },
};

const TASK_STATUS_META = {
  todo: { label: "A fazer" },
  doing: { label: "Em andamento" },
  done: { label: "Concluído" },
};

const ACTIVITY_ICONS = {
  project_created: "bi-folder-plus",
  task_created: "bi-plus-circle",
  task_done: "bi-check2-circle",
  task_reopened: "bi-arrow-counterclockwise",
  note_created: "bi-journal-plus",
  note_edited: "bi-pencil",
  resource_added: "bi-link-45deg",
  file_added: "bi-paperclip",
  journal_entry: "bi-book",
  status_changed: "bi-arrow-repeat",
};

const AppState = {
  categories: [],
  categoriesById: {},
  projects: [],
  currentProjectId: null,
  currentProject: null,
  currentTab: "overview",
  view: "desktop", // "desktop" | "project"
  listeners: {
    global: [],   // categorias, projetos
    project: [],  // listeners da aba/projeto atual (limpos ao trocar)
  },
};

function clearListeners(bucket) {
  AppState.listeners[bucket].forEach((unsub) => { try { unsub(); } catch (e) {} });
  AppState.listeners[bucket] = [];
}

/* Chamado pelo auth.js assim que o usuário loga e os dados iniciais chegam */
window.onUserReady = async function () {
  clearListeners("global");
  clearListeners("project");

  AppState.listeners.global.push(
    DataLayer.watchCategories((cats) => {
      AppState.categories = cats;
      AppState.categoriesById = Object.fromEntries(cats.map((c) => [c.id, c]));
      if (cats.length === 0) {
        DataLayer.seedDefaultCategories().catch((e) => console.error(e));
      }
      if (AppState.view === "desktop") renderDesktop();
      refreshCategorySelects();
    })
  );

  AppState.listeners.global.push(
    DataLayer.watchProjects((projects) => {
      AppState.projects = projects;
      if (AppState.view === "desktop") renderDesktop();
      if (AppState.currentProjectId) {
        const updated = projects.find((p) => p.id === AppState.currentProjectId);
        if (updated) {
          AppState.currentProject = updated;
          if (AppState.view === "project") renderProjectHeader(updated);
        }
      }
    })
  );
};

/* Chamado pelo auth.js ao deslogar */
window.onUserSignedOut = function () {
  clearListeners("global");
  clearListeners("project");
  AppState.categories = [];
  AppState.projects = [];
  AppState.currentProjectId = null;
  AppState.currentProject = null;
  AppState.view = "desktop";
};

/* ---------- NAVEGAÇÃO ---------- */

function goToDesktop() {
  clearListeners("project");
  AppState.view = "desktop";
  AppState.currentProjectId = null;
  AppState.currentProject = null;
  $("#projectView").style.display = "none";
  $("#desktopView").style.display = "block";
  renderDesktop();
}

function openProject(projectId) {
  const project = AppState.projects.find((p) => p.id === projectId);
  if (!project) return;

  clearListeners("project");
  AppState.view = "project";
  AppState.currentProjectId = projectId;
  AppState.currentProject = project;
  AppState.currentTab = "overview";

  $("#desktopView").style.display = "none";
  $("#projectView").style.display = "block";

  renderProjectHeader(project);
  switchProjectTab("overview");
}

document.addEventListener("DOMContentLoaded", () => {
  $("#backToDesktop").addEventListener("click", goToDesktop);

  $all(".project-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchProjectTab(btn.dataset.tab));
  });
});
