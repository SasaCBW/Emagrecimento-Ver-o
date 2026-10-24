import { auth, adminEmail } from "./firebase-config.js";

import {
  getPublicSettings,
  savePublicSettings
} from "./firestore-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================================
   CONFIGURAÇÕES PADRÃO
========================================= */

const defaultSettings = {
  courseName: "Verão Fit",
  courseDescription:
    "Um guia prático para organizar hábitos mais equilibrados durante o verão.",
  price: "29.90",
  oldPrice: "97.00",
  checkoutUrl: "",
  contactEmail: "saracbwendling@gmail.com"
};

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const settingsForm = document.querySelector("#settings-form");
const saveMessage = document.querySelector("#save-message");
const logoutButton = document.querySelector("#logout-button");
const resetButton = document.querySelector("#reset-settings");

let authenticatedAdmin = false;
let loadingSettings = false;

/* =========================================
   MENSAGENS
========================================= */

function showMessage(message, isError = false) {
  if (!saveMessage) return;

  saveMessage.textContent = message;
  saveMessage.classList.toggle("error", isError);
  saveMessage.hidden = false;
}

/* =========================================
   VALIDAR ADMINISTRADORA
========================================= */

function isAuthorizedAdmin(user) {
  return Boolean(
    user &&
    user.email &&
    user.email.toLowerCase() === adminEmail.toLowerCase()
  );
}

/* =========================================
   PREENCHER FORMULÁRIO
========================================= */

function fillForm(settings) {
  if (!settingsForm) return;

  Object.entries(settings).forEach(([key, value]) => {
    const field = settingsForm.elements.namedItem(key);

    if (field) {
      field.value = value ?? "";
    }
  });

  updateDashboard(settings);
}

/* =========================================
   ATUALIZAR RESUMO DO PAINEL
========================================= */

function updateDashboard(settings) {
  const priceElement = document.querySelector("#current-price");
  const checkoutStatus = document.querySelector("#checkout-status");

  if (priceElement) {
    const price = Number(settings.price || 0);

    priceElement.textContent = price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  if (checkoutStatus) {
    checkoutStatus.textContent = settings.checkoutUrl
      ? "Configurado"
      : "Não configurado";
  }
}

/* =========================================
   CARREGAR CONFIGURAÇÕES DO FIRESTORE
========================================= */

async function loadSettings() {
  if (!settingsForm) return;

  loadingSettings = true;

  try {
    const settings = await getPublicSettings();

    if (settings) {
      fillForm({
        ...defaultSettings,
        ...settings,
        price: String(settings.price ?? defaultSettings.price),
        oldPrice: String(settings.oldPrice ?? defaultSettings.oldPrice)
      });

      showMessage("Configurações carregadas do banco de dados.");
    } else {
      fillForm(defaultSettings);

      showMessage(
        "Nenhuma configuração foi salva ainda. Preencha os campos e salve."
      );
    }
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);

    fillForm(defaultSettings);

    showMessage(
      "Não foi possível carregar o banco de dados. Verifique se o Firestore foi criado e configurado.",
      true
    );
  } finally {
    loadingSettings = false;
  }
}

/* =========================================
   PROTEGER A PÁGINA ADMINISTRATIVA
========================================= */

const protectedPage = document.body.dataset.protected === "true";

onAuthStateChanged(auth, async (user) => {
  if (!protectedPage) return;

  if (!user) {
    window.location.replace("admin-login.html");
    return;
  }

  if (!isAuthorizedAdmin(user)) {
    await signOut(auth);
    window.location.replace("admin-login.html");
    return;
  }

  authenticatedAdmin = true;

  const userElement = document.querySelector("#admin-user");

  if (userElement) {
    userElement.textContent = user.email;
  }

  document.body.classList.add("admin-authenticated");

  await loadSettings();
});

/* =========================================
   SALVAR CONFIGURAÇÕES
========================================= */

if (settingsForm) {
  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (loadingSettings) {
      showMessage(
        "Aguarde o carregamento das configurações.",
        true
      );
      return;
    }

    const user = auth.currentUser;

    if (!authenticatedAdmin || !isAuthorizedAdmin(user)) {
      showMessage(
        "Você precisa entrar com a conta administrativa autorizada.",
        true
      );
      return;
    }

    const formData = new FormData(settingsForm);
    const settings = {};

    for (const [key, value] of formData.entries()) {
      settings[key] = String(value).trim();
    }

    const price = Number(settings.price);
    const oldPrice = Number(settings.oldPrice || 0);

    if (!Number.isFinite(price) || price < 0) {
      showMessage("Digite um preço atual válido.", true);
      return;
    }

    if (!Number.isFinite(oldPrice) || oldPrice < 0) {
      showMessage("Digite um preço de referência válido.", true);
      return;
    }

    if (settings.checkoutUrl) {
      try {
        const checkout = new URL(settings.checkoutUrl);

        if (checkout.protocol !== "https:") {
          throw new Error("O checkout precisa utilizar HTTPS.");
        }
      } catch {
        showMessage(
          "Informe um endereço de checkout válido começando com https://.",
          true
        );
        return;
      }
    }

    settings.price = price;
    settings.oldPrice = oldPrice;

    const saveButton = settingsForm.querySelector(
      'button[type="submit"]'
    );

    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = "Salvando...";
    }

    showMessage("Salvando configurações no banco de dados...");

    try {
      await savePublicSettings(settings);

      updateDashboard(settings);

      showMessage(
        "Configurações salvas no Firestore com sucesso!"
      );
    } catch (error) {
      console.error("Erro ao salvar:", error);

      showMessage(
        "Não foi possível salvar. Confira a conexão e as regras de segurança do Firestore.",
        true
      );
    } finally {
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = "Salvar configurações →";
      }
    }
  });
}

/* =========================================
   RESTAURAR VALORES INICIAIS
========================================= */

if (resetButton && settingsForm) {
  resetButton.addEventListener("click", () => {
    const user = auth.currentUser;

    if (!authenticatedAdmin || !isAuthorizedAdmin(user)) {
      showMessage(
        "Entre com a conta administrativa para continuar.",
        true
      );
      return;
    }

    const confirmed = window.confirm(
      "Deseja restaurar os valores iniciais? Será necessário salvar para atualizar o banco de dados."
    );

    if (!confirmed) return;

    fillForm(defaultSettings);

    showMessage(
      "Valores iniciais preenchidos. Clique em Salvar configurações para gravá-los."
    );
  });
}

/* =========================================
   SAIR DO PAINEL
========================================= */

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.replace("admin-login.html");
    } catch (error) {
      console.error("Erro ao sair:", error);

      showMessage(
        "Não foi possível sair da conta. Tente novamente.",
        true
      );
    }
  });
}
