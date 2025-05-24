// firebase-config.js

// Importa le funzioni necessarie dal SDK di Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Configurazione del tuo progetto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCU5qdpokOFHYw7_MkKA0IJMYvJRwXSSlE",
  authDomain: "ippos-casino-premium.firebaseapp.com",
  projectId: "ippos-casino-premium",
  storageBucket: "ippos-casino-premium.firebasestorage.app",
  messagingSenderId: "691446568112",
  appId: "1:691446568112:web:8d63d548226abde7aa1775",
  measurementId: "G-B5S9W3WGBW"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Esporta oggetti da usare nel resto dell'app
export { app, analytics, auth, db };