// ==========================================
// 1. KONFIGURASI API
// ==========================================
// Jika Anda belum menggunakan Vercel Proxy (Langkah Keamanan), gunakan URL Apps Script langsung seperti ini:
const API_URL = "https://script.google.com/macros/s/AKfycbw1PQint5ujLAONiovS7kTVvBzcK-tyukOYFvtkhzsGsSZ7zvseTORs8OIduC8CqgFS/exec";

// ==========================================
// 2. LOGIKA FETCH DATA (MENARIK DATA)
// ==========================================
async function fetchDashboardData() {
    // Tampilan indikator loading saat mengambil data
    document.getElementById('total-barang').innerText = '...';
    document.getElementById('stok-rendah').innerText = '...';
    document.getElementById('transaksi-hari-ini').innerText = '...';
    
    const tabelBody = document.getElementById('tabel-dashboard-transaksi');
    if (tabelBody) {
        tabelBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Memuat data dari server...</td></tr>`;
    }

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // Cek apakah data.total_barang ada di dalam JSON yang diterima
        if (data.total_barang !== undefined) {
            
            // A. Update 3 Kartu Angka Utama (Disesuaikan dengan format JSON dari backend Anda)
            document.getElementById('total-barang').innerText = data.total_barang || 0;
            document.getElementById('stok-rendah').innerText = data.stok_rendah || 0;
            document.getElementById('transaksi-hari-ini').innerText = data.transaksi_hari_ini || 0;

            // B. Update Tabel Aktivitas Transaksi Terbaru (Disesuaikan menjadi data.transaksi)
            if (tabelBody && data.transaksi) {
                tabelBody.innerHTML = ''; // Bersihkan tulisan "Memuat data..."

                if (data.transaksi.length === 0) {
                    tabelBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Belum ada aktivitas transaksi terbaru</td></tr>`;
                } else {
                    data.transaksi.forEach(trx => {
                        // Tentukan warna badge (Merah untuk KELUAR, Hijau untuk MASUK)
                        const isKeluar = trx.tipe.toUpperCase() === 'KELUAR';
                        const badgeClass = isKeluar ? 'badge-out' : 'badge-in';
                        const qtyText = isKeluar ? `<span class="qty-out">-${trx.qty}</span>` : `<span class="qty-in" style="color: var(--color-green); font-weight: bold;">+${trx.qty}</span>`;

                        const row = `
                            <tr>
                                <td>
                                    <span class="date-row"><i class="fa-regular fa-calendar-days"></i> ${trx.tanggal.split(' ')[0]}</span>
                                    <span class="time-row"><i class="fa-regular fa-clock"></i> ${trx.tanggal.split(' ')[1] || ''}</span>
                                </td>
                                <td><strong>${trx.barang}</strong></td>
                                <td><span class="badge ${badgeClass}">${trx.tipe}</span></td>
                                <td>${qtyText}</td>
                            </tr>
                        `;
                        tabelBody.insertAdjacentHTML('beforeend', row);
                    });
                }
            }
        }
    } catch (error) {
        console.error("Gagal mengambil data dari Google Sheets:", error);
        document.getElementById('total-barang').innerText = 'Err';
        document.getElementById('stok-rendah').innerText = 'Err';
        document.getElementById('transaksi-hari-ini').innerText = 'Err';
        
        if (tabelBody) {
            tabelBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--color-red);">Gagal terhubung ke database. Periksa URL Apps Script Anda.</td></tr>`;
        }
    }
}

// Tombol Refresh untuk memanggil ulang data
const btnRefresh = document.getElementById('btn-refresh');
if (btnRefresh) {
    btnRefresh.addEventListener('click', fetchDashboardData);
}

// ==========================================
// 3. LOGIKA DARK / LIGHT MODE
// ==========================================
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;
const themeIcon = themeToggleBtn.querySelector('i');

// Cek preferensi tema sebelumnya di browser
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
// 4. LOGIKA DROPDOWN PROFIL & LOGIN MULTILEVEL
// ==========================================
const profileMenu = document.getElementById('profile-menu');
const dropdownMenu = document.getElementById('dropdown-menu');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userName = document.getElementById('user-name');
const userRole = document.getElementById('user-role');

// Buka/Tutup menu profil
profileMenu.addEventListener('click', (e) => {
    if (e.target.closest('.dropdown-menu') === null) {
        dropdownMenu.classList.toggle('active');
    }
});

// Tutup menu profil jika klik di luar area menu
document.addEventListener('click', (e) => {
    if (!profileMenu.contains(e.target)) {
        dropdownMenu.classList.remove('active');
    }
});

// Simulasi Login Admin
btnLogin.addEventListener('click', (e) => {
    e.preventDefault();
    userName.innerText = "Admin Inventory";
    userRole.innerText = "Super Admin";
    userRole.style.backgroundColor = "rgba(16, 185, 129, 0.2)"; 
    userRole.style.color = "var(--color-green)";
    
    btnLogin.style.display = "none";
    btnLogout.style.display = "flex";
    dropdownMenu.classList.remove('active');
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

// ==========================================
// 5. INISIALISASI SAAT HALAMAN DIMUAT
// ==========================================
window.addEventListener('DOMContentLoaded', fetchDashboardData);

// ==========================================
// 6. LOGIKA NAVIGASI MENU (DASHBOARD & INVENTORI)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const menuDashboard = document.getElementById('menu-dashboard'); 
    const menuInventori = document.getElementById('menu-inventori'); 
    
    const sectionDashboard = document.getElementById('dashboard-section');
    const sectionInventori = document.getElementById('inventori-section');
    const pageTitle = document.getElementById('page-title'); // Mengambil elemen judul header

    function switchPage(page) {
        // A. Reset semua status menu menjadi tidak aktif
        if (menuDashboard) menuDashboard.classList.remove('active');
        if (menuInventori) menuInventori.classList.remove('active');

        // B. Logika perpindahan halaman
        if (page === 'dashboard') {
            // Tampilkan section dashboard
            sectionDashboard.classList.add('active');
            sectionInventori.classList.remove('active');
            
            // Nyalakan menu dashboard dan ubah judul header
            if (menuDashboard) menuDashboard.classList.add('active');
            if (pageTitle) pageTitle.innerText = "Dashboard"; 
            
        } else if (page === 'inventori') {
            // Tampilkan section inventori
            sectionDashboard.classList.remove('active');
            sectionInventori.classList.add('active');
            
            // Nyalakan menu inventori dan ubah judul header
            if (menuInventori) menuInventori.classList.add('active');
            if (pageTitle) pageTitle.innerText = "Manajemen Inventori"; 
            
            // Panggil fungsi untuk mengambil data asli dari Spreadsheet
            fetchInventoryData(); 
        }
    }

    // Pasang aksi klik pada menu
    if (menuDashboard) menuDashboard.addEventListener('click', (e) => { e.preventDefault(); switchPage('dashboard'); });
    if (menuInventori) menuInventori.addEventListener('click', (e) => { e.preventDefault(); switchPage('inventori'); });
});

// ==========================================
// 7. RENDER DATA INVENTORI (VERSI DETEKTIF / DEBUG)
// ==========================================
async function fetchInventoryData() {
    const tbody = document.getElementById('tabel-inventori-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">Menyelidiki data dari server...</td></tr>`;

    try {
        const response = await fetch(API_URL);
        
        // Kita tangkap sebagai teks mentah dulu, jangan langsung di-JSON-kan
        const rawText = await response.text();
        
        let rawData;
        try {
            // Coba ubah teks tersebut menjadi JSON
            rawData = JSON.parse(rawText);
        } catch (parseError) {
            // JIKA GAGAL: Berarti server tidak mengirim JSON (mungkin ngirim halaman Login HTML atau Error Google)
            tbody.innerHTML = `
                <tr><td colspan="6" style="text-align:left; background: #fff0f0; padding: 20px;">
                    <b style="color: red;">Peringatan: Google Apps Script tidak mengirimkan data JSON yang valid!</b><br>
                    Kemungkinan URL Web App salah, belum di-deploy sebagai "Anyone" (Siapa saja), atau scriptnya error.<br><br>
                    <b>Balasan asli dari server:</b><br>
                    <div style="background: #fff; padding: 10px; border: 1px solid #ddd; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; margin-top: 10px;">
                        ${rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                    </div>
                </td></tr>`;
            return;
        }

        // JIKA BERHASIL JADI JSON: Tampilkan wujud aslinya ke layar
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align:left; background: #f0f8ff; padding: 20px;">
                <b style="color: #0056b3;">Data JSON berhasil ditangkap!</b><br>
                Ternyata struktur data Anda seperti ini. Tolong <b>screenshot bagian kotak putih di bawah ini</b> dan kirimkan ke saya agar saya bisa menyesuaikan tabelnya:<br><br>
                <div style="background: #fff; padding: 10px; border: 1px solid #ddd; max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px; white-space: pre-wrap;">${JSON.stringify(rawData, null, 2)}</div>
            </td></tr>`;

    } catch (error) {
        // Gagal melakukan fetch sama sekali (Misal: masalah CORS)
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red; padding: 20px;">Error Fetch API: ${error.message}</td></tr>`;
    }
}