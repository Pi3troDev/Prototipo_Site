// Arquivo: script.js - ATUALIZADO

let cart = [];

// Elementos do DOM (Interface)
const modal = document.getElementById("cart-modal");
const cartBtn = document.getElementById("cart-btn");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalElement = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const cartCounter = document.getElementById("cart-count");

// Elementos de Pagamento e Endereço
const addressInput = document.getElementById("address");
const addressWarn = document.getElementById("address-warn");
const paymentMethodSelect = document.getElementById("payment-method");
const paymentWarn = document.getElementById("payment-warn");
const trocoField = document.getElementById("troco-field");
const trocoValueInput = document.getElementById("troco-value");

// Chave PIX do estabelecimento (Simulada, mas será exibida no WhatsApp)
const PIX_KEY = "5511999999999"; // Chave PIX: Telefone ou CNPJ

// --- 1. FUNÇÕES AUXILIARES ---

function showToast(text, color) {
    Toastify({
        text: text,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: color,
        },
    }).showToast();
}

// --- 2. MANIPULAÇÃO DO CARRINHO E MODAL ---

cartBtn.addEventListener("click", function() {
    updateCartModal();
    modal.style.display = "flex";
});

modal.addEventListener("click", function(event) {
    if(event.target === modal) {
        modal.style.display = "none";
    }
});
closeModalBtn.addEventListener("click", function() {
    modal.style.display = "none";
});

// Adicionar Item ao Carrinho
const addToCartBtns = document.querySelectorAll(".add-to-cart-btn");
addToCartBtns.forEach(btn => {
    btn.addEventListener("click", function(e) {
        e.preventDefault();
        const name = btn.getAttribute("data-name");
        const price = parseFloat(btn.getAttribute("data-price"));
        addToCart(name, price);
        showToast(`"${name}" adicionado ao carrinho!`, "#2ecc71");
    })
});

function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);

    if(existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name,
            price,
            quantity: 1,
        });
    }
    updateCartModal();
}

// Atualizar o Visual do Carrinho
function updateCartModal() {
    cartItemsContainer.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: #888;">O seu carrinho está vazio. Adicione itens!</p>';
        cartCounter.innerHTML = 0;
        cartTotalElement.textContent = "0,00";
        return;
    }

    cart.forEach(item => {
        const itemPriceTotal = item.price * item.quantity;
        const cartItemElement = document.createElement("div");
        cartItemElement.classList.add("cart-item");

        cartItemElement.innerHTML = `
            <div>
                <span style="font-weight: bold;">${item.name}</span>
                <span style="display: block; font-size: 14px; color: #666;">R$ ${item.price.toFixed(2).replace('.', ',')} (x${item.quantity})</span>
            </div>
            <div class="cart-item-actions">
                 <button class="btn btn-sm remove-from-cart-btn" data-name="${item.name}">
                     -
                 </button>
                 <button class="btn btn-sm add-more-btn" data-name="${item.name}">
                     +
                 </button>
            </div>
        `;

        total += itemPriceTotal;
        cartItemsContainer.appendChild(cartItemElement);
    });

    cartTotalElement.textContent = total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).replace('R$', '');

    cartCounter.innerHTML = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Remover / Adicionar Quantidade no Modal
cartItemsContainer.addEventListener("click", function(event) {
    const target = event.target;
    const name = target.getAttribute("data-name");

    if(target.classList.contains("remove-from-cart-btn")) {
        removeItemCart(name);
        showToast(`Item removido!`, "#e74c3c");
    } else if (target.classList.contains("add-more-btn")) {
        const existingItem = cart.find(item => item.name === name);
        if(existingItem) {
            existingItem.quantity += 1;
            updateCartModal();
            showToast(`Mais um(a) "${name}" adicionado(a)!`, "#2ecc71");
        }
    }
});

function removeItemCart(name) {
    const index = cart.findIndex(item => item.name === name);

    if(index !== -1) {
        const item = cart[index];
        
        if(item.quantity > 1) {
            item.quantity -= 1;
        } else {
            cart.splice(index, 1);
        }
        updateCartModal();
    }
}

// --- 3. LÓGICA DE PAGAMENTO E VALIDAÇÃO ---

// Lógica para mostrar/esconder campo de Troco
paymentMethodSelect.addEventListener("change", function() {
    const selectedMethod = this.value;

    trocoField.classList.add("hidden");
    paymentWarn.classList.add("hidden");

    if (selectedMethod === "dinheiro") {
        trocoField.classList.remove("hidden");
    }
});

// Ocultar avisos de endereço ao digitar
addressInput.addEventListener("input", function(){
    if(this.value.trim() !== ""){
        addressWarn.classList.add("hidden");
        this.classList.remove("border-red");
    }
});

// Finalizar Pedido
checkoutBtn.addEventListener("click", function() {
    finalizeOrder();
});

function finalizeOrder() {
    const address = addressInput.value.trim();
    const paymentMethod = paymentMethodSelect.value;
    const totalText = cartTotalElement.textContent;
    const trocoValue = trocoValueInput.value.trim();

    // 1. Validação do Carrinho
    if (cart.length === 0) {
        showToast("O seu carrinho está vazio!", "#f39c12");
        return;
    }

    // 2. Validação do Endereço (OBRIGATÓRIO)
    if (address === "") {
        addressWarn.classList.remove("hidden");
        addressInput.classList.add("border-red");
        showToast("ERRO: O endereço é obrigatório.", "#f39c12");
        return;
    } else {
        addressWarn.classList.add("hidden");
        addressInput.classList.remove("border-red");
    }

    // 3. Validação da Forma de Pagamento (OBRIGATÓRIO)
    if (paymentMethod === "") {
        paymentWarn.classList.remove("hidden");
        showToast("ERRO: Selecione a forma de pagamento.", "#f39c12");
        return;
    } else {
        paymentWarn.classList.add("hidden");
    }


    // 4. Montagem da Mensagem
    const cartItems = cart.map((item) => {
        return (
            `*${item.name}* (Qtd: ${item.quantity}) - R$${(item.price * item.quantity).toFixed(2).replace('.', ',')}`
        );
    }).join("\n");

    let paymentInfo = `Forma de Pagamento: *${paymentMethod.toUpperCase().replace('DEBITO', 'DÉBITO').replace('CREDITO', 'CRÉDITO')}*`;

    if (paymentMethod === "dinheiro") {
        const trocoTxt = trocoValue ? `R$ ${parseFloat(trocoValue).toFixed(2).replace('.', ',')}` : 'NÃO PRECISA';
        paymentInfo += `\n*Troco para:* ${trocoTxt}`;
    } else if (paymentMethod === "pix") {
        paymentInfo += `\n*Atenção:* O pagamento será via PIX. Use a chave: ${PIX_KEY}`;
    }

    const phone = "5511989985090"; 
    
    const message = encodeURIComponent(
        `Olá! Gostaria de fazer o seguinte pedido:\n\n${cartItems}\n\n*Total a pagar: R$ ${totalText}*\n\n${paymentInfo}\n\n*Endereço para entrega:*\n${address}`
    );

    // 5. Envio
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");

    // Limpa o formulário e carrinho após o envio
    cart = [];
    updateCartModal();
    addressInput.value = "";
    trocoValueInput.value = "";
    paymentMethodSelect.value = "";
    trocoField.classList.add("hidden");

    // Fecha o modal
    modal.style.display = "none";
}