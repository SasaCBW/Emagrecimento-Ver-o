import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjfaQEIkvgBjBfpXH_J2c-fDVPBqRO_A",
  authDomain: "emagrecimentoverao-29a51.firebaseapp.com",
  projectId: "emagrecimentoverao-29a51",
  storageBucket: "emagrecimentoverao-29a51.firebasestorage.app",
  messagingSenderId: "592554572592",
  appId: "1:592554572592:web:de1999ab1cf4a24da0e6f5",
  measurementId: "G-VB88RN7VQ1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

isSupported()
  .then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  })
  .catch((error) => {
    console.warn("Analytics indisponível:", error);
  });

export { app, auth, firebaseConfig };

export const adminEmail = "saracbwendling@gmail.com";
