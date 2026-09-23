/* =========================================================
   VG BOIS
   COMMANDE ET FICHE PRODUIT
========================================================= */


/* =========================================================
   PRODUITS
========================================================= */

const products = {

    bois25: {
        name: "Bois de chauffage 25 cm",
        price: 95,
        format: "25 cm",
        type: "Bûches",
        image: "https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&w=1200&q=80"
    },

    bois33: {
        name: "Bois de chauffage 33 cm",
        price: 92,
        format: "33 cm",
        type: "Bûches",
        image: "https://images.unsplash.com/photo-1605906537664-4b1c3e7d1f37?auto=format&fit=crop&w=1200&q=80"
    },

    bois40: {
        name: "Bois de chauffage 40 cm",
        price: 90,
        format: "40 cm",
        type: "Bûches",
        image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1200&q=80"
    },

    bois50: {
        name: "Bois de chauffage 50 cm",
        price: 88,
        format: "50 cm",
        type: "Bûches",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80"
    },

    pack3: {
        name: "Pack de 3 stères",
        price: 255,
        format: "33 cm",
        type: "Pack",
        image: "https://images.unsplash.com/photo-1593013283867-cb6c7b7e9e88?auto=format&fit=crop&w=1200&q=80"
    },

    pack5: {
        name: "Pack de 5 stères",
        price: 415,
        format: "33 cm",
        type: "Pack",
        image: "https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&w=1200&q=80"
    }

};


/* =========================================================
   FICHE PRODUIT
========================================================= */

function loadProductPage() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("id") || "bois25";

    const product =
        products[id];

    if (!product) return;


    const name =
        document.getElementById("productName");

    const price =
        document.getElementById("productPrice");

    const image =
        document.getElementById("productImage");

    const format =
        document.getElementById("productFormat");

    const type =
        document.getElementById("productType");

    const breadcrumb =
        document.getElementById("breadcrumbProduct");

    const total =
        document.getElementById("detailTotal");

    const quantity =
        document.getElementById("quantity");


    if (name) name.textContent = product.name;

    if (price)
        price.textContent =
            product.price.toFixed(2) + " €";

    if (image) {

        image.src =
            product.image;

        image.alt =
            product.name;

    }

    if (format)
        format.textContent =
            product.format;

    if (type)
        type.textContent =
            product.type;

    if (breadcrumb)
        breadcrumb.textContent =
            product.name;


    function updateTotal() {

        const qty =
            Math.max(
                1,
                Number(quantity.value) || 1
            );

        total.textContent =
            (product.price * qty)
                .toFixed(2) + " €";

    }


    const minus =
        document.getElementById("minus");

    const plus =
        document.getElementById("plus");


    if (minus) {

        minus.addEventListener(
            "click",
            function() {

                let qty =
                    Number(quantity.value);

                if (qty > 1) {
                    qty--;
                }

                quantity.value =
                    qty;

                updateTotal();

            }
        );

    }


    if (plus) {

        plus.addEventListener(
            "click",
            function() {

                let qty =
                    Number(quantity.value);

                if (qty < 50) {
                    qty++;
                }

                quantity.value =
                    qty;

                updateTotal();

            }
        );

    }


    if (quantity) {

        quantity.addEventListener(
            "input",
            updateTotal
        );

    }


    const addButton =
        document.getElementById(
            "addProduct"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            function() {

                const qty =
                    Math.max(
                        1,
                        Number(quantity.value) || 1
                    );


                const cart =
                    JSON.parse(
                        localStorage.getItem(
                            "vgBoisCart"
                        ) || "[]"
                    );


                const existing =
                    cart.find(
                        item =>
                            item.id === id
                    );


                if (existing) {

                    existing.quantity +=
                        qty;

                } else {

                    cart.push({

                        id: id,

                        name:
                            product.name,

                        price:
                            product.price,

                        image:
                            product.image,

                        quantity:
                            qty

                    });

                }


                localStorage.setItem(
                    "vgBoisCart",
                    JSON.stringify(cart)
                );


                if (
                    typeof updateCartCount ===
                    "function"
                ) {

                    updateCartCount();

                }


                window.location.href =
                    "panier.html";

            }
        );

    }


    updateTotal();

}


/* =========================================================
   RÉSUMÉ DE COMMANDE
========================================================= */

function renderCheckout() {

    const container =
        document.getElementById(
            "checkoutItems"
        );

    const totalElement =
        document.getElementById(
            "checkoutTotal"
        );

    if (!container || !totalElement)
        return;


    const cart =
        JSON.parse(
            localStorage.getItem(
                "vgBoisCart"
            ) || "[]"
        );


    if (!cart.length) {

        container.innerHTML = `
            <div class="notice">
                Votre panier est vide.
            </div>
        `;

        totalElement.textContent =
            "0 €";

        return;

    }


    let total = 0;


    container.innerHTML =
        cart.map(item => {

            const line =
                item.price *
                item.quantity;

            total += line;


            return `

                <div class="summary-row">

                    <span>
                        ${item.name}
                        × ${item.quantity}
                    </span>

                    <strong>
                        ${line.toFixed(2)} €
                    </strong>

                </div>

            `;

        }).join("");


    totalElement.textContent =
        total.toFixed(2) + " €";

}


/* =========================================================
   FORMULAIRE DE COMMANDE
========================================================= */

function setupOrderForm() {

    const form =
        document.getElementById(
            "orderForm"
        );

    if (!form) return;


    form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const cart =
                JSON.parse(
                    localStorage.getItem(
                        "vgBoisCart"
                    ) || "[]"
                );


            if (!cart.length) {

                alert(
                    "Votre panier est vide."
                );

                window.location.href =
                    "boutique.html";

                return;

            }


            const formData =
                new FormData(form);


            const customer = {

                firstName:
                    formData.get(
                        "firstName"
                    ),

                lastName:
                    formData.get(
                        "lastName"
                    ),

                email:
                    formData.get(
                        "email"
                    ),

                phone:
                    formData.get(
                        "phone"
                    ),

                address:
                    formData.get(
                        "address"
                    ),

                postalCode:
                    formData.get(
                        "postalCode"
                    ),

                city:
                    formData.get(
                        "city"
                    ),

                deliveryNotes:
                    formData.get(
                        "deliveryNotes"
                    ),

                deliveryType:
                    formData.get(
                        "deliveryType"
                    )

            };


            localStorage.setItem(
                "vgBoisCustomer",
                JSON.stringify(customer)
            );


            /*
             * IMPORTANT :
             * Dans la version de production,
             * ces informations doivent être envoyées
             * à votre serveur sécurisé.
             */


            window.location.href =
                "paiement.html";

        }
    );

}


/* =========================================================
   INITIALISATION
========================================================= */

loadProductPage();

renderCheckout();

setupOrderForm();