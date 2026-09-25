/* =========================
   PERSONAL OS - UTILITÁRIOS
========================= */

function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function debounce(fn, delay) {
  let t = null;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ---- DATAS ---- */

const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate(); // Firestore Timestamp
  if (typeof value === "string") {
    // YYYY-MM-DD -> evita bug de fuso horário tratando como data local
    const parts = value.split("-");
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(value);
  }
  return null;
}

function formatDateShort(value) {
  const d = toDate(value);
  if (!d) return "—";
  return `${d.getDate()} ${MESES_ABREV[d.getMonth()]}`;
}

function formatDateFull(value) {
  const d = toDate(value);
  if (!d) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatRelativeDateTime(value) {
  const d = toDate(value);
  if (!d) return "—";
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  if (isSameDay(d, now)) return `Hoje, ${hh}:${mi}`;
  if (isSameDay(d, yesterday)) return `Ontem, ${hh}:${mi}`;
  return `${formatDateFull(d)}, ${hh}:${mi}`;
}

function daysSince(value) {
  const d = toDate(value);
  if (!d) return null;
  const now = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end - start) / 86400000);
}

function daysUntil(value) {
  if (!value) return null;
  const d = toDate(value);
  if (!d) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((end - start) / 86400000);
}

/* ---- FORMATAÇÃO DE ARQUIVOS ---- */

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes === 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/* ---- TOASTS (feedback leve) ---- */

function toast(message, tone) {
  let host = $("#toastHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "toastHost";
    host.className = "toast-host";
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = `toast-item${tone === "error" ? " toast-error" : ""}`;
  el.textContent = message;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

/* ---- MODAIS (Bootstrap) ---- */

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const modal = bootstrap.Modal.getOrCreateInstance(el);
  modal.show();
  return modal;
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const modal = bootstrap.Modal.getInstance(el);
  if (modal) modal.hide();
}

/* ---- CHIPS DE TAGS (input reutilizável) ---- */

function setupTagInput(inputEl, listEl, initialTags) {
  let tags = Array.isArray(initialTags) ? [...initialTags] : [];

  function render() {
    listEl.innerHTML = tags
      .map(
        (t, i) => `<span class="tag-chip">#${escapeHtml(t)}<button type="button" data-i="${i}" class="tag-chip-remove" aria-label="Remover tag">&times;</button></span>`
      )
      .join("");
    listEl.querySelectorAll(".tag-chip-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        tags.splice(Number(btn.dataset.i), 1);
        render();
      });
    });
  }

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const raw = inputEl.value.trim().replace(/^#/, "");
      if (raw && !tags.includes(raw)) {
        tags.push(raw);
        render();
      }
      inputEl.value = "";
    }
  });

  render();

  return {
    getTags: () => tags,
    setTags: (t) => { tags = [...t]; render(); },
  };
}

/* ---- PROGRESSO ---- */

function calcProgress(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

/* ---- IDS DE ELEMENTO SEGUROS ---- */

let __uidCounter = 0;
function localId(prefix) {
  __uidCounter += 1;
  return `${prefix || "id"}-${Date.now()}-${__uidCounter}`;
}
