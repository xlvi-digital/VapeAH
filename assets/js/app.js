/**
 * app.js - Vanilla JavaScript for Vape AH Storefront
 * Handles fetching, filtering, and rendering products from Google Apps Script.
 */

// Configuration
// Configuration
// Configuration
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-zQa6Oa1U6r0Btvn9txU4910UjI5oiPxOGbdsUstZ-fIzUypSTjUBVVKKR_nXhEzG/exec';
const WA_PHONE = '6281313362467'; // Ganti dengan nomor admin Cianjur

// State
let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('vape_ah_cart')) || [];
let currentCategory = 'All';
let searchQuery = '';

// Elements
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilters = document.getElementById('categoryFilters');
const navbar = document.getElementById('navbar');
const cartBadge = document.getElementById('cartBadge');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');

/**
 * Initialize Application
 */
async function init() {
    await fetchProducts();
    setupEventListeners();
    updateCartUI();
}

/**
 * Fetch Products from Google Apps Script
 */
async function fetchProducts() {
    showSkeleton();

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_products', token: 'public' }) 
        });
        
        const result = await response.json();

        if (result.success) {
            allProducts = result.data || [];
            applyFilters();
        } else {
            handleError(result.message || 'Gagal mengambil data produk.');
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        handleError('Terjadi kesalahan koneksi ke database.');
    }
}

/**
 * Render Products to the Grid
 */
function renderProducts(products) {
    if (products.length === 0) {
        productGrid.innerHTML = `<div class="status-message"><h3>Produk tidak ditemukan</h3></div>`;
        return;
    }

    productGrid.innerHTML = products.map((p, index) => `
        <div class="product-card fade-in reveal" style="animation-delay: ${index * 0.05}s">
            <span class="product-category" style="${index < 2 ? 'background: #cc0000;' : ''}">${index < 2 ? '🔥 HOT' : p.kategori || 'General'}</span>
            <img src="${p.gambar || 'https://via.placeholder.com/400'}" alt="${p.nama}" class="product-image" loading="lazy">
            <h3 class="product-name">${p.nama}</h3>
            <p class="product-price" style="color: var(--primary-red); font-size: 1.3rem;">${formatRupiah(p.harga)}</p>
            <div style="font-size: 0.8rem; color: var(--text-gray); margin-bottom: 15px; border-top: 1px solid var(--glass-border); padding-top: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="display: flex; align-items: center; gap: 4px; color: #ffd700;"><i data-lucide="star" style="width: 14px; height: 14px; fill: #ffd700;"></i> 4.8</span>
                    <span style="color: var(--primary-red); font-weight: 600;">Terjual 120+</span>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <i data-lucide="check-circle" style="width: 14px; height: 14px; color: #00ffcc;"></i> Stok tersedia &bull; Siap kirim hari ini
                </div>
            </div>
            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px 20px;" onclick="addToCart('${p.id}', '${p.nama}', ${p.harga}, '${p.gambar}')">
                <i data-lucide="shopping-bag"></i>
                Beli Sekarang
            </button>
        </div>
    `).join('');
    lucide.createIcons();
    
    // Observer elemen baru
    if (window.observeElement) {
        document.querySelectorAll('#productGrid .reveal:not(.active)').forEach(el => window.observeElement(el));
    }
}

/**
 * Show Skeleton Loading State
 */
function showSkeleton() {
    productGrid.innerHTML = Array(4).fill(0).map(() => `
        <div class="product-card">
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width: 60%"></div>
            <div class="skeleton skeleton-price"></div>
        </div>
    `).join('');
}

/**
 * Handle Error Display
 */
function handleError(message) {
    productGrid.innerHTML = `
        <div class="status-message fade-in" style="border-color: rgba(255, 77, 77, 0.3);">
            <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin-bottom: 15px; color: #ff4d4d;"></i>
            <h3 style="color: #ff4d4d;">Oops! Terjadi Kesalahan</h3>
            <p style="color: var(--text-gray);">${message}</p>
            <button class="btn btn-outline" style="margin-top: 20px;" onclick="fetchProducts()">Coba Lagi</button>
        </div>
    `;
    lucide.createIcons();
}

/**
 * Cart Logic
 */
window.addToCart = function(id, nama, harga, gambar) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ id, nama, harga, gambar, qty: 1 });
    }
    saveCart();
    updateCartUI();

    // Feedback visual saat tambah ke keranjang
    if (window.showStoreToast) {
        window.showStoreToast('Produk berhasil ditambahkan!', 'success');
    }
    
    if (cartBadge) {
        cartBadge.classList.remove('badge-bounce');
        void cartBadge.offsetWidth; // Memicu reflow browser agar animasi bisa diulang
        cartBadge.classList.add('badge-bounce');
    }
}

function saveCart() {
    localStorage.setItem('vape_ah_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadge.textContent = totalQty;
    cartBadge.style.display = totalQty > 0 ? 'flex' : 'none';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-gray);">Keranjang Anda kosong.</p>';
        cartTotalEl.textContent = 'Rp 0';
    } else {
        let total = 0;
        cartItemsContainer.innerHTML = cart.map(item => {
            const subtotal = item.harga * item.qty;
            total += subtotal;
            return `
                <div class="cart-item">
                    <img src="${item.gambar}" alt="${item.nama}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.nama}</div>
                        <div class="cart-item-price">${formatRupiah(item.harga)}</div>
                        <div class="cart-item-qty">
                            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                            <span style="min-width: 20px; text-align: center;">${item.qty}</span>
                            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        cartTotalEl.textContent = formatRupiah(total);
    }
}

window.updateQty = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
        saveCart();
        updateCartUI();
    }
}

/**
 * UI Toggles
 */
window.toggleCart = function() {
    document.getElementById('cartDrawer').classList.toggle('active');
    document.getElementById('cartOverlay').classList.toggle('active');
}

window.toggleMobileMenu = function() {
    document.getElementById('mobileMenu').classList.toggle('active');
    document.querySelector('.hamburger').classList.toggle('active');
}

/**
 * Checkout via WhatsApp
 */
window.checkoutWhatsApp = function() {
    if (cart.length === 0) return alert('Keranjang masih kosong!');

    let message = 'Halo Vape AH!%0A';
    message += 'Saya ingin memesan produk berikut:%0A';
    message += '----------------------------------%0A';
    
    let total = 0;
    cart.forEach(item => {
        total += (item.harga * item.qty);
        message += `- ${item.nama} (Qty: ${item.qty}) - ${formatRupiah(item.harga)}%0A`;
    });

    message += '----------------------------------%0A';
    message += `Total Pembayaran: ${formatRupiah(total)}%0A`;
    message += 'Metode Pengiriman: (Isi sendiri)%0A';
    message += 'Alamat: (Isi sendiri)%0A';

    window.open(`https://wa.me/${WA_PHONE}?text=${message}`, '_blank');
}

/**
 * Filter and Search Logic
 */
function applyFilters() {
    filteredProducts = allProducts.filter(p => {
        const matchesCategory = currentCategory === 'All' || p.kategori === currentCategory;
        const matchesSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    renderProducts(filteredProducts);
}

/**
 * Set up Event Listeners
 */
function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        applyFilters();
    });

    categoryFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-pill');
        if (!btn) return;
        document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        applyFilters();
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
    });

    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
                // Close mobile menu if open
                document.getElementById('mobileMenu').classList.remove('active');
                document.querySelector('.hamburger').classList.remove('active');
            }
        });
    });

    document.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-header').addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });
}


function formatRupiah(n) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function showSkeleton() {
    productGrid.innerHTML = Array(4).fill(0).map(() => `<div class="product-card"><div class="skeleton skeleton-image"></div><div class="skeleton skeleton-text"></div></div>`).join('');
}

function handleError(msg) {
    productGrid.innerHTML = `<div class="status-message"><h3>Oops!</h3><p>${msg}</p></div>`;
}

init();
