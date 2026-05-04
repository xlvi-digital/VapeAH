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
    updateFloatingBtn();
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
            <img src="${p.gambar || 'https://via.placeholder.com/400'}" alt="${p.nama}" class="product-image" loading="lazy" onclick="openProductDetail('${p.id}')" style="cursor: pointer;">
            <h3 class="product-name" onclick="openProductDetail('${p.id}')" style="cursor: pointer;">${p.nama}</h3>
            <p class="product-price" style="color: var(--primary-red); font-size: 1.3rem;">${formatRupiah(p.harga)}</p>
            <div style="font-size: 0.8rem; color: var(--text-gray); margin-bottom: 15px; border-top: 1px solid var(--glass-border); padding-top: 10px;">
                <div style="display: flex; justify-content: space-between; flex-direction: column; margin-bottom: 5px;">
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
    updateFloatingBtn();

    if (window.showStoreToast) window.showStoreToast('Produk ditambahkan ke keranjang!', 'success');

    if (cartBadge) {
        cartBadge.classList.remove('badge-bounce');
        void cartBadge.offsetWidth;
        cartBadge.classList.add('badge-bounce');
    }

    // Auto-buka cart setelah 350ms (beri waktu toast muncul)
    setTimeout(() => {
        if (!document.getElementById('cartDrawer').classList.contains('active')) toggleCart();
    }, 350);
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
    if (cart.length === 0) return;
    openCheckout();
};

window.openCheckout = function() {
    if (cart.length === 0) {
        if (window.showStoreToast) window.showStoreToast('Keranjang masih kosong!', 'error');
        return;
    }
    // Tutup cart drawer
    document.getElementById('cartDrawer').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');

    // Isi ringkasan pesanan
    const summary = document.getElementById('checkoutSummary');
    if (summary) {
        summary.innerHTML = cart.map(item => `
            <div class="co-sum-item">
                <span class="co-sum-name">${item.nama}</span>
                <span class="co-sum-price">x${item.qty} &nbsp;${formatRupiah(item.harga * item.qty)}</span>
            </div>
        `).join('');
    }

    const total = cart.reduce((s, i) => s + i.harga * i.qty, 0);
    const totalEl = document.getElementById('checkoutTotalVal');
    if (totalEl) totalEl.textContent = formatRupiah(total);

    // Reset ke state awal: metode "delivery" terpilih
    selectDelivery('delivery');

    // Bersihkan semua error
    ['nama', 'wa', 'maps'].forEach(f => {
        const err = document.getElementById('err_' + f);
        const inp = document.getElementById('co_' + f);
        if (err) err.textContent = '';
        if (inp) inp.classList.remove('co-error');
    });

    document.getElementById('checkoutModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
};

window.closeCheckout = function() {
    document.getElementById('checkoutModal').classList.remove('active');
    document.body.style.overflow = '';
};

/**
 * Product Detail Modal Logic
 */
window.openProductDetail = function(id) {
    const p = allProducts.find(item => item.id === id);
    if (!p) return;

    const modal = document.getElementById('productDetailModal');
    const image = document.getElementById('pd_image');
    const category = document.getElementById('pd_category');
    const name = document.getElementById('pd_name');
    const price = document.getElementById('pd_price');
    const description = document.getElementById('pd_description');
    const addBtn = document.getElementById('pd_add_btn');

    image.src = p.gambar || 'https://via.placeholder.com/400';
    category.textContent = p.kategori || 'General';
    name.textContent = p.nama;
    price.textContent = formatRupiah(p.harga);
    description.textContent = p.deskripsi || 'Tidak ada deskripsi untuk produk ini.';
    
    addBtn.onclick = () => {
        addToCart(p.id, p.nama, p.harga, p.gambar);
        closeProductDetail();
    };

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
};

window.closeProductDetail = function() {
    const modal = document.getElementById('productDetailModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
};

// State metode pengiriman
let currentDeliveryMethod = 'delivery';

/**
 * Toggle UI saat user pilih metode pengiriman
 */
window.selectDelivery = function(method) {
    currentDeliveryMethod = method;

    // Update radio
    document.getElementById('radio_' + method).checked = true;

    // Update visual selection
    ['delivery', 'pickup'].forEach(m => {
        document.getElementById('opt_' + m).classList.toggle('selected', m === method);
    });

    // Toggle panel dengan animasi
    const panelDelivery = document.getElementById('panel_delivery');
    const panelPickup   = document.getElementById('panel_pickup');
    const shippingNote  = document.getElementById('shippingNote');

    if (method === 'delivery') {
        panelDelivery.style.display = 'block';
        panelPickup.style.display   = 'none';
        if (shippingNote) shippingNote.textContent = '+ Ongkir dikonfirmasi admin';
    } else {
        panelDelivery.style.display = 'none';
        panelPickup.style.display   = 'block';
        if (shippingNote) shippingNote.textContent = '+ Gratis (ambil di toko)';
    }
    lucide.createIcons();
};

window.submitCheckout = function(e) {
    e.preventDefault();
    const nama    = document.getElementById('co_nama').value.trim();
    const wa      = document.getElementById('co_wa').value.trim();
    const method  = currentDeliveryMethod;
    const mapsLink = method === 'delivery' ? document.getElementById('co_maps').value.trim() : '';
    const catatan  = method === 'delivery'
        ? document.getElementById('co_catatan').value.trim()
        : document.getElementById('co_catatan_pickup').value.trim();

    // Reset semua error
    ['nama', 'wa', 'maps'].forEach(f => {
        const err = document.getElementById('err_' + f);
        const inp = document.getElementById('co_' + f);
        if (err) err.textContent = '';
        if (inp) inp.classList.remove('co-error');
    });

    let valid = true;
    if (!nama) {
        document.getElementById('err_nama').textContent = 'Nama wajib diisi';
        document.getElementById('co_nama').classList.add('co-error');
        valid = false;
    }
    if (!wa) {
        document.getElementById('err_wa').textContent = 'No. WhatsApp wajib diisi';
        document.getElementById('co_wa').classList.add('co-error');
        valid = false;
    } else if (!/^(\+62|62|0)[0-9]{8,12}$/.test(wa.replace(/[\s-]/g, ''))) {
        document.getElementById('err_wa').textContent = 'Format nomor tidak valid (cth: 081234...)';
        document.getElementById('co_wa').classList.add('co-error');
        valid = false;
    }
    // Validasi Maps hanya jika metode = delivery
    if (method === 'delivery') {
        if (!mapsLink) {
            document.getElementById('err_maps').textContent = 'Mohon isi link Google Maps lokasi kamu';
            document.getElementById('co_maps').classList.add('co-error');
            valid = false;
        } else if (!/(maps\.google|goo\.gl|maps\.app|google\.com\/maps)/.test(mapsLink)) {
            document.getElementById('err_maps').textContent = 'Link tidak valid. Gunakan link dari Google Maps';
            document.getElementById('co_maps').classList.add('co-error');
            valid = false;
        }
    }
    if (!valid) return;

    // Loading state
    const btn = document.getElementById('checkoutSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="co-spinner"></span><span>Menghubungkan ke WhatsApp...</span>';

    setTimeout(() => {
        const msg = generateWhatsAppMessage({ nama, wa, method, mapsLink, catatan });
        window.open('https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(msg), '_blank');

        // Reset cart & form
        cart = [];
        saveCart();
        updateCartUI();
        updateFloatingBtn();
        document.getElementById('checkoutForm').reset();
        closeCheckout();

        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="send"></i><span>Kirim ke WhatsApp</span>';
        lucide.createIcons();

        if (window.showStoreToast) window.showStoreToast('Pesanan berhasil dikirim! Cek WhatsApp kamu 🎉', 'success');
    }, 800);
};

function generateWhatsAppMessage({ nama, wa, method, mapsLink, catatan }) {
    const total = cart.reduce((s, i) => s + i.harga * i.qty, 0);
    let msg = 'Halo Vape AH! 👋\n\n';
    msg += 'Saya ingin order:\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    cart.forEach(item => {
        msg += `• ${item.nama}\n  ${item.qty} pcs × ${formatRupiah(item.harga)} = ${formatRupiah(item.harga * item.qty)}\n`;
    });
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += `💰 Total Produk: ${formatRupiah(total)}\n`;

    if (method === 'delivery') {
        msg += `🚚 Ongkir: Menyusul (konfirmasi admin)\n\n`;
        msg += `📦 Metode: Kirim ke alamat\n`;
        msg += `📍 Lokasi saya:\n${mapsLink}\n`;
    } else {
        msg += `🏪 Metode: Ambil di toko (GRATIS)\n`;
        msg += `📍 Lokasi toko:\nhttps://maps.app.goo.gl/Nzx9E5f5emWtbDV57\n`;
    }

    msg += `\n📋 Data Pemesan:\n`;
    msg += `Nama   : ${nama}\n`;
    msg += `No. HP : ${wa}\n`;
    if (catatan) msg += `Catatan: ${catatan}\n`;
    msg += '\nMohon segera diproses ya kak, terima kasih! 🙏';
    return msg;
}

function updateFloatingBtn() {
    const btn = document.getElementById('floatingWABtn');
    const txt = document.getElementById('floatingWAText');
    if (!btn) return;
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    if (totalQty > 0) {
        txt.textContent = `Keranjang (${totalQty})`;
        btn.style.boxShadow = '0 0 20px rgba(255,42,42,0.8)';
    } else {
        txt.textContent = 'Order WA';
        btn.style.boxShadow = 'var(--neon-red-glow)';
    }
}

window.handleFloatingCTA = function() {
    if (cart.length > 0) {
        toggleCart();
    } else {
        window.open('https://wa.me/' + WA_PHONE, '_blank');
    }
};

/**
 * Filter and Search Logic
 */
function applyFilters() {
    filteredProducts = allProducts.filter(p => {
        const productKategori = (p.kategori || '').trim().toLowerCase();
        const selectedKategori = currentCategory.trim().toLowerCase();
        const matchesCategory = currentCategory === 'All' || productKategori === selectedKategori;
        const matchesSearch = (p.nama || '').toLowerCase().includes(searchQuery.toLowerCase());
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
