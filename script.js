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
    const menuDashboard = document.getElementById('menu-dashboard'); // Pastikan ID ini ada di HTML menu Dashboard Anda
    const menuInventori = document.getElementById('menu-inventori'); // Pastikan ID ini ada di HTML menu Inventori Anda
    
    const sectionDashboard = document.getElementById('dashboard-section');
    const sectionInventori = document.getElementById('inventori-section');

    function switchPage(page) {
        if (page === 'dashboard') {
            sectionDashboard.classList.add('active');
            sectionInventori.classList.remove('active');
            // Opsional: tambahkan class 'active' ke menu sidebar juga
        } else if (page === 'inventori') {
            sectionDashboard.classList.remove('active');
            sectionInventori.classList.add('active');
            renderDummyInventory(); // Panggil data saat masuk ke halaman ini
        }
    }

    // Event listener untuk klik menu
    if (menuDashboard) menuDashboard.addEventListener('click', (e) => { e.preventDefault(); switchPage('dashboard'); });
    if (menuInventori) menuInventori.addEventListener('click', (e) => { e.preventDefault(); switchPage('inventori'); });
});

// ==========================================
// RENDER DATA INVENTORI (Sementara pakai Data Dummy)
// ==========================================
function renderDummyInventory() {
    const tbody = document.getElementById('tabel-inventori-body');
    if (!tbody) return;

    // Contoh data seperti di gambar Anda
    const dummyData = [
        { nama: 'Stub end agru 8"', sku: 'NWA0000001', kategori: 'Dn200mm', lokasi: 'STO-A1', stok: 0, min: 0 },
        { nama: 'Stub end agru 6"', sku: 'NWA0000002', kategori: 'Dn160mm', lokasi: 'STO-A1', stok: 0, min: 0 },
        { nama: 'Stub end agru 12"', sku: 'NWA0000003', kategori: 'Dn315mm', lokasi: 'STO-A1', stok: 0, min: 0 },
        { nama: 'Stub end agru 2"', sku: 'NWA0000004', kategori: 'Dn63mm', lokasi: 'STO-A1', stok: 0, min: 0 }
    ];

    let rows = '';
    dummyData.forEach(item => {
        rows += `
            <tr>
                <td>
                    <span class="item-title">${item.nama}</span>
                    <span class="item-sku">${item.sku}</span>
                </td>
                <td>${item.kategori}</td>
                <td>${item.lokasi}</td>
                <td>
                    <span class="stock-value">${item.stok}</span>
                    <span class="stock-min">Min: ${item.min}</span>
                    <div style="width: 100%; height: 4px; background: #eee; border-radius: 2px; margin-top: 5px;"></div>
                </td>
                <td><span class="badge-rendah">RENDAH</span></td>
                <td class="action-btns">
                    <i class="fa-solid fa-pen-to-square"></i>
                    <i class="fa-solid fa-arrow-right-arrow-left"></i>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rows;
}