// ==========================================
// 1. KONFIGURASI API & STATE GLOBAL
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbyPrlCNCf0Qb5pj71G_9YSx_-aD7hOVzpMN8h_9slDk3eCzJgqOVdOjndu9QmdWEyc5/exec";

// Brankas Penyimpanan Data Utama
let globalInventoryData = [];       // Menyimpan database semua barang dari Sheets
let transactionCart = [];           // Menyimpan daftar barang yang masuk keranjang transaksi
let selectedProduct = null;         // Menyimpan data produk yang sedang terpilih dari dropdown
let base64PhotoData = "";           // Menyimpan string base64 foto bukti transaksi

// ==========================================
// 2. LOGIKA DASHBOARD (Data Ringkasan)
// ==========================================
async function fetchDashboardData() {
    document.getElementById('total-barang').innerText = '...';
    document.getElementById('stok-rendah').innerText = '...';
    document.getElementById('transaksi-hari-ini').innerText = '...';
    
    const tabelBody = document.getElementById('transaction-table-body');
    if (tabelBody) {
        tabelBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Memuat data dari server...</td></tr>`;
    }

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // Simpan database barang ke global secara otomatis saat ambil data dashboard
        if (data.barang) globalInventoryData = data.barang;

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
                        const qtyText = isKeluar 
                            ? `<span class="qty-out" style="color: #e63946; font-weight: bold;">-${trx.qty}</span>` 
                            : `<span class="qty-in" style="color: #2bc47a; font-weight: bold;">+${trx.qty}</span>`;

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
        console.error("Gagal mengambil data Dashboard:", error);
        document.getElementById('total-barang').innerText = 'Err';
        document.getElementById('stok-rendah').innerText = 'Err';
        document.getElementById('transaksi-hari-ini').innerText = 'Err';
        if (tabelBody) tabelBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: #e63946;">Gagal terhubung ke database.</td></tr>`;
    }
}

document.getElementById('btn-refresh')?.addEventListener('click', fetchDashboardData);

// ==========================================
// 3. LOGIKA INVENTORI (Tabel Stok)
// ==========================================
async function fetchInventoryData() {
    const tbody = document.getElementById('tabel-inventori-body');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">Memuat data...</td></tr>`;

    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        
        globalInventoryData = rawData.barang || [];
        renderTable(globalInventoryData);

    } catch (error) {
        console.error("Gagal sinkronisasi data Inventori:", error);
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
        const stok = parseInt(item.stok || 0);
        const min = parseInt(item.min || 0);
        const isRendah = stok <= min;
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
                <td style="color: #475569; vertical-align: middle;">${item.kategori || '-'}</td>
                <td style="color: #475569; vertical-align: middle;">${item.lokasi || '-'}</td>
                <td style="vertical-align: middle;">
                    <div style="display: flex; align-items: baseline; gap: 4px;">
                        <span style="${stokColor}; font-size: 15px;">${stok}</span>
                        <span style="color: #94a3b8; font-size: 12px;">/ Min: ${min}</span>
                    </div>
                    <div style="width: 100px; height: 5px; background: #f1f5f9; border-radius: 3px; margin-top: 6px; overflow: hidden;">
                        <div style="width: ${stok > 0 ? '100%' : '0%'}; height: 100%; background: ${progressColor};"></div>
                    </div>
                </td>
                <td style="vertical-align: middle;"><span style="${badgeStyle}">${isRendah ? 'RENDAH' : 'AMAN'}</span></td>
                <td style="vertical-align: middle; font-size: 16px;">
                    <a href="#" onclick="alert('Fitur edit menyusul')" style="color: #4361ee; margin-right: 12px;" title="Edit"><i class="fa-solid fa-pen-to-square"></i></a>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = rows;
}

document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filteredData = globalInventoryData.filter(item => 
        (item.nama || '').toLowerCase().includes(keyword) || (item.id || '').toLowerCase().includes(keyword)
    );
    renderTable(filteredData);
});

document.getElementById('btnSync')?.addEventListener('click', function(e) {
    e.preventDefault();
    const originalText = this.innerHTML;
    this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
    fetchInventoryData().then(() => { setTimeout(() => { this.innerHTML = originalText; }, 500); });
});

// ==========================================
// 4. LOGIKA TRANSAKSI (Cari, Keranjang, Upload, Submit)
// ==========================================

// A. Pencarian Live Dropdown
function initFungsiPencarianBarang() {
    const inputSearch = document.getElementById('txSearchInput');
    const dropdown = document.getElementById('searchDropdown');

    if (!inputSearch || !dropdown) return;

    inputSearch.addEventListener('input', function() {
        const keyword = this.value.trim().toLowerCase();
        
        if (!keyword) {
            dropdown.style.display = 'none';
            return;
        }

        const hasilFilter = globalInventoryData.filter(item => {
            return (item.nama || '').toLowerCase().includes(keyword) || (item.id || '').toLowerCase().includes(keyword);
        });

        if (hasilFilter.length === 0) {
            dropdown.innerHTML = `<div style="padding: 10px; text-align: center; color: #94a3b8; font-size: 13px;">Barang tidak ditemukan</div>`;
        } else {
            let htmlItems = '';
            hasilFilter.forEach(item => {
                htmlItems += `
                    <div style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;"
                         onclick="pilihItemDariDropdown('${item.id}', '${item.nama.replace(/'/g, "\\'")}', ${item.stok})">
                        <div>
                            <strong style="display:block; font-size:13px; color: #1e293b;">${item.nama}</strong>
                            <span style="font-size:11px; color:#94a3b8;">SKU: ${item.id}</span>
                        </div>
                        <span style="font-size:12px; font-weight:bold; background:#f1f5f9; padding:2px 8px; border-radius:4px;">Stok: ${item.stok}</span>
                    </div>
                `;
            });
            dropdown.innerHTML = htmlItems;
        }
        dropdown.style.display = 'block';
    });

    // Tutup dropdown jika klik di luar
    document.addEventListener('click', (e) => {
        if (!inputSearch.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// Terpilih dari dropdown
window.pilihItemDariDropdown = function(id, nama, stok) {
    document.getElementById('txSearchInput').value = nama;
    document.getElementById('searchDropdown').style.display = 'none';
    
    selectedProduct = { id, nama, stok };
    
    const previewLabel = document.getElementById('tx-product-preview');
    if (previewLabel) {
        previewLabel.innerHTML = `<span style="color: #2bc47a;"><i class="fa-solid fa-circle-check"></i> Terpilih: <strong>${nama}</strong> | Stok Saat Ini: ${stok}</span>`;
    }
};

// B. Tambah ke Keranjang
function tambahKeKeranjang() {
    if (!selectedProduct) {
        alert("Silakan cari dan pilih barang dari dropdown terlebih dahulu!");
        return;
    }

    const qtyInput = document.getElementById('txQtyInput');
    const qty = parseInt(qtyInput ? qtyInput.value : 1);

    if (isNaN(qty) || qty <= 0) {
        alert("Jumlah (Qty) barang harus valid dan minimal 1!");
        return;
    }

    const indexDiKeranjang = transactionCart.findIndex(item => item.id === selectedProduct.id);
    
    if (indexDiKeranjang === -1 && transactionCart.length >= 5) {
        alert("Maksimal 5 jenis barang berbeda dalam 1 transaksi!");
        return;
    }

    if (indexDiKeranjang > -1) {
        transactionCart[indexDiKeranjang].qty += qty;
    } else {
        transactionCart.push({ ...selectedProduct, qty: qty });
    }

    // Reset Form Input Pilihan
    document.getElementById('txSearchInput').value = '';
    if (qtyInput) qtyInput.value = 1;
    document.getElementById('tx-product-preview').innerHTML = '';
    selectedProduct = null;

    renderKeranjang();
}

// C. Render UI Keranjang
function renderKeranjang() {
    let cartContainer = document.getElementById('tx-cart-container');
    
    // Auto-create container jika belum ada di HTML
    if (!cartContainer) {
        const addGroup = document.querySelector('.qty-input') || document.querySelector('.btn-add-list').parentElement;
        if (addGroup) {
            cartContainer = document.createElement('div');
            cartContainer.id = 'tx-cart-container';
            cartContainer.style = 'margin: 16px 0; padding: 12px; background: rgba(0,0,0,0.02); border-radius: 8px; border: 1px dashed var(--border-color);';
            addGroup.parentNode.insertBefore(cartContainer, addGroup.nextSibling);
        }
    }

    if (!cartContainer) return;

    if (transactionCart.length === 0) {
        cartContainer.innerHTML = `<p style="text-align:center; font-size:12px; color:gray; margin:0;"><i class="fa-solid fa-basket-shopping"></i> Daftar barang transaksi kosong.</p>`;
        return;
    }

    let html = `<h4 style="font-size:12px; margin:0 0 8px 0; font-weight:600;">Daftar Barang (${transactionCart.length}/5):</h4>`;
    html += `<ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:6px;">`;

    transactionCart.forEach((item, index) => {
        html += `
            <li style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:8px 10px; border-radius:6px; border:1px solid #ddd; font-size:13px;">
                <div>
                    <strong style="display:block;">${item.nama}</strong>
                    <span style="font-size:11px; color:gray;">SKU: ${item.id} | Stok Sisa: ${item.stok}</span>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-weight:bold; color:#4361ee; font-size:14px;">x${item.qty}</span>
                    <button onclick="hapusItemKeranjang(${index})" style="background:none; border:none; color:#e63946; cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </li>
        `;
    });
    html += `</ul>`;
    cartContainer.innerHTML = html;
}

window.hapusItemKeranjang = function(index) {
    transactionCart.splice(index, 1);
    renderKeranjang();
};

// D. Upload Foto Base-64
function initFungsiUploadFoto() {
    const photoInput = document.getElementById('transaction-photo');
    const previewContainer = document.getElementById('photo-preview-container');
    const previewImg = document.getElementById('photo-preview');

    if (!photoInput) return;

    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) {
            base64PhotoData = "";
            if (previewContainer) previewContainer.style.display = 'none';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            if (previewImg) previewImg.src = event.target.result;
            if (previewContainer) previewContainer.style.display = 'block';
            base64PhotoData = event.target.result.split(',')[1];
        };
        reader.readAsDataURL(file);
    });
}

// E. Submit Data Transaksi
async function simpanSeluruhTransaksi() {
    if (transactionCart.length === 0) {
        alert("Harap masukkan minimal 1 barang ke dalam daftar transaksi.");
        return;
    }

    const tipe = document.getElementById('tipe-transaksi').value; 
    let applicant = "", noPo = "", supplier = "", section = "";

    if (tipe === 'in') {
        applicant = document.querySelector('#form-in-fields input[placeholder="Nama pemohon"]')?.value || "";
        noPo = document.querySelector('#form-in-fields input[placeholder="Nomor PO"]')?.value || "";
        supplier = document.querySelector('#form-in-fields input[placeholder="Nama Supplier"]')?.value || "";
    } else {
        section = document.querySelector('#form-out-fields input[placeholder="Misal: Gudang A"]')?.value || "";
        applicant = document.querySelector('#form-out-fields input[placeholder="Nama pemohon"]')?.value || "";
    }

    const keterangan = document.querySelector('textarea')?.value || "";
    const btnSave = document.querySelector('.btn-save-transaksi');

    const payload = {
        action: "saveTransaction",
        tipe: tipe === 'in' ? 'MASUK' : 'KELUAR',
        applicant: applicant,
        no_po: noPo,
        supplier: supplier,
        section: section,
        keterangan: keterangan,
        photoData: base64PhotoData,
        items: transactionCart
    };

    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btnSave.disabled = true;

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        alert("Sukses! Data transaksi berhasil tersimpan.");

        // Bersihkan Form
        transactionCart = [];
        base64PhotoData = "";
        renderKeranjang();
        
        document.querySelectorAll('.page-section input[type="text"]').forEach(input => input.value = '');
        document.querySelectorAll('.page-section input[type="file"]').forEach(input => input.value = '');
        const previewContainer = document.getElementById('photo-preview-container');
        if (previewContainer) previewContainer.style.display = 'none';
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.value = '';

        // Segarkan Dashboard otomatis
        fetchDashboardData();

    } catch (error) {
        console.error(error);
        alert("Gagal koneksi saat menyimpan data transaksi.");
    } finally {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
    }
}

// Toggle field IN / OUT
document.getElementById('tipe-transaksi')?.addEventListener('change', function() {
    const tipe = this.value;
    const formIn = document.getElementById('form-in-fields');
    const formOut = document.getElementById('form-out-fields');
    if (formIn && formOut) {
        formIn.style.display = (tipe === 'in') ? 'block' : 'none';
        formOut.style.display = (tipe === 'out') ? 'block' : 'none';
    }
});

// ==========================================
// 5. INISIALISASI HALAMAN & NAVIGASI MENU
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const menus = {
        'dashboard': document.getElementById('menu-dashboard'),
        'inventori': document.getElementById('menu-inventori'),
        'transaksi': document.getElementById('menu-transaksi')
    };
    
    const sections = {
        'dashboard': document.getElementById('dashboard-section'),
        'inventori': document.getElementById('inventori-section'),
        'transaksi': document.getElementById('transaksi-section')
    };
    
    const pageTitle = document.getElementById('page-title');

    function switchPage(pageName) {
        Object.values(menus).forEach(m => m?.classList.remove('active'));
        Object.values(sections).forEach(s => s?.classList.remove('active'));

        menus[pageName]?.classList.add('active');
        sections[pageName]?.classList.add('active');

        if (pageName === 'dashboard') {
            if (pageTitle) pageTitle.innerText = "Dashboard";
            fetchDashboardData();
        } else if (pageName === 'inventori') {
            if (pageTitle) pageTitle.innerText = "Manajemen Inventori";
            fetchInventoryData(); 
        } else if (pageName === 'transaksi') {
            if (pageTitle) pageTitle.innerText = "Transaksi Barang";
            renderKeranjang(); // Pastikan form keranjang kosong siap pakai
        }
    }

    Object.keys(menus).forEach(key => {
        menus[key]?.addEventListener('click', (e) => { e.preventDefault(); switchPage(key); });
    });

    // --- SETUP EVENT LISTENER TRANSAKSI SEKALI SAJA SAAT LOAD ---
    document.querySelector('.btn-add-list')?.addEventListener('click', (e) => { e.preventDefault(); tambahKeKeranjang(); });
    document.querySelector('.btn-save-transaksi')?.addEventListener('click', (e) => { e.preventDefault(); simpanSeluruhTransaksi(); });
    
    initFungsiPencarianBarang();
    initFungsiUploadFoto();

    // Pemuatan Awal
    fetchDashboardData();
});

// ==========================================
// 6. DARK MODE & LAIN-LAIN
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
        themeIcon?.classList.replace('fa-moon', 'fa-sun');
    } else {
        localStorage.setItem('theme', 'dark');
        themeIcon?.classList.replace('fa-sun', 'fa-moon');
    }
});

// Export CSV
document.getElementById('btnExport')?.addEventListener('click', function(e) {
    e.preventDefault();
    if (globalInventoryData.length === 0) { alert("Tidak ada data untuk diexport!"); return; }
    let csvContent = "SKU,Nama Barang,Kategori,Lokasi,Stok,Min Stok\n";
    globalInventoryData.forEach(item => {
        csvContent += `${item.id},"${item.nama || ''}",${item.kategori || ''},${item.lokasi || ''},${item.stok},${item.min}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Data_Inventori.csv";
    link.click();
});