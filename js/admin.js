import { auth, adminEmail } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ==========================================
   VERÃO FIT — PAINEL ADMINISTRATIVO
========================================== */

const protectedPage =
  document.body.dataset.protected === "true";

const loginPage =
  document.querySelector("#login-form") !== null;

/* ==========================================
   CONFIGURAÇÕES PADRÃO
========================================== */

const defaultSettings = {
  courseName: "Verão Fit",

  courseDescription:
    "Um guia prático para organizar hábitos mais equilibrados durante o verão.",

  price: "29.90",

  oldPrice: "97.00",

  checkoutUrl: "",

  contactEmail: "saracbwendling@gmail.com"
};

/* ==========================================
   AUTENTICAÇÃO E PROTEÇÃO DO PAINEL
========================================== */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (protectedPage) {
      window.location.replace("admin-login.html");
    }

    return;
  }

  const authorized =
    user.email?.toLowerCase() === adminEmail.toLowerCase();

  if (!authorized) {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error);
    }

    if (protectedPage) {
      window.location.replace("admin-login.html");
    }

    const loginMessage = document.querySelector("#login-message");

    if (loginMessage) {
      loginMessage.textContent =
        "Esta conta não tem autorização para acessar o painel.";
    }

    return;
  }

  if (protectedPage) {
    document.body.classList.add("admin-authenticated");

    const userElement = document.querySelector("#admin-user");

    if (userElement) {
      userElement.textContent = user.email;
    }

    initializeSettings();
  }

  if (loginPage) {
    window.location.replace("admin.html");
  }
});

/* ==========================================
   BOTÃO DE SAIR
========================================== */

const logoutButton = document.querySelector("#logout-button");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Saindo...";

    try {
      await signOut(auth);
      window.location.replace("admin-login.html");
    } catch (error) {
      console.error("Erro ao sair:", error);

      alert("Não foi possível sair da conta. Tente novamente.");

      logoutButton.disabled = false;
      logoutButton.textContent = "Sair da conta";
    }
  });
}

/* ==========================================
   MENSAGENS DO PAINEL
========================================== */

function showMessage(message, isError = false) {
  const element = document.querySelector("#save-message");

  if (!element) return;

  element.textContent = message;
  element.classList.toggle("error", isError);
  element.hidden = false;
}

/* ==========================================
   CARREGAR CONFIGURAÇÕES
========================================== */

function getSettings() {
  try {
    const storedSettings = localStorage.getItem("veraoFitSettings");

    if (!storedSettings) {
      return { ...defaultSettings };
    }

    const parsedSettings = JSON.parse(storedSettings);

    if (
      !parsedSettings ||
      typeof parsedSettings !== "object" ||
      Array.isArray(parsedSettings)
    ) {
      return { ...defaultSettings };
    }

    return {
      ...defaultSettings,
      ...parsedSettings
    };
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);

    return { ...defaultSettings };
  }
}

/* ==========================================
   PREENCHER FORMULÁRIO
========================================== */

function fillForm(settings) {
  const form = document.querySelector("#settings-form");

  if (!form) return;

  Object.entries(settings).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);

    if (field && "value" in field) {
      field.value = value ?? "";
    }
  });
}

/* ==========================================
   INICIALIZAR CONFIGURAÇÕES
========================================== */

function initializeSettings() {
  const form = document.querySelector("#settings-form");

  if (!form || form.dataset.initialized === "true") {
    return;
  }

  form.dataset.initialized = "true";

  fillForm(getSettings());

  /* Atualiza os cartões de resumo */

  function updateOverview() {
    const settings = {};

    for (const key of Object.keys(defaultSettings)) {
      const field = form.elements.namedItem(key);

      if (field) {
        settings[key] = field.value.trim();
      }
    }

    const nameElement = document.querySelector(
      "#overview-course-name"
    );

    const priceElement = document.querySelector(
      "#overview-price"
    );

    const contactElement = document.querySelector(
      "#overview-contact"
    );

    const contactDisplay = document.querySelector(
      "#contact-email-display"
    );

    const contactLink = document.querySelector(
      "#contact-email-link"
    );

    if (nameElement) {
      nameElement.textContent =
        settings.courseName || "Verão Fit";
    }

    if (priceElement) {
      const amount = Number(settings.price);

      priceElement.textContent = Number.isFinite(amount)
        ? amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
          })
        : "Não definido";
    }

    if (contactElement) {
      contactElement.textContent =
        settings.contactEmail || "Não definido";
    }

    if (contactDisplay) {
      contactDisplay.textContent =
        settings.contactEmail || "Não definido";
    }

    if (contactLink) {
      contactLink.href = settings.contactEmail
        ? `mailto:${settings.contactEmail}`
        : "#";
    }
  }

  form.addEventListener("input", updateOverview);

  form.addEventListener("change", updateOverview);

  updateOverview();

  /* ========================================
     SALVAR CONFIGURAÇÕES
  ======================================== */

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const user = auth.currentUser;

    if (
      !user ||
      user.email?.toLowerCase() !== adminEmail.toLowerCase()
    ) {
      showMessage(
        "Sua sessão não está autorizada. Entre novamente.",
        true
      );

      return;
    }

    const formData = new FormData(form);

    const settings = {
      ...defaultSettings
    };

    for (const [key, value] of formData.entries()) {
      if (Object.prototype.hasOwnProperty.call(settings, key)) {
        settings[key] = String(value).trim();
      }
    }

    /* Validar nome */

    if (!settings.courseName) {
      showMessage(
        "Digite o nome do produto.",
        true
      );

      return;
    }

    /* Validar e-mail */

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(settings.contactEmail)) {
      showMessage(
        "Digite um endereço de e-mail válido.",
        true
      );

      return;
    }

    /* Validar preço */

    const currentPrice = Number(settings.price);

    if (
      !Number.isFinite(currentPrice) ||
      currentPrice < 0 ||
      currentPrice > 1000000
    ) {
      showMessage(
        "Digite um preço atual válido.",
        true
      );

      return;
    }

    /* Validar preço anterior, quando informado */

    if (settings.oldPrice !== "") {
      const previousPrice = Number(settings.oldPrice);

      if (
        !Number.isFinite(previousPrice) ||
        previousPrice < 0 ||
        previousPrice > 1000000
      ) {
        showMessage(
          "Digite um preço anterior válido.",
          true
        );

        return;
      }
    }

    /* Validar link de pagamento */

    if (settings.checkoutUrl !== "") {
      try {
        const checkout = new URL(settings.checkoutUrl);

        if (
          checkout.protocol !== "https:" &&
          checkout.protocol !== "http:"
        ) {
          throw new Error("Endereço inválido");
        }
      } catch {
        showMessage(
          "Digite um link de pagamento válido, começando com https://.",
          true
        );

        return;
      }
    }

    /* Salvar no navegador */

    try {
      localStorage.setItem(
        "veraoFitSettings",
        JSON.stringify(settings)
      );

      updateOverview();

      showMessage(
        "Configurações salvas neste navegador com sucesso!"
      );
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);

      showMessage(
        "Não foi possível salvar. Verifique o armazenamento do navegador.",
        true
      );
    }
  });

  /* ========================================
     RESTAURAR CONFIGURAÇÕES
  ======================================== */

  const resetButton = document.querySelector("#reset-settings");

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Deseja restaurar as configurações iniciais do Verão Fit?"
      );

      if (!confirmed) return;

      const user = auth.currentUser;

      if (
        !user ||
        user.email?.toLowerCase() !== adminEmail.toLowerCase()
      ) {
        showMessage(
          "Sua sessão não está autorizada. Entre novamente.",
          true
        );

        return;
      }

      fillForm(defaultSettings);

      try {
        localStorage.removeItem("veraoFitSettings");

        updateOverview();

        showMessage(
          "Configurações iniciais restauradas."
        );
      } catch (error) {
        console.error("Erro ao restaurar configurações:", error);

        showMessage(
          "Não foi possível restaurar as configurações.",
          true
        );
      }
    });
  }
}
