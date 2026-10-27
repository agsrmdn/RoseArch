# Panduan Tema "Relief" (Undangan Pernikahan)

Tema: nude champagne, bunga timbul (relief), pintu pembuka, bingkai lengkung yang tetap diam,
isi berganti dengan efek blur-pudar. Mobile-first. Backend (Supabase, RSVP, ucapan, balasan,
kalender, peta, musik) tetap dikerjakan `js/core.js` dan TIDAK diubah.

## Struktur file
```
index.html              kerangka & teks tetap (tiap bab = satu <section class="bab">)
css/style.css           seluruh tampilan (ada daftar isi di bagian atas file)
js/konfigurasi.js       SEMUA data per klien (slug, jam, palet, foto, cerita, rekening, live, galeri)
js/core.js              backend & logika (jangan diubah)
js/tema-konten.js       mengisi bab dari konfigurasi.js (cerita, galeri, hadiah, live, RSVP)
js/tema-minimalist.js   pintu, transisi antar bab, menu, gestur
assets/                 relief-*.webp + tekstur-plester.webp (ornamen 3D) + foto klien + musik.mp3 (lihat assets/BACA-SAYA.txt)
alat/buat-relief.py     (opsional) pembuat gambar relief 3D (pencahayaan fisik: bayangan, kilau, kedalaman)
admin.html, _headers, robots.txt   tidak berubah
```

## Tempat Anda mengubah tema (cari tulisan "UBAH DI SINI")
| Ingin mengubah | Lokasi |
|---|---|
| **Warna seluruh tema** | `js/konfigurasi.js` > `tema.palet` (champagne / sage / mocha / biru). Warna sendiri: `css/style.css` bagian 0, salin satu blok palet. Relief & pintu ikut berubah otomatis. |
| **Font** | `index.html` (link Google Fonts) + variabel `--serif` di `css/style.css` bagian 1 |
| **Hidup/matikan bagian** | `js/konfigurasi.js` > `tema.bagian` (cerita, lokasi, live, galeri, hadiah, rsvp, ucapan) |
| **Nama bab / urutan bab** | `index.html`: atribut `data-bab` dan urutan `<section class="bab">` |
| **Teks pembuka, salam, penutup** | `index.html` (di dalam bab terkait) |
| **Ayat** | `js/konfigurasi.js` > `tema.ayat` |
| **Foto mempelai, perjalanan, galeri** | `js/konfigurasi.js` > `tema.foto`, `tema.cerita[].foto`, `tema.galeri` (file di `assets/`) |
| **Perjalanan Kami** | `js/konfigurasi.js` > `tema.cerita` (tambah/kurangi baris) |
| **Rangkaian acara, dress code, nama tempat** | `js/konfigurasi.js` > `tema.rundown`, `tema.dresscode`, `tema.lokasi.nama` |
| **Rekening / alamat kado** | `js/konfigurasi.js` > `tema.hadiah` |
| **Siaran langsung** | `js/konfigurasi.js` > `tema.live.url` (YouTube bisa diputar langsung) |
| **Batas konfirmasi RSVP** | `js/konfigurasi.js` > `tema.rsvp.batas` ("2026-12-25") |
| **Kecepatan/gaya transisi** | `css/style.css` bagian 5 (blur, durasi, jeda) + `DURASI_KELUAR` di `js/tema-minimalist.js` (harus sama) |
| **Kecepatan pintu** | `css/style.css` bagian 3 (`.daun transition`) + `DURASI_PINTU` di `js/tema-minimalist.js` |
| **Ukuran/posisi bunga di pojok** | `css/style.css` bagian 2 (`.sudut`) |
| **Bentuk bingkai lengkung** | `index.html`: dua `<path>` di dalam `#arch-garis` |
| **Motif relief** | ganti `assets/relief-*.webp` (atau jalankan `alat/buat-relief.py`) |


## Pintu 3D, musik, dan animasi (baru)
| Ingin mengubah | Lokasi |
|---|---|
| **Kecepatan pintu terbuka** | `css/style.css` bagian 3: variabel `--lama-pintu` (2.6s) + `DURASI_PINTU` di `js/tema-minimalist.js` (harus sama, dalam ms) |
| **Seberapa jauh kamera maju** | `css/style.css` bagian 3: `#pintu.buka .adegan { scale: 1.2 }` |
| **Seberapa gelap interior / pintu kanan** | `#gelap-dalam`, dan `.redup` (opacity pintu kiri 0.38, kanan 0.88) di bagian 3 |
| **Tebal pintu** | `.sisi { width: 22px }` di bagian 3 |
| **Musik langsung putar saat pintu dibuka** | otomatis (ketukan tamu = izin browser). Naik pelan dari senyap: `DURASI_FADE_MUSIK` di `js/tema-minimalist.js`; volume akhir: `volumeLagu` di `js/konfigurasi.js` |
| **Tampilan kontrol musik** | `css/style.css` bagian "KONTROL MUSIK" (cakram + equalizer + label kecil). Tanpa berkas `assets/musik.mp3`, kontrol otomatis disembunyikan. |
| **Kehalusan pindah bab** | `css/style.css` bagian 5 (durasi, blur 8px) + `DURASI_KELUAR` di `js/tema-minimalist.js` (bab baru mulai muncul saat bab lama masih memudar) |
| **Tekstur plester** | `assets/tekstur-plester.webp` (dipakai di latar & pintu), `opacity` di `#latar::before` dan `.muka::after` |

Catatan performa HP: pintu memakai `transform`/`opacity` (dipercepat GPU). Total aset gambar sekitar 1 MB dan
`relief-pintu.webp` sudah di-preload. Jika ingin lebih ringan di HP lawas, kecilkan ukuran/kualitas gambar
lewat `alat/buat-relief.py` (parameter `q=` dan ukuran W,H di bagian bawah file).

## Animasi berurutan, judul terkunci, tanggal & tipografi (V4)
| Ingin mengubah | Lokasi |
|---|---|
| **Urutan & kecepatan muncul (elemen/kata satu per satu)** | `js/tema-minimalist.js` bagian "Animasi berurutan": `JEDA_BLOK`, `JEDA_KATA_MAKS`, `BATAS_TOTAL` (ms). Elemen mana yang dianimasikan: daftar `SEL_TEKS` (dipecah per kata) dan `SEL_BLOK` (muncul utuh) di file yang sama. |
| **Arah & gaya gerak muncul** | `css/style.css` bagian E: `@keyframes geser-masuk` / `geser-kata` (`translateX(22px)` = dari kanan; ganti jadi `-22px` untuk dari kiri) |
| **Posisi judul yang terkunci** | `css/style.css` bagian A: `--judul-y` (18% dari atas bingkai) dan `--judul-tinggi` |
| **Bentuk area isi (teks tetap di dalam relief)** | `<clipPath id="klip-arch">` di `index.html` (bagian sprite SVG di atas). Makin kecil skalanya, makin menjauh dari molding. |
| **Bingkai tanggal & jam** | HTML: bab "Hari Bahagia" di `index.html`; gambar bingkai: `assets/relief-kartus-besar.webp` & `relief-kartus-kecil.webp`; ukuran: `.kartus-besar` / `.kartus-kecil` di `css/style.css` bagian C |
| **Jam acara yang tampil** | `js/konfigurasi.js` > `acara.jam`, `acara.menit`, `acara.zona` (WIB/WITA/WIT otomatis) |
| **Hitung mundur** | bab "Hitung Mundur" di `index.html`; kutipannya di `js/konfigurasi.js` > `tema.kutipan`; gaya di `css/style.css` bagian D |
| **Font / tipografi** | `css/style.css` bagian B. Judul & teks = Cormorant Garamond; label = Cormorant SC (kapital kecil); angka sejajar (lining). Tautan font: `index.html`. |

## Cara mengaktifkan Siaran Langsung & Hadiah, tombol musik, footer (V5)
| Ingin | Caranya |
|---|---|
| **Mengaktifkan Siaran Langsung** | `js/konfigurasi.js` > `tema.live.url`: isi tautan YouTube/Zoom/Instagram. Selama kosong, bab ini disembunyikan. |
| **Mengaktifkan Hadiah** | `js/konfigurasi.js` > `tema.hadiah.rekening`: hapus tanda `//` di contoh lalu isi bank, nomor, nama. Atau isi `tema.hadiah.alamat` untuk alamat kado. |
| **Melihat tampilannya dulu (pamer ke klien)** | Tambahkan `?demo=1` di akhir alamat, mis. `http://127.0.0.1:5500/index.html?demo=1`. Live & Hadiah muncul dengan data contoh. |
| **Mematikan paksa** | `tema.bagian.live: false` / `tema.bagian.hadiah: false` |
| **Footer Wedding Code** | `js/konfigurasi.js` > `tema.kredit`. Tautan ditulis DI DALAM teks tagline dengan tanda kurung siku: `kunjungi kami [di sini] untuk pemesanan` lalu isi `website`. Varian: `[teks](wa)`, `[teks](ig)`, `[teks](https://...)`. Tinggi footer otomatis menyesuaikan sehingga tidak tumpang tindih. `tampil: false` menghapus footer. Gaya: `css/style.css` bagian V5-C. |
| **Pelat nama tamu di sampul** | `index.html` (blok `.pelat-tamu`), gambar `assets/relief-pelat-tamu.webp`, gaya `css/style.css` V5-A |
| **Tombol musik bunga** | gambar `assets/relief-bunga-musik.webp`; kecepatan putar/mekar di `css/style.css` V5-B (`9s` dan `3.4s`) |

## Data per klien (backend, tidak berubah)
- `slug` + jam acara + zona waktu: `js/konfigurasi.js` (bagian atas).
- Nama, tanggal, lokasi, link peta: tabel `pasangan` di Supabase (diisi lewat `admin.html`).
- Ucapan & RSVP masuk ke `ucapan_tamu` (nama, kehadiran, ucapan); balasan ke `balasan_ucapan`.
- Nama tamu di pintu: dari alamat `?to=Nama%20Tamu` (dibuat otomatis oleh `admin.html`).

## Cek sebelum dikirim ke klien
1. Ganti `slug`, foto, cerita, rekening di `js/konfigurasi.js`; taruh `assets/musik.mp3`.
2. Buka dengan Live Server di HP/DevTools mode ponsel; tekan `Ctrl+Shift+R` agar cache bersih.
3. Coba kirim satu RSVP, balas satu ucapan, dan tombol kalender/peta.
