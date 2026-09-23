/* =========================================================
   VG BOIS
   GESTION DU PANIER
========================================================= */


function getCartItems() {

    return JSON.parse(
        localStorage.getItem("vgBoisCart") || "[]"
    );

}


function saveCartItems(cart) {

    localStorage.setItem(
        "vgBoisCart",
        JSON.stringify(cart)
    );

}


function renderCart() {

    const cart =
        getCartItems();

    const container =
        document.getElementById("cartItems");

    const empty =
        document.getElementById("emptyCart");

    const content =
        document.getElementById("cartContent");

    const subtotal =
        document.getElementById("cartSubtotal");

    const total =
        document.getElementById("cartTotal");


    if (!cart.length) {

        empty.style.display = "block";

        content.style.display = "none";

        subtotal.textContent = "0 €";

        total.textContent = "0 €";

        return;

    }


    empty.style.display = "none";

    content.style.display = "grid";


    let totalPrice = 0;


    container.innerHTML =
        cart.map((item, index) => {

            const lineTotal =
                item.price * item.quantity;

            totalPrice += lineTotal;


            return `

                <div class="cart-item">

                    <img
                        class="cart-item-image"
                        src="${item.image}"
                        alt="${item.name}">

                    <div>

                        <h3>
                            ${item.name}
                        </h3>

                        <p>
                            ${Number(item.price).toFixed(2)} €
                            / unité
                        </p>

                        <div class="cart-quantity">

                            <button
                                onclick="changeQuantity(${index}, -1)">
                                −
                            </button>

                            <span>
                                ${item.quantity}
                            </span>

                            <button
                                onclick="changeQuantity(${index}, 1)">
                                +
                            </button>

                        </div>

                        <button
                            class="remove-item"
                            onclick="removeCartItem(${index})">

                            Supprimer

                        </button>

                    </div>


                    <div class="cart-item-price">

                        ${lineTotal.toFixed(2)} €

                    </div>

                </div>

            `;

        }).join("");


    subtotal.textContent =
        totalPrice.toFixed(2) + " €";

    total.textContent =
        totalPrice.toFixed(2) + " €";

}


function changeQuantity(index, amount) {

    const cart =
        getCartItems();

    if (!cart[index]) return;


    cart[index].quantity += amount;


    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }


    saveCartItems(cart);

    renderCart();

    if (typeof updateCartCount === "function") {
        updateCartCount();
    }

}


function removeCartItem(index) {

    const cart =
        getCartItems();

    cart.splice(index, 1);

    saveCartItems(cart);

    renderCart();

    if (typeof updateCartCount === "function") {
        updateCartCount();
    }

}


renderCart();