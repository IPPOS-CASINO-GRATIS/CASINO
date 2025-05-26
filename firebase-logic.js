// js/firebase-logic.js

// Importa le funzioni necessarie dal SDK di Firebase
// Non inizializzare l'app qui se firebase-config.js lo fa e lo esporta.
// Assumiamo che auth e db vengano importati da firebase-config.js
import { auth, db } from "./firebase-config.js";

// Importa funzioni specifiche per Firestore
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Importa onAuthStateChanged direttamente da Firebase Auth
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";


console.log("Firebase Logic loaded. Auth & Firestore instances expected from firebase-config.js.");

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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        console.log(`User registered in Auth: ${newUser.email} (UID: ${newUser.uid})`);

        const userDocRef = doc(db, "users", newUser.uid);
        try {
            await setDoc(userDocRef, {
                email: newUser.email,
                isVIP: false,
                saldo: 1000, // Saldo iniziale di default
                createdAt: serverTimestamp(),
                vipUpdatedAt: null
            });
            console.log(`User document created in Firestore for UID: ${newUser.uid}`);
            return newUser;
        } catch (dbError) {
            console.error("Firestore Error: Failed to create user document.", dbError);
            throw new Error("Errore critico: impossibile salvare i dati utente dopo la registrazione.");
        }
    } catch (authError) {
        console.error("Auth Error: Registration failed.", authError);
        throw authError;
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
        throw error;
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
            vipUpdatedAt: serverTimestamp()
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
            return userData.isVIP || false;
        } else {
            console.warn(`User document not found for UID: ${userId} during VIP check.`);
            return false;
        }
    } catch (error) {
        console.error(`Firestore Error: Failed to get VIP status for user ${userId}.`, error);
        return false;
    }
}

// =========================================
// AGGIUNTA: FUNZIONE PER AGGIORNARE IL SALDO UTENTE IN FIRESTORE
// =========================================

/**
 * Aggiorna il saldo dell'utente in Firestore.
 * @param {string} userId UID dell'utente.
 * @param {number} newSaldo Il nuovo saldo da salvare.
 * @returns {Promise<void>}
 * @throws {Error} Errore Firestore.
 */
async function updateSaldoInFirestore(userId, newSaldo) {
    if (!userId || typeof newSaldo !== 'number') {
        throw new Error("User ID e un saldo numerico valido sono richiesti.");
    }
    const userDocRef = doc(db, "users", userId);
    try {
        await updateDoc(userDocRef, {
            saldo: newSaldo,
            lastUpdated: serverTimestamp() // Aggiungi un timestamp per tracciare le modifiche
        });
        console.log(`Saldo utente ${userId} aggiornato a ${newSaldo} in Firestore.`);
    } catch (error) {
        console.error(`Firestore Error: Failed to update saldo for user ${userId}.`, error);
        throw new Error("Errore durante l'aggiornamento del saldo.");
    }
}

// =========================================
// AGGIUNTA: FUNZIONE PER LEGGERE IL SALDO UTENTE DA FIRESTORE
// =========================================

/**
 * Legge il saldo dell'utente da Firestore.
 * @param {string} userId UID dell'utente.
 * @returns {Promise<number>} Il saldo dell'utente, o 0 se non trovato.
 * @throws {Error} Errore Firestore.
 */
async function getSaldoFromFirestore(userId) {
    if (!userId) {
        console.warn("getSaldoFromFirestore called without userId.");
        return 0;
    }
    const userDocRef = doc(db, "users", userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            return userData.saldo || 0;
        } else {
            console.warn(`User document not found for UID: ${userId} during saldo check.`);
            return 0;
        }
    } catch (error) {
        console.error(`Firestore Error: Failed to get saldo for user ${userId}.`, error);
        return 0;
    }
}


// =========================================
// 4. INTEGRAZIONE PAGAMENTO (PAYPAL - Placeholder)
// =========================================

/**
 * Funzione da chiamare dopo che PayPal conferma un pagamento valido.
 * DOVREBBE ESSERE FATTA SERVER-SIDE (es. Firebase Cloud Function) per sicurezza.
 * Qui è client-side solo per dimostrazione.
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
    if (paypalDetails && paypalDetails.status === 'COMPLETED') {
        console.log("PayPal payment status seems COMPLETED (Client-side check - INSECURE!).");
        try {
            await setUserVIPStatus(userId);
            console.log(`VIP status updated for user ${userId} after simulated successful payment.`);
        } catch (error) {
            console.error("Failed to update VIP status after payment.", error);
            throw new Error("Errore aggiornamento VIP dopo pagamento.");
        }
    } else {
        console.warn("PayPal payment status not 'COMPLETED' or details missing.", paypalDetails);
        throw new Error("Pagamento PayPal non valido o non completato.");
    }
}


// =========================================
// 5. ESPORTAZIONI (per uso in altri moduli)
// =========================================
export {
    auth,
    db,
    registerUser,
    loginUser,
    logoutUser,
    setUserVIPStatus,
    checkUserVIPStatus,
    handlePayPalSuccess,
    onAuthStateChanged, // Esporta anche il listener per collegarlo a uno script esterno
    updateSaldoInFirestore,
    getSaldoFromFirestore
};
