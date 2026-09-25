/* =========================
   PERSONAL OS - DESKTOP (TELA INICIAL)
========================= */

const DesktopFilters = {
  search: "",
  categoryId: "all",
  status: "all",
  showArchived: false,
};

let editingProjectId = null;      // se preenchido, o modal de projeto está editando em vez de criando
let projectImageDraft = null;     // { file } selecionado no modal antes de salvar
let projectTagsCtl = null;

function renderDesktop() {
  renderCategoryFilterOptions();
  renderCategorySelectInProjectModal();
  renderProjectsGrid();
  renderCategoriesManagerList();
}

function getFilteredProjects() {
  return AppState.projects.filter((p) => {
    if (!DesktopFilters.showArchived && p.archived) return false;
    if (DesktopFilters.showArchived && !p.archived) return false;
    if (DesktopFilters.categoryId !== "all" && p.categoryId !== DesktopFilters.categoryId) return false;
    if (DesktopFilters.status !== "all" && p.status !== DesktopFilters.status) return false;
    if (DesktopFilters.search) {
      const q = DesktopFilters.search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.description || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function renderProjectsGrid() {
  const grid = $("#projectsGrid");
  const list = getFilteredProjects();

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-folder2"></i>
        <p>${AppState.projects.length === 0
          ? "Nenhum projeto ainda. Crie o primeiro para começar no ELO."
          : "Nenhum projeto encontrado com esses filtros."}</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(projectCardHtml).join("");

  $all(".project-card", grid).forEach((card) => {
    card.addEventListener("click", () => openProject(card.dataset.id));
  });
}

function projectCardHtml(p) {
  const cat = AppState.categoriesById[p.categoryId];
  const status = STATUS_META[p.status] || STATUS_META.started;
  const progress = p.progress || 0;

  const cover = p.image
    ? `<img src="${p.image}" alt="" class="project-card-img">`
    : `<div class="project-card-placeholder">${escapeHtml((p.name || "?").slice(0, 1).toUpperCase())}</div>`;

  return `
    <article class="project-card${p.archived ? " archived" : ""}" data-id="${p.id}">
      <div class="project-card-cover">${cover}</div>
      <div class="project-card-body">
        <h3 class="project-card-title">${escapeHtml(p.name)}</h3>
        <div class="project-card-meta">
          <span class="project-card-category">${cat ? `${cat.icon || "•"} ${escapeHtml(cat.name)}` : "Sem categoria"}</span>
        </div>
        <div class="project-card-status">
          <span class="status-dot ${status.dot}"></span>${status.label}
        </div>
        <div class="project-progress">
          <div class="project-progress-bar"><div class="project-progress-fill" style="width:${progress}%"></div></div>
          <span class="project-progress-num">${progress}%</span>
        </div>
      </div>
    </article>`;
}

function renderCategoryFilterOptions() {
  const sel = $("#filterCategory");
  if (!sel) return;
  const current = sel.value || "all";
  sel.innerHTML = `<option value="all">Todas as categorias</option>` +
    AppState.categories.map((c) => `<option value="${c.id}">${c.icon || "•"} ${escapeHtml(c.name)}</option>`).join("");
  sel.value = AppState.categories.some((c) => c.id === current) ? current : "all";
}

/* ---------- FILTROS ---------- */

document.addEventListener("DOMContentLoaded", () => {
  $("#searchProjects").addEventListener("input", debounce((e) => {
    DesktopFilters.search = e.target.value.trim();
    renderProjectsGrid();
  }, 150));

  $("#filterCategory").addEventListener("change", (e) => {
    DesktopFilters.categoryId = e.target.value;
    renderProjectsGrid();
  });

  $("#filterStatus").addEventListener("change", (e) => {
    DesktopFilters.status = e.target.value;
    renderProjectsGrid();
  });

  $("#toggleArchived").addEventListener("click", (e) => {
    DesktopFilters.showArchived = !DesktopFilters.showArchived;
    e.currentTarget.classList.toggle("active", DesktopFilters.showArchived);
    e.currentTarget.textContent = DesktopFilters.showArchived ? "Ver ativos" : "Ver arquivados";
    renderProjectsGrid();
  });

  $("#btnNewProject").addEventListener("click", () => openProjectModal());
  $("#btnManageCategories").addEventListener("click", () => openModal("categoriesModal"));

  setupProjectModal();
  setupCategoryModal();
});

/* ---------- MODAL: NOVO / EDITAR PROJETO ---------- */

function setupProjectModal() {
  const form = $("#projectForm");
  const imageInput = $("#projectImageInput");
  const preview = $("#projectImagePreview");

  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    projectImageDraft = file;
    const reader = new FileReader();
    reader.onload = () => { preview.src = reader.result; preview.style.display = "block"; };
    reader.readAsDataURL(file);
  });

  $all("input[name=statusChoice]").forEach((radio) => {
    radio.addEventListener("change", updateStatusChoiceUI);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveProjectFromModal();
  });

  $("#btnOpenNewCategoryFromProject").addEventListener("click", () => {
    openModal("categoriesModal");
  });
}

function updateStatusChoiceUI() {
  $all(".status-choice").forEach((el) => {
    const input = el.querySelector("input");
    el.classList.toggle("selected", input.checked);
  });
}

function openProjectModal(project) {
  editingProjectId = project ? project.id : null;
  projectImageDraft = null;

  $("#projectModalTitle").textContent = project ? "Editar projeto" : "Novo projeto";
  $("#projectName").value = project ? project.name : "";
  $("#projectDescription").value = project ? project.description || "" : "";
  $("#projectStartDate").value = project ? project.startDate || "" : "";
  $("#projectDueDate").value = project ? project.dueDate || "" : "";

  const preview = $("#projectImagePreview");
  if (project && project.image) {
    preview.src = project.image;
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
    preview.src = "";
  }
  $("#projectImageInput").value = "";

  renderCategorySelectInProjectModal(project ? project.categoryId : null);

  const status = (project && project.status) || "started";
  $all("input[name=statusChoice]").forEach((r) => { r.checked = r.value === status; });
  updateStatusChoiceUI();

  $("#projectPriority").value = (project && project.priority) || "normal";

  const tagsList = $("#projectTagsList");
  const tagsInput = $("#projectTagsInput");
  tagsInput.value = "";
  projectTagsCtl = setupTagInput(tagsInput, tagsList, project ? project.tags || [] : []);

  openModal("projectModal");
}

function renderCategorySelectInProjectModal(selectedId) {
  const sel = $("#projectCategory");
  if (!sel) return;
  const current = selectedId !== undefined ? selectedId : sel.value;
  sel.innerHTML =
    `<option value="">Sem categoria</option>` +
    AppState.categories.map((c) => `<option value="${c.id}">${c.icon || "•"} ${escapeHtml(c.name)}</option>`).join("");
  if (current) sel.value = current;
}

function refreshCategorySelects() {
  renderCategorySelectInProjectModal();
  renderCategoryFilterOptions();
}

async function saveProjectFromModal() {
  const name = $("#projectName").value.trim();
  if (!name) { toast("Dê um nome ao projeto.", "error"); return; }

  const statusInput = $all("input[name=statusChoice]").find((r) => r.checked);
  const saveBtn = $("#saveProjectBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Salvando...";

  try {
    const data = {
      name,
      description: $("#projectDescription").value.trim(),
      categoryId: $("#projectCategory").value || null,
      status: statusInput ? statusInput.value : "started",
      priority: $("#projectPriority").value,
      startDate: $("#projectStartDate").value || null,
      dueDate: $("#projectDueDate").value || null,
      tags: projectTagsCtl ? projectTagsCtl.getTags() : [],
    };

    let projectId = editingProjectId;

    if (!projectId) {
      const ref = await DataLayer.createProject(data);
      projectId = ref.id;
    } else {
      await DataLayer.updateProject(projectId, data);
    }

    if (projectImageDraft) {
      const { image, imagePath } = await DataLayer.uploadProjectCover(projectId, projectImageDraft);
      await DataLayer.updateProject(projectId, { image, imagePath });
    }

    closeModal("projectModal");
    toast(editingProjectId ? "Projeto atualizado." : "Projeto criado.");
    editingProjectId = null;
  } catch (err) {
    console.error(err);
    toast("Não foi possível salvar o projeto.", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Salvar projeto";
  }
}

/* ---------- MODAL: CATEGORIAS ---------- */

function setupCategoryModal() {
  $("#categoryForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#categoryName").value.trim();
    const icon = $("#categoryIcon").value.trim();
    if (!name) return;

    try {
      await DataLayer.createCategory({ name, icon });
      $("#categoryName").value = "";
      $("#categoryIcon").value = "";
      toast("Categoria criada.");
    } catch (err) {
      console.error(err);
      toast("Erro ao criar categoria.", "error");
    }
  });
}

function renderCategoriesManagerList() {
  const list = $("#categoriesManagerList");
  if (!list) return;

  if (AppState.categories.length === 0) {
    list.innerHTML = `<p class="muted-small">Nenhuma categoria ainda.</p>`;
    return;
  }

  list.innerHTML = AppState.categories.map((c) => `
    <div class="category-row" data-id="${c.id}">
      <span class="category-row-icon">${escapeHtml(c.icon || "•")}</span>
      <input type="text" class="category-row-name" value="${escapeHtml(c.name)}" data-id="${c.id}">
      <button type="button" class="icon-btn category-delete" data-id="${c.id}" title="Excluir categoria">
        <i class="bi bi-trash3"></i>
      </button>
    </div>`).join("");

  $all(".category-row-name", list).forEach((input) => {
    input.addEventListener("change", async () => {
      const val = input.value.trim();
      if (!val) return;
      try {
        await DataLayer.updateCategory(input.dataset.id, { name: val });
      } catch (err) {
        console.error(err);
        toast("Erro ao renomear categoria.", "error");
      }
    });
  });

  $all(".category-delete", list).forEach((btn) => {
    btn.addEventListener("click", async () => {
      const inUse = AppState.projects.some((p) => p.categoryId === btn.dataset.id);
      const msg = inUse
        ? "Essa categoria está em uso por projetos. Os projetos ficarão sem categoria. Excluir mesmo assim?"
        : "Excluir essa categoria?";
      if (!confirm(msg)) return;
      try {
        await DataLayer.deleteCategory(btn.dataset.id);
        toast("Categoria excluída.");
      } catch (err) {
        console.error(err);
        toast("Erro ao excluir categoria.", "error");
      }
    });
  });
}
