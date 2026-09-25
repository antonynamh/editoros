/* =========================
   PERSONAL OS - CAMADA DE DADOS (Firestore + Storage)
========================= */
/*
  Estrutura no Firestore:

  users/{uid}
    ├── categories/{categoryId}        -> { name, icon, createdAt }
    └── projects/{projectId}           -> { name, description, categoryId, image, imagePath,
                                             status, priority, startDate, dueDate, tags,
                                             archived, createdAt, updatedAt,
                                             progress, tasksTotal, tasksDone,
                                             notesCount, resourcesCount, filesCount,
                                             lastActivityAt, lastActivityText }
         ├── tasks/{taskId}            -> { title, description, status, priority, dueDate,
                                             createdAt, completedAt }
         ├── notes/{noteId}            -> { title, content, createdAt, updatedAt }
         ├── resources/{resourceId}    -> { name, description, url, createdAt }
         ├── files/{fileId}            -> { name, url, path, size, type, createdAt }
         ├── journal/{entryId}         -> { content, date, createdAt }
         └── activity/{activityId}     -> { type, message, createdAt }

  Regras de segurança recomendadas (configurar no console do Firebase):

  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }

  service firebase.storage {
    match /b/{bucket}/o {
      match /users/{userId}/{allPaths=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
*/

const DataLayer = (() => {
  function uidPath() {
    if (!currentUser) throw new Error("Usuário não autenticado.");
    return currentUser.uid;
  }

  function userDoc() {
    return db.collection("users").doc(uidPath());
  }

  function categoriesRef() {
    return userDoc().collection("categories");
  }

  function projectsRef() {
    return userDoc().collection("projects");
  }

  function projectDoc(projectId) {
    return projectsRef().doc(projectId);
  }

  function subRef(projectId, sub) {
    return projectDoc(projectId).collection(sub);
  }

  const now = () => firebase.firestore.FieldValue.serverTimestamp();

  /* ---------- CATEGORIAS ---------- */

  function watchCategories(onChange) {
    return categoriesRef()
      .orderBy("createdAt", "asc")
      .onSnapshot(
        (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Erro ao observar categorias:", err)
      );
  }

  async function createCategory({ name, icon }) {
    return categoriesRef().add({ name, icon: icon || "•", createdAt: now() });
  }

  async function updateCategory(id, data) {
    return categoriesRef().doc(id).update(data);
  }

  async function deleteCategory(id) {
    return categoriesRef().doc(id).delete();
  }

  async function seedDefaultCategories() {
    const defaults = [
      { name: "Vídeo", icon: "🎬" },
      { name: "Estudo", icon: "📚" },
      { name: "Programação", icon: "💻" },
      { name: "TCC", icon: "🎓" },
      { name: "Trabalho", icon: "💼" },
      { name: "Projeto criativo", icon: "🎨" },
      { name: "Projeto pessoal", icon: "🧠" },
      { name: "Outro", icon: "•" },
    ];
    const batch = db.batch();
    defaults.forEach((c) => {
      const ref = categoriesRef().doc();
      batch.set(ref, { ...c, createdAt: now() });
    });
    return batch.commit();
  }

  /* ---------- PROJETOS ---------- */

  function watchProjects(onChange) {
    return projectsRef()
      .orderBy("updatedAt", "desc")
      .onSnapshot(
        (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Erro ao observar projetos:", err)
      );
  }

  async function createProject(data) {
    const payload = {
      name: data.name,
      description: data.description || "",
      categoryId: data.categoryId || null,
      image: data.image || null,
      imagePath: data.imagePath || null,
      status: data.status || "started",
      priority: data.priority || "normal",
      startDate: data.startDate || null,
      dueDate: data.dueDate || null,
      tags: data.tags || [],
      archived: false,
      progress: 0,
      tasksTotal: 0,
      tasksDone: 0,
      notesCount: 0,
      resourcesCount: 0,
      filesCount: 0,
      lastActivityAt: now(),
      lastActivityText: "Projeto criado",
      createdAt: now(),
      updatedAt: now(),
    };
    const ref = await projectsRef().add(payload);
    await addActivity(ref.id, "project_created", "Projeto criado");
    return ref;
  }

  async function updateProject(projectId, data) {
    return projectDoc(projectId).update({ ...data, updatedAt: now() });
  }

  async function deleteProjectCompletely(projectId) {
    // Remove subcoleções conhecidas e depois o projeto.
    const subs = ["tasks", "notes", "resources", "files", "journal", "activity"];
    for (const sub of subs) {
      const snap = await subRef(projectId, sub).get();
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      if (snap.docs.length) await batch.commit();
    }
    return projectDoc(projectId).delete();
  }

  /* ---------- ATIVIDADE ---------- */

  async function addActivity(projectId, type, message) {
    await subRef(projectId, "activity").add({ type, message, createdAt: now() });
    await projectDoc(projectId).update({
      lastActivityAt: now(),
      lastActivityText: message,
      updatedAt: now(),
    });
  }

  function watchActivity(projectId, onChange, max) {
    return subRef(projectId, "activity")
      .orderBy("createdAt", "desc")
      .limit(max || 15)
      .onSnapshot(
        (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Erro ao observar atividade:", err)
      );
  }

  /* ---------- TAREFAS ---------- */

  function watchTasks(projectId, onChange) {
    return subRef(projectId, "tasks")
      .orderBy("createdAt", "asc")
      .onSnapshot(
        (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Erro ao observar tarefas:", err)
      );
  }

  async function createTask(projectId, data) {
    await subRef(projectId, "tasks").add({
      title: data.title,
      description: data.description || "",
      status: data.status || "todo",
      priority: data.priority || "normal",
      dueDate: data.dueDate || null,
      createdAt: now(),
      completedAt: null,
    });
    await recalcTaskCounts(projectId);
    await addActivity(projectId, "task_created", `Tarefa criada: "${data.title}"`);
  }

  async function updateTask(projectId, taskId, data, opts) {
    await subRef(projectId, "tasks").doc(taskId).update(data);
    await recalcTaskCounts(projectId);
    if (opts && opts.completed) {
      await addActivity(projectId, "task_done", `Tarefa concluída: "${opts.title}"`);
    } else if (opts && opts.reopened) {
      await addActivity(projectId, "task_reopened", `Tarefa reaberta: "${opts.title}"`);
    }
  }

  async function deleteTask(projectId, taskId) {
    await subRef(projectId, "tasks").doc(taskId).delete();
    await recalcTaskCounts(projectId);
  }

  async function recalcTaskCounts(projectId) {
    const snap = await subRef(projectId, "tasks").get();
    const total = snap.size;
    const done = snap.docs.filter((d) => d.data().status === "done").length;
    await projectDoc(projectId).update({
      tasksTotal: total,
      tasksDone: done,
      progress: calcProgress(done, total),
    });
  }

  /* ---------- ANOTAÇÕES ---------- */

  function watchNotes(projectId, onChange) {
    return subRef(projectId, "notes")
      .orderBy("updatedAt", "desc")
      .onSnapshot(
        (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Erro ao observar anotações:", err)
      );
  }

  async function createNote(projectId, data) {
    await subRef(projectId, "notes").add({
      title: data.title || "Sem título",
      content: data.content || "",
      createdAt: now(),
      updatedAt: now(),
    });
    await recalcSimpleCount(projectId, "notes", "notesCount");
    await addActivity(projectId, "note_created", `Nova anotação: "${data.title || "Sem título"}"`);
  }

  async function updateNote(projectId, noteId, data) {
    await subRef(projectId, "notes").doc(noteId).update({ ...data, updatedAt: now() });
    await addActivity(projectId, "note_edited", `Anotação editada: "${data.title || ""}"`);
  }

  async function deleteNote(projectId, noteId) {
    await subRef(projectId, "notes").doc(noteId).delete();
    await recalcSimpleCount(projectId, "notes", "notesCount");
  }

  /* ---------- DIÁRIO ---------- */

  function watchJournal(projectId, onChange) {
    return subRef(projectId, "journal")
      .orderBy("date", "desc")
      .onSnapshot(
        (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Erro ao observar diário:", err)
      );
  }

  async function createJournalEntry(projectId, data) {
    await subRef(projectId, "journal").add({
      content: data.content,
      date: data.date || todayISO(),
      createdAt: now(),
    });
    await addActivity(projectId, "journal_entry", "Nova entrada no diário do projeto");
  }

  async function deleteJournalEntry(projectId, entryId) {
    return subRef(projectId, "journal").doc(entryId).delete();
  }

  /* ---------- RECURSOS ---------- */

  function watchResources(projectId, onChange) {
    return subRef(projectId, "resources")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Erro ao observar recursos:", err)
      );
  }

  async function createResource(projectId, data) {
    await subRef(projectId, "resources").add({
      name: data.name,
      description: data.description || "",
      url: data.url,
      createdAt: now(),
    });
    await recalcSimpleCount(projectId, "resources", "resourcesCount");
    await addActivity(projectId, "resource_added", `Recurso adicionado: "${data.name}"`);
  }

  async function deleteResource(projectId, resourceId) {
    await subRef(projectId, "resources").doc(resourceId).delete();
    await recalcSimpleCount(projectId, "resources", "resourcesCount");
  }

  /* ---------- ARQUIVOS ---------- */

  function watchFiles(projectId, onChange) {
    return subRef(projectId, "files")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Erro ao observar arquivos:", err)
      );
  }

  async function uploadProjectFile(projectId, file, onProgress) {
    const path = `users/${uidPath()}/projects/${projectId}/files/${Date.now()}_${file.name}`;
    const ref = storage.ref(path);
    const task = ref.put(file);

    return new Promise((resolve, reject) => {
      task.on(
        "state_changed",
        (snap) => {
          if (onProgress) onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        },
        (err) => reject(err),
        async () => {
          try {
            const url = await task.snapshot.ref.getDownloadURL();
            await subRef(projectId, "files").add({
              name: file.name,
              url,
              path,
              size: file.size,
              type: file.type || "",
              createdAt: now(),
            });
            await recalcSimpleCount(projectId, "files", "filesCount");
            await addActivity(projectId, "file_added", `Arquivo adicionado: "${file.name}"`);
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }

  async function deleteProjectFile(projectId, fileDoc) {
    if (fileDoc.path) {
      try {
        await storage.ref(fileDoc.path).delete();
      } catch (err) {
        console.warn("Não foi possível remover o arquivo do Storage:", err);
      }
    }
    await subRef(projectId, "files").doc(fileDoc.id).delete();
    await recalcSimpleCount(projectId, "files", "filesCount");
  }

  async function recalcSimpleCount(projectId, sub, field) {
    const snap = await subRef(projectId, sub).get();
    await projectDoc(projectId).update({ [field]: snap.size });
  }

  /* ---------- IMAGEM DE CAPA (upload ou fallback base64) ---------- */

  async function uploadProjectCover(projectId, file) {
    const path = `users/${uidPath()}/projects/${projectId}/cover_${Date.now()}`;
    try {
      const ref = storage.ref(path);
      await ref.put(file);
      const url = await ref.getDownloadURL();
      return { image: url, imagePath: path };
    } catch (err) {
      console.warn("Upload para o Storage falhou, usando fallback local:", err);
      const dataUrl = await fileToDataUrl(file);
      return { image: dataUrl, imagePath: null };
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return {
    watchCategories, createCategory, updateCategory, deleteCategory, seedDefaultCategories,
    watchProjects, createProject, updateProject, deleteProjectCompletely,
    addActivity, watchActivity,
    watchTasks, createTask, updateTask, deleteTask,
    watchNotes, createNote, updateNote, deleteNote,
    watchJournal, createJournalEntry, deleteJournalEntry,
    watchResources, createResource, deleteResource,
    watchFiles, uploadProjectFile, deleteProjectFile,
    uploadProjectCover, fileToDataUrl,
  };
})();
