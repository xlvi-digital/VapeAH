/**
 * login.js - Secure Login Logic for Vape AH
 * Implementasi client-side SHA-256 hashing dan integrasi Google Apps Script.
 */

// Link Google Apps Script Web App yang Baru
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby-zQa6Oa1U6r0Btvn9txU4910UjI5oiPxOGbdsUstZ-fIzUypSTjUBVVKKR_nXhEzG/exec';

/**
 * Meng-hash string menggunakan SHA-256 via Web Crypto API
 * @param {string} password 
 * @returns {Promise<string>} String hash heksadesimal
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Menampilkan pesan status ke pengguna
 * @param {string} message 
 * @param {boolean} isError 
 */
function showStatus(message, isError = false) {
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#ff4d4d' : '#00ffcc';
    statusEl.style.opacity = '1';
    
    // Sembunyikan otomatis setelah 5 detik jika sukses
    if (!isError) {
        setTimeout(() => {
            statusEl.style.opacity = '0';
        }, 5000);
    }
}

// Menangani Pengiriman Formulir
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const btn = e.target.querySelector('.login-btn');
    const btnText = btn.querySelector('span');
    
    // 1. Status UI Awal
    const originalText = btnText.textContent;
    btnText.textContent = 'Memverifikasi...';
    btn.disabled = true;
    showStatus('Sedang memproses login aman...', false);

    try {
        // 2. Hash password di sisi klien
        const hashedPassword = await hashPassword(password);
        
        // 3. Siapkan data untuk GAS
        const payload = {
            action: "login", // SANGAT PENTING: Harus ada ini agar GAS tahu ini proses login
            username: username,
            hashedPassword: hashedPassword
        };

        // 4. Kirim ke Google Apps Script
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();

        if (result.success) {
            showStatus('Login berhasil! Mengalihkan...', false);
            // Simpan token dengan kunci 'admin_token' agar sesuai dengan dashboard.js
            if (result.token) localStorage.setItem('admin_token', result.token);
            
            // Pengalihan setelah jeda singkat
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showStatus(result.message || 'Username atau password salah.', true);
            btnText.textContent = originalText;
            btn.disabled = false;
        }

    } catch (error) {
        console.error('Login Error:', error);
        showStatus('Kesalahan koneksi. Pastikan internet aktif atau URL Apps Script benar.', true);
        btnText.textContent = originalText;
        btn.disabled = false;
    }
});
