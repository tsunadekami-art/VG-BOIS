require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const Stripe = require("stripe");

const app = express();

const PORT = process.env.PORT || 3000;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const DATA_DIR = path.join(__dirname, "data");
const ORDERS_FILE = path.join(DATA_DIR, "commandes.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, "[]", "utf8");
}

/*
====================================================
PRODUITS
====================================================

IMPORTANT :
Remplace les prix ci-dessous par les vrais prix
présents sur ton site VG BOIS.

Les prix sont en centimes.
99 € = 9900
189 € = 18900
*/

const PRODUCTS = {
    "bois-1": {
        name: "1 stère de bois de chauffage",
        price: 9900
    },

    "bois-2": {
        name: "2 stères de bois de chauffage",
        price: 18900
    },

    "bois-3": {
        name: "3 stères de bois de chauffage",
        price: 26900
    },

    "bois-5": {
        name: "5 stères de bois de chauffage",
        price: 42900
    }
};

/*
====================================================
FRAIS DE LIVRAISON
====================================================

Ceci est une configuration EXEMPLE.

Adapte les codes postaux et les montants
aux vraies zones de livraison de VG BOIS.
*/

function calculateDeliveryFee(postalCode) {

    const code = String(postalCode).trim();

    // Strasbourg
    const strasbourgCodes = [
        "67000",
        "67100",
        "67200"
    ];

    if (strasbourgCodes.includes(code)) {
        return 0;
    }

    // Exemple : autres communes du Bas-Rhin
    if (code.startsWith("67")) {
        return 1500; // 15 €
    }

    return null;
}

/*
====================================================
LECTURE DES COMMANDES
====================================================
*/

function readOrders() {
    try {
        return JSON.parse(
            fs.readFileSync(ORDERS_FILE, "utf8")
        );
    } catch {
        return [];
    }
}

function saveOrders(orders) {
    fs.writeFileSync(
        ORDERS_FILE,
        JSON.stringify(orders, null, 2),
        "utf8"
    );
}

/*
====================================================
WEBHOOK STRIPE
====================================================

IMPORTANT :
Cette route doit être placée AVANT express.json()
car Stripe vérifie la signature sur le corps brut.
*/

app.post(
    "/api/stripe-webhook",
    express.raw({ type: "application/json" }),
    (req, res) => {

        const signature = req.headers["stripe-signature"];

        let event;

        try {

            event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );

        } catch (error) {

            console.error(
                "Erreur signature Stripe :",
                error.message
            );

            return res.status(400).send(
                `Webhook Error: ${error.message}`
            );
        }

        /*
        ================================================
        PAIEMENT RÉUSSI
        ================================================
        */

        if (event.type === "checkout.session.completed") {

            const session = event.data.object;

            const orderId = session.metadata?.order_id;

            const orders = readOrders();

            const order = orders.find(
                item => item.id === orderId
            );

            if (order) {

                order.status = "PAYE";

                order.stripeSessionId = session.id;

                order.paymentStatus = session.payment_status;

                order.paidAt = new Date().toISOString();

                saveOrders(orders);

                console.log(
                    "Commande payée :",
                    order.id
                );
            }
        }

        res.json({ received: true });
    }
);

/*
====================================================
JSON
====================================================
*/

app.use(express.json());

/*
====================================================
FICHIERS DU SITE
====================================================
*/

app.use(express.static(__dirname));

/*
====================================================
CRÉATION DU PAIEMENT STRIPE
====================================================
*/

app.post("/api/create-checkout-session", async (req, res) => {

    try {

        const {
            productId,
            quantity,
            firstName,
            lastName,
            email,
            phone,
            address,
            postalCode,
            city,
            instructions
        } = req.body;

        /*
        Validation
        */

        if (
            !productId ||
            !quantity ||
            !firstName ||
            !lastName ||
            !email ||
            !phone ||
            !address ||
            !postalCode ||
            !city
        ) {
            return res.status(400).json({
                error: "Veuillez remplir tous les champs obligatoires."
            });
        }

        const product = PRODUCTS[productId];

        if (!product) {
            return res.status(400).json({
                error: "Produit invalide."
            });
        }

        const qty = Number(quantity);

        if (
            !Number.isInteger(qty) ||
            qty < 1 ||
            qty > 20
        ) {
            return res.status(400).json({
                error: "Quantité invalide."
            });
        }

        /*
        Frais de livraison
        */

        const deliveryFee = calculateDeliveryFee(postalCode);

        if (deliveryFee === null) {
            return res.status(400).json({
                error:
                    "Cette adresse est actuellement hors de notre zone de livraison."
            });
        }

        /*
        Création d'un numéro de commande
        */

        const orderId =
            "VG-" +
            Date.now().toString(36).toUpperCase() +
            "-" +
            Math.floor(Math.random() * 10000);

        /*
        Calcul du montant total
        */

        const productTotal =
            product.price * qty;

        const total =
            productTotal + deliveryFee;

        /*
        Enregistrement initial
        */

        const orders = readOrders();

        const order = {

            id: orderId,

            status: "EN_ATTENTE_PAIEMENT",

            customer: {
                firstName,
                lastName,
                email,
                phone,
                address,
                postalCode,
                city,
                instructions: instructions || ""
            },

            product: {
                id: productId,
                name: product.name,
                quantity: qty,
                unitPrice: product.price
            },

            deliveryFee,

            total,

            createdAt:
                new Date().toISOString()
        };

        orders.push(order);

        saveOrders(orders);

        /*
        ================================================
        SESSION STRIPE
        ================================================
        */

        const session =
            await stripe.checkout.sessions.create({

                mode: "payment",

                customer_email: email,

                line_items: [

                    {
                        price_data: {

                            currency: "eur",

                            product_data: {
                                name: product.name
                            },

                            unit_amount: product.price
                        },

                        quantity: qty
                    },

                    ...(deliveryFee > 0
                        ? [
                            {
                                price_data: {

                                    currency: "eur",

                                    product_data: {
                                        name: "Livraison VG BOIS"
                                    },

                                    unit_amount: deliveryFee
                                },

                                quantity: 1
                            }
                        ]
                        : [])
                ],

                billing_address_collection:
                    "required",

                phone_number_collection: {
                    enabled: true
                },

                metadata: {
                    order_id: orderId
                },

                success_url:
                    `${process.env.BASE_URL}/confirmation.html?session_id={CHECKOUT_SESSION_ID}`,

                cancel_url:
                    `${process.env.BASE_URL}/commande.html?paiement=annule`,

                locale: "fr"
            });

        /*
        On sauvegarde l'identifiant Stripe
        */

        order.stripeSessionId = session.id;

        saveOrders(orders);

        res.json({
            success: true,
            url: session.url
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                "Une erreur est survenue lors de la création du paiement."
        });
    }
});

/*
====================================================
VÉRIFIER UNE SESSION APRÈS PAIEMENT
====================================================
*/

app.get("/api/session/:id", async (req, res) => {

    try {

        const session =
            await stripe.checkout.sessions.retrieve(
                req.params.id
            );

        res.json({

            status: session.status,

            payment_status:
                session.payment_status,

            amount_total:
                session.amount_total,

            currency:
                session.currency,

            customer_email:
                session.customer_details?.email || null

        });

    } catch (error) {

        console.error(error);

        res.status(404).json({
            error: "Session introuvable."
        });
    }
});

/*
====================================================
DÉMARRAGE
====================================================
*/

app.listen(PORT, () => {

    console.log(
        `VG BOIS lancé sur http://localhost:${PORT}`
    );

});