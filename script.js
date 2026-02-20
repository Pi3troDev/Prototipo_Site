let cart = [];
let produtosGlobais = [];
let currentProduct = null;
let optionQuantities = {}; 

const menuGrid = document.querySelector("#menu-grid");
const productModal = document.getElementById("product-modal");
const cartModal = document.getElementById("cart-modal");
const paymentSelect = document.getElementById("payment-method");
const trocoField = document.getElementById("troco-field");
const phone = "5511989985090";

// ==========================
// FUNÇÃO DE AVISO NA TELA
// ==========================
function mostrarAviso(mensagem) {
    const avisoAntigo = document.querySelector(".toast-error");
    if (avisoAntigo) avisoAntigo.remove();

    const div = document.createElement("div");
    div.className = "toast-error";
    div.innerHTML = `<i class="fa fa-exclamation-circle"></i> ${mensagem}`;
    document.body.appendChild(div);

    setTimeout(() => {
        div.style.opacity = "0";
        div.style.transition = "0.5s";
        setTimeout(() => div.remove(), 500);
    }, 3000);
}

// ==========================
// CARREGAR PRODUTOS
// ==========================
fetch("produtos.json")
  .then(res => res.json())
  .then(produtos => {
    produtosGlobais = produtos;
    renderProdutos(produtos);
  });

function renderProdutos(produtos) {
  menuGrid.innerHTML = "";
  produtos.forEach((produto, index) => {
    const li = document.createElement("li");
    li.className = "product-card";
    li.innerHTML = `
      <div class="img-container">
        <img src="${produto.image}" alt="${produto.name}">
      </div>
      <div class="prod-info">
        <div>
          <h3>${produto.name}</h3>
          <p>${produto.description}</p>
        </div>
        <div class="price-row">
          <strong>R$ ${produto.basePrice.toFixed(2)}</strong>
          <button class="btn-add-card"><i class="fa fa-plus"></i></button>
        </div>
      </div>
    `;
    li.addEventListener("click", () => abrirProduto(index));
    menuGrid.appendChild(li);
  });
}

// ==========================
// LÓGICA DO MODAL DE PRODUTO
// ==========================
function abrirProduto(index) {
  const produto = produtosGlobais[index];
  currentProduct = produto;
  optionQuantities = {}; 

  if (produto.groups && produto.groups.length > 0) {
    const content = document.getElementById("modal-content");
    document.getElementById("modal-product-name").innerText = produto.name;

    let html = "";
    produto.groups.forEach((group, gIndex) => {
      html += `
        <div class="group-section">
          <div class="group-header">
            <h4>${group.title}</h4>
            ${group.required ? `<span class="required-tag">Obrigatório</span>` : ""}
            ${group.max && group.type === 'counter' ? `<small>(Limite: ${group.max})</small>` : ""}
          </div>
      `;

      group.options.forEach((opt, oIndex) => {
        if (group.type === "radio") {
          html += `
            <label class="option-item">
              <div class="option-info">
                <input type="radio" name="group-${gIndex}" value="${opt.name}" data-price="${opt.price}" ${oIndex === 0 ? "checked" : ""}>
                <span>${opt.name}</span>
              </div>
              ${opt.price > 0 ? `<span class="opt-price">+ R$ ${opt.price.toFixed(2)}</span>` : ""}
            </label>
          `;
        } else if (group.type === "counter") {
          html += `
            <div class="option-item">
              <div class="option-info">
                <span>${opt.name}</span>
                ${opt.price > 0 ? `<span class="opt-price">+ R$ ${opt.price.toFixed(2)}</span>` : ""}
              </div>
              <div class="counter-wrapper">
                <button type="button" onclick="changeOptionQty(${gIndex}, ${oIndex}, -1, ${group.max})">-</button>
                <span id="qty-${gIndex}-${oIndex}">0</span>
                <button type="button" onclick="changeOptionQty(${gIndex}, ${oIndex}, 1, ${group.max})">+</button>
              </div>
            </div>
          `;
        }
      });
      html += `</div>`;
    });

    html += `
        <div class="group-section">
            <div class="group-header"><h4>Observações</h4></div>
            <textarea id="product-obs" placeholder="Ex: Tirar a granola..." rows="3" 
            style="width: 100%; border: 1px solid #ddd; border-radius: 12px; padding: 12px; font-family: inherit; resize: none; background: #f9f9f9;"></textarea>
        </div>
    `;

    content.innerHTML = html;
    productModal.classList.remove("hidden");
    toggleBodyScroll(true);
  } else {
    addToCart(produto.name, produto.basePrice, "");
  }
}

window.changeOptionQty = (gIndex, oIndex, delta, max) => {
  const key = `${gIndex}-${oIndex}`;
  const currentQty = optionQuantities[key] || 0;
  
  // Calcula o total apenas deste grupo específico
  const groupTotal = Object.keys(optionQuantities)
    .filter(k => k.startsWith(`${gIndex}-`))
    .reduce((acc, k) => acc + optionQuantities[k], 0);

  if (delta > 0 && max && groupTotal >= max) {
    mostrarAviso(`Limite de ${max} itens para este grupo atingido.`);
    return;
  }

  const newQty = Math.max(0, currentQty + delta);
  optionQuantities[key] = newQty;
  
  const display = document.getElementById(`qty-${gIndex}-${oIndex}`);
  if (display) display.innerText = newQty;
};

// ==========================
// CARRINHO E FINALIZAÇÃO
// ==========================
document.getElementById("add-custom-product").addEventListener("click", () => {
  let total = Number(currentProduct.basePrice);
  let details = [];

  currentProduct.groups.forEach((group, gIndex) => {
    if (group.type === "radio") {
      const selected = document.querySelector(`input[name="group-${gIndex}"]:checked`);
      if (selected) {
        total += Number(selected.dataset.price);
        details.push(`${selected.value}`);
      }
    } else if (group.type === "counter") {
      group.options.forEach((opt, oIndex) => {
        const qty = optionQuantities[`${gIndex}-${oIndex}`] || 0;
        if (qty > 0) {
          total += qty * opt.price;
          details.push(`${opt.name} (x${qty})`);
        }
      });
    }
  });

  const obs = document.getElementById("product-obs").value;
  let finalDescription = details.join(", ");
  if (obs) finalDescription += ` | OBS: ${obs}`;

  addToCart(currentProduct.name, total, finalDescription);
  fecharModais();
});

function addToCart(name, price, description) {
  const existingIndex = cart.findIndex(item => item.name === name && item.description === description);
  if (existingIndex > -1) {
    cart[existingIndex].quantity++;
  } else {
    cart.push({ name, price: Number(price), quantity: 1, description });
  }
  updateCartUI();
}

function updateCartUI() {
  const container = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");
  const cartCount = document.getElementById("cart-count");

  container.innerHTML = "";
  let total = 0;
  let totalItems = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    totalItems += item.quantity;

    container.innerHTML += `
      <div class="cart-item">
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-desc">${item.description}</p>
          <p class="cart-item-price">R$ ${itemTotal.toFixed(2)}</p>
        </div>
        <div class="cart-item-actions">
          <button onclick="changeCartQty(${index}, -1)">-</button>
          <span>${item.quantity}</span>
          <button onclick="changeCartQty(${index}, 1)">+</button>
        </div>
      </div>
    `;
  });

  totalElement.innerText = total.toFixed(2);
  cartCount.innerText = totalItems;
}

window.changeCartQty = (index, delta) => {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  updateCartUI();
};

function toggleBodyScroll(lock) {
  document.body.style.overflow = lock ? "hidden" : "auto";
}

function fecharModais() {
  productModal.classList.add("hidden");
  cartModal.classList.add("hidden");
  toggleBodyScroll(false);
}

document.getElementById("close-product-modal").onclick = fecharModais;
document.getElementById("cart-btn").onclick = () => {
  cartModal.classList.remove("hidden");
  toggleBodyScroll(true);
};

const closeBtn = document.getElementById("close-modal-btn");
if (closeBtn) closeBtn.onclick = fecharModais;

paymentSelect.addEventListener("change", () => {
  if (paymentSelect.value === "dinheiro") {
    trocoField.classList.remove("hidden");
  } else {
    trocoField.classList.add("hidden");
  }
});

// ENVIO PARA WHATSAPP
document.getElementById("checkout-btn").addEventListener("click", () => {
    if (cart.length === 0) {
        mostrarAviso("Seu carrinho está vazio!");
        return;
    }

    const nome = document.getElementById("client-name").value;
    const rua = document.getElementById("rua").value;
    const numero = document.getElementById("numero").value;
    const bairro = document.getElementById("bairro").value;
    const cidade = document.getElementById("cidade") ? document.getElementById("cidade").value : "Atibaia"; // Ajuste se tiver o campo cidade
    const payment = paymentSelect.value;

    if (!nome || !rua || !numero || !bairro) {
        mostrarAviso("Por favor, preencha todos os campos de entrega.");
        return;
    }

    let msg = `*NOVO PEDIDO* 🍧\n`;
    msg += `*Cliente:* ${nome}\n\n`;

    // Itens do Pedido
    cart.forEach(item => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        msg += `*${item.name}* (Qtd ${item.quantity}) - R$ ${itemTotal}\n`;
        
        if (item.description) {
            // Transforma a descrição (que está separada por vírgula ou |) em lista com "-"
            // Primeiro limpamos a string e depois quebramos pelos separadores que usamos no JS
            const extras = item.description.split(/[,|]/);
            extras.forEach(extra => {
                if(extra.trim() !== "") {
                    msg += `-${extra.trim()}\n`;
                }
            });
        }
        msg += `\n`; // Espaço entre produtos
    });

    const total = document.getElementById("cart-total").innerText;
    msg += `*Total a pagar:* R$ ${total}\n\n`;

    // Pagamento
    msg += `Forma de pagamento: *${payment.toUpperCase()}*\n`;
    
    if (payment === "dinheiro") {
        const troco = document.getElementById("troco-value").value;
        if (troco) {
            msg += `*Troco para:* R$ ${Number(troco).toFixed(2)}\n`;
        }
    } else if (payment === "pix") {
        msg += `*MANDEM O PIX POR GENTILEZA*\n`;
    }

    // Endereço
    msg += `\n*Endereço para entrega:*\n`;
    msg += `${rua}, ${numero} - Bairro ${bairro} - ${cidade}`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
});