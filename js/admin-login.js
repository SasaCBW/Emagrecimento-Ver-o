import { auth, adminEmail } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const form = document.querySelector("#login-form");
const message = document.querySelector("#login-message");

if (form && message) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    if (user.email?.toLowerCase() === adminEmail.toLowerCase()) {
      window.location.href = "admin.html";
    } else {
      await signOut(auth);
      message.textContent =
        "Esta conta não tem autorização para acessar o painel.";
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    const button = form.querySelector('button[type="submit"]');

    message.textContent = "Verificando seus dados...";
    button.disabled = true;

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (
        credential.user.email?.toLowerCase() !==
        adminEmail.toLowerCase()
      ) {
        await signOut(auth);

        message.textContent =
          "Este e-mail não está autorizado a administrar o site.";

        return;
      }

      window.location.href = "admin.html";
    } catch (error) {
      console.error("Erro no login:", error.code);

      message.textContent =
        "Não foi possível entrar. Confira o e-mail, a senha e a configuração do Firebase.";
    } finally {
      button.disabled = false;
    }
  });
}
