// =====================================================================
// KONFIGURASI UNDANGAN  —  satu-satunya file JS yang diedit untuk tiap klien
// (selain teks di index.html dan foto/lagu di folder assets).
// Harus dimuat SEBELUM core.js.
// =====================================================================
window.KONFIG_UNDANGAN = {
  // ---- Koneksi database (sama untuk semua klien) ----
  // HANYA kunci "anon public". JANGAN PERNAH menaruh kunci "service_role" di sini.
  supabaseUrl: "https://nqeclnbrzzmyabgwmpth.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZWNsbmJyenpteWFiZ3dtcHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMzAzNTQsImV4cCI6MjEwNzgwNjM1NH0.cXvgbhJZCtpZVdPTbjoY7qTLyjS3uKZ53HurbTaUulM",

  // ---- Identitas pasangan ----
  // Slug klien, SAMA PERSIS dengan kolom slug di tabel pasangan (huruf kecil, tanda hubung), mis. "aisyah-rizky".
  // Terisi = halaman terkunci pada pasangan itu. Kosong = mode demo (slug dari ?slug= di alamat, atau "demo").
  slug: "",

  // ---- Acara (dipakai hitung mundur dan tombol Simpan ke Kalender) ----
  // Tanggalnya diambil dari database; jam dan zona ditulis di sini.
  // Samakan jam mulai dengan acara pertama di section Acara (mis. Akad 08.00).
  acara: {
    jam: 8,
    menit: 0, // jam mulai (format 24 jam)
    durasiJam: 6, // lama acara di kalender tamu (jam)
    zona: "+07:00", // WIB +07:00 | WITA +08:00 | WIT +09:00
  },

  // Pengingat di Apple Kalender / Outlook (menit sebelum acara). 1440 = H-1, 180 = 3 jam sebelumnya.
  // Google Kalender memakai pengingat bawaan akun tamu.
  pengingatMenit: [1440, 180],

  // Baris tambahan di catatan kalender tamu. Contoh: ["Dress code: Earth tone", "Mohon hadir 15 menit lebih awal"]
  catatanTambahan: [],

  // Kata kunci peta untuk pratinjau. Kosong = pakai kolom lokasi_acara dari database.
  // Bisa nama tempat lengkap ("Gedung Sabuga, Bandung") atau koordinat ("-6.8915,107.6107").
  petaQuery: "",

  // ---- Lagu ----
  volumeLagu: 0.7, // 0 (hening) sampai 1 (penuh)

  // ---- Panel admin ----
  // Keterangan waktu yang ikut masuk ke pesan undangan, mis. "Pukul 08.00 WIB - Selesai". Kosongkan kalau tidak perlu.
  teksWaktuPesan: "",

  // =====================================================================
  // KONTEN TEMA RELIEF  -  isi khusus tiap klien. Semua bagian OPSIONAL.
  // Bagian yang datanya kosong otomatis disembunyikan (cerita, siaran langsung, hadiah).
  // Teks di bawah ini contoh; ganti sesuai klien.
  // =====================================================================
  tema: {
    // UBAH DI SINI: pilihan warna. champagne (bawaan) | sage | mocha | biru
    // (daftar warna & cara membuat palet sendiri ada di css/style.css bagian 0)
    palet: "champagne",

    // UBAH DI SINI: hidupkan / matikan bagian. false = bagian hilang dari undangan.
    // (live & hadiah & cerita juga hilang otomatis bila datanya kosong)
    bagian: {
      cerita: true, // Perjalanan Kami
      lokasi: true, // peta & petunjuk arah
      live: true, // siaran langsung
      galeri: true, // Momen Kami
      hadiah: true, // rekening & alamat kado
      rsvp: true, // formulir konfirmasi kehadiran
      ucapan: true, // daftar ucapan tamu
    },

    // Foto mempelai (rasio ideal 3:4, portrait). Kosong = bingkai siluet bawaan.
    // Taruh file di folder assets/, mis. "assets/mempelai-wanita.jpg".
    foto: { wanita: "/clients/bride.webp", pria: "/clients/groom.webp" },

    // Keterangan orang tua (tampil di bawah nama mempelai)
    orangTua: {
      wanita: "Putri dari Bapak ... & Ibu ...",
      pria: "Putra dari Bapak ... & Ibu ...",
    },

    // Akun Instagram tanpa @ (kosongkan bila tidak ingin ditampilkan)
    instagram: { wanita: "", pria: "" },

    // Kutipan di bagian Salam & Doa
    ayat: {
      teks: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
      sumber: "QS. Ar-Rum: 21",
    },

    // PERJALANAN KAMI. Tambah/kurangi baris sesuka hati (3 sampai 6 baris paling nyaman).
    // foto (opsional): "assets/perjalanan-1.jpg" (rasio 4:3).
    cerita: [
      {
        waktu: "2019",
        judul: "Pertama Bertemu",
        teks: "Takdir mempertemukan kami di sebuah acara kampus. Awalnya hanya saling sapa, lalu obrolan panjang yang tak pernah terasa lama.",
        foto: "",
      },
      {
        waktu: "2021",
        judul: "Saling Menguatkan",
        teks: "Melewati jarak dan ujian bersama, kami belajar bahwa rumah adalah seseorang yang selalu pulang kepada kita.",
        foto: "",
      },
      {
        waktu: "2023",
        judul: "Menjalin Komitmen",
        teks: "Setelah bertahun-tahun saling mengenal, kami memantapkan hati untuk berjalan bersama dengan restu keluarga.",
        foto: "",
      },
      {
        waktu: "2026",
        judul: "Menuju Pelaminan",
        teks: "Dengan ridha Allah SWT, kami melangkah ke hari yang istimewa dan ingin berbagi kebahagiaan bersama Anda.",
        foto: "",
      },
    ],

    // KUTIPAN di bawah hitung mundur (kosongkan untuk memakai kalimat bawaan)
    kutipan: "Dua jiwa, satu cinta, kini bersatu dalam janji suci.",

    // RANGKAIAN ACARA. Jam mulai untuk kalender & hitung mundur tetap dari "acara" di atas.
    rundown: [
      { nama: "Akad Nikah", waktu: "08.00 - 10.00 WIB" },
      { nama: "Resepsi", waktu: "11.00 - 14.00 WIB" },
    ],
    dresscode: "", // contoh: "Earth tone, nuansa nude & champagne". Kosong = tidak tampil.

    // LOKASI. Alamat lengkap diambil dari database (kolom lokasi_acara).
    // nama (opsional) = nama tempat yang tampil tebal di atas alamat, mis. "Gedung Sabuga".
    lokasi: { nama: "" },

    // ---------------------------------------------------------------
    // CARA MENGAKTIFKAN SIARAN LANGSUNG & HADIAH
    // Dua bagian ini TIDAK muncul selama datanya kosong (supaya undangan tidak punya halaman kosong).
    //   1. Siaran Langsung -> isi tema.live.url di bawah dengan tautan YouTube/Zoom/Instagram.
    //   2. Hadiah          -> isi minimal SATU rekening (hapus tanda // di depan contoh) atau alamat kado.
    // Ingin melihat tampilannya dulu tanpa mengisi data? Buka undangan dengan tambahan ?demo=1
    // di alamat (contoh: http://127.0.0.1:5500/index.html?demo=1).
    // ---------------------------------------------------------------

    // SIARAN LANGSUNG. YouTube (watch / live / youtu.be) punya pratinjau yang bisa diputar langsung;
    // platform lain (Zoom, Instagram, TikTok) tampil sebagai tombol tautan.
    live: {
      url: "", // contoh: "https://www.youtube.com/watch?v=XXXXXXXXXXX"
      judul: "Siaran Langsung",
      jadwal: "", // contoh: "Akad nikah disiarkan langsung Sabtu, 08.00 WIB"
    },

    // HADIAH / AMPLOP DIGITAL. Rekening boleh lebih dari satu.
    hadiah: {
      rekening: [
        { bank: "BCA", nomor: "1234567890", nama: "Nama Pemilik" },
        { bank: "DANA", nomor: "081234567890", nama: "Nama Pemilik" },
      ],
      alamat: "", // alamat kirim kado (opsional), contoh: "Jl. Mawar No. 5, Bandung 40111"
      penerima: "", // nama penerima kado (opsional)
    },

    // FOOTER di bab terakhir. tampil:false = footer dihapus.
    // TAUTAN DI DALAM TEKS: tulis kata yang ingin ditautkan di dalam [ ] pada tagline.
    //   [di sini]              -> mengarah ke website di bawah
    //   [hubungi kami](wa)     -> WhatsApp (isi whatsapp, contoh "6281234567890")
    //   [ikuti kami](ig)       -> Instagram (isi instagram, tanpa @)
    //   [lihat katalog](https://contoh.com/katalog) -> tautan apa pun
    // Contoh tagline: "Undangan pernikahan digital yang berkesan, kunjungi kami [di sini] untuk pemesanan"
    // Tujuan yang belum diisi membuat kata itu tampil biasa (tanpa tautan).
    kredit: {
      tampil: true,
      label: "Designed by",
      nama: "Wedding Code",
      tagline:
        "Undangan pernikahan digital yang berkesan, kunjungi kami [di sini] untuk pemesanan",
      website: "https://wedding-code-orpin.vercel.app/", // contoh: "https://weddingcode.id"  <- ISI DI SINI agar kata [di sini] menjadi tautan
      whatsapp: "",
      instagram: "",
    },

    // GALERI (carousel). Daftar foto, mis. ["assets/galeri-1.jpg", "assets/galeri-2.jpg"].
    // Kosong = tampil 5 bingkai contoh agar tata letaknya terlihat. Rasio ideal 3:4.
    galeri: [
      "/clients/galeri1.webp",
      "/clients/galeri2.webp",
      "/clients/galeri3.webp",
      "/clients/galeri4.webp",
      "/clients/galeri5.webp",
    ],

    // RSVP. batas = tanggal terakhir konfirmasi ("2026-12-25"); lewat tanggal itu formulir
    // otomatis ditutup. Kosongkan bila tidak ada batas.
    // NOTE: batas ini pemeriksaan di sisi tampilan saja (bukan di database).
    rsvp: { batas: "" },
  },
};
