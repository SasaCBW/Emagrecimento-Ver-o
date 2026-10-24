import { auth, adminEmail } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================================
   ELEMENTOS DO FORMULÁRIO
========================================= */

const form = document.querySelector("#login-form");
const message = document.querySelector("#login-message");

const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");

const submitButton = form
  ? form.querySelector('button[type="submit"]')
  : null;

/* =========================================
   MOSTRAR MENSAGENS
========================================= */

function showMessage(text, isError = false) {
  if (!message) return;

  message.textContent = text;
  message.hidden = false;
  message.classList.toggle("error", isError);
}

/* =========================================
   VERIFICAR AUTORIZAÇÃO
========================================= */

function isAuthorized(user) {
  return Boolean(
    user &&
    user.email &&
    user.email.toLowerCase() === adminEmail.toLowerCase()
  );
}

/* =========================================
   VERIFICAR SESSÃO EXISTENTE
========================================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  if (isAuthorized(user)) {
    window.location.replace("admin.html");
    return;
  }

  try {
    await signOut(auth);
  } catch (error) {
    console.error("Não foi possível encerrar a sessão:", error);
  }

  showMessage(
    "Esta conta não está autorizada a acessar o painel administrativo.",
    true
  );
});

/* =========================================
   PROCESSAR LOGIN
========================================= */

if (form && emailInput && passwordInput && submitButton) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showMessage(
        "Preencha o e-mail e a senha para continuar.",
        true
      );
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Verificando acesso...";

    showMessage("Verificando seus dados...");

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (!isAuthorized(credential.user)) {
        await signOut(auth);

        showMessage(
          "Este e-mail não tem autorização para administrar o site.",
          true
        );

        return;
      }

      showMessage("Login realizado. Abrindo painel...");

      window.location.replace("admin.html");

    } catch (error) {
      console.error("Falha no login:", error.code);

      let errorMessage =
        "Não foi possível entrar. Confira seu e-mail e sua senha.";

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        errorMessage = "E-mail ou senha incorretos.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          "Muitas tentativas de acesso. Aguarde um pouco e tente novamente.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage =
          "Falha na conexão. Verifique sua internet e tente novamente.";
      } else if (error.code === "auth/unauthorized-domain") {
        errorMessage =
          "Este domínio não está autorizado no Firebase Authentication.";
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage =
          "O login por e-mail e senha ainda não está ativado no Firebase.";
      }

      showMessage(errorMessage, true);

    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Entrar no painel →";
    }
  });
}
