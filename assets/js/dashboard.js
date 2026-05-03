/**
 * dashboard.js - Admin Dashboard Logic for Vape AH
 */

// Simple Obfuscation for SCRIPT_URL
const _0x1a2b = 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J5LXpRYTZPYTFVNnIwQnR2bjl0eFU0OTEwVWpJNW9pUHhPR2Jkc1VzdFotZkl6VXlwU1RqVUJWVktLUl9uWGhFekcvZXhlYw==';
const SCRIPT_URL = atob(_0x1a2b);

let selectedImageData = null;
let selectedEditImageData = null;

/**
 * Navigation Logic
 */
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        if (item.id === 'logoutBtn') return handleLogout();
        
        e.preventDefault();
        const sectionId = item.getAttribute('data-section');
        if (!sectionId) return;

        // Update Active State
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Switch Sections
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');

        // Fetch products if list section
        if (sectionId === 'product-list') fetchProducts();
        
        // Close sidebar on mobile
        document.querySelector('.sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    });
});

// Hamburger Toggle
document.getElementById('hamburger').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.add('active');
    document.getElementById('overlay').classList.add('active');
});

document.getElementById('overlay').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
});

/**
 * Handle Auth & Logout
 */
function handleAuthError(result) {
    if (result.code === 403 || result.expired) {
        localStorage.removeItem('admin_token');
        showConfirm("Sesi Berakhir", "Sesi Anda telah habis. Silakan login kembali.", () => {
            window.location.href = 'login.html';
        });
        return true;
    }
    return false;
}

function handleLogout() {
    showConfirm("Keluar?", "Anda akan keluar dari dashboard admin.", () => {
        localStorage.removeItem('admin_token');
        window.location.href = 'login.html';
    });
}

/**
 * Global Components
 */
window.showLoading = (msg) => {
    document.getElementById('loadingText').innerText = msg;
    document.getElementById('loadingOverlay').classList.add('active');
};
window.hideLoading = () => document.getElementById('loadingOverlay').classList.remove('active');

window.showToast = (msg, type = 'success') => {
    // Ambil atau buat container yang sudah fix di pojok layar
    let container = document.getElementById('dash-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'dash-toast-container';
        document.body.appendChild(container);
    }

    const icon = type === 'success'
        ? `<svg class="dash-toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg class="dash-toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    const toast = document.createElement('div');
    toast.className = `dash-toast ${type}`;
    toast.innerHTML = `${icon}<span class="dash-toast-msg">${msg}</span>`;
    container.appendChild(toast);

    // Auto dismiss
    const dismiss = () => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };
    setTimeout(dismiss, 3000);
};

let confirmCallback = null;
window.showConfirm = (title, msg, callback) => {
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmMessage').innerText = msg;
    document.getElementById('confirmModal').classList.add('active');
    confirmCallback = callback;
    if (window.lucide) lucide.createIcons();
};
window.closeConfirm = (res) => {
    document.getElementById('confirmModal').classList.remove('active');
    if (res && confirmCallback) confirmCallback();
    confirmCallback = null;
};

/**
 * Fetch & Render
 */
async function fetchProducts() {
    const body = document.getElementById('productListBody');
    if (body) body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Memuat data...</td></tr>';
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_products' })
        });
        const result = await response.json();
        if (result.success) {
            renderProductList(result.data);
        } else {
            showToast("Gagal memuat data", "error");
        }
    } catch (error) {
        console.error(error);
        showToast("Error koneksi server", "error");
    }
}

function renderProductList(products) {
    const tbody = document.getElementById('productListBody');
    const mobileList = document.getElementById('productCardList');
    
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Belum ada produk.</td></tr>';
        if (mobileList) mobileList.innerHTML = '<p style="text-align:center; color:var(--text-gray);">Belum ada produk.</p>';
        return;
    }

    // Tampilkan produk terbaru (baris terbawah di Sheet) di urutan paling atas
    const sorted = [...products].reverse();

    tbody.innerHTML = sorted.map(p => `
        <tr>
            <td><img src="${p.gambar}" style="width:40px; height:40px; object-fit:cover; border-radius:8px;"></td>
            <td style="font-weight:500;">${p.nama}</td>
            <td>${formatRupiah(p.harga)}</td>
            <td><span class="badge">${p.kategori}</span></td>
            <td>
                <div style="display:flex; gap:5px;">
                    <button onclick="openEditModal('${p.id}')" class="btn-action" style="padding:6px; background:var(--primary-cyan); min-width:35px;"><i data-lucide="edit-2"></i></button>
                    <button onclick="deleteProduk('${p.id}')" class="btn-action" style="padding:6px; background:#ff4d4d; min-width:35px;"><i data-lucide="trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    if (mobileList) {
        mobileList.innerHTML = sorted.map(p => `
            <div class="card" style="margin-bottom:15px;">
                <div style="display:flex; gap:15px; align-items:center;">
                    <img src="${p.gambar}" style="width:60px; height:60px; border-radius:12px; object-fit:cover;">
                    <div style="flex:1;">
                        <h4 style="margin-bottom:4px;">${p.nama}</h4>
                        <p class="text-neon" style="font-size:0.9rem;">${formatRupiah(p.harga)}</p>
                    </div>
                </div>
                <div style="margin-top:15px; display:flex; gap:10px;">
                    <button onclick="openEditModal('${p.id}')" class="btn-outline" style="flex:1; padding:8px; border-radius:8px;">Edit</button>
                    <button onclick="deleteProduk('${p.id}')" class="btn-action" style="flex:1; padding:8px; border-radius:8px; background:#ff4d4d;">Hapus</button>
                </div>
            </div>
        `).join('');
    }

    lucide.createIcons();
}

// Image Upload Handlers
document.getElementById('gambar_produk')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            selectedImageData = event.target.result;
            document.getElementById('imagePreview').innerHTML = `<img src="${selectedImageData}" style="width:100%; height:100%; object-fit:contain; border-radius:12px;">`;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('edit_gambar')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('edit_file_label').innerText = file.name;
        const reader = new FileReader();
        reader.onload = function(event) {
            selectedEditImageData = event.target.result;
            document.getElementById('editImagePreview').innerHTML = `<img src="${selectedEditImageData}" style="width:100%; height:100%; object-fit:contain; border-radius:12px;">`;
        };
        reader.readAsDataURL(file);
    }
});

/**
 * CRUD
 */
window.simpanProdukKeSheet = async function(e) {
    e.preventDefault();
    if (!selectedImageData) return showToast("Pilih foto produk!", "error");
    
    showLoading("Menyimpan...");
    const data = {
        action: 'add_product',
        nama: document.getElementById('nama_produk').value,
        harga: document.getElementById('harga_produk').value,
        kategori: document.getElementById('kategori_produk').value,
        deskripsi: document.getElementById('deskripsi_produk').value,
        gambar: selectedImageData,
        token: localStorage.getItem('admin_token')
    };

    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
        const result = await res.json();
        if (!handleAuthError(result) && result.success) {
            showToast("Produk berhasil ditambahkan!", "success");
            document.getElementById('form_input').reset();
            document.getElementById('imagePreview').innerHTML = '<p style="color: var(--text-gray); font-size: 0.85rem;">Pratinjau akan muncul di sini</p>';
            selectedImageData = null;
            fetchProducts();
            
            // Auto switch to product list
            document.querySelector('[data-section="product-list"]').click();
        } else {
             showToast(result.message || "Gagal menyimpan", "error");
        }
    } catch (e) {
        showToast("Gagal menyimpan produk", "error");
    } finally {
        hideLoading();
    }
};

window.openEditModal = function(id) {
    showLoading("Memuat data...");
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'get_products' }) })
        .then(res => res.json())
        .then(result => {
            hideLoading();
            if (result.success) {
                const product = result.data.find(p => p.id === id);
                if (product) {
                    document.getElementById('edit_id').value = product.id;
                    document.getElementById('edit_nama').value = product.nama;
                    // Set raw value and format untuk input harga
                    const hargaInput = document.getElementById('edit_harga');
                    const rawHarga = String(product.harga).replace(/\D/g, '');
                    hargaInput.dataset.raw = rawHarga;
                    hargaInput.value = rawHarga ? 'Rp ' + Number(rawHarga).toLocaleString('id-ID') : '';
                    document.getElementById('edit_kategori').value = product.kategori;
                    document.getElementById('edit_deskripsi').value = product.deskripsi;
                    document.getElementById('editImagePreview').innerHTML = `<img src="${product.gambar}" style="width:100%; height:100%; object-fit:contain; border-radius:12px;">`;
                    selectedEditImageData = product.gambar;
                    document.getElementById('editModal').classList.add('active');
                }
            }
        }).catch(() => { hideLoading(); showToast("Error memuat data edit", "error"); });
};

window.closeEditModal = function() {
    document.getElementById('editModal').classList.remove('active');
    document.getElementById('form_edit').reset();
    const label = document.getElementById('edit_file_label');
    if (label) label.innerText = 'Pilih file baru...';
};

window.updateProduk = async function(e) {
    e.preventDefault();
    showLoading("Menyimpan...");
    const data = {
        action: 'update_product',
        id: document.getElementById('edit_id').value,
        nama: document.getElementById('edit_nama').value,
        harga: document.getElementById('edit_harga').value,
        kategori: document.getElementById('edit_kategori').value,
        deskripsi: document.getElementById('edit_deskripsi').value,
        gambar: selectedEditImageData,
        token: localStorage.getItem('admin_token')
    };
    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
        const result = await res.json();
        if (!handleAuthError(result) && result.success) {
            showToast("Berhasil diperbarui!", "success");
            closeEditModal();
            fetchProducts();
        }
    } catch (e) { showToast("Gagal menyimpan", "error"); }
    finally { hideLoading(); }
};

window.deleteProduk = function(id) {
    showConfirm("Hapus Produk?", "Data yang dihapus tidak bisa dikembalikan.", async () => {
        showLoading("Menghapus...");
        try {
            const res = await fetch(SCRIPT_URL, { 
                method: 'POST', 
                body: JSON.stringify({ action: 'delete_product', id: id, token: localStorage.getItem('admin_token') }) 
            });
            const result = await res.json();
            if (!handleAuthError(result) && result.success) {
                showToast("Produk dihapus", "success");
                fetchProducts();
            }
        } catch (e) { showToast("Gagal menghapus", "error"); }
        hideLoading();
    });
};

// Bulk Upload Handlers
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const previewContainer = document.getElementById('previewContainer');
const previewTable = document.getElementById('previewTable');
let bulkData = [];

if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary-cyan)'; });
    dropZone.addEventListener('dragleave', () => dropZone.style.borderColor = 'var(--glass-border)');
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--glass-border)'; if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', (e) => { if(e.target.files[0]) handleFile(e.target.files[0]); });
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        // Assuming XLSX is loaded via CDN in HTML
        if (typeof XLSX === 'undefined') {
            return showToast("Library Excel tidak dimuat", "error");
        }
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        bulkData = XLSX.utils.sheet_to_json(firstSheet);
        
        if (bulkData.length > 0) {
            const headers = Object.keys(bulkData[0]);
            let tableHTML = '<tr>' + headers.map(h => `<th style="padding:15px; border-bottom:1px solid var(--glass-border);">${h}</th>`).join('') + '</tr>';
            
            bulkData.slice(0, 5).forEach(row => {
                tableHTML += '<tr>' + headers.map(h => `<td style="padding:15px; border-bottom:1px solid rgba(255,255,255,0.05);">${row[h] || ''}</td>`).join('') + '</tr>';
            });
            
            if (bulkData.length > 5) {
                tableHTML += `<tr><td colspan="${headers.length}" style="text-align:center; padding:10px; color:var(--text-gray);">...dan ${bulkData.length - 5} data lainnya</td></tr>`;
            }
            
            previewTable.innerHTML = tableHTML;
            previewContainer.style.display = 'block';
            document.getElementById('excelIcon').style.color = 'var(--primary-cyan)';
        }
    };
    reader.readAsArrayBuffer(file);
}

const bulkSubmitBtn = document.getElementById('bulkSubmitBtn');
if (bulkSubmitBtn) {
    bulkSubmitBtn.addEventListener('click', async () => {
        if (bulkData.length === 0) return;
        showConfirm("Upload Massal", `Anda akan mengunggah ${bulkData.length} produk ke database.`, async () => {
            showLoading("Mengunggah data...");
            try {
                const res = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'bulk_upload', data: bulkData, token: localStorage.getItem('admin_token') })
                });
                const result = await res.json();
                if (!handleAuthError(result) && result.success) {
                    showToast(`Berhasil mengunggah ${bulkData.length} produk!`, "success");
                    previewContainer.style.display = 'none';
                    bulkData = [];
                    fileInput.value = '';
                    document.getElementById('excelIcon').style.color = '';
                    fetchProducts();
                    document.querySelector('[data-section="product-list"]').click();
                } else {
                    showToast("Gagal upload massal", "error");
                }
            } catch(e) {
                showToast("Kesalahan jaringan", "error");
            } finally {
                hideLoading();
            }
        });
    });
}

/**
 * Helpers
 */
function formatRupiah(n) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

/**
 * Auto-format harga input menjadi format Rupiah dengan titik ribuan.
 * Input tipenya text karena akan diformat, nilai mentahnya disimpan di data-raw.
 */
function setupPriceInputFormatter(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;

    // Ganti type ke text agar bisa diformat
    el.type = 'text';
    el.inputMode = 'numeric';
    el.setAttribute('autocomplete', 'off');

    el.addEventListener('input', function () {
        // Hapus semua karakter non-angka
        const raw = this.value.replace(/\D/g, '');
        this.dataset.raw = raw;
        if (raw === '') {
            this.value = '';
            return;
        }
        // Format pakai titik sebagai pemisah ribuan
        this.value = 'Rp ' + Number(raw).toLocaleString('id-ID');
    });

    el.addEventListener('focus', function () {
        // Saat fokus, tampilkan angka mentah agar mudah diedit
        const raw = this.dataset.raw || this.value.replace(/\D/g, '');
        this.value = raw;
    });

    el.addEventListener('blur', function () {
        // Saat blur, format kembali
        const raw = this.value.replace(/\D/g, '');
        this.dataset.raw = raw;
        if (raw === '') { this.value = ''; return; }
        this.value = 'Rp ' + Number(raw).toLocaleString('id-ID');
    });
}

setupPriceInputFormatter('harga_produk');
setupPriceInputFormatter('edit_harga');

// Patch simpanProdukKeSheet & updateProduk agar baca nilai mentah
(function patchHargaValues() {
    const origSimpan = window.simpanProdukKeSheet;
    window.simpanProdukKeSheet = async function(e) {
        const el = document.getElementById('harga_produk');
        if (el) {
            const raw = el.dataset.raw || el.value.replace(/\D/g, '');
            el._formatted = el.value;
            el.value = raw;
            await origSimpan(e);
            el.value = el._formatted || '';
        } else {
            await origSimpan(e);
        }
    };
    const origUpdate = window.updateProduk;
    window.updateProduk = async function(e) {
        const el = document.getElementById('edit_harga');
        if (el) {
            const raw = el.dataset.raw || el.value.replace(/\D/g, '');
            el._formatted = el.value;
            el.value = raw;
            await origUpdate(e);
            el.value = el._formatted || '';
        } else {
            await origUpdate(e);
        }
    };
})();

// Set Date
const d = new Date();
const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
document.getElementById('currentDate').innerText = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

// Initial Fetch
fetchProducts();
