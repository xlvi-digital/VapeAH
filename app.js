/**
 * JagoVape - Premium Vanilla JS Logic
 */

// --- GLOBAL CONFIGURATION ---
const _0x4a2e = ['SkFHT1ZBUEVfU0VDVVJFXzIwMjQ=']; // JAGOVAPE_SECURE_2024

/**
 * safeAtob: Decodes Base64 safely with error handling and header stripping
 */
function safeAtob(str) {
    try {
        if (!str || typeof str !== 'string') return '';
        const base64 = str.includes(',') ? str.split(',')[1] : str;
        const cleanBase64 = base64.trim().replace(/[\r\n]/g, '');
        return atob(cleanBase64);
    } catch (e) {
        console.error("[Base64 Error] Invalid characters or format:", e.message);
        return '';
    }
}

// Secret Key initialization using safe decoding and .trim()
const SECRET_KEY = safeAtob(_0x4a2e[0]).trim();

const STATE = {
    scriptURL: 'https://script.google.com/macros/s/AKfycbzG-AewN7fgJS1SZ51s61uyr9jCz5o6m74fbN-0mmBLFy_gov0T3U5zUvTWfHhuL10qTg/exec',
    products: [],
    cart: [],
    activeCategory: 'All',
    searchQuery: '',
    isLoading: true,
    currentPage: 1,
    itemsPerPage: 12,
    phoneWA: '6281313362467',
    branches: [
        { name: 'Cianjur', maps: 'https://maps.app.goo.gl/aUtpT4hJx1KXSm7o8' },
        { name: 'Ciranjang', maps: 'https://maps.app.goo.gl/sUUJw3Cj8AXJXqyd8' },
        { name: 'Cipanas', maps: 'https://maps.app.goo.gl/HKN6dDeFGiuuGoBC6' },
        { name: 'Beelka', maps: 'https://maps.app.goo.gl/C7vTG7mzra5dyDrz5' },
        { name: 'Cibeber', maps: 'https://maps.app.goo.gl/smd86X6WXNucfAGJ6' },
        { name: 'Bojong', maps: 'https://maps.app.goo.gl/6r55j8SErbS25BwdA' },
        { name: 'Sukabumi', maps: 'https://maps.app.goo.gl/oJf9j1TenC2XiXHj8' },
        { name: 'Siliwangi', maps: 'https://maps.app.goo.gl/ALNJwQ8L6VRh8owD7' },
        { name: 'Bypass', maps: 'https://maps.app.goo.gl/YaVzGX7XE2JRVvWD7' }
    ],
    faqs: [
        { q: 'Apakah produk di jagoVape 100% original?', a: 'Ya, kami menjamin seluruh produk yang kami jual 100% original dari distributor resmi.' },
        { q: 'Bagaimana jam operasional toko?', a: 'Toko fisik kami buka setiap hari mulai pukul 10:00 - 22:00 WIB.' },
        { q: 'Bisa kirim ke luar kota?', a: 'Tentu! Kami melayani pengiriman ke seluruh Indonesia menggunakan jasa ekspedisi terpercaya.' }
    ]
};

// --- INITIALIZATION ---
let deferredPrompt;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    console.log('👍 [PWA] beforeinstallprompt fired');
    
    // Show the installation banner
    const installContainer = document.getElementById('pwa-install-container');
    if (installContainer) {
        installContainer.style.display = 'flex';
    }
});

window.addEventListener('appinstalled', (event) => {
    console.log('👍 [PWA] App successfully installed');
    deferredPrompt = null;
});

async function initApp() {
    loadCartFromStorage();
    setupEventListeners();
    setupScrollAnimations();
    setupPwaUI(); // New helper
    await fetchProducts();
    renderBranches();
    renderFAQ();
    window.updateCartDisplay();
}

function setupPwaUI() {
    const installBtn = document.getElementById('pwa-install-btn');
    const installContainer = document.getElementById('pwa-install-container');
    const closeBtn = document.getElementById('pwa-close-btn');

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`[PWA] User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                if (installContainer) installContainer.style.display = 'none';
            }
        });
    }

    if (closeBtn && installContainer) {
        closeBtn.addEventListener('click', () => {
            installContainer.style.display = 'none';
        });
    }
}

function renderBranches() {
    const container = document.getElementById('branch-grid');
    if (!container) return;

    container.innerHTML = STATE.branches.map(b => `
        <div class="branch-card">
            <h3 class="font-premium">${b.name}</h3>
            <p>Cabang JagoVape ${b.name}</p>
            <a href="${b.maps}" target="_blank" class="btn btn-maps">Buka di Maps</a>
        </div>
    `).join('');
}

// --- DATA FETCHING ---
async function fetchProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    STATE.isLoading = true;
    showSkeletons('product-grid', 8);

    try {
        const url = `${STATE.scriptURL}?key=${encodeURIComponent(SECRET_KEY)}`;
        console.log("🔍 Fetching products from:", url);

        const response = await fetch(url);

        if (!response.ok) {
            console.error("❌ Link Error. Status Code:", response.status);
            if (response.status === 403) {
                console.error("❌ Akses Ditolak (403): Secret Key atau deployment bermasalah.");
                if (grid) grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #ff4444;">Eror Keamanan: Akses API Ditolak (403).</p>';
                return;
            }
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result = await response.json();

        // Check for internal error result from GAS (e.g. key mismatch)
        if (result.result === "error") {
            console.error("❌ Key mismatch or Backend error:", result.error);
            if (grid) grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: #ff4444;">Gagal memuat produk: ${result.error}</p>`;
            return;
        }

        const rawData = result.data || result;

        STATE.products = rawData.filter(p => {
            return p.nama && p.nama.trim() !== "" && p.harga > 0;
        });

        renderProducts();
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        if (grid) grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Gagal memuat produk. Silakan coba lagi.</p>';
    } finally {
        STATE.isLoading = false;
        // renderProducts will handle grid display
    }
}

function showSkeletons(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton-img skeleton"></div>
            <div class="skeleton-line short skeleton"></div>
            <div class="skeleton-line medium skeleton"></div>
            <div class="skeleton-line skeleton"></div>
            <div class="skeleton-btn skeleton"></div>
        `;
        container.appendChild(skeleton);
    }
}

// --- RENDERING ---
function renderProducts() {
    const grid = document.getElementById('product-grid');
    const empty = document.getElementById('empty-results');
    const pgContainer = document.getElementById('pagination-container');

    if (!grid) return;

    const filtered = STATE.products.filter(p => {
        const matchesCat = STATE.activeCategory === 'All' || p.kategori === STATE.activeCategory;
        const matchesSearch = p.nama.toLowerCase().includes(STATE.searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / STATE.itemsPerPage);

    if (STATE.currentPage > totalPages) STATE.currentPage = Math.max(1, totalPages);

    const startIdx = (STATE.currentPage - 1) * STATE.itemsPerPage;
    const endIdx = startIdx + STATE.itemsPerPage;
    const paginatedItems = filtered.slice(startIdx, endIdx);

    grid.innerHTML = '';

    if (filtered.length === 0) {
        if (empty) empty.style.display = 'block';
        if (pgContainer) pgContainer.innerHTML = '';
        return;
    }

    if (empty) empty.style.display = 'none';

    paginatedItems.forEach((p, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animation = `staggerIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards`;
        card.style.animationDelay = `${index * 0.05}s`;
        card.style.opacity = '0'; // Initial state for animation
        card.innerHTML = `
            <div class="p-header">
                <span class="status-badge ${p.status_stock === 'ready' ? 'status-ready' : 'status-empty'}">
                    ${p.status_stock === 'ready' ? 'Ready Stock' : 'Habis'}
                </span>
                <img src="${p.url_gambar}" alt="${p.nama}" class="p-image" onerror="handleImageError(this)">
            </div>
            <div class="p-body">
                <span class="p-cat">${p.kategori}</span>
                <h3 class="p-title font-premium">${p.nama}</h3>
                <p class="p-price">${formatRupiah(p.harga)}</p>
                <button class="btn btn-add js-cart-btn" onclick="addToCart(STATE.products.find(p => p.id === ${p.id}))"data-id="${p.id}" ${p.status_stock !== 'ready' ? 'disabled' : ''}>
                    <span>Tambah Keranjang</span>
                    <div class="btn-icon circle-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    renderPagination(totalPages);
}

function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Optional: Unobserve after reveal to save resources
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach(el => observer.observe(el));
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <button class="pg-btn pg-btn-nav" ${STATE.currentPage === 1 ? 'disabled' : ''} onclick="changePage(${STATE.currentPage - 1})">
            &laquo; Prev
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button class="pg-btn ${STATE.currentPage === i ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }

    html += `
        <button class="pg-btn pg-btn-nav" ${STATE.currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${STATE.currentPage + 1})">
            Next &raquo;
        </button>
    `;

    container.innerHTML = html;
}

function changePage(page) {
    STATE.currentPage = page;
    renderProducts();

    const shopSection = document.getElementById('products');
    if (shopSection) {
        const nav = document.getElementById('navbar');
        const offset = nav ? nav.offsetHeight : 80;
        window.scrollTo({
            top: shopSection.offsetTop - offset,
            behavior: 'smooth'
        });
    }
}

function renderFAQ() {
    const container = document.getElementById('faq-container');
    if (!container) return;

    container.innerHTML = '';
    STATE.faqs.forEach((faq, index) => {
        const item = document.createElement('div');
        item.className = 'faq-item';
        item.innerHTML = `
            <div class="faq-question" onclick="toggleFAQ(${index})">
                <h4>${faq.q}</h4>
                <div class="faq-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
            <div class="faq-answer">
                <p>${faq.a}</p>
            </div>
        `;
        container.appendChild(item);
    });
}

// --- CART LOGIC ---
window.addToCart = function (product) {
    console.log('Produk ditambahkan:', product.id);
    const existing = STATE.cart.find(item => String(item.id) === String(product.id));
    if (existing) {
        existing.qty++;
    } else {
        STATE.cart.push({ ...product, qty: 1 });
    }

    saveCartToStorage();
    window.updateCartDisplay();
    triggerToast();
};

window.updateQty = function (id, delta) {
    // Cast both checking parameters to string to prevent type mismatch bugs
    const item = STATE.cart.find(i => String(i.id) === String(id));
    if (!item) return;

    item.qty += delta;
    if (item.qty < 1) {
        window.removeFromCart(id);
    } else {
        saveCartToStorage();
        window.updateCartDisplay();
    }
};

window.removeFromCart = function (id) {
    // Cast both checking parameters to string 
    STATE.cart = STATE.cart.filter(i => String(i.id) !== String(id));
    saveCartToStorage();
    window.updateCartDisplay();
};

window.updateCartDisplay = function () {
    const totalQty = STATE.cart.reduce((sum, item) => sum + item.qty, 0); // Logic: Total quantity

    const navBadge = document.getElementById('cart-badge-nav');
    const floatBadge = document.getElementById('cart-badge-floating');
    const floatCart = document.getElementById('floating-cart');

    if (navBadge) {
        navBadge.textContent = totalQty;
        navBadge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
    if (floatBadge) {
        floatBadge.textContent = totalQty;
        floatBadge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
    if (floatCart) {
        floatCart.style.display = totalQty > 0 ? 'flex' : 'none';
    }

    // Update Drawer Items
    const itemsContainer = document.getElementById('cart-items');
    const totalAmountEl = document.getElementById('cart-total-amount');
    const cartFooter = document.getElementById('cart-footer');
    const branchSelector = document.getElementById('branch-selector-container');

    if (!itemsContainer) return;

    itemsContainer.innerHTML = '';

    if (STATE.cart.length === 0) {
        itemsContainer.innerHTML = `
            <div class="empty-cart" style="padding: 40px 0;">
                <div style="text-align: center;">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity: 0.2; margin-bottom: 20px;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    <p style="color: var(--text-muted);">Keranjang Anda kosong</p>
                </div>
            </div>
        `;
        if (cartFooter) cartFooter.style.display = 'none';
        if (branchSelector) branchSelector.style.display = 'none';
        return;
    }

    if (cartFooter) cartFooter.style.display = 'block';
    
    // Update Branch Selector Dropdown
    if (branchSelector) {
        branchSelector.style.display = 'block';
        const select = document.getElementById('pickup-branch');
        if (select && select.options.length <= 1) { // Only populate if empty or only has one option
            select.innerHTML = STATE.branches.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
        }
    }

    let total = 0;

    STATE.cart.forEach(item => {
        total += item.harga * item.qty;
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${item.url_gambar}" alt="${item.nama}" class="cart-item-img" onerror="handleImageError(this)">
            <div class="cart-item-info">
                <h4>${item.nama}</h4>
                <p class="text-orange" style="font-weight: 800;">${formatRupiah(item.harga)}</p>
                <div class="qty-wrapper">
                    <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                    <span class="qty-val">${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                    <button class="btn-remove" onclick="removeFromCart('${item.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
        `;
        itemsContainer.appendChild(itemEl);
    });

    if (totalAmountEl) totalAmountEl.textContent = formatRupiah(total);
}

// --- PERSISTENCE ---
function saveCartToStorage() {
    localStorage.setItem('jagovape_cart', JSON.stringify(STATE.cart));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('jagovape_cart');
    if (saved) {
        try {
            STATE.cart = JSON.parse(saved);
        } catch (e) {
            STATE.cart = [];
        }
    }
}

// --- UTILITIES ---
function formatRupiah(num) {
    return 'Rp' + Number(num).toLocaleString('id-ID');
}

function handleImageError(img) {
    img.onerror = null;
    img.src = 'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1a1a1a"/><text x="50%" y="50%" fill="#333" font-family="sans-serif" font-size="20" text-anchor="middle">No Image</text></svg>');
}

function triggerToast() {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

function triggerBtnFeedback(btn) {
    if (!btn) return;
    btn.classList.add('btn-pulse');
    setTimeout(() => btn.classList.remove('btn-pulse'), 400);
}

// --- UI INTERACTIONS ---
function toggleCart(open) {
    const overlay = document.getElementById('cart-overlay');
    if (overlay) {
        overlay.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
    }
}

function toggleFAQ(index) {
    const items = document.querySelectorAll('.faq-item');
    items.forEach((item, i) => {
        if (i === index) {
            item.classList.toggle('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function scrollToSection(id, e) {
    if (e) e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;

    const nav = document.getElementById('navbar');
    const offset = nav ? nav.offsetHeight : 80;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = el.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });

    const links = document.querySelectorAll('.nav-menu a');
    links.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
        }
    });
}

function setupEventListeners() {
    // Event Delegation for Adding to Cart
    const grid = document.getElementById('product-grid');
    if (grid) {
        grid.addEventListener('click', (e) => {
            const btn = e.target.closest('.js-cart-btn');
            if (btn) {
                const id = btn.dataset.id;
                const product = STATE.products.find(p => p.id === id);
                if (product) {
                    addToCart(product);
                    triggerBtnFeedback(btn);
                    animateToCart(e, btn);
                }
            }
        });
    }

    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            STATE.searchQuery = e.target.value;
            STATE.currentPage = 1;
            renderProducts();
        });
    }

    const filterTabs = document.getElementById('filter-tabs');
    if (filterTabs) {
        filterTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-tab')) {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                STATE.activeCategory = e.target.dataset.category;
                STATE.currentPage = 1;
                renderProducts();
            }
        });
    }

    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (nav) {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        }
    });

    const overlay = document.getElementById('cart-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target.id === 'cart-overlay') {
                toggleCart(false);
            }
        });
    }
}

// --- ANIMATIONS ---
function animateToCart(event, btnElement) {
    const cartIcon = document.querySelector('.cart-trigger') || document.querySelector('.floating-cart');
    if (!btnElement || !cartIcon) return;

    // Create flying element
    const flyingIcon = document.createElement('div');
    flyingIcon.className = 'flying-item';
    flyingIcon.style.width = '40px';
    flyingIcon.style.height = '40px';
    flyingIcon.style.zIndex = '9999';

    // Copy content or use a simplified icon
    flyingIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`;

    const btnRect = btnElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    flyingIcon.style.left = `${btnRect.left + btnRect.width / 2 - 20}px`;
    flyingIcon.style.top = `${btnRect.top + btnRect.height / 2 - 20}px`;

    document.body.appendChild(flyingIcon);

    // Trigger animation
    requestAnimationFrame(() => {
        flyingIcon.style.left = `${cartRect.left + cartRect.width / 2 - 20}px`;
        flyingIcon.style.top = `${cartRect.top + cartRect.height / 2 - 20}px`;
        flyingIcon.style.transform = 'scale(0.3) rotate(720deg)';
        flyingIcon.style.opacity = '0.5';
    });

    setTimeout(() => {
        flyingIcon.remove();
        cartIcon.classList.add('cart-bounce');
        setTimeout(() => cartIcon.classList.remove('cart-bounce'), 500);
    }, 800);
}

// --- WHATSAPP CHECKOUT ---
function sendToWhatsApp() {
    if (STATE.cart.length === 0) return;

    const branchName = document.getElementById('pickup-branch').value;
    if (!branchName) {
        alert('Silahkan pilih cabang pengambilan terlebih dahulu.');
        return;
    }

    const selectedBranch = STATE.branches.find(b => b.name === branchName);
    const totalAmount = STATE.cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);

    // Build Message
    let message = `*PESANAN BARU - JAGOVAPE*\n`;
    message += `--------------------------------\n\n`;
    
    STATE.cart.forEach((item, index) => {
        message += `${index + 1}. *${item.nama}*\n`;
        message += `   Qty: ${item.qty} | Harga: ${formatRupiah(item.harga * item.qty)}\n\n`;
    });

    message += `--------------------------------\n`;
    message += `*Total Bayar:* ${formatRupiah(totalAmount)}\n`;
    message += `*Cabang Ambil:* ${branchName}\n`;
    
    if (selectedBranch && selectedBranch.maps) {
        message += `*Link Maps:* ${selectedBranch.maps}\n`;
    }
    
    message += `\n_Terima kasih telah berbelanja di JagoVape!_`;

    // Encode and Open
    const whatsappUrl = `https://wa.me/${STATE.phoneWA}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}
