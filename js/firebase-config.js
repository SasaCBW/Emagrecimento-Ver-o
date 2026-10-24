import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAnalytics,
  isSupported
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// CONFIGURAÇÃO DO FIREBASE — VERÃO FIT
const firebaseConfig = {
  apiKey: "AIzaSyDjfaQEIkvgBjBfpXH_J2c-fDVPBqRO_A",
  authDomain: "emagrecimentoverao-29a51.firebaseapp.com",
  projectId: "emagrecimentoverao-29a51",
  storageBucket: "emagrecimentoverao-29a51.firebasestorage.app",
  messagingSenderId: "592554572592",
  appId: "1:592554572592:web:de1999ab1cf4a24da0e6f5",
  measurementId: "G-VB88RN7VQ1"
};

// INICIALIZAÇÃO DO FIREBASE
const app = initializeApp(firebaseConfig);

// AUTENTICAÇÃO
const auth = getAuth(app);

// ANALYTICS
isSupported()
  .then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  })
  .catch((error) => {
    console.warn(
      "O Firebase Analytics não pôde ser inicializado:",
      error
    );
  });

// E-MAIL AUTORIZADO PARA ADMINISTRAÇÃO
const adminEmail = "saracbwendling@gmail.com";

// EXPORTAÇÕES UTILIZADAS PELOS OUTROS ARQUIVOS
export {
  app,
  auth,
  firebaseConfig,
  adminEmail
};
