// --- CONFIGURATION ---
        const PRODUCT_PRICE = 233;
        
        // --- STATE ---
        let cartQty = 0;
        let cart = [];
        try {
            const saved = JSON.parse(localStorage.getItem('vytron_cart'));
            if (Array.isArray(saved)) {
                cart = saved.filter(item => item && item.id === 1 && Number.isInteger(item.qty) && item.qty > 0).map(item => ({ id: 1, name: 'VYTRON Premium Whey Protein', price: PRODUCT_PRICE, qty: Math.min(item.qty, 100) }));
            }
        } catch (_) { /* Ignore invalid demo cart data. */ }

        // --- DOM ELEMENTS ---
        const qtyInput = document.getElementById('qty-input');
        const displayPrice = document.getElementById('display-price');
        const savingsBadge = document.getElementById('savings-badge');
        const cartDrawer = document.getElementById('cart-drawer');
        const cartItemsContainer = document.getElementById('cart-items');
        const cartCountEl = document.getElementById('cart-count');
        const cartSubtotalEl = document.getElementById('cart-subtotal');
        const cartTotalEl = document.getElementById('cart-total');
        const modalTotalEl = document.getElementById('modal-total');
        const checkoutModal = document.getElementById('checkout-modal');
        const freeGiftRow = document.getElementById('free-gift-row');

        // --- INITIALIZATION ---
        document.addEventListener('DOMContentLoaded', () => {
            renderCart();
            setupScrollAnimations();
            setupFAQ();
            updatePriceDisplay(parseInt(qtyInput.value, 10));
            setupEventHandlers();
        });


        // --- PRODUCT LOGIC ---
        function updateQty(change) {
            let current = parseInt(qtyInput.value);
            let newVal = current + change;
            newVal = Math.max(1, Math.min(100, newVal));
            qtyInput.value = newVal;
            updatePriceDisplay(newVal);
        }

        function updatePriceDisplay(qty) {
            const freeTubs = Math.floor(qty / 4);
            const paidTubs = qty - freeTubs;
            const total = paidTubs * PRODUCT_PRICE;
            
            displayPrice.innerText = `${total} LEI`;
            
            if(freeTubs > 0) {
                savingsBadge.innerText = `Economisești ${freeTubs * PRODUCT_PRICE} LEI (Promo 3+1)`;
                savingsBadge.style.display = 'inline-block';
            } else if (qty >= 2) {
                savingsBadge.innerText = `Primești Baton Gratuit!`;
                savingsBadge.style.display = 'inline-block';
            } else {
                savingsBadge.style.display = 'none';
            }
        }

        function setQtyAndScroll(qty) {
            qtyInput.value = qty;
            updatePriceDisplay(qty);
            document.getElementById('product').scrollIntoView();
        }

        // --- CART LOGIC ---
        function addToCart() {
            const qty = Math.max(1, Math.min(100, parseInt(qtyInput.value, 10) || 1));
            const existingItemIndex = cart.findIndex(item => item.id === 1);

            if (existingItemIndex > -1) {
                cart[existingItemIndex].qty = Math.min(100, cart[existingItemIndex].qty + qty);
            } else {
                cart.push({
                    id: 1,
                    name: "VYTRON Premium Whey Protein",
                    price: PRODUCT_PRICE,
                    qty: qty
                });
            }

            saveCart();
            renderCart();
            toggleCart(); 
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            saveCart();
            renderCart();
        }

        function changeCartQty(index, change) {
            if (!cart[index]) return;
            cart[index].qty = Math.min(100, cart[index].qty + change);
            if (cart[index].qty <= 0) {
                removeFromCart(index);
            } else {
                saveCart();
                renderCart();
            }
        }

        function saveCart() {
            try {
                localStorage.setItem('vytron_cart', JSON.stringify(cart));
            } catch (_) { /* Storage unavailable: cart still works for this visit. */ }
        }

        function calculateTotals() {
            let totalQty = 0;
            let subtotal = 0;
            let hasFreeBar = false;
            let hasFreeTub = false;

            cart.forEach(item => {
                totalQty += item.qty;
                subtotal += item.qty * item.price;
            });

            const freeTubs = Math.floor(totalQty / 4);
            if (freeTubs > 0) hasFreeTub = true;

            if (totalQty >= 2 && freeTubs === 0) {
                hasFreeBar = true;
            } else if (totalQty >= 2 && freeTubs > 0) {
                hasFreeBar = true; 
            }

            const discount = freeTubs * PRODUCT_PRICE;
            const total = subtotal - discount;

            return { totalQty, subtotal, discount, total, freeTubs, hasFreeBar, hasFreeTub };
        }

        function renderCart() {
            cartItemsContainer.innerHTML = '';
            const totals = calculateTotals();

            cartCountEl.innerText = totals.totalQty;

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p style="text-align: center; color: #999; margin-top: 50px;">Coșul este gol.</p>';
                freeGiftRow.style.display = 'none';
            } else {
                cart.forEach((item, index) => {
                    const div = document.createElement('div');
                    div.className = 'cart-item';
                    div.innerHTML = `
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <small>${item.price} LEI / buc</small>
                        </div>
                        <div class="cart-controls">
                            <button class="cart-btn" data-cart-delta="-1" data-index="${index}" aria-label="Reduce cantitatea">-</button>
                            <span style="font-weight:600; width:20px; text-align:center;">${item.qty}</span>
                            <button class="cart-btn" data-cart-delta="1" data-index="${index}" aria-label="Crește cantitatea">+</button>
                        </div>
                    `;
                    cartItemsContainer.appendChild(div);
                });

                if (totals.hasFreeBar || totals.hasFreeTub) {
                    freeGiftRow.style.display = 'flex';
                    let giftText = "";
                    if (totals.hasFreeTub) giftText += `+ ${totals.freeTubs} Tub(uri) Gratis `;
                    if (totals.hasFreeBar) giftText += `+ 1 Baton Gratis`;
                    freeGiftRow.querySelector('span:first-child').innerText = giftText;
                } else {
                    freeGiftRow.style.display = 'none';
                }
            }

            cartSubtotalEl.innerText = `${totals.subtotal} LEI`;
            cartTotalEl.innerText = `${totals.total} LEI`;
            modalTotalEl.innerText = `${totals.total} LEI`;
        }

        function toggleCart() {
            cartDrawer.classList.toggle('open');
        }

        // --- CHECKOUT & WHATSAPP ---
        function openCheckout() {
            if (cart.length === 0) {
                alert("Coșul este gol!");
                return;
            }
            cartDrawer.classList.remove('open');
            checkoutModal.classList.add('active');
            checkoutModal.style.display = 'flex';
        }

        function closeCheckout() {
            checkoutModal.classList.remove('active');
            setTimeout(() => { checkoutModal.style.display = 'none'; }, 300);
        }
function completeDemoCheckout(e) {
  e.preventDefault();
  const result = document.getElementById('demo-confirmation');
  result.textContent = 'Simulare finalizată! Coșul și calculul au fost testate. Nicio comandă nu a fost trimisă.';
  result.style.display = 'block';
}




        // --- EVENTS (no inline HTML handlers) ---
        function setupEventHandlers() {
            document.addEventListener('click', (event) => {
                const cartButton = event.target.closest('[data-cart-delta]');
                if (cartButton) {
                    const index = Number(cartButton.dataset.index);
                    const change = Number(cartButton.dataset.cartDelta);
                    if (Number.isInteger(index) && (change === 1 || change === -1)) {
                        changeCartQty(index, change);
                    }
                    return;
                }
                const actionButton = event.target.closest('[data-action]');
                if (!actionButton) return;
                switch (actionButton.dataset.action) {
                    case 'toggle-cart': toggleCart(); break;
                    case 'qty-decrease': updateQty(-1); break;
                    case 'qty-increase': updateQty(1); break;
                    case 'add-to-cart': addToCart(); break;
                    case 'set-quantity': {
                        const qty = Number(actionButton.dataset.qty);
                        if (Number.isInteger(qty) && qty >= 1 && qty <= 100) setQtyAndScroll(qty);
                        break;
                    }
                    case 'scroll-to-product': document.getElementById('product').scrollIntoView(); break;
                    case 'open-checkout': openCheckout(); break;
                    case 'close-checkout': closeCheckout(); break;
                }
            });
            document.addEventListener('keydown', (event) => {
                if ((event.key === 'Enter' || event.key === ' ') &&
                    event.target.matches('[data-action][role="button"]')) {
                    event.preventDefault();
                    event.target.click();
                }
                if (event.key === 'Escape') {
                    if (checkoutModal.classList.contains('active')) closeCheckout();
                    else cartDrawer.classList.remove('open');
                }
            });
            document.getElementById('checkout-form').addEventListener('submit', completeDemoCheckout);
            checkoutModal.addEventListener('click', (event) => {
                if (event.target === checkoutModal) closeCheckout();
            });
        }

        // --- ANIMATIONS & UI ---
        function setupScrollAnimations() {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = 1;
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('.fade-in').forEach(el => {
                el.style.opacity = 0;
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'all 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)';
                observer.observe(el);
            });
        }

        function setupFAQ() {
            document.querySelectorAll('.faq-question').forEach(item => {
                item.addEventListener('click', () => {
                    const parent = item.parentElement;
                    parent.classList.toggle('active');
                });
            });
        }
