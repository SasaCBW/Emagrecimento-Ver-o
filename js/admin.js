import { auth, adminEmail } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Verifica se a conta tem autorização para acessar o painel.
const protectedPage = document.body.dataset.protected === "true";

onAuthStateChanged(auth, async (user) => {
  if (!protectedPage) return;

  if (!user) {
    window.location.replace("admin-login.html");
    return;
  }

  if (user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    await signOut(auth);
    window.location.replace("admin-login.html");
    return;
  }

  const userElement = document.querySelector("#admin-user");

  if (userElement) {
    userElement.textContent = user.email;
  }

  document.body.classList.add("admin-authenticated");
});

// Sair da conta administrativa.
const logoutButton = document.querySelector("#logout-button");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.replace("admin-login.html");
    } catch (error) {
      console.error("Erro ao sair:", error);
      alert("Não foi possível sair. Tente novamente.");
    }
  });
}

// Configurações do site.
const settingsForm = document.querySelector("#settings-form");
const saveMessage = document.querySelector("#save-message");

const defaultSettings = {
  courseName: "Verão Fit",
  courseDescription:
    "Um guia prático para organizar hábitos mais equilibrados durante o verão.",
  price: "29.90",
  oldPrice: "97.00",
  checkoutUrl: "",
  contactEmail: "saracbwendling@gmail.com"
};

function getSettings() {
  try {
    const saved = localStorage.getItem("veraoFitSettings");

    if (!saved) {
      return { ...defaultSettings };
    }

    return {
      ...defaultSettings,
      ...JSON.parse(saved)
    };
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    return { ...defaultSettings };
  }
}

function fillForm(settings) {
  if (!settingsForm) return;

  Object.entries(settings).forEach(([key, value]) => {
    const field = settingsForm.elements.namedItem(key);

    if (field) {
      field.value = value ?? "";
    }
  });
}

function showMessage(text, isError = false) {
  if (!saveMessage) return;

  saveMessage.textContent = text;
  saveMessage.classList.toggle("error", isError);
  saveMessage.hidden = false;
}

if (settingsForm) {
  fillForm(getSettings());

  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const user = auth.currentUser;

    if (
      !user ||
      user.email?.toLowerCase() !== adminEmail.toLowerCase()
    ) {
      showMessage(
        "Você precisa entrar com a conta administrativa para salvar.",
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

    if (!Number.isFinite(price) || price < 0) {
      showMessage("Digite um preço válido.", true);
      return;
    }

    if (settings.checkoutUrl) {
      try {
        const checkout = new URL(settings.checkoutUrl);

        if (!["https:", "http:"].includes(checkout.protocol)) {
          throw new Error("Protocolo inválido");
        }
      } catch {
        showMessage("Digite um link de checkout válido.", true);
        return;
      }
    }

    try {
      localStorage.setItem(
        "veraoFitSettings",
        JSON.stringify(settings)
      );

      showMessage(
        "Configurações salvas neste navegador com sucesso!"
      );
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);

      showMessage(
        "Não foi possível salvar as configurações neste navegador.",
        true
      );
    }
  });
}

// Botão para restaurar os valores iniciais.
const resetButton = document.querySelector("#reset-settings");

if (resetButton && settingsForm) {
  resetButton.addEventListener("click", () => {
    const confirmed = confirm(
      "Deseja restaurar as configurações iniciais?"
    );

    if (!confirmed) return;

    fillForm(defaultSettings);

    try {
      localStorage.removeItem("veraoFitSettings");
      showMessage("Valores iniciais restaurados.");
    } catch (error) {
      showMessage("Não foi possível restaurar os valores.", true);
    }
  });
}
