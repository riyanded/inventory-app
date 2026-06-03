// ==========================================
// 1. KONFIGURASI API
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbyPrlCNCf0Qb5pj71G_9YSx_-aD7hOVzpMN8h_9slDk3eCzJgqOVdOjndu9QmdWEyc5/exec";

// Variabel Global (Brankas Penyimpanan Data Utama)
let globalInventoryData = [];       // Menyimpan database semua barang dari Sheets
let transactionCart = [];           // Menyimpan daftar barang yang masuk keranjang transaksi
let selectedProduct = null;         // Menyimpan data produk yang sedang terpilih sementara

// ==========================================
// 2. LOGIKA FETCH DASHBOARD (Mendapatkan Data Ringkasan)
// ==========================================
async function fetchDashboardData() {
    document.getElementById('total-barang').innerText = '...';
    document.getElementById('stok-rendah').innerText = '...';
    document.getElementById('transaksi-hari-ini').innerText = '...';
    
    // PERBAIKAN: Menyesuaikan dengan ID tabel di HTML Anda (transaction-table-body)
    const tabelBody = document.getElementById('transaction-table-body');
    if (tabelBody) {
        tabelBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Memuat data dari server...</td></tr>`;
    }

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.total_barang !== undefined) {
            document.getElementById('total-barang').innerText = data.total_barang || 0;
            document.getElementById('stok-rendah').innerText = data.stok_rendah || 0;
            document.getElementById('transaksi-hari-ini').innerText = data.transaksi_hari_ini || 0;

            if (tabelBody && data.transaksi) {
                tabelBody.innerHTML = ''; 

                if (data.transaksi.length === 0) {
                    tabelBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Belum ada aktivitas transaksi terbaru</td></tr>`;
                } else {
                    data.transaksi.forEach(trx => {
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
            tabelBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--color-red);">Gagal terhubung ke database.</td></tr>`;
        }
    }
}

// Tombol Refresh Ringkasan
const btnRefresh = document.getElementById('btn-refresh');
if (btnRefresh) {
    btnRefresh.addEventListener('click', fetchDashboardData);
}

// ==========================================
// 3. LOGIKA FETCH DATA INVENTORI (Tabel Stok)
// ==========================================
async function fetchInventoryData() {
    const tbody = document.getElementById('tabel-inventori-body');
    const totalBarangEl = document.getElementById('total-barang'); 
    const stokRendahEl = document.getElementById('stok-rendah');

    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">Memuat data...</td></tr>`;

    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        
        if (totalBarangEl) totalBarangEl.innerText = rawData.total_barang || 0;
        if (stokRendahEl) stokRendahEl.innerText = rawData.stok_rendah || 0;

        // Simpan data barang ke dalam brankas global
        globalInventoryData = rawData.barang || [];
        renderTable(globalInventoryData);

    } catch (error) {
        console.error("Gagal sinkronisasi data:", error);
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red; padding: 20px;">Gagal memuat database.</td></tr>`;
    }
}

function renderTable(items) {
    const tbody = document.getElementById('tabel-inventori-body');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #64748b; padding: 20px;">Data tidak ditemukan.</td></tr>`;
        return;
    }

    let rows = '';
    items.forEach(item => {
        const nama = item.nama || '-';
        const sku = item.id || '-';
        const kategori = item.kategori || '-';
        const lokasi = item.lokasi || '-';
        const stok = parseInt(item.stok || 0);
        const min = parseInt(item.min || 0);

        const isRendah = stok <= min;
        const statusText = isRendah ? 'RENDAH' : 'AMAN';
        
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
                    <a href="#" onclick="editBarang('${sku}', '${nama}')" style="color: #4361ee; margin-right: 12px;" title="Edit"><i class="fa-solid fa-pen-to-square"></i></a>
                    <a href="#" onclick="transaksiCepatBarang('${sku}')" style="color: #4361ee;" title="Transaksi"><i class="fa-solid fa-right-left"></i></a>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = rows;
}

// Fitur Pencarian di Halaman Inventori
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const keyword = e.target.value.toLowerCase();
        const filteredData = globalInventoryData.filter(item => {
            return (item.nama || '').toLowerCase().includes(keyword) || (item.id || '').toLowerCase().includes(keyword);
        });
        renderTable(filteredData);
    });
}

// Sync Stok Button
const btnSync = document.getElementById('btnSync');
if (btnSync) {
    btnSync.addEventListener('click', function(e) {
        e.preventDefault();
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
        fetchInventoryData().then(() => {
            setTimeout(() => { this.innerHTML = originalText; }, 500);
        });
    });
}

// ==========================================
// 4. INTEGRASI LOGIKA PENCARIAN FORM & KERANJANG (TRANSAKSI)
// ==========================================
let previewLabel, cartContainer;

function inisialisasiElemenKeranjang() {
    const searchGroup = document.querySelector('.search-item-group');
    const addGroup = document.querySelector('.add-item-group');

    if (searchGroup && !document.getElementById('tx-product-preview')) {
        previewLabel = document.createElement('div');
        previewLabel.id = 'tx-product-preview';
        previewLabel.style = 'font-size: 12px; margin-top: 4px; font-weight: 500; min-height: 18px; transition: 0.2s;';
        searchGroup.parentNode.insertBefore(previewLabel, searchGroup.nextSibling);
    }

    if (addGroup && !document.getElementById('tx-cart-container')) {
        cartContainer = document.createElement('div');
        cartContainer.id = 'tx-cart-container';
        cartContainer.style = 'margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;';
        addGroup.parentNode.insertBefore(cartContainer, addGroup.nextSibling);
        renderKeranjang();
    }
}

// Logika 1: Cari Barang untuk Transaksi (SKU / Nama)
function cariBarangTransaksi() {
    const txSearchInput = document.querySelector('.search-item-group input');
    if (!txSearchInput) return;

    const keyword = txSearchInput.value.trim().toLowerCase();
    if (!keyword) {
        alert("Silakan ketik SKU atau Nama Barang!");
        return;
    }

    // Pastikan database internal sudah terisi data
    if (globalInventoryData.length === 0) {
        previewLabel.innerHTML = `<span style="color: #e63946;"><i class="fa-solid fa-triangle-exclamation"></i> Database kosong, silakan klik menu "Inventori" dahulu untuk sinkronisasi.</span>`;
        return;
    }

    const barangDitemukan = globalInventoryData.find(item => {
        return (item.id || '').toLowerCase() === keyword || (item.nama || '').toLowerCase().includes(keyword);
    });

    if (barangDitemukan) {
        selectedProduct = barangDitemukan;
        previewLabel.innerHTML = `<span style="color: #2bc47a;"><i class="fa-solid fa-circle-check"></i> Terpilih: <strong>${barangDitemukan.nama}</strong> (${barangDitemukan.id}) | Stok saat ini: ${barangDitemukan.stok}</span>`;
    } else {
        selectedProduct = null;
        previewLabel.innerHTML = `<span style="color: #e63946;"><i class="fa-solid fa-circle-xmark"></i> Barang tidak ditemukan di database.</span>`;
    }
}

// Logika 2: Masukkan ke Dalam Keranjang
function tambahKeKeranjang() {
    if (!selectedProduct) {
        alert("Pilih barang terlebih dahulu dengan mengetik SKU/Nama lalu tekan Enter/ikon cari!");
        return;
    }

    const qtyInput = document.querySelector('.qty-input input');
    const qty = parseInt(qtyInput ? qtyInput.value : 1);

    if (isNaN(qty) || qty <= 0) {
        alert("Jumlah (Qty) barang harus valid dan minimal 1!");
        return;
    }

    // Validasi aturan Maksimal 5 jenis barang berbeda (Sesuai tulisan di UI)
    const indexDiKeranjang = transactionCart.findIndex(item => item.id === selectedProduct.id);
    if (indexDiKeranjang === -1 && transactionCart.length >= 5) {
        alert("Batas maksimal dalam 1 transaksi hanya boleh 5 jenis barang!");
        return;
    }

    if (indexDiKeranjang > -1) {
        transactionCart[indexDiKeranjang].qty += qty;
    } else {
        transactionCart.push({
            id: selectedProduct.id,
            nama: selectedProduct.nama,
            stok: selectedProduct.stok,
            qty: qty
        });
    }

    // Reset kolom input pilihan barang agar siap menscan produk berikutnya
    const txSearchInput = document.querySelector('.search-item-group input');
    if (txSearchInput) txSearchInput.value = '';
    if (qtyInput) qtyInput.value = 1;
    selectedProduct = null;
    if (previewLabel) previewLabel.innerHTML = '';

    renderKeranjang();
}

// Logika 3: Render Tampilan UI Keranjang
function renderKeranjang() {
    if (!cartContainer) return;

    if (transactionCart.length === 0) {
        cartContainer.innerHTML = `<p style="text-align:center; font-size:12px; color:#94a3b8; margin:0;"><i class="fa-solid fa-basket-shopping"></i> Daftar barang transaksi masih kosong.</p>`;
        return;
    }

    let html = `<h4 style="font-size:12px; margin:0 0 8px 0; color:#475569; font-weight:600;"><i class="fa-solid fa-list-ol"></i> Daftar Barang Dipilih (${transactionCart.length}/5):</h4>`;
    html += `<ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:6px;">`;

    transactionCart.forEach((item, index) => {
        html += `
            <li style="display:flex; justify-content:space-between; align-items:center; background:#ffffff; padding:8px 10px; border-radius:6px; border:1px solid #e2e8f0; font-size:13px;">
                <div>
                    <strong style="color:#1e293b; display:block;">${item.nama}</strong>
                    <span style="font-size:11px; color:#94a3b8;">SKU: ${item.id} | Stok: ${item.stok}</span>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-weight:bold; color:#4361ee; font-size:14px;">x${item.qty}</span>
                    <button onclick="hapusItemKeranjang(${index})" style="background:none; border:none; color:#e63946; cursor:pointer; font-size:14px;" title="Hapus"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </li>
        `;
    });
    html += `</ul>`;
    cartContainer.innerHTML = html;
}

// Logika 4: Aksi Hapus Item dari Keranjang
window.hapusItemKeranjang = function(index) {
    transactionCart.splice(index, 1);
    renderKeranjang();
};

// Logika 5: Submit & Kirim Keranjang ke Google Sheets API
async function simpanSeluruhTransaksi() {
    if (transactionCart.length === 0) {
        alert("Gagal Menyimpan! Tambahkan minimal 1 barang ke dalam daftar transaksi.");
        return;
    }

    const tipe = document.getElementById('tipe-transaksi').value; // 'in' atau 'out'
    let applicant = "", noPo = "", supplier = "", section = "";

    if (tipe === 'in') {
        applicant = document.querySelector('#form-in-fields input[placeholder="Nama pemohon"]')?.value || "";
        noPo = document.querySelector('#form-in-fields input[placeholder="Nomor PO"]')?.value || "";
        supplier = document.querySelector('#form-in-fields input[placeholder="Nama Supplier"]')?.value || "";
    } else {
        section = document.querySelector('#form-out-fields input[placeholder="Misal: Gudang A"]')?.value || "";
        applicant = document.querySelector('#form-out-fields input[placeholder="Nama pemohon"]')?.value || "";
    }

    const keterangan = document.querySelector('textarea[placeholder="Catatan opsional..."]')?.value || "";
    const btnSave = document.querySelector('.btn-save-transaksi');

    // Menghimpun payload data JSON
    const payload = {
        action: "saveTransaction",
        tipe: tipe === 'in' ? 'MASUK' : 'KELUAR',
        applicant: applicant,
        no_po: noPo,
        supplier: supplier,
        section: section,
        keterangan: keterangan,
        items: transactionCart
    };

    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    btnSave.disabled = true;

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        alert("Sukses! Transaksi Anda berhasil dicatat ke Google Sheets.");

        // Pembersihan (Reset Form) setelah sukses
        transactionCart = [];
        renderKeranjang();
        document.querySelectorAll('.page-section input[type="text"]').forEach(input => input.value = '');
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.value = '';

        // Otomatis perbarui data angka di halaman dashboard
        fetchDashboardData();
        fetchInventoryData();

    } catch (error) {
        console.error("Gagal menyimpan transaksi:", error);
        alert("Ada gangguan koneksi saat menyimpan transaksi ke Google Sheets.");
    } finally {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
    }
}

// Shortcut Tombol Aksi Cepat dari Baris Tabel Inventori
window.transaksiCepatBarang = function(sku) {
    const menuTransaksi = document.getElementById('menu-transaksi');
    if (menuTransaksi) menuTransaksi.click();
    
    setTimeout(() => {
        const txSearchInput = document.querySelector('.search-item-group input');
        if (txSearchInput) {
            txSearchInput.value = sku;
            cariBarangTransaksi();
        }
    }, 150);
};

// ==========================================
// 5. EVENT BINDING & PASANG EVENT LISTENER FORM
// ==========================================
function setupEventListenersForm() {
    const txSearchInput = document.querySelector('.search-item-group input');
    const txSearchBtn = document.querySelector('.btn-search-item');
    const txAddBtn = document.querySelector('.btn-add-list');
    const txSaveBtn = document.querySelector('.btn-save-transaksi');

    if (txSearchInput) {
        txSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                cariBarangTransaksi();
            }
        });
    }
    if (txSearchBtn) txSearchBtn.addEventListener('click', (e) => { e.preventDefault(); cariBarangTransaksi(); });
    if (txAddBtn) txAddBtn.addEventListener('click', (e) => { e.preventDefault(); tambahKeKeranjang(); });
    if (txSaveBtn) txSaveBtn.addEventListener('click', (e) => { e.preventDefault(); simpanSeluruhTransaksi(); });
}

// ==========================================
// 6. LOGIKA DARK MODE & PROFIL UTILITY
// ==========================================
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;
const themeIcon = themeToggleBtn?.querySelector('i');

if (localStorage.getItem('theme') === 'light' && themeIcon) {
    body.classList.add('light-mode');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
}

themeToggleBtn?.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    if (body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        localStorage.setItem('theme', 'dark');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
});

const profileMenu = document.getElementById('profile-menu');
const dropdownMenu = document.getElementById('dropdown-menu');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userName = document.getElementById('user-name');
const userRole = document.getElementById('user-role');

profileMenu?.addEventListener('click', (e) => {
    if (e.target.closest('.dropdown-menu') === null) {
        dropdownMenu.classList.toggle('active');
    }
});

document.addEventListener('click', (e) => {
    if (profileMenu && !profileMenu.contains(e.target)) {
        dropdownMenu.classList.remove('active');
    }
});

btnLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    userName.innerText = "Admin Inventory";
    userRole.innerText = "Super Admin";
    userRole.style.backgroundColor = "rgba(16, 185, 129, 0.2)"; 
    userRole.style.color = "var(--color-green)";
    btnLogin.style.display = "none";
    btnLogout.style.display = "flex";
    dropdownMenu.classList.remove('active');
});

btnLogout?.addEventListener('click', (e) => {
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
// 7. SAKLAR PERPINDAHAN SECTIONS (NAVIGASI)
// ==========================================
function toggleFormTransaksi() {
    const tipe = document.getElementById('tipe-transaksi').value;
    const formIn = document.getElementById('form-in-fields');
    const formOut = document.getElementById('form-out-fields');
    if (formIn && formOut) {
        formIn.style.display = (tipe === 'in') ? 'block' : 'none';
        formOut.style.display = (tipe === 'out') ? 'block' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const menuDashboard = document.getElementById('menu-dashboard'); 
    const menuInventori = document.getElementById('menu-inventori'); 
    const menuTransaksi = document.getElementById('menu-transaksi'); 
    
    const sectionDashboard = document.getElementById('dashboard-section');
    const sectionInventori = document.getElementById('inventori-section');
    const sectionTransaksi = document.getElementById('transaksi-section'); 
    const pageTitle = document.getElementById('page-title');

    function switchPage(page) {
        [menuDashboard, menuInventori, menuTransaksi].forEach(m => m?.classList.remove('active'));
        [sectionDashboard, sectionInventori, sectionTransaksi].forEach(s => s?.classList.remove('active'));

        if (page === 'dashboard') {
            sectionDashboard?.classList.add('active');
            menuDashboard?.classList.add('active');
            if (pageTitle) pageTitle.innerText = "Dashboard";
        } else if (page === 'inventori') {
            sectionInventori?.classList.add('active');
            menuInventori?.classList.add('active');
            if (pageTitle) pageTitle.innerText = "Manajemen Inventori";
            fetchInventoryData(); 
        } else if (page === 'transaksi') {
            sectionTransaksi?.classList.add('active');
            menuTransaksi?.classList.add('active');
            if (pageTitle) pageTitle.innerText = "Transaksi Barang";
            
            // Inisialisasi Elemen & Event Listener Keranjang saat Halaman Transaksi Dibuka
            inisialisasiElemenKeranjang();
            setupEventListenersForm();
        }
    }

    if (menuDashboard) menuDashboard.addEventListener('click', (e) => { e.preventDefault(); switchPage('dashboard'); });
    if (menuInventori) menuInventori.addEventListener('click', (e) => { e.preventDefault(); switchPage('inventori'); });
    if (menuTransaksi) menuTransaksi.addEventListener('click', (e) => { e.preventDefault(); switchPage('transaksi'); });

    // Pemuatan Awal Data Dashboard saat Aplikasi Dibuka
    fetchDashboardData();
    // Tarik database produk di latar belakang agar fitur pencarian form langsung siap pakai
    fetch(API_URL).then(res => res.json()).then(data => { globalInventoryData = data.barang || []; }).catch(err => console.log(err));
});

// Penunjang Tombol Ekspor CSV
const btnExport = document.getElementById('btnExport');
if (btnExport) {
    btnExport.addEventListener('click', function(e) {
        e.preventDefault();
        if (globalInventoryData.length === 0) { alert("Tidak ada data untuk diexport!"); return; }
        let csvContent = "SKU,Nama Barang,Kategori,Lokasi,Stok,Min Stok\n";
        globalInventoryData.forEach(item => {
            const nama = `"${item.nama || ''}"`; 
            csvContent += `${item.id},${nama},${item.kategori},${item.lokasi},${item.stok},${item.min}\n`;
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", "Data_Inventori.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

function editBarang(sku, nama) {
    alert(`Modul Edit Barang:\nNama: ${nama}\nSKU: ${sku}`);
}