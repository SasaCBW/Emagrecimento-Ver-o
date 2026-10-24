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

  return snapshot.data();
}

export async function savePublicSettings(settings) {
  const user = auth.currentUser;

  if (!user || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    throw new Error(
      "Apenas a conta administrativa autorizada pode salvar configurações."
    );
  }

  const settingsRef = doc(
    db,
    SETTINGS_COLLECTION,
    SETTINGS_DOCUMENT
  );

  await setDoc(
    settingsRef,
    {
      courseName: String(settings.courseName || "Verão Fit"),
      courseDescription: String(settings.courseDescription || ""),
      price: Number(settings.price || 0),
      oldPrice: Number(settings.oldPrice || 0),
      checkoutUrl: String(settings.checkoutUrl || ""),
      contactEmail: String(settings.contactEmail || ""),
      updatedAt: new Date().toISOString(),
      updatedBy: user.email
    },
    { merge: true }
  );
}
