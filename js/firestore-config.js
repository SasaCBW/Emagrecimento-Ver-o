import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  app,
  auth,
  adminEmail
} from "./firebase-config.js";

export const db = getFirestore(app);

const SETTINGS_COLLECTION = "siteSettings";
const SETTINGS_DOCUMENT = "public";

const DEFAULT_SETTINGS = {
  courseName: "Verão Fit",
  courseDescription:
    "Um guia informativo para desenvolver hábitos saudáveis, equilíbrio e bem-estar.",
  price: 0,
  oldPrice: 0,
  checkoutUrl: "",
  contactEmail: "saracbwendling@gmail.com"
};

/**
 * Retorna as configurações padrão do site.
 */
export function getDefaultSettings() {
  return { ...DEFAULT_SETTINGS };
}

/**
 * Busca as configurações públicas do site no Firestore.
 * Retorna null quando o documento ainda não existe.
 */
export async function getPublicSettings() {
  const settingsRef = doc(
    db,
    SETTINGS_COLLECTION,
    SETTINGS_DOCUMENT
  );

  const snapshot = await getDoc(settingsRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    ...DEFAULT_SETTINGS,
    ...data
  };
}

/**
 * Salva as configurações públicas do site.
 * Somente o administrador autorizado pode salvar.
 */
export async function savePublicSettings(settings) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Você precisa entrar na conta administrativa.");
  }

  if (
    !user.email ||
    user.email.toLowerCase() !== adminEmail.toLowerCase()
  ) {
    throw new Error("Sua conta não tem autorização para salvar alterações.");
  }

  const courseName = String(
    settings.courseName || DEFAULT_SETTINGS.courseName
  ).trim();

  const courseDescription = String(
    settings.courseDescription ||
    DEFAULT_SETTINGS.courseDescription
  ).trim();

  const price = Number(settings.price);
  const oldPrice = Number(settings.oldPrice);

  const checkoutUrl = String(
    settings.checkoutUrl || ""
  ).trim();

  const contactEmail = String(
    settings.contactEmail || DEFAULT_SETTINGS.contactEmail
  ).trim();

  if (!courseName) {
    throw new Error("Informe o nome do produto.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Informe um preço válido.");
  }

  if (!Number.isFinite(oldPrice) || oldPrice < 0) {
    throw new Error("Informe um preço anterior válido.");
  }

  if (checkoutUrl) {
    let parsedUrl;

    try {
      parsedUrl = new URL(checkoutUrl);
    } catch {
      throw new Error("O endereço de pagamento não é válido.");
    }

    if (parsedUrl.protocol !== "https:") {
      throw new Error("O endereço de pagamento precisa utilizar HTTPS.");
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error("Informe um e-mail de contato válido.");
  }

  const settingsRef = doc(
    db,
    SETTINGS_COLLECTION,
    SETTINGS_DOCUMENT
  );

  const dataToSave = {
    courseName,
    courseDescription,
    price,
    oldPrice,
    checkoutUrl,
    contactEmail,
    updatedAt: new Date().toISOString(),
    updatedBy: user.email
  };

  await setDoc(settingsRef, dataToSave, { merge: true });

  return dataToSave;
}
