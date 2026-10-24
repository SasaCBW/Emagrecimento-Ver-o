import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  auth,
  adminEmail
} from "./firebase-config.js";

import {
  getPublicSettings,
  savePublicSettings
} from "./firestore-config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#settings-form");
  const logoutButton = document.querySelector("#logout-button");
  const resetButton = document.querySelector("#reset-settings");
  const message = document.querySelector("#save-message");
  const adminUser = document.querySelector("#admin-user");

  const fields = {
    courseName: document.querySelector('[name="courseName"]'),
    courseDescription: document.querySelector('[name="courseDescription"]'),
    price: document.querySelector('[name="price"]'),
    oldPrice: document.querySelector('[name="oldPrice"]'),
    checkoutUrl: document.querySelector('[name="checkoutUrl"]'),
    contactEmail: document.querySelector('[name="contactEmail"]')
  };

  const defaultSettings = {
    courseName: "Verão Fit",
    courseDescription:
      "Um guia informativo para desenvolver hábitos saudáveis, equilíbrio e bem-estar.",
    price: 0,
    oldPrice: 0,
    checkoutUrl: "",
    contactEmail: adminEmail
  };

  let originalSettings = { ...defaultSettings };
  let currentUser = null;
  let authReady = false;

  function showMessage(text, type = "info") {
    if (!message) return;

    message.textContent = text;
    message.className = `save-message ${type}`;
    message.hidden = false;
  }

  function setFormDisabled(disabled) {
    if (!form) return;

    form.querySelectorAll("input, textarea, button").forEach((element) => {
      if (element.id !== "logout-button") {
        element.disabled = disabled;
      }
    });
  }

  function readForm() {
    return {
      courseName: fields.courseName?.value.trim() || "",
      courseDescription: fields.courseDescription?.value.trim() || "",
      price: Number(fields.price?.value || 0),
      oldPrice: Number(fields.oldPrice?.value || 0),
      checkoutUrl: fields.checkoutUrl?.value.trim() || "",
      contactEmail: fields.contactEmail?.value.trim() || ""
    };
  }

  function fillForm(settings) {
    Object.entries(fields).forEach(([key, element]) => {
      if (!element) return;

      const value = settings[key];

      element.value = value === undefined || value === null
        ? ""
        : String(value);
    });
  }

  function validateSettings(settings) {
    if (!settings.courseName) {
      return "Informe o nome do produto.";
    }

    if (!Number.isFinite(settings.price) || settings.price < 0) {
      return "Informe um preço válido.";
    }

    if (!Number.isFinite(settings.oldPrice) || settings.oldPrice < 0) {
      return "Informe um preço anterior válido.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail)) {
      return "Informe um e-mail de contato válido.";
    }

    if (settings.checkoutUrl) {
      try {
        const url = new URL(settings.checkoutUrl);

        if (url.protocol !== "https:") {
          return "O endereço de pagamento precisa começar com https://.";
        }
      } catch {
        return "Informe um endereço de pagamento válido.";
      }
    }

    return null;
  }

  async function loadSettings() {
    showMessage("Carregando configurações...", "info");
    setFormDisabled(true);

    try {
      const settings = await getPublicSettings();

      originalSettings = {
        ...defaultSettings,
        ...(settings || {})
      };

      fillForm(originalSettings);

      showMessage(
        settings
          ? "Configurações carregadas."
          : "Ainda não há configurações salvas. Preencha os campos e clique em salvar.",
        "info"
      );
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);

      showMessage(
        "Não foi possível carregar as configurações. Confira se o Firestore foi criado e se suas regras foram publicadas.",
        "error"
      );

      fillForm(originalSettings);
    } finally {
      setFormDisabled(!currentUser || !authReady);
    }
  }

  // CONFIRMA A AUTENTICAÇÃO E PROTEGE O PAINEL
  onAuthStateChanged(auth, async (user) => {
    authReady = true;

    if (!user) {
      window.location.replace("admin-login.html");
      return;
    }

    if (
      !user.email ||
      user.email.toLowerCase() !== adminEmail.toLowerCase()
    ) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Erro ao encerrar sessão não autorizada:", error);
      }

      window.location.replace("admin-login.html");
      return;
    }

    currentUser = user;

    if (adminUser) {
      adminUser.textContent = user.email;
    }

    await loadSettings();
  });

  // SALVAR CONFIGURAÇÕES
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!currentUser) {
        showMessage("Entre na conta administrativa antes de salvar.", "error");
        return;
      }

      const settings = readForm();
      const validationError = validateSettings(settings);

      if (validationError) {
        showMessage(validationError, "error");
        return;
      }

      const submitButton = form.querySelector('[type="submit"]');

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Salvando...";
      }

      showMessage("Salvando alterações...", "info");

      try {
        await savePublicSettings(settings);

        originalSettings = { ...settings };

        showMessage("Configurações salvas com sucesso!", "success");
      } catch (error) {
        console.error("Erro ao salvar configurações:", error);

        let errorMessage =
          "Não foi possível salvar. Confira as regras do Firestore e tente novamente.";

        if (error.code === "permission-denied") {
          errorMessage =
            "Acesso negado pelo Firestore. Confira se o e-mail administrativo e as regras estão corretos.";
        } else if (error.code === "unavailable") {
          errorMessage =
            "O Firestore está indisponível no momento. Tente novamente mais tarde.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        showMessage(errorMessage, "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Salvar configurações";
        }
      }
    });
  }

  // RESTAURAR OS VALORES CARREGADOS
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      fillForm(originalSettings);

      showMessage(
        "Os campos voltaram aos últimos valores carregados. Para desfazer alterações salvas, clique em salvar.",
        "info"
      );
    });
  }

  // SAIR DO PAINEL
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      logoutButton.textContent = "Saindo...";

      try {
        await signOut(auth);
        window.location.replace("admin-login.html");
      } catch (error) {
        console.error("Erro ao sair:", error);

        showMessage("Não foi possível encerrar a sessão.", "error");

        logoutButton.disabled = false;
        logoutButton.textContent = "Sair";
      }
    });
  }
});
