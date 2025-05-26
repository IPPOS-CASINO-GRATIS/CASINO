// js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
// Se usi Analytics, importa anche questo:
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCU5qdpokOFHYw7_MkKA0IJMYvJRwXSSlE", // Metti la TUA CHIAVE REALE QUI
  authDomain: "ippos-casino-premium.firebaseapp.com",
  projectId: "ippos-casino-premium",
  storageBucket: "ippos-casino-premium.appspot.com",
  messagingSenderId: "691446568112",
  appId: "1:691446568112:web:8d63d548226abde7aa1775",
  measurementId: "G-B5S9W3WGBW" // opzionale, se usi Analytics
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Se usi Analytics:
// const analytics = getAnalytics(app);

// Esporta le istanze per usarle in altri moduli
export { app, auth, db };
// Se usi Analytics:
// export { app, auth, db, analytics };

console.log("Firebase App Initialized from firebase-config.js");
