// --- MASUKKAN URL GOOGLE APPS SCRIPT ANDA DI SINI ---
// Pastikan URL diakhiri dengan /exec
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbw1PQint5ujLAONiovS7kTVvBzcK-tyukOYFvtkhzsGsSZ7zvseTORs8OIduC8CqgFS/exec"; 

document.addEventListener("DOMContentLoaded", () => {
    fetchData();

    // Event listener untuk tombol refresh
    document.getElementById("btn-refresh").addEventListener("click", () => {
        fetchData();
    });
});

async function fetchData() {
    const tableBody = document.getElementById("table-body");
    
    // UI Loading state
    document.getElementById("total-barang").innerText = "...";
    document.getElementById("stok-rendah").innerText = "...";
    document.getElementById("transaksi-hari-ini").innerText = "...";
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">Mengambil data dari server...</td></tr>`;

    try {
        // PERHATIAN: Jika URL GAS belum ada, ini menggunakan Data Dummy untuk preview desain
        if (GAS_API_URL === "URL_APPSCRIPT_ANDA_DISINI") {
            loadDummyData();
            return;
        }

        const response = await fetch(GAS_API_URL);
        const data = await response.json();
        
        updateDashboard(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--accent-red);">Gagal memuat data. Periksa koneksi API.</td></tr>`;
    }
}

function updateDashboard(data) {
    // 1. Update Statistik
    document.getElementById("total-barang").innerText = data.total_barang || 0;
    document.getElementById("stok-rendah").innerText = data.stok_rendah || 0;
    document.getElementById("transaksi-hari-ini").innerText = data.transaksi_hari_ini || 0;

    // 2. Update Tabel Transaksi
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = ""; // Bersihkan tabel

    if (!data.transaksi || data.transaksi.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">Belum ada transaksi terbaru</td></tr>`;
        return;
    }

    data.transaksi.forEach(trx => {
        const isKeluar = trx.kategori === "KELUAR";
        const badgeClass = isKeluar ? "badge keluar" : "badge masuk";
        const qtyClass = isKeluar ? "qty-keluar" : "qty-masuk";
        const qtyPrefix = isKeluar ? "-" : "+";

        const row = `
            <tr>
                <td>
                    <div><i class="fa-regular fa-calendar" style="color: var(--accent-blue);"></i> ${trx.tanggal}</div>
                </td>
                <td>
                    <strong>${trx.nama_barang}</strong><br>
                    <small style="color: var(--text-secondary);">ID: ${trx.id}</small>
                </td>
                <td><span class="${badgeClass}">${trx.kategori}</span></td>
                <td class="${qtyClass}">${qtyPrefix}${trx.qty}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// Fungsi ini hanya berjalan jika Anda belum memasukkan URL GAS yang asli
function loadDummyData() {
    const dummyData = {
        total_barang: 45,
        stok_rendah: 2,
        transaksi_hari_ini: 5,
        transaksi: [
            { tanggal: "26/05/2026", id: "2", nama_barang: 'Pipa PVC 4"', kategori: "KELUAR", qty: 2 },
            { tanggal: "26/05/2026", id: "1", nama_barang: 'Pipa PVC 3"', kategori: "MASUK", qty: 3 },
            { tanggal: "25/05/2026", id: "2", nama_barang: 'Pipa PVC 4"', kategori: "KELUAR", qty: 3 }
        ]
    };
    
    setTimeout(() => {
        updateDashboard(dummyData);
    }, 800); // Simulasi delay jaringan
}