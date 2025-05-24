const functions = require("firebase-functions");
const admin = require("firebase-admin");
const paypal = require("@paypal/paypal-server-sdk");

admin.initializeApp();

// Recupera le credenziali da Firebase config
const { client_id, secret, mode } = functions.config().paypal;

// Crea l’ambiente PayPal
const environment = mode === "live"
  ? new paypal.core.LiveEnvironment(client_id, secret)
  : new paypal.core.SandboxEnvironment(client_id, secret);

const client = new paypal.core.PayPalHttpClient(environment);

// Funzione per creare un ordine
exports.createPaypalOrder = functions.https.onRequest(async (req, res) => {
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: "EUR",
          value: "5.00"
        }
      }]
    });

    const order = await client.execute(request);
    res.status(200).json({ orderID: order.result.id });
  } catch (error) {
    console.error("Errore PayPal:", error);
    res.status(500).json({ error: "Errore nella creazione dell'ordine" });
  }
});
