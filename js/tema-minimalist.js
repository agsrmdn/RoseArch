// =====================================================================
// TEMA-MINIMALIST.JS  -  mesin tema "Relief"
//
// Alur:
//   1. Tamu mengetuk pintu/segel -> dua daun pintu berayun terbuka (CSS) -> bab pertama muncul.
//   2. Bingkai lengkung & relief bunga TIDAK bergerak. Hanya isi (.bab) yang berganti:
//      bab lama memudar + blur (DURASI_KELUAR), bab baru muncul dari blur ke jelas.
//   3. Pindah bab: tombol "Gulir ke bawah", gulir/geser melewati ujung isi, keyboard,
//      atau menu daftar bagian (ketuk label di atas) untuk melompat langsung.
//
// Backend (Supabase, RSVP, ucapan, kalender, peta) diurus core.js; file ini hanya tampilan.
// =====================================================================
(function () {
  "use strict";

  const U = window.Undangan || null;
  // NOTE: $ memakai getElementById, jadi tanpa tanda "#".
  const $ = (id) => document.getElementById(id);
  const kurangGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // UBAH DI SINI: jeda (ms) sebelum bab baru mulai muncul. Lebih kecil dari durasi keluar bab
  // (0,5 dtk di css/style.css bagian 5) = bab baru muncul SAAT bab lama masih memudar (lebih mulus).
  const DURASI_KELUAR = 260;
  // UBAH DI SINI: lama pintu berayun (ms). Samakan dengan --lama-pintu di css/style.css bagian 3.
  const DURASI_PINTU = 2600;
  // UBAH DI SINI: lama musik naik dari senyap ke volume penuh (ms) saat pintu dibuka.
  const DURASI_FADE_MUSIK = 3200;

  const bab = Array.from(document.querySelectorAll(".bab"));
  const total = bab.length;
  const pintu = $("pintu");
  if (total === 0 || !pintu) {
    console.error("[tema] Struktur .bab / #pintu tidak ditemukan.");
    return;
  }

  let aktif = -1;
  let sibuk = true; // terkunci sampai undangan dibuka
  let musikMulai = false;

  const pad = (n) => String(n).padStart(2, "0");
  const ikon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;

  // Beri indeks urut pada anak isi tiap bab (dipakai animasi muncul bergantian)
  bab.forEach((el) => {
    const g = el.querySelector(".gulir");
    if (g) Array.from(g.children).forEach((c, i) => c.style.setProperty("--n", String(Math.min(i, 8))));
  });

  // -------------------------------------------------------------------
  // 1. UI: label atas, nomor, tombol gulir, tombol kembali
  // -------------------------------------------------------------------
  const namaBab = $("nama-bab");
  const nomorBab = $("nomor-bab");
  const balik = $("balik");
  const lanjut = $("lanjut");
  const lanjutTeks = $("lanjut-teks");
  const lanjutIkon = $("lanjut-ikon");

  function perbaruiUI() {
    // di bab terakhir, relief kanan-bawah dipudarkan agar footer terbaca jelas
    document.body.classList.toggle("bab-akhir", aktif === total - 1);
    const el = bab[aktif];
    if (namaBab) namaBab.textContent = el.dataset.bab || "";
    if (nomorBab) nomorBab.textContent = `${pad(aktif + 1)} / ${pad(total)}`;
    if (balik) balik.classList.toggle("tak-ada", aktif === 0);
    const terakhir = aktif === total - 1;
    if (lanjutTeks) lanjutTeks.textContent = terakhir ? "Kembali ke awal" : "Gulir ke bawah";
    if (lanjutIkon) lanjutIkon.innerHTML = `<use href="#${terakhir ? "i-atas" : "i-bawah"}"/>`;
    document.querySelectorAll(".menu-item").forEach((m, i) => m.setAttribute("aria-current", String(i === aktif)));
  }

  // -------------------------------------------------------------------
  // 2. PINDAH BAB (blur-pudar)
  // -------------------------------------------------------------------
  // ---- Animasi berurutan di dalam bingkai ----
  // Tiap elemen (judul, foto, bingkai, tombol...) dan tiap KATA pada teks muncul satu per satu,
  // meluncur dari kanan (gaya geraknya di css/style.css bagian E).
  // UBAH DI SINI: jeda antar elemen / antar kata / batas total (ms).
  const JEDA_BLOK = 240; // jeda setelah satu elemen non-teks
  const JEDA_BLOK_KECIL = 140; // untuk item kecil (chip, pilihan)
  const JEDA_KATA_MAKS = 70; // jeda antar kata (dipersingkat otomatis bila teks panjang)
  const JEDA_KATA_MIN = 24;
  const BATAS_TOTAL = 3200; // seluruh urutan satu bab tidak melebihi ini

  const SEL_TEKS = [
    ".kecil-kapital", ".label", ".teks", ".judul-kecil", ".miring-besar", ".miring-sedang", ".tanggal-teks",
    ".nama-pasangan span", ".nama-sedang", ".ortu", ".jr-waktu", ".jr-judul", ".jr-teks", ".pelat-nama",
    ".pelat-alamat", ".kutipan", ".nama-penutup", ".dresscode", ".acara-waktu", ".acara-nama", ".rek-bank",
    ".rek-nama", ".kredit-label", ".kredit-nama", ".kredit-tagline", ".kredit-hak", ".ayat p", ".ayat cite", ".tgl-bulan", ".tgl-tahun", ".cd-kecil-label", ".kecil-isi", ".status",
  ].join(",");
  const SEL_BLOK = [
    ".kartus", ".pembatas", ".foto-arch", ".kartus-besar", ".kartus-kecil", ".tgl-angka", ".tgl-titik", ".cd-besar",
    ".cd-kecil > div", ".tombol", ".jr-medali", ".jr-foto", ".galeri", ".live-kotak", ".jendela-peta", ".rekening",
    ".opsi", ".chip-doa", ".isian", ".daftar-ucapan", ".ig", ".nama-pasangan .dan", ".musik-x",
  ].join(",");
  const SEL_KECIL = ".chip-doa,.opsi";

  function bagiKata(el) {
    if (el.children.length > 0) return []; // hanya teks murni
    const teks = el.textContent;
    if (!teks.trim()) return [];
    if (el.dataset.teks === teks && el.querySelector(".kata")) return Array.from(el.querySelectorAll(".kata"));
    el.textContent = "";
    const kata = [];
    teks.split(/(\s+)/).forEach((bagian) => {
      if (!bagian) return;
      if (/^\s+$/.test(bagian)) return el.appendChild(document.createTextNode(bagian));
      const sp = document.createElement("span");
      sp.className = "kata";
      sp.textContent = bagian;
      el.appendChild(sp);
      kata.push(sp);
    });
    el.dataset.teks = teks;
    return kata;
  }

  function siapkanAnimasi(b) {
    if (kurangGerak) return;
    const unit = [];
    b.querySelectorAll(SEL_TEKS + "," + SEL_BLOK).forEach((el) => {
      if (el.closest(".u-ucapan, .daftar-ucapan") && !el.matches(".daftar-ucapan")) return;
      const teks = el.matches(SEL_TEKS) && !el.matches(SEL_BLOK);
      if (teks) {
        const k = bagiKata(el);
        if (k.length) return unit.push({ tipe: "teks", kata: k });
      }
      unit.push({ tipe: "blok", el, kecil: el.matches(SEL_KECIL) });
    });
    let t = 100;
    const jadwal = [];
    unit.forEach((u) => {
      if (u.tipe === "blok") {
        jadwal.push([u.el, t, false]);
        t += u.kecil ? JEDA_BLOK_KECIL : JEDA_BLOK;
      } else {
        const langkah = Math.max(JEDA_KATA_MIN, Math.min(JEDA_KATA_MAKS, Math.round(1000 / u.kata.length)));
        u.kata.forEach((k) => {
          jadwal.push([k, t, true]);
          t += langkah;
        });
        t += 90;
      }
    });
    const faktor = t > BATAS_TOTAL ? BATAS_TOTAL / t : 1;
    jadwal.forEach(([el, d]) => {
      el.classList.add("anim");
      el.style.setProperty("--d", Math.round(d * faktor) + "ms");
    });
  }

  function tampilBaru(ke) {
    const baru = bab[ke];
    const g = baru.querySelector(".gulir");
    if (g) g.scrollTop = 0;
    baru.classList.remove("keluar");
    siapkanAnimasi(baru);
    baru.classList.add("tampil");
    void baru.offsetWidth; // paksa browser menghitung gaya awal agar transisi berjalan
    baru.classList.add("masuk");
    aktif = ke;
    perbaruiUI();
    setTimeout(() => (sibuk = false), kurangGerak ? 0 : 700);
  }

  function pindah(ke) {
    ke = Math.max(0, Math.min(total - 1, Number(ke) || 0));
    if (sibuk || ke === aktif) return;
    sibuk = true;
    const lama = bab[aktif];
    lama.classList.add("keluar"); // elemen tetap terlihat saat wadah memudar
    lama.classList.remove("masuk"); // mulai memudar + blur
    setTimeout(() => tampilBaru(ke), kurangGerak ? 0 : DURASI_KELUAR); // bab baru menyusul (tumpang tindih)
    setTimeout(() => lama.classList.remove("tampil"), kurangGerak ? 0 : 560); // sembunyikan setelah benar-benar pudar
  }

  const maju = () => pindah(aktif < total - 1 ? aktif + 1 : 0); // penutup -> awal
  const mundur = () => aktif > 0 && pindah(aktif - 1);

  window.geserBab = pindah; // lompat langsung ke bab ke-n (mulai dari 0)
  window.geserPulau = pindah; // nama lama, dipertahankan agar kompatibel

  if (lanjut) lanjut.addEventListener("click", maju);
  if (balik) balik.addEventListener("click", mundur);

  // -------------------------------------------------------------------
  // 3. PINTU PEMBUKA
  // -------------------------------------------------------------------
  // ---- Musik: mulai dari ketukan pertama tamu (aturan autoplay browser), naik pelan dari senyap ----
  const tombolMusik = $("tombol-musik");
  let infoTimer = null;
  function infoMusik(teks, lama = 2200) {
    if (!tombolMusik) return;
    const el = tombolMusik.querySelector(".musik-info");
    if (el && teks) el.textContent = teks;
    tombolMusik.classList.add("info");
    clearTimeout(infoTimer);
    infoTimer = setTimeout(() => tombolMusik.classList.remove("info"), lama);
  }
  function mulaiMusik() {
    if (musikMulai) return;
    musikMulai = true;
    const el = (U && U.musik && U.musik.elemen) || $("musik");
    if (!el) return;
    const K = window.KONFIG_UNDANGAN || {};
    const target = typeof K.volumeLagu === "number" ? K.volumeLagu : el.volume || 0.7;
    const hasil = U && U.musik ? U.musik.play() : el.play();
    try { el.volume = 0; } catch (e) {}
    Promise.resolve(hasil).catch(() => {});
    const t0 = performance.now();
    (function naik(now) {
      const k = Math.min(1, (now - t0) / DURASI_FADE_MUSIK);
      try { el.volume = target * k * k; } catch (e) {}
      if (k < 1) requestAnimationFrame(naik);
    })(t0);
    // Bila berkas musik tidak ada, sembunyikan kontrolnya (jangan tampilkan tombol yang tak berfungsi)
    el.addEventListener("error", () => tombolMusik && tombolMusik.classList.add("hidden"), { once: true });
    if (tombolMusik) tombolMusik.classList.remove("hidden");
  }

  // ---- Pintu: ketuk -> segel tertekan -> pintu berayun + kamera maju + halaman mendekat ----
  function bukaUndangan() {
    if (aktif !== -1 || pintu.classList.contains("buka")) return;
    mulaiMusik();
    setTimeout(() => {
      pintu.classList.add("buka");
      document.body.classList.remove("terkunci");
    }, kurangGerak ? 0 : 140);
    // Isi bab pertama muncul saat pintu sudah terbuka separuh
    setTimeout(() => tampilBaru(0), kurangGerak ? 0 : DURASI_PINTU * 0.55);
    setTimeout(() => {
      pintu.style.display = "none";
      infoMusik("Musik menyala", 3400);
    }, kurangGerak ? 0 : DURASI_PINTU + 300);
  }
  window.bukaUndangan = bukaUndangan;
  pintu.addEventListener("click", bukaUndangan);

  // -------------------------------------------------------------------
  // 4. MENU DAFTAR BAGIAN (ketuk label di atas)
  // -------------------------------------------------------------------
  const menu = $("menu");
  const menuDaftar = $("menu-daftar");
  if (menu && menuDaftar) {
    menuDaftar.innerHTML = bab
      .map((el, i) => `<button type="button" class="menu-item" data-ke="${i}"><span>${el.dataset.bab}</span><small>${pad(i + 1)}</small></button>`)
      .join("");
    const tutupMenu = () => menu.classList.add("hidden");
    $("label-bab").addEventListener("click", () => {
      if (sibuk) return;
      perbaruiUI();
      menu.classList.remove("hidden");
    });
    menu.addEventListener("click", (e) => {
      if (e.target.closest(".menu-tutup") || e.target === menu) return tutupMenu();
      const item = e.target.closest(".menu-item");
      if (item) {
        tutupMenu();
        pindah(Number(item.dataset.ke));
      }
    });
    document.addEventListener("keydown", (e) => e.key === "Escape" && tutupMenu());
  }

  // -------------------------------------------------------------------
  // 5. GULIR MELEWATI UJUNG, KEYBOARD
  // NOTE: isi yang panjang digulir seperti biasa. Perpindahan bab hanya terjadi bila gulir
  // sudah berada di ujung SEBELUM gestur dimulai, jadi menggulir ke bawah tidak pernah
  // tiba-tiba memindahkan bab.
  // -------------------------------------------------------------------
  const abaikan = "input, textarea, select, .tanpa-geser, .lightbox, .menu";
  const diUjung = (g) => ({
    atas: !g || g.scrollTop <= 2,
    bawah: !g || g.scrollTop + g.clientHeight >= g.scrollHeight - 2,
  });
  const area = $("arch");

  let sentuh = null;
  area.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1 || e.target.closest(abaikan)) return (sentuh = null);
      const t = e.touches[0];
      sentuh = { x: t.clientX, y: t.clientY, w: Date.now(), ...diUjung(e.target.closest(".gulir")) };
    },
    { passive: true },
  );
  area.addEventListener(
    "touchend",
    (e) => {
      if (!sentuh || aktif < 0) return;
      const t = e.changedTouches[0];
      const dy = sentuh.y - t.clientY;
      const dx = t.clientX - sentuh.x;
      const s = sentuh;
      sentuh = null;
      if (Date.now() - s.w > 900 || Math.abs(dy) < 80 || Math.abs(dy) < Math.abs(dx) * 1.5) return;
      if (dy > 0 && s.bawah && aktif < total - 1) maju();
      else if (dy < 0 && s.atas) mundur();
    },
    { passive: true },
  );

  let rodaTotal = 0;
  let rodaWaktu = 0;
  area.addEventListener(
    "wheel",
    (e) => {
      if (sibuk || aktif < 0 || e.target.closest(abaikan)) return;
      const u = diUjung(e.target.closest(".gulir"));
      const now = Date.now();
      if (now - rodaWaktu > 300) rodaTotal = 0;
      rodaWaktu = now;
      if ((e.deltaY > 0 && !u.bawah) || (e.deltaY < 0 && !u.atas)) return (rodaTotal = 0);
      rodaTotal += e.deltaY;
      if (rodaTotal > 140 && aktif < total - 1) {
        rodaTotal = 0;
        maju();
      } else if (rodaTotal < -140) {
        rodaTotal = 0;
        mundur();
      }
    },
    { passive: true },
  );

  document.addEventListener("keydown", (e) => {
    if (aktif < 0) return e.key === "Enter" || e.key === " " ? bukaUndangan() : undefined;
    if (e.target.closest("input, textarea, select")) return;
    if (document.querySelector(".lightbox:not(.hidden), .menu:not(.hidden)")) return;
    if (e.key === "ArrowDown" || e.key === "PageDown") maju();
    else if (e.key === "ArrowUp" || e.key === "PageUp") mundur();
  });

  // -------------------------------------------------------------------
  // 6. TOMBOL MUSIK & DATA
  // -------------------------------------------------------------------
  if (tombolMusik && U && U.musik && U.musik.elemen) {
    let awal = true;
    const tandai = (main) => {
      tombolMusik.dataset.main = String(main);
      tombolMusik.setAttribute("aria-pressed", String(main));
      if (!awal && aktif >= 0) infoMusik(main ? "Musik menyala" : "Musik dijeda", 1800);
    };
    U.musik.onUbah(tandai);
    awal = false;
    tombolMusik.addEventListener("click", () => U.musik.toggle());
  }

  if (U && U.saatData) {
    U.saatData(({ nilai }) => {
      document.title = `Undangan Pernikahan ${nilai.nama_pasangan}`;
    });
  }

  // Sebelum dibuka: label atas diisi bab pertama supaya tidak kosong saat muncul
  if (namaBab) namaBab.textContent = bab[0].dataset.bab || "";
  if (nomorBab) nomorBab.textContent = `${pad(1)} / ${pad(total)}`;
  if (balik) balik.classList.add("tak-ada");
})();
