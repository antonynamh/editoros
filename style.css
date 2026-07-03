@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
}

body {
  background: #0f0f10;
  color: #e6e6e6;
  overflow-x: hidden;
}

/* LAYOUT PRINCIPAL */
.app-container {
  display: flex;
  height: 100vh;
}

/* SIDEBAR */
.sidebar {
  width: 260px;
  background: #161618;
  border-right: 1px solid #242428;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  margin-bottom: 30px;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  background: transparent;
  border: none;
  color: #b5b5b5;
  text-align: left;
  padding: 12px 14px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: 0.2s;
  cursor: pointer;
  font-size: 14px;
}

.menu-item i {
  font-size: 16px;
}

.menu-item:hover {
  background: #222226;
  color: #fff;
}

.menu-item.active {
  background: #2a2a30;
  color: #fff;
}

/* MAIN */
.main {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

/* TOPBAR */
.topbar {
  margin-bottom: 25px;
}

.topbar h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 6px;
}

.topbar p {
  color: #9a9a9a;
  font-size: 14px;
  max-width: 700px;
}

/* SEÇÕES */
.section {
  display: none;
  animation: fadeIn 0.2s ease-in;
}

.section.active {
  display: block;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* CARDS */
.card-custom {
  background: #18181b;
  border: 1px solid #26262c;
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 16px;
}

.card-custom h4 {
  font-size: 15px;
  margin-bottom: 10px;
  color: #fff;
}

.card-custom p,
.card-custom li {
  color: #bdbdbd;
  font-size: 13px;
  line-height: 1.5;
}

.card-custom ul {
  margin-left: 18px;
}

/* ALERTA */
.card-custom.warning {
  border-left: 3px solid #7c5cff;
}

/* DESTAQUE */
.card-custom.highlight {
  border-left: 3px solid #4a4a4a;
}

/* PROJETO ATUAL */
#currentProject p {
  margin: 0;
}

/* BOTÕES ENERGIA */
.energy-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.btn-energy {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #2b2b31;
  background: #1c1c20;
  color: #bdbdbd;
  cursor: pointer;
  transition: 0.2s;
  font-size: 13px;
}

.btn-energy:hover {
  background: #2a2a30;
  color: #fff;
}

.btn-energy.active {
  background: #7c5cff;
  border-color: #7c5cff;
  color: #fff;
}

/* ENERGIA TAREFAS */
.energy-tasks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.energy-tag {
  background: #222226;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  color: #cfcfcf;
}

/* SEÇÃO HEADER */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h2 {
  font-size: 18px;
}

/* TABELA */
.table {
  background: transparent !important;
  color: #ddd;
}

.table thead th {
  border-bottom: 1px solid #2a2a2a !important;
  font-size: 12px;
  color: #9a9a9a;
}

.table tbody td {
  border-top: 1px solid #1f1f1f !important;
  font-size: 13px;
}

/* IDEIAS */
.ideas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.idea-card {
  background: #18181b;
  border: 1px solid #26262c;
  padding: 14px;
  border-radius: 12px;
}

.idea-card h5 {
  font-size: 14px;
  margin-bottom: 10px;
}

/* MÊS */
.month-input {
  width: 180px;
  background: #18181b;
  border: 1px solid #26262c;
  color: #fff;
}

.add-task {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.add-task input {
  background: #18181b;
  border: 1px solid #26262c;
  color: #fff;
}

.task-list {
  list-style: none;
  padding: 0;
}

.task-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1a1a1d;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 8px;
  font-size: 13px;
}

.task-list input[type="checkbox"] {
  transform: scale(1.2);
}

/* BOTÕES GLOBAIS */
.btn-primary {
  background: #7c5cff !important;
  border: none !important;
}

.btn-primary:hover {
  background: #6a4df0 !important;
}

.btn-secondary {
  background: #2a2a2a !important;
  border: none !important;
}

/* RESPONSIVO */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
  }

  .menu {
    flex-direction: row;
  }

  .main {
    padding: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.dashboard-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (max-width: 900px) {
  .dashboard-grid-2 {
    grid-template-columns: 1fr;
  }
}
.sidebar-footer{
    margin-top:auto;
    padding:20px;
    border-top:1px solid rgba(255,255,255,.08);

    display:flex;
    flex-direction:column;
    align-items:center;
    gap:4px;

    opacity:.65;
}

.sidebar-footer h4{
    margin:0;
    font-size:15px;
    font-weight:600;
    color:white;
}

.sidebar-footer p{
    margin:0;
    font-size:13px;
    color:#9ca3af;
}

.sidebar-footer span{
    font-size:12px;
    color:#8b5cf6;
}


/* BOTÃO MOBILE */
.mobile-menu-btn {
  display: none;
  background: #1c1c20;
  border: 1px solid #2a2a2a;
  color: white;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 18px;
}

/* MOBILE BEHAVIOR */
@media (max-width: 768px) {

  .app-container {
    flex-direction: column;
  }

  /* sidebar vira offcanvas */
  .sidebar {
    position: fixed;
    top: 0;
    left: -260px;
    height: 100vh;
    width: 260px;
    z-index: 999;
    transition: 0.25s ease;
  }

  .sidebar.active {
    left: 0;
  }

  .mobile-menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .topbar {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}
