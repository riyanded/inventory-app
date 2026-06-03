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

        // Jika berhasil mengambil data
        if (data.status === "success" || data.totalBarang !== undefined) {
            
            // A. Update 3 Kartu Angka Utama
            document.getElementById('total-barang').innerText = data.totalBarang || 0;
            document.getElementById('stok-rendah').innerText = data.stokRendah || 0;
            document.getElementById('transaksi-hari-ini').innerText = data.transaksiHariIni || 0;

            // B. Update Tabel Aktivitas Transaksi Terbaru
            if (tabelBody && data.transaksiTerbaru) {
                tabelBody.innerHTML = ''; // Bersihkan tulisan "Memuat data..."

                if (data.transaksiTerbaru.length === 0) {
                    tabelBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Belum ada aktivitas transaksi terbaru</td></tr>`;
                } else {
                    data.transaksiTerbaru.forEach(trx => {
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