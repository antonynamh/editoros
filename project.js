/* =========================
   PERSONAL OS - WORKSPACE DO PROJETO
========================= */

let tasksViewMode = "list";      // "list" | "kanban"
let notesSubTab = "notes";       // "notes" | "journal"
let editingNoteId = null;
let editingTaskId = null;

/* ---------- CABEÇALHO ---------- */

function renderProjectHeader(project) {
  const cat = AppState.categoriesById[project.categoryId];
  $("#projectViewTitle").textContent = project.name;
  $("#projectViewCategory").textContent = cat ? `${cat.icon || "•"} ${cat.name}` : "Sem categoria";
  $("#projectViewStatusDot").className = `status-dot ${(STATUS_META[project.status] || STATUS_META.started).dot}`;
  $("#projectViewStatusLabel").textContent = (STATUS_META[project.status] || STATUS_META.started).label;
  if (project.archived) {
    $("#projectViewTitle").insertAdjacentHTML("beforeend", ` <span class="archived-badge">Arquivado</span>`);
  }
}

/* ---------- ROTEAMENTO DE ABAS ---------- */

function switchProjectTab(tab) {
  clearListeners("project");
  AppState.currentTab = tab;

  $all(".project-tab-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));

  const container = $("#projectTabContent");
  container.innerHTML = `<div class="tab-loading">Carregando…</div>`;

  const project = AppState.currentProject;
  if (!project) return;

  switch (tab) {
    case "overview": return renderOverviewTab(container, project);
    case "notes": return renderNotesTab(container, project);
    case "tasks": return renderTasksTab(container, project);
    case "stats": return renderStatsTab(container, project);
    case "resources": return renderResourcesTab(container, project);
    case "files": return renderFilesTab(container, project);
    case "settings": return renderSettingsTab(container, project);
  }
}

/* =========================================================
   VISÃO GERAL
========================================================= */

function renderOverviewTab(container, project) {
  const cat = AppState.categoriesById[project.categoryId];
  const started = daysSince(project.startDate);
  const due = daysUntil(project.dueDate);

  container.innerHTML = `
    <div class="overview-grid">
      <div class="panel">
        <div class="overview-cover">
          ${project.image
            ? `<img src="${project.image}" alt="">`
            : `<div class="project-card-placeholder large">${escapeHtml((project.name || "?").slice(0, 1).toUpperCase())}</div>`}
        </div>
        <p class="overview-description">${project.description ? escapeHtml(project.description) : "<span class=\"muted-small\">Sem descrição.</span>"}</p>

        <div class="overview-facts">
          <div class="fact"><span class="fact-label">Categoria</span><span class="fact-value">${cat ? `${cat.icon || "•"} ${escapeHtml(cat.name)}` : "—"}</span></div>
          <div class="fact"><span class="fact-label">Prioridade</span><span class="fact-value">${PRIORITY_META[project.priority]?.label || "—"}</span></div>
          <div class="fact"><span class="fact-label">Início</span><span class="fact-value">${project.startDate ? formatDateFull(project.startDate) : "—"}</span></div>
          <div class="fact"><span class="fact-label">Prazo</span><span class="fact-value">${project.dueDate ? formatDateFull(project.dueDate) + (due !== null ? ` (${due >= 0 ? `em ${due}d` : `${Math.abs(due)}d atrás`})` : "") : "—"}</span></div>
        </div>

        ${project.tags && project.tags.length ? `<div class="overview-tags">${project.tags.map((t) => `<span class="tag-chip static">#${escapeHtml(t)}</span>`).join("")}</div>` : ""}

        <div class="progress-block">
          <div class="progress-block-head">
            <span>Progresso</span>
            <span>${project.progress || 0}%</span>
          </div>
          <div class="project-progress-bar large"><div class="project-progress-fill" style="width:${project.progress || 0}%"></div></div>
        </div>

        <div class="overview-stats-mini">
          <div><strong>${project.tasksDone || 0}/${project.tasksTotal || 0}</strong><span>tarefas</span></div>
          <div><strong>${project.notesCount || 0}</strong><span>anotações</span></div>
          <div><strong>${project.filesCount || 0}</strong><span>arquivos</span></div>
          <div><strong>${started !== null ? started : "—"}</strong><span>dias desde o início</span></div>
        </div>
      </div>

      <div class="panel">
        <h4 class="panel-title">Próximas tarefas</h4>
        <div id="overviewNextTasks" class="next-tasks-list"><p class="muted-small">Carregando…</p></div>

        <h4 class="panel-title" style="margin-top:24px">Atividade recente</h4>
        <div id="overviewActivity" class="activity-list"><p class="muted-small">Carregando…</p></div>
      </div>
    </div>
  `;

  AppState.listeners.project.push(
    DataLayer.watchTasks(project.id, (tasks) => {
      const next = tasks
        .filter((t) => t.status !== "done")
        .sort((a, b) => {
          if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return 0;
        })
        .slice(0, 5);

      const el = $("#overviewNextTasks");
      if (!el) return;
      el.innerHTML = next.length
        ? next.map((t) => `
            <label class="next-task-item">
              <input type="checkbox" data-id="${t.id}">
              <span>${escapeHtml(t.title)}</span>
              ${t.dueDate ? `<span class="next-task-date">${formatDateShort(t.dueDate)}</span>` : ""}
            </label>`).join("")
        : `<p class="muted-small">Nenhuma tarefa pendente.</p>`;

      $all("input[type=checkbox]", el).forEach((cb) => {
        cb.addEventListener("change", async () => {
          const task = tasks.find((t) => t.id === cb.dataset.id);
          await DataLayer.updateTask(project.id, task.id, { status: "done", completedAt: firebase.firestore.FieldValue.serverTimestamp() }, { completed: true, title: task.title });
        });
      });
    })
  );

  AppState.listeners.project.push(
    DataLayer.watchActivity(project.id, (items) => {
      const el = $("#overviewActivity");
      if (!el) return;
      el.innerHTML = items.length
        ? items.map((a) => `
            <div class="activity-item">
              <i class="bi ${ACTIVITY_ICONS[a.type] || "bi-dot"}"></i>
              <div>
                <p>${escapeHtml(a.message)}</p>
                <span>${formatRelativeDateTime(a.createdAt)}</span>
              </div>
            </div>`).join("")
        : `<p class="muted-small">Nenhuma atividade registrada ainda.</p>`;
    }, 8)
  );
}

/* =========================================================
   ANOTAÇÕES + DIÁRIO
========================================================= */

function renderNotesTab(container, project) {
  container.innerHTML = `
    <div class="subtabs">
      <button class="subtab-btn ${notesSubTab === "notes" ? "active" : ""}" data-sub="notes">Anotações</button>
      <button class="subtab-btn ${notesSubTab === "journal" ? "active" : ""}" data-sub="journal">Diário</button>
    </div>
    <div id="notesSubContent"></div>
  `;

  $all(".subtab-btn", container).forEach((btn) => {
    btn.addEventListener("click", () => {
      notesSubTab = btn.dataset.sub;
      renderNotesTab(container, project);
    });
  });

  if (notesSubTab === "notes") renderNotesList(project);
  else renderJournalList(project);
}

function renderNotesList(project) {
  const el = $("#notesSubContent");
  el.innerHTML = `
    <div class="section-header">
      <span></span>
      <button class="btn-pill" id="btnNewNote"><i class="bi bi-plus-lg"></i> Nova anotação</button>
    </div>
    <div id="notesGrid" class="notes-grid"><p class="muted-small">Carregando…</p></div>
  `;

  $("#btnNewNote").addEventListener("click", () => openNoteEditor(project));

  AppState.listeners.project.push(
    DataLayer.watchNotes(project.id, (notes) => {
      const grid = $("#notesGrid");
      if (!grid) return;
      grid.innerHTML = notes.length
        ? notes.map((n) => `
            <article class="note-card" data-id="${n.id}">
              <h5>${escapeHtml(n.title || "Sem título")}</h5>
              <p>${escapeHtml((n.content || "").slice(0, 140))}</p>
              <span class="note-card-date">Atualizado ${formatRelativeDateTime(n.updatedAt)}</span>
              <button type="button" class="icon-btn note-delete" data-id="${n.id}" title="Excluir"><i class="bi bi-trash3"></i></button>
            </article>`).join("")
        : `<p class="muted-small">Nenhuma anotação ainda.</p>`;

      $all(".note-card", grid).forEach((card) => {
        card.addEventListener("click", (e) => {
          if (e.target.closest(".note-delete")) return;
          const note = notes.find((n) => n.id === card.dataset.id);
          openNoteEditor(project, note);
        });
      });

      $all(".note-delete", grid).forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!confirm("Excluir essa anotação?")) return;
          await DataLayer.deleteNote(project.id, btn.dataset.id);
        });
      });
    })
  );
}

function openNoteEditor(project, note) {
  editingNoteId = note ? note.id : null;
  $("#noteModalTitle").textContent = note ? "Editar anotação" : "Nova anotação";
  $("#noteTitleInput").value = note ? note.title || "" : "";
  $("#noteContentInput").value = note ? note.content || "" : "";
  openModal("noteModal");
}

/* ---------- DIÁRIO ---------- */

function renderJournalList(project) {
  const el = $("#notesSubContent");
  el.innerHTML = `
    <form id="journalForm" class="journal-form">
      <input type="date" id="journalDate" value="${todayISO()}" required>
      <textarea id="journalContent" placeholder="Escreva sobre o desenvolvimento do projeto hoje..." rows="3" required></textarea>
      <button type="submit" class="btn-pill"><i class="bi bi-plus-lg"></i> Adicionar entrada</button>
    </form>
    <div id="journalList" class="journal-list"><p class="muted-small">Carregando…</p></div>
  `;

  $("#journalForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = $("#journalContent").value.trim();
    const date = $("#journalDate").value;
    if (!content) return;
    await DataLayer.createJournalEntry(project.id, { content, date });
    $("#journalContent").value = "";
  });

  AppState.listeners.project.push(
    DataLayer.watchJournal(project.id, (entries) => {
      const list = $("#journalList");
      if (!list) return;
      list.innerHTML = entries.length
        ? entries.map((j) => `
            <div class="journal-entry" data-id="${j.id}">
              <div class="journal-entry-date">${formatDateFull(j.date)}</div>
              <p>${escapeHtml(j.content)}</p>
              <button type="button" class="icon-btn journal-delete" data-id="${j.id}" title="Excluir"><i class="bi bi-trash3"></i></button>
            </div>`).join("")
        : `<p class="muted-small">Nenhuma entrada de diário ainda.</p>`;

      $all(".journal-delete", list).forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm("Excluir essa entrada do diário?")) return;
          await DataLayer.deleteJournalEntry(project.id, btn.dataset.id);
        });
      });
    })
  );
}

document.addEventListener("DOMContentLoaded", () => {
  $("#noteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("#noteTitleInput").value.trim();
    const content = $("#noteContentInput").value.trim();
    const project = AppState.currentProject;
    if (!project) return;

    try {
      if (editingNoteId) {
        await DataLayer.updateNote(project.id, editingNoteId, { title, content });
      } else {
        await DataLayer.createNote(project.id, { title, content });
      }
      closeModal("noteModal");
    } catch (err) {
      console.error(err);
      toast("Erro ao salvar anotação.", "error");
    }
  });
});

/* =========================================================
   TAREFAS (LISTA + KANBAN)
========================================================= */

function renderTasksTab(container, project) {
  container.innerHTML = `
    <div class="section-header">
      <div class="view-toggle">
        <button class="view-toggle-btn ${tasksViewMode === "list" ? "active" : ""}" data-mode="list">Lista</button>
        <button class="view-toggle-btn ${tasksViewMode === "kanban" ? "active" : ""}" data-mode="kanban">Quadro</button>
      </div>
      <button class="btn-pill" id="btnNewTask"><i class="bi bi-plus-lg"></i> Nova tarefa</button>
    </div>
    <div id="tasksContent"><p class="muted-small">Carregando…</p></div>
  `;

  $all(".view-toggle-btn", container).forEach((btn) => {
    btn.addEventListener("click", () => {
      tasksViewMode = btn.dataset.mode;
      renderTasksTab(container, project);
    });
  });

  $("#btnNewTask").addEventListener("click", () => openTaskEditor(project));

  AppState.listeners.project.push(
    DataLayer.watchTasks(project.id, (tasks) => {
      tasksViewMode === "list" ? renderTasksList(project, tasks) : renderTasksKanban(project, tasks);
    })
  );
}

function renderTasksList(project, tasks) {
  const el = $("#tasksContent");
  if (!el) return;

  const sorted = [...tasks].sort((a, b) => {
    if ((a.status === "done") !== (b.status === "done")) return a.status === "done" ? 1 : -1;
    return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
  });

  el.innerHTML = sorted.length
    ? `<ul class="task-list-v2">${sorted.map((t) => `
        <li class="task-row ${t.status === "done" ? "done" : ""}" data-id="${t.id}">
          <input type="checkbox" ${t.status === "done" ? "checked" : ""} class="task-check">
          <div class="task-row-main">
            <span class="task-row-title">${escapeHtml(t.title)}</span>
            <div class="task-row-meta">
              <span class="priority-tag priority-${t.priority}">${PRIORITY_META[t.priority]?.label}</span>
              ${t.dueDate ? `<span class="task-row-date"><i class="bi bi-calendar3"></i> ${formatDateShort(t.dueDate)}</span>` : ""}
            </div>
          </div>
          <button type="button" class="icon-btn task-edit" title="Editar"><i class="bi bi-pencil"></i></button>
          <button type="button" class="icon-btn task-delete" title="Excluir"><i class="bi bi-trash3"></i></button>
        </li>`).join("")}</ul>`
    : `<p class="muted-small">Nenhuma tarefa ainda.</p>`;

  $all(".task-check", el).forEach((cb) => {
    cb.addEventListener("change", async () => {
      const row = cb.closest(".task-row");
      const task = tasks.find((t) => t.id === row.dataset.id);
      const newStatus = cb.checked ? "done" : "todo";
      await DataLayer.updateTask(project.id, task.id,
        { status: newStatus, completedAt: cb.checked ? firebase.firestore.FieldValue.serverTimestamp() : null },
        cb.checked ? { completed: true, title: task.title } : { reopened: true, title: task.title }
      );
    });
  });

  $all(".task-edit", el).forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".task-row");
      openTaskEditor(project, tasks.find((t) => t.id === row.dataset.id));
    });
  });

  $all(".task-delete", el).forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Excluir essa tarefa?")) return;
      const row = btn.closest(".task-row");
      await DataLayer.deleteTask(project.id, row.dataset.id);
    });
  });
}

function renderTasksKanban(project, tasks) {
  const el = $("#tasksContent");
  if (!el) return;

  const columns = ["todo", "doing", "done"];
  el.innerHTML = `
    <div class="kanban-board">
      ${columns.map((col) => `
        <div class="kanban-column" data-status="${col}">
          <div class="kanban-column-head">${TASK_STATUS_META[col].label} <span>${tasks.filter((t) => t.status === col).length}</span></div>
          <div class="kanban-dropzone" data-status="${col}">
            ${tasks.filter((t) => t.status === col).map((t) => `
              <div class="kanban-card" draggable="true" data-id="${t.id}">
                <p>${escapeHtml(t.title)}</p>
                <div class="kanban-card-meta">
                  <span class="priority-tag priority-${t.priority}">${PRIORITY_META[t.priority]?.label}</span>
                  ${t.dueDate ? `<span>${formatDateShort(t.dueDate)}</span>` : ""}
                </div>
              </div>`).join("")}
          </div>
        </div>`).join("")}
    </div>
  `;

  $all(".kanban-card", el).forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", card.dataset.id);
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    card.addEventListener("click", () => openTaskEditor(project, tasks.find((t) => t.id === card.dataset.id)));
  });

  $all(".kanban-dropzone", el).forEach((zone) => {
    zone.addEventListener("dragover", (e) => e.preventDefault());
    zone.addEventListener("drop", async (e) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("text/plain");
      const task = tasks.find((t) => t.id === taskId);
      const newStatus = zone.dataset.status;
      if (!task || task.status === newStatus) return;
      await DataLayer.updateTask(project.id, taskId,
        { status: newStatus, completedAt: newStatus === "done" ? firebase.firestore.FieldValue.serverTimestamp() : null },
        newStatus === "done" ? { completed: true, title: task.title } : undefined
      );
    });
  });
}

function openTaskEditor(project, task) {
  editingTaskId = task ? task.id : null;
  $("#taskModalTitle").textContent = task ? "Editar tarefa" : "Nova tarefa";
  $("#taskTitleInput").value = task ? task.title : "";
  $("#taskDescriptionInput").value = task ? task.description || "" : "";
  $("#taskPriorityInput").value = task ? task.priority : "normal";
  $("#taskDueDateInput").value = task ? task.dueDate || "" : "";
  $("#taskStatusInput").value = task ? task.status : "todo";
  openModal("taskModal");
}

document.addEventListener("DOMContentLoaded", () => {
  $("#taskForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const project = AppState.currentProject;
    if (!project) return;

    const title = $("#taskTitleInput").value.trim();
    if (!title) return;

    const data = {
      title,
      description: $("#taskDescriptionInput").value.trim(),
      priority: $("#taskPriorityInput").value,
      dueDate: $("#taskDueDateInput").value || null,
      status: $("#taskStatusInput").value,
    };

    try {
      if (editingTaskId) {
        await DataLayer.updateTask(project.id, editingTaskId, data);
      } else {
        await DataLayer.createTask(project.id, data);
      }
      closeModal("taskModal");
    } catch (err) {
      console.error(err);
      toast("Erro ao salvar tarefa.", "error");
    }
  });
});

/* =========================================================
   ESTATÍSTICAS
========================================================= */

function renderStatsTab(container, project) {
  const started = daysSince(project.startDate);

  container.innerHTML = `
    <div class="stats-cards-grid">
      <div class="stat-card"><span class="stat-num">${project.progress || 0}%</span><span class="stat-label">Progresso</span></div>
      <div class="stat-card"><span class="stat-num">${project.tasksDone || 0}/${project.tasksTotal || 0}</span><span class="stat-label">Tarefas concluídas</span></div>
      <div class="stat-card"><span class="stat-num">${project.notesCount || 0}</span><span class="stat-label">Anotações</span></div>
      <div class="stat-card"><span class="stat-num">${project.resourcesCount || 0}</span><span class="stat-label">Recursos</span></div>
      <div class="stat-card"><span class="stat-num">${project.filesCount || 0}</span><span class="stat-label">Arquivos</span></div>
      <div class="stat-card"><span class="stat-num">${started !== null ? started : "—"}</span><span class="stat-label">Dias desde o início</span></div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h4 class="panel-title">Tarefas por status</h4>
      <div id="taskStatusBreakdown"><p class="muted-small">Carregando…</p></div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h4 class="panel-title">Última atividade</h4>
      <p class="muted-small">${project.lastActivityText ? `${escapeHtml(project.lastActivityText)} — ${formatRelativeDateTime(project.lastActivityAt)}` : "Sem atividade registrada."}</p>
    </div>
  `;

  AppState.listeners.project.push(
    DataLayer.watchTasks(project.id, (tasks) => {
      const el = $("#taskStatusBreakdown");
      if (!el) return;
      const total = tasks.length || 1;
      const counts = { todo: 0, doing: 0, done: 0 };
      tasks.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });

      if (tasks.length === 0) {
        el.innerHTML = `<p class="muted-small">Sem tarefas para exibir.</p>`;
        return;
      }

      el.innerHTML = Object.keys(counts).map((key) => `
        <div class="stat-bar-row">
          <span class="stat-bar-label">${TASK_STATUS_META[key].label}</span>
          <div class="stat-bar-track"><div class="stat-bar-fill status-${key}" style="width:${Math.round((counts[key] / total) * 100)}%"></div></div>
          <span class="stat-bar-num">${counts[key]}</span>
        </div>`).join("");
    })
  );
}

/* =========================================================
   RECURSOS
========================================================= */

function renderResourcesTab(container, project) {
  container.innerHTML = `
    <div class="section-header">
      <span></span>
      <button class="btn-pill" id="btnNewResource"><i class="bi bi-plus-lg"></i> Novo recurso</button>
    </div>
    <div id="resourcesList" class="resources-list"><p class="muted-small">Carregando…</p></div>

    <form id="resourceForm" class="inline-form" style="display:none">
      <input type="text" id="resourceName" placeholder="Nome" required>
      <input type="url" id="resourceUrl" placeholder="https://..." required>
      <input type="text" id="resourceDescription" placeholder="Descrição (opcional)">
      <div class="inline-form-actions">
        <button type="button" class="btn-secondary-flat" id="btnCancelResource">Cancelar</button>
        <button type="submit" class="btn-pill">Salvar</button>
      </div>
    </form>
  `;

  const form = $("#resourceForm");

  $("#btnNewResource").addEventListener("click", () => { form.style.display = "flex"; });
  $("#btnCancelResource").addEventListener("click", () => { form.reset(); form.style.display = "none"; });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#resourceName").value.trim();
    const url = $("#resourceUrl").value.trim();
    const description = $("#resourceDescription").value.trim();
    if (!name || !url) return;

    try {
      await DataLayer.createResource(project.id, { name, url, description });
      form.reset();
      form.style.display = "none";
    } catch (err) {
      console.error(err);
      toast("Erro ao salvar recurso.", "error");
    }
  });

  AppState.listeners.project.push(
    DataLayer.watchResources(project.id, (resources) => {
      const el = $("#resourcesList");
      if (!el) return;
      el.innerHTML = resources.length
        ? resources.map((r) => `
            <div class="resource-row" data-id="${r.id}">
              <i class="bi bi-link-45deg"></i>
              <div class="resource-row-main">
                <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a>
                ${r.description ? `<p>${escapeHtml(r.description)}</p>` : ""}
              </div>
              <button type="button" class="icon-btn resource-delete" data-id="${r.id}" title="Excluir"><i class="bi bi-trash3"></i></button>
            </div>`).join("")
        : `<p class="muted-small">Nenhum recurso ainda.</p>`;

      $all(".resource-delete", el).forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm("Excluir esse recurso?")) return;
          await DataLayer.deleteResource(project.id, btn.dataset.id);
        });
      });
    })
  );
}

/* =========================================================
   ARQUIVOS
========================================================= */

function renderFilesTab(container, project) {
  container.innerHTML = `
    <div class="file-drop-zone" id="fileDropZone">
      <i class="bi bi-cloud-arrow-up"></i>
      <p>Arraste um arquivo aqui ou <label for="fileInput" class="file-drop-link">escolha do computador</label></p>
      <input type="file" id="fileInput" hidden>
      <div id="uploadProgress" class="upload-progress" style="display:none"><div class="upload-progress-fill"></div></div>
    </div>
    <div id="filesList" class="files-list"><p class="muted-small">Carregando…</p></div>
  `;

  const zone = $("#fileDropZone");
  const input = $("#fileInput");

  input.addEventListener("change", () => { if (input.files[0]) handleFileUpload(project, input.files[0]); });

  ["dragover", "dragenter"].forEach((evt) => zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((evt) => zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.remove("dragging"); }));
  zone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(project, file);
  });

  AppState.listeners.project.push(
    DataLayer.watchFiles(project.id, (files) => {
      const el = $("#filesList");
      if (!el) return;
      el.innerHTML = files.length
        ? files.map((f) => `
            <div class="file-row" data-id="${f.id}">
              <i class="bi bi-file-earmark"></i>
              <div class="file-row-main">
                <a href="${escapeHtml(f.url)}" target="_blank" rel="noopener">${escapeHtml(f.name)}</a>
                <span>${formatBytes(f.size)} · ${formatRelativeDateTime(f.createdAt)}</span>
              </div>
              <button type="button" class="icon-btn file-delete" data-id="${f.id}" title="Excluir"><i class="bi bi-trash3"></i></button>
            </div>`).join("")
        : `<p class="muted-small">Nenhum arquivo enviado ainda.</p>`;

      $all(".file-delete", el).forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm("Excluir esse arquivo?")) return;
          await DataLayer.deleteProjectFile(project.id, files.find((f) => f.id === btn.dataset.id));
        });
      });
    })
  );
}

async function handleFileUpload(project, file) {
  const progressWrap = $("#uploadProgress");
  const progressFill = $(".upload-progress-fill", progressWrap);
  progressWrap.style.display = "block";

  try {
    await DataLayer.uploadProjectFile(project.id, file, (pct) => { progressFill.style.width = `${pct}%`; });
    toast("Arquivo enviado.");
  } catch (err) {
    console.error(err);
    toast("Não foi possível enviar o arquivo. Verifique se o Firebase Storage está ativado e configurado para este projeto.", "error");
  } finally {
    progressWrap.style.display = "none";
    progressFill.style.width = "0%";
    $("#fileInput").value = "";
  }
}

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

function renderSettingsTab(container, project) {
  container.innerHTML = `
    <form id="settingsForm" class="panel settings-form">
      <div class="settings-image-row">
        <img id="settingsImagePreview" src="${project.image || ""}" style="${project.image ? "" : "display:none"}">
        <div>
          <label for="settingsImageInput" class="btn-secondary-flat">Trocar imagem</label>
          <input type="file" id="settingsImageInput" accept="image/*" hidden>
        </div>
      </div>

      <label class="field-label">Nome</label>
      <input type="text" id="settingsName" value="${escapeHtml(project.name)}" required>

      <label class="field-label">Descrição</label>
      <textarea id="settingsDescription" rows="3">${escapeHtml(project.description || "")}</textarea>

      <label class="field-label">Categoria</label>
      <select id="settingsCategory"></select>

      <label class="field-label">Status</label>
      <div class="status-choice-group" id="settingsStatusGroup">
        ${Object.keys(STATUS_META).map((key) => `
          <label class="status-choice ${project.status === key ? "selected" : ""}">
            <input type="radio" name="settingsStatus" value="${key}" ${project.status === key ? "checked" : ""}>
            <span class="status-dot ${STATUS_META[key].dot}"></span> ${STATUS_META[key].label}
          </label>`).join("")}
      </div>

      <label class="field-label">Prioridade</label>
      <select id="settingsPriority">
        ${Object.keys(PRIORITY_META).map((k) => `<option value="${k}" ${project.priority === k ? "selected" : ""}>${PRIORITY_META[k].label}</option>`).join("")}
      </select>

      <div class="two-col">
        <div>
          <label class="field-label">Início</label>
          <input type="date" id="settingsStartDate" value="${project.startDate || ""}">
        </div>
        <div>
          <label class="field-label">Prazo</label>
          <input type="date" id="settingsDueDate" value="${project.dueDate || ""}">
        </div>
      </div>

      <label class="field-label">Tags</label>
      <input type="text" id="settingsTagsInput" placeholder="Digite e pressione Enter">
      <div class="tag-chip-list" id="settingsTagsList"></div>

      <button type="submit" class="btn-pill" style="margin-top:8px">Salvar alterações</button>
    </form>

    <div class="panel danger-zone">
      <h4 class="panel-title">Zona de risco</h4>
      <div class="danger-row">
        <div>
          <strong>${project.archived ? "Desarquivar projeto" : "Arquivar projeto"}</strong>
          <p class="muted-small">Projetos arquivados saem da lista principal mas continuam salvos.</p>
        </div>
        <button type="button" class="btn-secondary-flat" id="btnToggleArchive">${project.archived ? "Desarquivar" : "Arquivar"}</button>
      </div>
      <div class="danger-row">
        <div>
          <strong>Excluir projeto</strong>
          <p class="muted-small">Remove o projeto e todos os seus dados permanentemente. Essa ação não pode ser desfeita.</p>
        </div>
        <button type="button" class="btn-danger-flat" id="btnDeleteProject">Excluir</button>
      </div>
    </div>
  `;

  renderCategorySelectGeneric($("#settingsCategory"), project.categoryId);

  let settingsImageDraft = null;
  $("#settingsImageInput").addEventListener("change", () => {
    const file = $("#settingsImageInput").files[0];
    if (!file) return;
    settingsImageDraft = file;
    const reader = new FileReader();
    reader.onload = () => {
      const img = $("#settingsImagePreview");
      img.src = reader.result;
      img.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  $all("input[name=settingsStatus]", container).forEach((r) => {
    r.addEventListener("change", () => {
      $all(".status-choice", container).forEach((el) => el.classList.toggle("selected", el.querySelector("input").checked));
    });
  });

  const settingsTagsCtl = setupTagInput($("#settingsTagsInput"), $("#settingsTagsList"), project.tags || []);

  $("#settingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusInput = $all("input[name=settingsStatus]", container).find((r) => r.checked);

    const data = {
      name: $("#settingsName").value.trim(),
      description: $("#settingsDescription").value.trim(),
      categoryId: $("#settingsCategory").value || null,
      status: statusInput ? statusInput.value : project.status,
      priority: $("#settingsPriority").value,
      startDate: $("#settingsStartDate").value || null,
      dueDate: $("#settingsDueDate").value || null,
      tags: settingsTagsCtl.getTags(),
    };

    try {
      await DataLayer.updateProject(project.id, data);
      if (settingsImageDraft) {
        const { image, imagePath } = await DataLayer.uploadProjectCover(project.id, settingsImageDraft);
        await DataLayer.updateProject(project.id, { image, imagePath });
      }
      if (data.status !== project.status) {
        await DataLayer.addActivity(project.id, "status_changed", `Status alterado para "${STATUS_META[data.status].label}"`);
      }
      toast("Alterações salvas.");
    } catch (err) {
      console.error(err);
      toast("Erro ao salvar alterações.", "error");
    }
  });

  $("#btnToggleArchive").addEventListener("click", async () => {
    try {
      await DataLayer.updateProject(project.id, { archived: !project.archived });
      toast(project.archived ? "Projeto desarquivado." : "Projeto arquivado.");
      goToDesktop();
    } catch (err) {
      console.error(err);
      toast("Erro ao atualizar projeto.", "error");
    }
  });

  $("#btnDeleteProject").addEventListener("click", async () => {
    const sure = confirm(`Excluir permanentemente "${project.name}"? Essa ação não pode ser desfeita.`);
    if (!sure) return;
    const typed = prompt(`Para confirmar, digite o nome do projeto: ${project.name}`);
    if (typed !== project.name) {
      toast("Nome não confere. Exclusão cancelada.");
      return;
    }
    try {
      await DataLayer.deleteProjectCompletely(project.id);
      toast("Projeto excluído.");
      goToDesktop();
    } catch (err) {
      console.error(err);
      toast("Erro ao excluir projeto.", "error");
    }
  });
}

function renderCategorySelectGeneric(sel, selectedId) {
  sel.innerHTML = `<option value="">Sem categoria</option>` +
    AppState.categories.map((c) => `<option value="${c.id}">${c.icon || "•"} ${escapeHtml(c.name)}</option>`).join("");
  if (selectedId) sel.value = selectedId;
}
