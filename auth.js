/* =========================
   FIREBASE INIT
========================= */

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;

/* =========================
   ELEMENTOS
========================= */

const loginScreen = document.getElementById("loginScreen");
const appContainer = document.getElementById("appContainer");
const sidebarOverlayEl = document.getElementById("sidebarOverlay");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const btnLogin = document.getElementById("btnLogin");
const btnSignup = document.getElementById("btnSignup");
const btnLogout = document.getElementById("btnLogout");
const btnForgotPassword = document.getElementById("btnForgotPassword");

/* =========================
   MOSTRAR / ESCONDER TELAS
========================= */

function showApp() {
  loginScreen.style.display = "none";
  appContainer.style.display = "flex";
}

function showLogin() {
  loginScreen.style.display = "flex";
  appContainer.style.display = "none";
  if (sidebarOverlayEl) sidebarOverlayEl.classList.remove("active");
  loginEmail.value = "";
  loginPassword.value = "";
  loginError.textContent = "";
}

/* =========================
   MENSAGENS DE ERRO EM PT-BR
========================= */

function traduzErro(code) {
  const mapa = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Esse e-mail já está cadastrado.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/missing-password": "Digite uma senha.",
  };
  return mapa[code] || "Erro ao entrar. Tente novamente.";
}

/* =========================
   AÇÕES DE LOGIN / CADASTRO / LOGOUT
========================= */

btnLogin.addEventListener("click", async () => {
  loginError.textContent = "";
  try {
    await auth.signInWithEmailAndPassword(loginEmail.value.trim(), loginPassword.value);
  } catch (err) {
    loginError.textContent = traduzErro(err.code);
  }
});

btnSignup.addEventListener("click", async () => {
  loginError.textContent = "";
  try {
    await auth.createUserWithEmailAndPassword(loginEmail.value.trim(), loginPassword.value);
  } catch (err) {
    loginError.textContent = traduzErro(err.code);
  }
});

btnLogout.addEventListener("click", () => {
  auth.signOut();
});

btnForgotPassword.addEventListener("click", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const email = loginEmail.value.trim();

  if (!email) {
    loginError.textContent = "Digite seu e-mail no campo acima primeiro.";
    return;
  }

  try {
    await auth.sendPasswordResetEmail(email);
    loginError.style.color = "#4ade80";
    loginError.textContent = "E-mail de recuperação enviado! Confira sua caixa de entrada.";
  } catch (err) {
    loginError.style.color = "#f87171";
    loginError.textContent = traduzErro(err.code);
  }
});

/* =========================
   ESTADO DE LOGIN
========================= */

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    showApp();

    // avisa o controlador do ELO (app.js) que o usuário está pronto
    if (window.onUserReady) {
      window.onUserReady(user);
    }
  } else {
    currentUser = null;
    showLogin();

    if (window.onUserSignedOut) {
      window.onUserSignedOut();
    }
  }
});
