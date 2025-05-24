// createPaypalOrder.js
const paypal = require('@paypal/checkout-server-sdk');
const fetch = require('node-fetch'); // Per versioni Node < 18 o per coerenza

// Configurazione Ambiente PayPal (Sandbox o Live)
// USARE VARIABILI D'AMBIENTE IN PRODUZIONE!
const PAYPAL_CLIENT_ID = 'AU2ed-MwamUR0Upt37s9x2KnTJqqnbzmI3kVV1d2n8d79RPulkRKDzae5drMAH3JkPaLLQDiNV-eyFO4';
const PAYPAL_CLIENT_SECRET = 'EEyv3eDF98aXT4KVOvUhuYyHBeZWzF6mOgHDftDMmxR5DUbU1aBjwaleBdWhEhivyruCvRAPICiCG61T';
const PAYPAL_API_URL = 'https://api-m.sandbox.paypal.com'; // Sandbox
// const PAYPAL_API_URL = 'https://api-m.paypal.com'; // Live

// Funzione per generare un token di accesso PayPal
async function generateAccessToken() {
    const auth = Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_CLIENT_SECRET).toString('base64');
    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
        },
    });
    const data = await response.json();
    return data.access_token;
}

// Funzione per creare un ordine
async function createOrderPayPal(purchaseAmount, currencyCode, returnUrl, cancelUrl) {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_URL}/v2/checkout/orders`;

    const payload = {
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: currencyCode,
                value: purchaseAmount, // Es. "1.99"
            },
        }, ],
        application_context: {
            return_url: returnUrl, // Es. "https://ippos-casino-gratis.netlify.app/"
            cancel_url: cancelUrl, // Es. "https://ippos-casino-gratis.netlify.app/"
            brand_name: "IPPO'S CASINÒ", // Opzionale: nome del tuo negozio
            user_action: 'PAY_NOW', // Incoraggia il pagamento immediato
        },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            // 'PayPal-Request-Id': 'YOUR_UNIQUE_REQUEST_ID', // Opzionale: per idempotenza
        },
        body: JSON.stringify(payload),
    });

    return response.json(); // Restituisce l'intero oggetto di risposta da PayPal
}

// Handler per la route Express (esempio)
// Questo andrebbe nel tuo file principale del server o in un file di routes
/*
const express = require('express');
const router = express.Router();

router.post('/api/paypal/create-order', async (req, res) => {
    // Qui dovresti verificare l'autenticazione dell'utente (es. tramite Firebase Auth ID Token)
    // const userId = req.user.uid; // Esempio se usi middleware di autenticazione
    // if (!userId) {
    //     return res.status(401).json({ message: "Utente non autenticato." });
    // }

    const amount = "1.99"; // Dall'utente o dalla configurazione
    const currency = "EUR";
    const successReturnUrl = "https://ippos-casino-gratis.netlify.app/"; // Dall'utente
    const cancelReturnUrl = "https://ippos-casino-gratis.netlify.app/";  // Dall'utente

    try {
        console.log(`Tentativo di creare ordine PayPal: ${amount} ${currency}`);
        const orderData = await createOrderPayPal(amount, currency, successReturnUrl, cancelReturnUrl);

        if (orderData.id) {
            console.log("Ordine PayPal creato con successo, ID:", orderData.id);
            res.json({ orderID: orderData.id });
        } else {
            console.error("Errore nella creazione dell'ordine PayPal, risposta:", orderData);
            res.status(500).json({ message: orderData.message || "Errore durante la creazione dell'ordine PayPal." });
        }
    } catch (error) {
        console.error('Errore grave durante la creazione ordine PayPal:', error);
        res.status(500).json({ message: error.message || "Errore server interno." });
    }
});

module.exports = router; // Se stai usando un file di routes separato
*/

// Se vuoi esportare solo la funzione per usarla altrove:
module.exports = { createOrderPayPal, generateAccessToken }; // Esporta anche generateAccessToken se serve altrove