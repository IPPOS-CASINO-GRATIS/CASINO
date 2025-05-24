// Blocco unico JavaScript <script type="module">

// =========================================
// 1. CONFIGURAZIONE E INIZIALIZZAZIONE FIREBASE
// =========================================
// Importa le funzioni necessarie dal SDK di Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
// Rimosso getAnalytics se non usato direttamente qui per chiarezza
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,     // Per creare il documento utente
    getDoc,     // Per leggere lo stato VIP
    updateDoc,  // Per aggiornare lo stato VIP
    serverTimestamp // Per salvare timestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Configurazione del tuo progetto Firebase (come fornita)
const firebaseConfig = {
  apiKey: "AIzaSyCU5qdpokOFHYw7_MkKA0IJMYvJRwXSSlE", // USA LA TUA CHIAVE REALE
  authDomain: "ippos-casino-premium.firebaseapp.com",
  projectId: "ippos-casino-premium",
  storageBucket: "ippos-casino-premium.appspot.com", // Controlla sia corretto nella tua console Firebase
  messagingSenderId: "691446568112",
  appId: "1:691446568112:web:8d63d548226abde7aa1775",
  measurementId: "G-B5S9W3WGBW" // opzionale
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);      // Istanza Autenticazione
const db = getFirestore(app);  // Istanza Firestore Database
// const analytics = getAnalytics(app); // Inizializza se necessario

console.log("Firebase Initialized (Auth & Firestore ready)");


// =========================================
// 2. FUNZIONI DI AUTENTICAZIONE
// =========================================

/**
 * Registra un nuovo utente con email e password e crea il suo documento su Firestore.
 * @param {string} email Email utente.
 * @param {string} password Password utente (min 6 caratteri).
 * @returns {Promise<import("firebase/auth").User>} Oggetto User se successo.
 * @throws {Error} Errore Firebase o creazione documento.
 */
async function registerUser(email, password) {
    if (!email || !password || password.length < 6) {
        throw new Error("Email e password valide (min 6 caratteri) sono richieste.");
    }
    try {
        // 1. Crea utente in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        console.log(`User registered in Auth: ${newUser.email} (UID: ${newUser.uid})`);

        // 2. Crea documento utente in Firestore
        const userDocRef = doc(db, "users", newUser.uid);
        try {
            await setDoc(userDocRef, {
                email: newUser.email,
                isVIP: false, // Nuovo utente NON è VIP di default
                createdAt: serverTimestamp(), // Timestamp creazione account
                vipUpdatedAt: null // Timestamp ultimo aggiornamento VIP
            });
            console.log(`User document created in Firestore for UID: ${newUser.uid}`);
            return newUser; // Ritorna l'oggetto User completo
        } catch (dbError) {
            console.error("Firestore Error: Failed to create user document.", dbError);
            // L'utente è registrato in Auth ma non nel DB! Gestire questo caso critico.
            // Potresti tentare di eliminare l'utente da Auth o segnalare l'errore.
            throw new Error("Errore critico: impossibile salvare i dati utente dopo la registrazione.");
        }
    } catch (authError) {
        console.error("Auth Error: Registration failed.", authError);
        // Rilancia l'errore per essere gestito dal chiamante (es. UI)
        throw authError; // Puoi mappare questo a un messaggio più user-friendly se necessario
    }
}

/**
 * Effettua il login di un utente esistente.
 * @param {string} email Email utente.
 * @param {string} password Password utente.
 * @returns {Promise<import("firebase/auth").User>} Oggetto User se successo.
 * @throws {Error} Errore Firebase.
 */
async function loginUser(email, password) {
    if (!email || !password) {
        throw new Error("Email e password sono richieste.");
    }
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log(`User logged in: ${userCredential.user.email}`);
        return userCredential.user;
    } catch (error) {
        console.error("Auth Error: Login failed.", error);
        throw error; // Rilancia per gestione UI
    }
}

/**
 * Effettua il logout dell'utente corrente.
 * @returns {Promise<void>}
 * @throws {Error} Errore Firebase.
 */
async function logoutUser() {
    try {
        await signOut(auth);
        console.log("User logged out successfully.");
    } catch (error) {
        console.error("Auth Error: Logout failed.", error);
        throw error;
    }
}


// =========================================
// 3. GESTIONE STATO VIP (FIRESTORE)
// =========================================

/**
 * Imposta lo stato VIP di un utente su Firestore a true.
 * Da chiamare DOPO una verifica di pagamento PayPal andata a buon fine.
 * @param {string} userId UID dell'utente da aggiornare.
 * @returns {Promise<void>}
 * @throws {Error} Errore Firestore.
 */
async function setUserVIPStatus(userId) {
    if (!userId) {
        throw new Error("User ID è richiesto per aggiornare lo stato VIP.");
    }
    const userDocRef = doc(db, "users", userId);
    try {
        await updateDoc(userDocRef, {
            isVIP: true,
            vipUpdatedAt: serverTimestamp() // Aggiorna timestamp VIP
        });
        console.log(`User ${userId} successfully updated to VIP status in Firestore.`);
    } catch (error) {
        console.error(`Firestore Error: Failed to update VIP status for user ${userId}.`, error);
        throw new Error("Errore durante l'aggiornamento dello stato VIP.");
    }
}

/**
 * Controlla lo stato VIP di un utente leggendo da Firestore.
 * @param {string} userId UID dell'utente da controllare.
 * @returns {Promise<boolean>} True se l'utente è VIP, false altrimenti (o se non trovato).
 */
async function checkUserVIPStatus(userId) {
    if (!userId) {
        console.warn("checkUserVIPStatus called without userId.");
        return false;
    }
    const userDocRef = doc(db, "users", userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log(`Checked VIP status for ${userId}: ${userData.isVIP || false}`);
            return userData.isVIP || false; // Ritorna il valore di isVIP (o false se non definito)
        } else {
            console.warn(`User document not found for UID: ${userId} during VIP check.`);
            return false; // Utente non trovato, quindi non VIP
        }
    } catch (error) {
        console.error(`Firestore Error: Failed to get VIP status for user ${userId}.`, error);
        return false; // In caso di errore, considera non VIP per sicurezza
    }
}


// =========================================
// 4. INTEGRAZIONE PAGAMENTO (PAYPAL - Placeholder)
// =========================================

/**
 * Funzione Placeholder da chiamare dopo che PayPal conferma un pagamento valido.
 * Simula la logica post-pagamento: verifica (dovrebbe essere fatta server-side!)
 * e aggiorna lo stato VIP su Firestore.
 * @param {string} userId UID dell'utente che ha pagato.
 * @param {object} paypalDetails Dettagli della transazione PayPal (es. { orderId: '...', status: 'COMPLETED', amount: ... })
 * @returns {Promise<void>}
 * @throws {Error} Se il pagamento non è valido o l'aggiornamento fallisce.
 */
async function handlePayPalSuccess(userId, paypalDetails) {
    console.log(`Handling successful PayPal payment for user ${userId}`, paypalDetails);

    // !!! IMPORTANTE: VERIFICA SERVER-SIDE !!!
    // In un'applicazione reale, NON dovresti fidarti dei dati dal client.
    // Dovresti inviare paypalDetails.orderId (e userId) a un backend sicuro
    // (es. Firebase Cloud Function) che verifichi l'ordine DIRETTAMENTE con l'API PayPal
    // per confermare stato 'COMPLETED' e importo corretto PRIMA di aggiornare Firestore.

    // --- Simulazione Verifica (NON SICURA!) ---
    if (paypalDetails && paypalDetails.status === 'COMPLETED') { // Esempio molto basilare
        console.log("PayPal payment status seems COMPLETED (Client-side check - INSECURE!).");
        try {
            // Se la verifica (server-side) fosse ok, aggiorna lo stato VIP
            await setUserVIPStatus(userId);
            console.log(`VIP status updated for user ${userId} after simulated successful payment.`);
            // Qui potresti triggerare un refresh dell'UI o mostrare un messaggio di successo
        } catch (error) {
            console.error("Failed to update VIP status after payment.", error);
            // Gestire l'errore (es. informare l'utente, loggare per intervento manuale)
            throw new Error("Errore aggiornamento VIP dopo pagamento.");
        }
    } else {
        console.warn("PayPal payment status not 'COMPLETED' or details missing.", paypalDetails);
        throw new Error("Pagamento PayPal non valido o non completato.");
    }
}


// =========================================
// 5. LISTENER STATO AUTENTICAZIONE (VERIFICA VIP AL LOGIN)
// =========================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Utente è loggato
        console.log(`Auth State Change: User ${user.email} is logged in.`);
        try {
            // Verifica lo stato VIP leggendo da Firestore
            const isVIP = await checkUserVIPStatus(user.uid);
            console.log(`User ${user.email} is ${isVIP ? 'VIP' : 'NOT VIP'}.`);

            // -------- Punto Decisionale per l'UI --------
            // Qui, basandoti sul valore di 'isVIP', decideresti cosa mostrare/nascondere
            // nell'interfaccia utente (es. sbloccare giochi, mostrare badge VIP).
            // Esempio concettuale:
            if (isVIP) {
                // showVIPFeatures();
                // hideUpgradeButton();
            } else {
                // hideVIPFeatures();
                // showUpgradeButton();
            }
            // --------------------------------------------

        } catch (error) {
            console.error("Error checking VIP status on Auth State Change:", error);
            // Gestire l'errore (es. mostrare un messaggio all'utente)
        }
    } else {
        // Utente è loggato fuori
        console.log("Auth State Change: User is logged out.");
         // -------- Punto Decisionale per l'UI --------
         // Qui resetteresti l'interfaccia allo stato "non loggato / non VIP"
         // Esempio concettuale:
         // showLoginForm();
         // hideVIPFeatures();
         // hideLogoutButton();
         // --------------------------------------------
    }
});


// =========================================
// 6. ESPORTAZIONI (Opzionale, per uso in altri moduli)
// =========================================
// Esporta le funzioni principali per poterle chiamare da altri script/event listener
export {
    auth, // Esporta istanza Auth
    db,   // Esporta istanza Firestore
    registerUser,
    loginUser,
    logoutUser,
    setUserVIPStatus,
    checkUserVIPStatus,
    handlePayPalSuccess,
    onAuthStateChanged // Esporta anche il listener se serve altrove
};

// Esempio di come potresti usare queste funzioni da un altro script
// (che gestisce i click sui bottoni, etc.):
/*
import { loginUser, registerUser, logoutUser, handlePayPalSuccess } from './firebase-logic.js'; // Assumendo questo file sia firebase-logic.js

document.getElementById('login-button').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await loginUser(email, password);
        // UI si aggiorna tramite onAuthStateChanged
    } catch (error) {
        // Mostra errore all'utente
    }
});

// Simula chiamata dopo successo PayPal (da un listener del bottone PayPal)
async function onPayPalPaymentSuccess(details) {
     const currentUser = auth.currentUser; // Assumendo 'auth' sia importato o globale
     if (currentUser) {
         try {
             await handlePayPalSuccess(currentUser.uid, details);
             alert("Pagamento VIP completato!");
         } catch(error) {
             alert(`Errore aggiornamento VIP: ${error.message}`);
         }
     } else {
          alert("Devi essere loggato per diventare VIP.");
     }
}
*/