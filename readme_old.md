# Dokumen Spesifikasi Fitur - Aplikasi Manajemen Bengkel Mobil (Bengkel Pro)

Dokumen ini berisi spesifikasi kebutuhan sistem (*System Requirement Specification*) untuk pengembangan website manajemen operasional bengkel mobil.

---

## 1. Modul Manajemen Akses & Pengguna (RBAC)
Sistem menggunakan pendekatan *Role-Based Access Control* (RBAC) yang dinamis untuk memastikan keamanan dan fleksibilitas pembagian tugas staf.

- Autentikasi Multi-User:** Login terpusat untuk Admin, Super User (Owner), Kasir, Gudang, dan Mekanik.
- Dynamic Menu & Permission Matrix:** Super User dapat mengatur secara spesifik hak akses setiap *user* hingga tingkat aksi (*Create, Read, Update, Delete*) per halaman menu.
- Manajemen Karyawan:** Pemetaan akun pengguna ke data internal karyawan untuk keperluan *tracking* produktivitas.

---

## 2. Modul Master Data

### 2.1. Master Pelanggan & Kendaraan (Relasi 1-to-N)
- Data Pelanggan:** Menyimpan informasi personal seperti ID Pelanggan, Nama, No. WhatsApp/Telepon, dan Alamat.
- Data Kendaraan Pelanggan:** Satu pelanggan dapat memiliki lebih dari satu mobil. Data yang disimpan meliputi:
    * Nomor Polisi (Plat Nomor - *Unique Key*)
    * Brand (Toyota, Honda, Mitsubishi, dll)
    * Nama/Model Mobil (Avanza, Civic, Xpander, dll)
    * Tahun Pembuatan & Transmisi (Manual/Matic)
    * Nomor Rangka & Nomor Mesin (Opsional)
- View Riwayat Servis (Riwayat Terintegrasi):** Pada profil pelanggan terdapat tab yang menampilkan seluruh riwayat transaksi, catatan keluhan, *sparepart* yang pernah diganti, dan mekanik yang menangani tanpa perlu menginput manual.

### 2.2. Master Produk & Jasa
- Item Handling Type:** Pembedaan tegas antara item bertipe **Sparepart** (memiliki fisik dan stok) dan **Jasa** (tidak memiliki stok, contoh: Jasa Tune Up, Jasa Pasang Rem).
- Atribut Produk:** Kode Item (SKU), Nama Produk/Jasa, Kategori, Harga Beli (untuk HPP Sparepart), Harga Jual/Tarif Jasa, dan Batas Minimum Stok (*Minimum Stock Alert*).

---

## 3. Modul Manajemen Stok (Inventory)
- Pencatatan Stok Real-time:** Stok *sparepart* otomatis berkurang ketika transaksi selesai dibayar, dan otomatis bertambah jika ada pembatalan transaksi.
- Manajemen Barang Masuk (Restock):** Input manual pembongkaran muatan/pembelian *sparepart* dari *supplier* untuk memperbarui jumlah stok dan harga modal (HPP).
- Notifikasi Stok Menipis:** Indikator visual di dashboard jika stok produk berada di bawah batas minimum yang ditentukan.

---

## 4. Modul Operasional & Alur Kerja Servis

### 4.1. Booking Service (Reservasi)
- Form Penjadwalan:** Input tanggal kedatangan, estimasi jam, data pelanggan & kendaraan, serta keluhan awal.
- Status Booking Tracking:** Pemantauan status reservasi mulai dari *Pending* (Menunggu Konfirmasi), *Confirmed* (Diterima), *Selesai*, atau *Cancelled* (Batal).

### 4.2. Work Order (Perintah Kerja Bengkel)
- Form Kendaraan Masuk:** Konversi dari data Booking atau input langsung untuk pelanggan *walk-in*.
- Penugasan Mekanik:** Penunjukan mekanik yang bertanggung jawab menangani kendaraan tersebut.
- Draft Estimasi:** Pencatatan keluhan konsumen, hasil diagnosa awal, serta estimasi *sparepart* yang dibutuhkan beserta jasa perbaikan.

### 4.3. Transaksi & Kasir (Invoice)
- Finalisasi Work Order:** Kasir menarik data Work Order yang sudah dinyatakan selesai oleh mekanik.
- Penyesuaian Akhir:** Kemampuan mengubah atau menambah *sparepart/jasa* jika ada perubahan riil di lapangan atas persetujuan pelanggan.
- Metode Pembayaran:** Mendukung Tunai, Transfer Bank, Debit/Kredit, dan QRIS.
- Cetak Invoice:** Sinkronisasi ke printer termal untuk nota fisik pelanggan.

---

## 5. Modul Pencatatan Keuangan (Cashflow)
- Pemasukan Otomatis:** Setiap transaksi kasir yang berstatus *Lunas* otomatis masuk sebagai arus kas masuk (*Cash Inflow*).
- Pengeluaran Manual (Cash Outflow):** Form khusus untuk mencatat beban biaya operasional bengkel, seperti:
    * Pembelian stok ke *supplier*
    * Gaji/Komisi mekanik dan staf
    * Biaya utilitas (Listrik, air, internet, sewa gedung, operasional harian)
- Jurnal Kas:** Rekap harian sisa saldo kas bengkel.

---

## 6. Laporan & Dashboard (Reporting)
- Ringkasan Eksekutif (Dashboard):** Grafik pendapatan bulanan, jumlah unit mobil yang diservis hari ini, dan daftar antrean booking terdekat.
- Laporan Penjualan & Jasa:** Laporan detail produk/jasa apa saja yang paling laris dan memberikan profit tertinggi.
- Laporan Arus Kas:** Laporan laba-rugi kotor berdasarkan selisih pemasukan operasional dan pengeluaran harian.

---

## 7. CUSTOMER SELF-SERVICE MODULE
- Registrasi Mandiri: Pelanggan mendaftarkan data diri via No. WhatsApp.
- Vehicle Auto-Link: Sistem otomatis mendaftarkan kendaraan baru ke profil pelanggan saat booking pertama kali.
- Intelligent Booking: Input tanggal, jam, tipe mobil, dan keluhan secara real-time.
- Status Tracking: Booking masuk ke Dashboard Admin dengan status 'PENDING' untuk divalidasi oleh Admin/Kasir.
- Audit Trail: User created ditandai sebagai 'SELF_SERVICE' untuk membedakan inputan internal vs eksternal.
