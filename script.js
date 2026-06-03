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
// 7. RENDER DATA INVENTORI DARI SPREADSHEET
// ==========================================
async function fetchInventoryData() {
    const tbody = document.getElementById('tabel-inventori-body');
    if (!tbody) return;

    // Tampilkan tulisan loading sementara
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">Memuat data dari Google Sheets...</td></tr>`;

    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        
        console.log("Data mentah dari Google Sheets:", rawData); 

        let items = [];
        
        // 1. Jika datanya langsung berupa array utama
        if (Array.isArray(rawData)) {
            items = rawData;
        } 
        // 2. Jika berupa object, cari array yang TIDAK KOSONG terlebih dahulu
        else if (typeof rawData === 'object' && rawData !== null) {
            
            // Cek berdasarkan kata kunci properti yang paling sering digunakan dan pastikan ada isinya
            const priorityKeys = ['inventori', 'inventory', 'data', 'barang', 'items', 'records', 'result', 'sheet1'];
            for (const key of priorityKeys) {
                if (rawData[key] && Array.isArray(rawData[key]) && rawData[key].length > 0) {
                    items = rawData[key];
                    break;
                }
            }

            // Jika kata kunci di atas tidak ketemu, scan seluruh isi object untuk mencari array apa saja yang ada isinya
            if (items.length === 0) {
                for (const key in rawData) {
                    if (Array.isArray(rawData[key]) && rawData[key].length > 0) {
                        items = rawData[key];
                        break;
                    }
                }
            }

            // Fallback terakhir: jika memang semua array kosong, baru ambil array pertama yang ditemui
            if (items.length === 0) {
                for (const key in rawData) {
                    if (Array.isArray(rawData[key])) {
                        items = rawData[key];
                        break;
                    }
                }
            }
        }

        // Jalankan render jika array data barang ditemukan
        if (items.length > 0) {
            let rows = '';
            
            items.forEach(item => {
                // Pemetaan nama kolom dengan toleransi huruf besar/kecil/spasi dari Spreadsheet
                const nama = item.nama || item.Nama || item.NAMA || item["Nama Barang"] || item["NAMA BARANG"] || '-';
                const sku = item.sku || item.SKU || item.id || item.ID || item["SKU Barang"] || '-';
                const kategori = item.kategori || item.Kategori || item.KATEGORI || '-';
                const lokasi = item.lokasi || item.Lokasi || item.LOKASI || '-';
                
                // Deteksi Stok & Batas Minimum Stok
                const stok = parseInt(item.stok || item.Stok || item.STOK || item.qty || item.QTY || 0);
                const min = parseInt(item.min || item.Min || item.MIN || item.minimum || item["Min Stok"] || 0);

                const isRendah = stok <= min;
                const statusText = isRendah ? 'RENDAH' : 'AMAN';
                
                // Pengaturan Gaya Tampilan Kustom sesuai UI Vercel Anda
                const badgeStyle = isRendah 
                    ? "background: #fff0f0; color: #e63946; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; display: inline-block;" 
                    : "background: #f0fff4; color: #2bc47a; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; display: inline-block;";

                const stokColor = isRendah ? "color: #e63946; font-weight: bold;" : "color: #1e293b; font-weight: bold;";
                const progressColor = isRendah ? "#e63946" : "#2bc47a";

                rows += `
                    <tr>
                        <td>
                            <span style="font-weight: 600; color: #1e293b; display: block; font-size: 14px;">${nama}</span>
                            <span style="color: #94a3b8; font-size: 12px; display: block; margin-top: 2px;">${sku}</span>
                        </td>
                        <td style="color: #475569; vertical-align: middle;">${kategori}</td>
                        <td style="color: #475569; vertical-align: middle;">${lokasi}</td>
                        <td style="vertical-align: middle;">
                            <div style="display: flex; align-items: baseline; gap: 4px;">
                                <span style="${stokColor}; font-size: 15px;">${stok}</span>
                                <span style="color: #94a3b8; font-size: 12px;">/ Min: ${min}</span>
                            </div>
                            <div style="width: 100px; height: 5px; background: #f1f5f9; border-radius: 3px; margin-top: 6px; overflow: hidden;">
                                <div style="width: ${stok > 0 ? '100%' : '0%'}; height: 100%; background: ${progressColor};"></div>
                            </div>
                        </td>
                        <td style="vertical-align: middle;"><span style="${badgeStyle}">${statusText}</span></td>
                        <td style="vertical-align: middle; font-size: 16px;">
                            <a href="#" style="color: #4361ee; margin-right: 12px;" title="Edit"><i class="fa-solid fa-pen-to-square"></i></a>
                            <a href="#" style="color: #4361ee;" title="Transaksi"><i class="fa-solid fa-right-left"></i></a>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = rows;
            
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">Data berhasil terhubung, tetapi sistem tidak menemukan baris tabel data yang valid di Spreadsheet Anda.</td></tr>`;
        }
    } catch (error) {
        console.error("Gagal mengambil data inventori:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red; padding: 20px;">Gagal terhubung ke database Spreadsheet. Periksa kembali URL Web App Apps Script Anda.</td></tr>`;
    }
}