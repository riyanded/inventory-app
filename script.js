// ==========================================
// 1. KONFIGURASI API (URL GOOGLE APPS SCRIPT)
// ==========================================
// PENTING: Ganti URL di bawah dengan URL Web App Google Apps Script Anda!
const API_URL = "https://script.google.com/macros/s/AKfycbw1PQint5ujLAONiovS7kTVvBzcK-tyukOYFvtkhzsGsSZ7zvseTORs8OIduC8CqgFS/exec";

// ==========================================
// 2. LOGIKA FETCH DATA (MENARIK DATA)
// ==========================================
async function fetchDashboardData() {
    // Ubah angka menjadi '...' saat loading
    document.getElementById('total-barang').innerText = '...';
    document.getElementById('stok-rendah').innerText = '...';
    document.getElementById('transaksi-hari-ini').innerText = '...';

    try {
        // Jika API_URL belum diisi, kita hentikan agar tidak error
        if (API_URL === "https://script.google.com/macros/s/AKfycbw1PQint5ujLAONiovS7kTVvBzcK-tyukOYFvtkhzsGsSZ7zvseTORs8OIduC8CqgFS/exec") {
            console.warn("⚠️ URL API belum diisi. Menampilkan data dummy.");
            document.getElementById('total-barang').innerText = '45';
            document.getElementById('stok-rendah').innerText = '3';
            document.getElementById('transaksi-hari-ini').innerText = '12';
            return;
        }

        const response = await fetch(API_URL);
        const data = await response.json();

        // Asumsi data JSON dari Apps Script Anda seperti: { totalBarang: 10, stokRendah: 2, transaksiHariIni: 5 }
        document.getElementById('total-barang').innerText = data.totalBarang || 0;
        document.getElementById('stok-rendah').innerText = data.stokRendah || 0;
        document.getElementById('transaksi-hari-ini').innerText = data.transaksiHariIni || 0;

    } catch (error) {
        console.error("Gagal mengambil data:", error);
        document.getElementById('total-barang').innerText = 'Err';
    }
}

// Panggil fungsi refresh saat tombol Refresh ditekan
document.getElementById('btn-refresh').addEventListener('click', fetchDashboardData);

// ==========================================
// 3. LOGIKA DARK / LIGHT MODE
// ==========================================
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;
const themeIcon = themeToggleBtn.querySelector('i');

// Cek memori browser, apakah user sebelumnya pakai light mode?
if (localStorage.getItem('theme') === 'light') {
    body.classList.add('light-mode');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
}

themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    
    if (body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        localStorage.setItem('theme', 'dark');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
});

// ==========================================
// 4. LOGIKA DROPDOWN PROFIL & MULTILEVEL LOGIN
// ==========================================
const profileMenu = document.getElementById('profile-menu');
const dropdownMenu = document.getElementById('dropdown-menu');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userName = document.getElementById('user-name');
const userRole = document.getElementById('user-role');

// Buka/Tutup menu profil
profileMenu.addEventListener('click', (e) => {
    // Mencegah menu langsung tertutup saat item di dalamnya diklik
    if (e.target.closest('.dropdown-menu') === null) {
        dropdownMenu.classList.toggle('active');
    }
});

// Simulasi Login (Bisa Anda ubah nanti dengan sistem Auth sungguhan)
btnLogin.addEventListener('click', (e) => {
    e.preventDefault();
    userName.innerText = "Dani Sabri";
    userRole.innerText = "Super Admin";
    userRole.style.backgroundColor = "rgba(16, 185, 129, 0.2)"; // Warna hijau
    userRole.style.color = "var(--color-green)";
    
    btnLogin.style.display = "none";
    btnLogout.style.display = "flex";
    dropdownMenu.classList.remove('active');
    alert("Berhasil login sebagai Admin!");
});

// Simulasi Logout
btnLogout.addEventListener('click', (e) => {
    e.preventDefault();
    userName.innerText = "Tamu";
    userRole.innerText = "Belum Login";
    userRole.style.backgroundColor = "var(--border-color)";
    userRole.style.color = "var(--text-muted)";
    
    btnLogin.style.display = "flex";
    btnLogout.style.display = "none";
    dropdownMenu.classList.remove('active');
});

// Jalankan pengambilan data pertama kali saat halaman dimuat
window.addEventListener('DOMContentLoaded', fetchDashboardData);