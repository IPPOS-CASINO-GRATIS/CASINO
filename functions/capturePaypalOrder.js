// capturePaypalOrder.js
const fetch = require('node-fetch');
const { generateAccessToken } = require('./createPaypalOrder'); // Importa la funzione per il token
const admin = require('firebase-admin'); // Richiede Firebase Admin SDK

// Inizializza Firebase Admin (FALLO UNA SOLA VOLTA nel tuo progetto, preferibilmente in un file separato)
/*
if (!admin.apps.length) {
    const serviceAccount = require("./path/to/your/serviceAccountKey.json"); // PERCORSO ALLA TUA CHIAVE
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // databaseURL: "https://TUO-PROJECT-ID.firebaseio.com" // Se usi Realtime Database
    });
}
const db = admin.firestore();
*/
// Per questo esempio, assumiamo che 'db' sia già inizializzato e disponibile globalmente o passato come parametro.
// Per semplicità, lo definiamo qui, ma in un'app reale va gestito meglio.
let db;
try {
    if (!admin.apps.length) {
        // IMPORTANTE: Assicurati che il percorso al tuo file serviceAccountKey.json sia corretto
        // e che il file sia presente nel tuo ambiente di deploy.
        // const serviceAccount = require("./path/to/your-service-account-file.json");
        // admin.initializeApp({
        //   credential: admin.credential.cert(serviceAccount)
        // });
        console.warn("Firebase Admin SDK non inizializzato. Le operazioni su Firestore falliranno. Configuralo correttamente.");
    }
    // db = admin.firestore(); // Decommenta quando Firebase Admin è configurato
} catch (e) {
    console.error("Errore inizializzazione Firebase Admin (assicurati che serviceAccountKey.json sia configurato):", e);
}


// USARE VARIABILI D'AMBIENTE IN PRODUZIONE!
const PAYPAL_API_URL = 'https://api-m.sandbox.paypal.com'; // Sandbox
// const PAYPAL_API_URL = 'https://api-m.paypal.com'; // Live


async function captureOrderPayPal(orderID) {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            // 'PayPal-Request-Id': 'YOUR_UNIQUE_CAPTURE_REQUEST_ID', // Opzionale
        },
    });

    return response.json();
}

// Funzione per aggiornare lo stato VIP dell'utente su Firestore
// Questa è una versione backend della funzione che avevi nel frontend.
async function updateUserVIPStatusInFirestore(userId, isVIP, purchaseDetails = {}) {
    if (!db) { // Controlla se db è inizializzato (Firebase Admin)
        console.error("Firestore (db) non è inizializzato. Impossibile aggiornare lo stato VIP.");
        throw new Error("Connessione al database non disponibile.");
    }
    if (!userId) {
        console.error("UserID non fornito per aggiornamento VIP.");
        throw new Error("UserID mancante.");
    }

    try {
        const userDocRef = db.collection('users').doc(userId);
        const updateData = {
            isVIP: isVIP,
            vipSince: isVIP ? admin.firestore.FieldValue.serverTimestamp() : null,
            lastPurchase: isVIP ? purchaseDetails : null, // Salva dettagli acquisto se diventa VIP
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        };

        await userDocRef.set(updateData, { merge: true });
        console.log(`Stato VIP per utente ${userId} aggiornato a ${isVIP} su Firestore con dettagli:`, purchaseDetails);
        return { success: true, message: "Stato VIP aggiornato." };
    } catch (error) {
        console.error(`Errore durante l'aggiornamento dello stato VIP per ${userId} su Firestore:`, error);
        throw error; // Rilancia l'errore per gestirlo a livello superiore
    }
}


// Handler per la route Express (esempio)
// Questo andrebbe nel tuo file principale del server o in un file di routes
/*
const express = require('express');
const router =express.Router();

router.post('/api/paypal/capture-order', async (req, res) => {
    // Qui dovresti verificare l'autenticazione dell'utente (es. tramite Firebase Auth ID Token)
    // const userId = req.user.uid; // Esempio
    // if (!userId) {
    //     return res.status(401).json({ message: "Utente non autenticato." });
    // }
    const { orderID } = req.body; // L'orderID viene inviato dal client

    if (!orderID) {
        return res.status(400).json({ message: "orderID mancante." });
    }

    try {
        console.log(`Tentativo di catturare ordine PayPal ID: ${orderID}`);
        const captureData = await captureOrderPayPal(orderID);

        if (captureData.status === 'COMPLETED') {
            console.log("Pagamento PayPal catturato con successo:", captureData);

            // Esempio: Salva lo stato dell'acquisto e aggiorna lo stato VIP dell'utente su Firestore
            // Assicurati che db (Firestore instance) sia inizializzato e disponibile
            // const userId = "USER_ID_FROM_AUTH"; // Ottieni l'ID dell'utente autenticato!
            // await updateUserVIPStatusInFirestore(userId, true, {
            //     paypalOrderId: orderID,
            //     paypalTransactionId: captureData.purchase_units[0].payments.captures[0].id,
            //     amount: captureData.purchase_units[0].payments.captures[0].amount.value,
            //     currency: captureData.purchase_units[0].payments.captures[0].amount.currency_code,
            //     captureTime: captureData.purchase_units[0].payments.captures[0].create_time,
            //     payerEmail: captureData.payer.email_address // Salva l'email per riferimento
            // });

            res.json({ success: true, message: "Pagamento completato con successo!", details: captureData });
        } else {
            console.error("Cattura pagamento PayPal fallita o stato non COMPLETED:", captureData);
            // In base alla risposta di PayPal, potresti voler dare un messaggio più specifico
            res.status(400).json({ success: false, message: captureData.message || "Impossibile completare il pagamento.", details: captureData });
        }
    } catch (error) {
        console.error('Errore grave durante la cattura ordine PayPal:', error);
        res.status(500).json({ success: false, message: error.message || "Errore server interno durante la cattura." });
    }
});
module.exports = router;
*/

// Se vuoi esportare solo la funzione per usarla altrove:
module.exports = { captureOrderPayPal, updateUserVIPStatusInFirestore };