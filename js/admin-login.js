import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  auth,
  adminEmail
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#login-form");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");
  const message = document.querySelector("#login-message");
  const submitButton = loginForm?.querySelector('button[type="submit"]');

  function showMessage(text, type = "error") {
    if (!message) return;

    message.textContent = text;
    message.className = `login-message ${type}`;
    message.hidden = false;
  }

  function setLoading(loading) {
    if (!submitButton) return;

    submitButton.disabled = loading;
    submitButton.textContent = loading
      ? "Verificando acesso..."
      : "Entrar no painel";
  }

  // VERIFICA SE JÁ EXISTE UMA SESSÃO
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    if (
      user.email &&
      user.email.toLowerCase() === adminEmail.toLowerCase()
    ) {
      window.location.replace("admin.html");
      return;
    }

    // Encerra uma sessão que não pertence ao administrador autorizado.
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error);
    }
  });

  // LOGIN POR E-MAIL E SENHA
  if (!loginForm) {
    console.error("Formulário #login-form não encontrado.");
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput?.value.trim().toLowerCase() || "";
    const password = passwordInput?.value || "";

    if (!email || !password) {
      showMessage("Preencha o e-mail e a senha.");
      return;
    }

    if (email !== adminEmail.toLowerCase()) {
      showMessage("Este e-mail não está autorizado a acessar o painel.");
      return;
    }

    setLoading(true);
    showMessage("Verificando suas credenciais...", "info");

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = credential.user;

      if (
        !user.email ||
        user.email.toLowerCase() !== adminEmail.toLowerCase()
      ) {
        await signOut(auth);

        showMessage(
          "Esta conta não tem permissão para acessar o painel."
        );

        return;
      }

      showMessage("Login realizado. Abrindo o painel...", "success");

      window.location.replace("admin.html");
    } catch (error) {
      console.error("Falha no login administrativo:", error);

      let errorMessage =
        "Não foi possível entrar. Confira seus dados e tente novamente.";

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "O formato do e-mail é inválido.";
          break;

        case "auth/user-not-found":
        case "auth/invalid-credential":
        case "auth/wrong-password":
          errorMessage = "E-mail ou senha incorretos.";
          break;

        case "auth/too-many-requests":
          errorMessage =
            "Muitas tentativas. Aguarde um pouco antes de tentar novamente.";
          break;

        case "auth/network-request-failed":
          errorMessage =
            "Falha de conexão. Confira sua internet e tente novamente.";
          break;

        case "auth/operation-not-allowed":
          errorMessage =
            "O login por e-mail e senha não está habilitado no Firebase Authentication.";
          break;

        case "auth/unauthorized-domain":
          errorMessage =
            "Este domínio não está autorizado. Adicione o domínio do site nas configurações do Firebase Authentication.";
          break;
      }

      showMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  });
});
