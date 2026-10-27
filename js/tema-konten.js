// =====================================================================
// TEMA-KONTEN.JS  -  mengisi bagian-bagian undangan dari konfigurasi.js
//
// Dimuat SETELAH core.js dan SEBELUM tema-minimalist.js, karena bab harus sudah
// lengkap (bab yang dimatikan/kosong sudah dihapus) sebelum mesin transisi
// menghitung urutan babnya.
//
// Isi file:
//   1 Bantuan kecil           5 Lokasi
//   2 Palet & bab opsional    6 Siaran langsung (pratinjau YouTube)
//   3 Mempelai & ayat         7 Galeri (carousel) + lightbox
//   4 Perjalanan & acara      8 Hadiah   9 RSVP interaktif
// Backend (database, RSVP, ucapan, balasan, kalender, peta) tetap diurus core.js.
// =====================================================================
// Membaca slug klien dari URL parameter (?client= atau ?slug=)
const urlParams = new URLSearchParams(window.location.search);
const clientSlug =
  urlParams.get("client") ||
  urlParams.get("slug") ||
  window.KONFIG_UNDANGAN?.slug ||
  "demo";
const CLIENT_URL = `/clients/${clientSlug}`;

// Timpa path foto & galeri secara otomatis berdasarkan folder klien
if (window.KONFIG_UNDANGAN && window.KONFIG_UNDANGAN.tema) {
  window.KONFIG_UNDANGAN.tema.foto = {
    wanita: `${CLIENT_URL}/bride.webp`,
    pria: `${CLIENT_URL}/groom.webp`,
  };

  window.KONFIG_UNDANGAN.tema.galeri = [
    `${CLIENT_URL}/galeri1.webp`,
    `${CLIENT_URL}/galeri2.webp`,
    `${CLIENT_URL}/galeri3.webp`,
    `${CLIENT_URL}/galeri4.webp`,
    `${CLIENT_URL}/galeri5.webp`,
  ];
}

const audioEl = document.getElementById("musik");
if (audioEl) audioEl.src = `${CLIENT_URL}/musik.mp3`;
(function () {
  "use strict";

  const K = window.KONFIG_UNDANGAN || {};
  const T = K.tema || {};

  // MODE CONTOH: tambahkan ?demo=1 di akhir alamat undangan (mis. index.html?demo=1) untuk melihat
  // bagian Siaran Langsung & Hadiah dengan data contoh, tanpa mengubah konfigurasi.js.
  // Dipakai untuk memamerkan fitur ke klien. Hilang sendiri bila ?demo=1 dibuang dari alamat.
  if (/[?&]demo=1(&|$)/.test(location.search)) {
    T.bagian = Object.assign({}, T.bagian, { live: true, hadiah: true });
    if (!(T.live && /^https?:\/\//i.test(T.live.url || ""))) {
      T.live = {
        url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
        judul: "Siaran Langsung",
        jadwal: "Contoh: akad nikah disiarkan langsung pukul 08.00 WIB.",
      };
    }
    const h = T.hadiah || {};
    if (!((h.rekening || []).length || String(h.alamat || "").trim())) {
      T.hadiah = {
        rekening: [
          { bank: "BCA", nomor: "1234567890", nama: "Nama Pemilik" },
          { bank: "DANA", nomor: "081234567890", nama: "Nama Pemilik" },
        ],
        alamat: "Jl. Contoh No. 1, Kota Anda 40111",
        penerima: "Nama Penerima",
      };
    }
  }
  const $ = (id) => document.getElementById(id);

  // -------------------------------------------------------------------
  // 1. BANTUAN KECIL
  // NOTE (keamanan): semua teks dari konfigurasi di-escape; tautan hanya http(s);
  // alamat gambar hanya http(s) atau path relatif (assets/...), menolak "javascript:".
  // -------------------------------------------------------------------
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const urlAman = (u) =>
    /^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "";
  const srcAman = (u) =>
    /^(https?:\/\/|assets\/|\.{1,2}\/|\/)/i.test(String(u || "").trim())
      ? String(u).trim()
      : "";
  const ikon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;

  // Bingkai foto kosong: warna mengikuti palet (lewat variabel CSS), jadi selalu serasi.
  const fotoKosong = (jenis = "orang") =>
    `<div class="foto-kosong" role="img" aria-label="Foto belum diisi">${ikon(jenis === "hati" ? "i-hati" : "i-orang")}</div>`;

  // -------------------------------------------------------------------
  // 2. PALET & BAB OPSIONAL
  // -------------------------------------------------------------------
  if (T.palet) document.documentElement.dataset.palet = String(T.palet);

  function adaIsi(nama) {
    if (nama === "cerita")
      return Array.isArray(T.cerita) && T.cerita.length > 0;
    if (nama === "live") return !!urlAman(T.live && T.live.url);
    if (nama === "hadiah") {
      const h = T.hadiah || {};
      return (
        (Array.isArray(h.rekening) && h.rekening.length > 0) ||
        !!String(h.alamat || "").trim()
      );
    }
    return true;
  }
  document.querySelectorAll(".bab[data-bagian]").forEach((el) => {
    const nama = el.dataset.bagian;
    const hidup = !T.bagian || T.bagian[nama] !== false; // saklar di konfigurasi.js > tema.bagian
    if (!hidup || !adaIsi(nama)) el.remove();
  });

  // -------------------------------------------------------------------
  // 3. MEMPELAI & AYAT
  // -------------------------------------------------------------------
  ["wanita", "pria"].forEach((k) => {
    const wadah = document.querySelector(`[data-foto="${k}"]`);
    if (wadah) {
      const src = srcAman(T.foto && T.foto[k]);
      wadah.innerHTML = src
        ? `<img src="${esc(src)}" alt="Foto mempelai ${k}" loading="lazy" decoding="async">`
        : fotoKosong("orang");
    }
    const ortu = document.querySelector(`[data-ortu="${k}"]`);
    const teksOrtu = T.orangTua && T.orangTua[k];
    if (ortu) teksOrtu ? (ortu.textContent = teksOrtu) : ortu.remove();

    const ig = document.querySelector(`[data-ig="${k}"]`);
    const akun = String((T.instagram && T.instagram[k]) || "")
      .replace(/^@/, "")
      .trim();
    if (ig) {
      if (/^[\w.]{1,30}$/.test(akun)) {
        ig.href = "https://instagram.com/" + akun;
        ig.querySelector("span").textContent = "@" + akun;
      } else ig.remove();
    }
  });
  if (T.ayat) {
    if (T.ayat.teks && $("ayat-teks")) $("ayat-teks").textContent = T.ayat.teks;
    if (T.ayat.sumber && $("ayat-sumber"))
      $("ayat-sumber").textContent = T.ayat.sumber;
  }

  // -------------------------------------------------------------------
  // 4. PERJALANAN KAMI & RANGKAIAN ACARA
  // -------------------------------------------------------------------
  const daftarCerita = $("cerita");
  if (daftarCerita && Array.isArray(T.cerita)) {
    daftarCerita.innerHTML = T.cerita
      .map((c, i) => {
        const foto = srcAman(c.foto);
        return `<li class="jr-item">
          <span class="jr-medali" aria-hidden="true">${i + 1}</span>
          <div>
            <p class="jr-waktu">${esc(c.waktu)}</p>
            <h3 class="jr-judul">${esc(c.judul)}</h3>
            <p class="jr-teks">${esc(c.teks)}</p>
            ${foto ? `<div class="jr-foto"><img src="${esc(foto)}" alt="${esc(c.judul)}" loading="lazy" decoding="async"></div>` : ""}
          </div></li>`;
      })
      .join("");
  }

  // NOTE: .acara-item > .acara-nama + .acara-waktu dibaca core.js untuk catatan kalender tamu.
  const rundown = $("rundown");
  if (rundown && Array.isArray(T.rundown)) {
    rundown.innerHTML = T.rundown
      .map(
        (a) =>
          `<div class="acara-item"><span class="acara-waktu">${esc(a.waktu)}</span><span class="acara-nama">${esc(a.nama)}</span></div>`,
      )
      .join("");
  }
  if (T.dresscode && $("dresscode")) {
    $("dresscode").textContent = "Dress code: " + T.dresscode;
    $("dresscode").classList.remove("hidden");
  }

  // -------------------------------------------------------------------
  // 5. LOKASI
  // Peta (iframe) dan alamat diisi core.js dari database. Di sini hanya nama tempat opsional.
  // -------------------------------------------------------------------
  const namaTempat = String((T.lokasi && T.lokasi.nama) || "").trim();
  if (namaTempat && $("lokasi-nama")) {
    $("lokasi-nama").textContent = namaTempat;
    $("lokasi-nama").classList.remove("hidden");
  }

  // -------------------------------------------------------------------
  // 6. SIARAN LANGSUNG
  // YouTube: tampil pratinjau, pemutar baru dimuat saat diketuk (hemat kuota HP).
  // Musik latar dijeda saat video diputar agar suaranya tidak bertabrakan.
  // -------------------------------------------------------------------
  const kotakLive = $("live-kotak");
  const L = T.live || {};
  if (kotakLive && urlAman(L.url)) {
    if (L.judul && $("live-judul")) $("live-judul").textContent = L.judul;
    if (L.jadwal && $("live-jadwal")) $("live-jadwal").textContent = L.jadwal;
    $("live-link").href = urlAman(L.url);

    const m = String(L.url).match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/))([\w-]{11})/,
    );
    if (m) {
      const id = m[1];
      kotakLive.innerHTML = `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()">
        <button type="button" class="live-putar" aria-label="Putar siaran langsung"><span>${ikon("i-play")}</span></button>`;
      kotakLive.querySelector(".live-putar").addEventListener("click", () => {
        if (window.Undangan && window.Undangan.musik)
          window.Undangan.musik.pause();
        kotakLive.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1"
          title="Siaran langsung pernikahan" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
      });
    } else {
      kotakLive.innerHTML = `<a class="live-putar" href="${esc(urlAman(L.url))}" target="_blank" rel="noopener" aria-label="Buka siaran langsung"><span>${ikon("i-play")}</span></a>`;
    }
  }

  // -------------------------------------------------------------------
  // 7. GALERI: carousel foto lengkung + lightbox
  // Foto di tengah tampil penuh, tetangganya mengecil & memudar (dihitung saat menggeser).
  // Tanpa foto asli: 5 bingkai contoh (tidak bisa diperbesar).
  // -------------------------------------------------------------------
  const wadahGaleri = $("galeri");
  let foto = [];
  if (wadahGaleri) {
    const asli = (T.galeri || []).map(srcAman).filter(Boolean);
    foto = asli;
    const jumlah = asli.length || 5;
    const slide = Array.from({ length: jumlah }, (_, i) => {
      const isi = asli.length
        ? `<img src="${esc(asli[i])}" alt="Foto galeri ${i + 1}" loading="lazy" decoding="async">`
        : fotoKosong(i % 2 ? "hati" : "orang");
      return `<div class="kar-slide" data-i="${i}"><div class="foto-arch"${asli.length ? ` role="button" tabindex="0" aria-label="Perbesar foto ${i + 1}"` : ""}>${isi}</div></div>`;
    }).join("");
    wadahGaleri.innerHTML = `<div class="kar">${slide}</div><div class="kar-titik" aria-hidden="true">${Array.from({ length: jumlah }, () => "<i></i>").join("")}</div>`;

    const kar = wadahGaleri.querySelector(".kar");
    const slides = Array.from(kar.querySelectorAll(".kar-slide"));
    const titik = Array.from(wadahGaleri.querySelectorAll(".kar-titik i"));
    let menunggu = false;
    const hitung = () => {
      menunggu = false;
      const pusat = kar.scrollLeft + kar.clientWidth / 2;
      let terdekat = 0,
        jarakMin = Infinity;
      slides.forEach((s, i) => {
        const d =
          Math.abs(s.offsetLeft + s.offsetWidth / 2 - pusat) / s.offsetWidth;
        s.style.setProperty("--s", String(1 - Math.min(0.14, d * 0.14)));
        s.style.setProperty("--o", String(1 - Math.min(0.5, d * 0.5)));
        if (d < jarakMin) {
          jarakMin = d;
          terdekat = i;
        }
      });
      titik.forEach((t, i) => t.classList.toggle("aktif", i === terdekat));
    };
    kar.addEventListener(
      "scroll",
      () => {
        if (!menunggu) {
          menunggu = true;
          requestAnimationFrame(hitung);
        }
      },
      { passive: true },
    );
    window.addEventListener("resize", hitung);
    // Hitung awal saat bab pertama kali tampil (lebar baru diketahui setelah terlihat)
    new MutationObserver(hitung).observe(wadahGaleri.closest(".bab"), {
      attributes: true,
      attributeFilter: ["class"],
    });
    setTimeout(hitung, 60);

    if (asli.length) {
      const buka = (e) => {
        const s = e.target.closest(".kar-slide");
        if (s && (e.type === "click" || e.key === "Enter" || e.key === " "))
          bukaLightbox(Number(s.dataset.i));
      };
      kar.addEventListener("click", buka);
      kar.addEventListener("keydown", buka);
    }
    if (!asli.length && $("galeri-ket"))
      $("galeri-ket").textContent = "Geser untuk melihat";
  }

  let lb = null;
  let lbIndex = 0;
  function bukaLightbox(i) {
    lbIndex = i;
    if (!lb) {
      lb = document.createElement("div");
      lb.className = "lightbox";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-label", "Pratinjau foto");
      lb.innerHTML = `<img alt="">
        <button type="button" class="lb-btn lb-tutup" aria-label="Tutup">${ikon("i-tutup")}</button>
        <button type="button" class="lb-btn lb-kiri" aria-label="Foto sebelumnya">${ikon("i-kiri")}</button>
        <button type="button" class="lb-btn lb-kanan" aria-label="Foto berikutnya">${ikon("i-kanan")}</button>
        <p class="lb-hitung"></p>`;
      document.body.appendChild(lb);
      lb.addEventListener("click", (e) => {
        if (e.target.closest(".lb-tutup") || e.target === lb) tutupLightbox();
        else if (e.target.closest(".lb-kiri")) geserLb(-1);
        else if (e.target.closest(".lb-kanan")) geserLb(1);
      });
      let awal = null;
      lb.addEventListener("touchstart", (e) => (awal = e.touches[0].clientX), {
        passive: true,
      });
      lb.addEventListener("touchend", (e) => {
        if (awal === null) return;
        const dx = e.changedTouches[0].clientX - awal;
        awal = null;
        if (Math.abs(dx) > 50) geserLb(dx < 0 ? 1 : -1);
      });
    }
    lb.classList.remove("hidden");
    tampilLb();
  }
  function tampilLb() {
    lb.querySelector("img").src = foto[lbIndex];
    lb.querySelector(".lb-hitung").textContent =
      `${lbIndex + 1} / ${foto.length}`;
  }
  function geserLb(d) {
    lbIndex = (lbIndex + d + foto.length) % foto.length;
    tampilLb();
  }
  function tutupLightbox() {
    if (lb) lb.classList.add("hidden");
  }
  document.addEventListener("keydown", (e) => {
    if (!lb || lb.classList.contains("hidden")) return;
    if (e.key === "Escape") tutupLightbox();
    if (e.key === "ArrowLeft") geserLb(-1);
    if (e.key === "ArrowRight") geserLb(1);
  });

  // -------------------------------------------------------------------
  // 8. HADIAH
  // Tombol memakai kelas .btn-salin + data-salin; core.js yang menyalin dan mengganti
  // label menjadi "Tersalin".
  // -------------------------------------------------------------------
  const wadahHadiah = $("hadiah-daftar");
  if (wadahHadiah) {
    const H = T.hadiah || {};
    let html = (H.rekening || [])
      .map(
        (r) => `<div class="rekening">
          <p class="rek-bank">${esc(r.bank)}</p>
          <p class="rek-nomor">${esc(r.nomor)}</p>
          <p class="rek-nama">a.n. ${esc(r.nama)}</p>
          <button type="button" class="tombol btn-salin" data-salin="${esc(r.nomor)}">${ikon("i-salin")}<span class="btn-label">Salin nomor</span></button>
        </div>`,
      )
      .join("");
    if (String(H.alamat || "").trim()) {
      html += `<div class="rekening">
        <p class="rek-bank">Kirim kado</p>
        ${H.penerima ? `<p class="rek-nama">${esc(H.penerima)}</p>` : ""}
        <p class="rek-nama">${esc(H.alamat)}</p>
        <button type="button" class="tombol btn-salin" data-salin="${esc(H.alamat)}">${ikon("i-salin")}<span class="btn-label">Salin alamat</span></button>
      </div>`;
    }
    wadahHadiah.innerHTML = html;
  }

  // -------------------------------------------------------------------
  // 9. RSVP INTERAKTIF
  // Pilihan kehadiran menyetel <select id="input-kehadiran"> yang dibaca core.js
  // (nilai persis "Hadir" / "Tidak Hadir").
  // -------------------------------------------------------------------
  const opsi = document.querySelectorAll(".opsi");
  const selectHadir = $("input-kehadiran");
  opsi.forEach((b) =>
    b.addEventListener("click", () => {
      if (selectHadir) selectHadir.value = b.dataset.nilai;
      opsi.forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    }),
  );

  const kotakUcapan = $("input-ucapan");
  const penghitung = $("hitung");
  const hitungUlang = () => {
    if (penghitung && kotakUcapan)
      penghitung.textContent = String(kotakUcapan.value.length);
  };
  if (kotakUcapan) kotakUcapan.addEventListener("input", hitungUlang);
  document.querySelectorAll(".chip-doa").forEach((c) =>
    c.addEventListener("click", () => {
      if (!kotakUcapan) return;
      kotakUcapan.value = c.dataset.teks.slice(0, 300);
      hitungUlang();
    }),
  );
  // core.js mengosongkan kotak ucapan setelah berhasil kirim; penghitung ikut direset.
  const statusEl = $("rsvp-status");
  if (statusEl && "MutationObserver" in window) {
    new MutationObserver(hitungUlang).observe(statusEl, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
    });
  }

  // Batas waktu konfirmasi (tema.rsvp.batas = "YYYY-MM-DD", berlaku sampai akhir hari itu WIB)
  const batas = String((T.rsvp && T.rsvp.batas) || "").trim();
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(batas) &&
    Date.now() > new Date(batas + "T23:59:59+07:00").getTime()
  ) {
    const form = $("rsvp-form");
    if (form) {
      form
        .querySelectorAll("input, textarea, select, button")
        .forEach((el) => (el.disabled = true));
      if (statusEl)
        statusEl.textContent =
          "Mohon maaf, konfirmasi kehadiran sudah ditutup.";
    }
  }

  // -------------------------------------------------------------------
  // 10. JUDUL TERKUNCI, TANGGAL BERBINGKAI, KUTIPAN
  // -------------------------------------------------------------------
  // Judul bab (.kartus) dipindah keluar dari area gulir, jadi saat isi digulir ke atas judulnya
  // tetap diam di tempat dan teks seolah menyelinap di bawahnya (di dalam relief).
  document.querySelectorAll(".bab").forEach((b) => {
    const g = b.querySelector(".gulir");
    const k = g && g.querySelector(":scope > .kartus");
    if (!k) return;
    const kepala = document.createElement("div");
    kepala.className = "kepala-bab";
    kepala.appendChild(k);
    b.insertBefore(kepala, g);
    b.classList.add("berjudul");
  });

  // Kutipan di bab Hitung Mundur (tema.kutipan di konfigurasi.js; kosong = bawaan)
  if (T.kutipan && $("kutipan")) $("kutipan").textContent = T.kutipan;

  // Jam di bingkai kecil: dari acara.jam / acara.menit / acara.zona di konfigurasi.js
  (function isiJam() {
    const el = $("tgl-jam");
    const a = K.acara || {};
    if (!el || typeof a.jam !== "number") return;
    const zona =
      { "+07:00": "WIB", "+08:00": "WITA", "+09:00": "WIT" }[
        a.zona || "+07:00"
      ] || "";
    const dua = (n) => String(n).padStart(2, "0");
    el.textContent = `${dua(a.jam)}.${dua(a.menit || 0)} ${zona}`.trim();
  })();

  // Bulan & tahun dipecah dari "Desember 2026" (nilai bulan_tahun milik core.js) agar bisa
  // ditata terpisah di dalam bingkai tanggal.
  if (window.Undangan && window.Undangan.saatData) {
    window.Undangan.saatData(({ nilai }) => {
      const m = String(nilai.bulan_tahun || "")
        .trim()
        .match(/^(.*?)\s*(\d{4})$/);
      if ($("tgl-bulan"))
        $("tgl-bulan").textContent = m ? m[1] : nilai.bulan_tahun;
      if ($("tgl-tahun")) $("tgl-tahun").textContent = m ? m[2] : "";
    });
  }

  // -------------------------------------------------------------------
  // 11. FOOTER KREDIT (bab terakhir)
  // Diisi dari konfigurasi.js > tema.kredit. Tombol hanya tampil bila tautannya diisi.
  // -------------------------------------------------------------------
  const kr = Object.assign(
    {
      tampil: true,
      label: "Dibuat dengan cinta oleh",
      nama: "Wedding Code",
      tagline: "Undangan pernikahan digital yang berkesan",
    },
    T.kredit || {},
  );
  const wadahKredit = $("kredit");
  if (wadahKredit) {
    if (kr.tampil === false) wadahKredit.remove();
    else {
      // Footer dipindah keluar dari area gulir: menempel di dasar bingkai, selalu terlihat di bab terakhir
      const babAkhir = wadahKredit.closest(".bab");
      if (babAkhir) babAkhir.appendChild(wadahKredit);

      // TAUTAN DI DALAM TEKS: tulis [kata] di tagline, mis. "kunjungi kami [di sini] untuk pemesanan".
      //   [kata]            -> mengarah ke kredit.website
      //   [kata](wa)        -> WhatsApp (kredit.whatsapp)      [kata](ig) -> Instagram (kredit.instagram)
      //   [kata](https://...) -> tautan apa pun
      // Bila tujuannya belum diisi, kata tampil biasa (tanpa tautan).
      const ig = String(kr.instagram || "")
        .replace(/^@/, "")
        .trim();
      const wa = String(kr.whatsapp || "").replace(/\D/g, "");
      const tujuan = (t) => {
        t = String(t || "").trim();
        if (!t) return urlAman(kr.website);
        if (t === "wa")
          return wa
            ? `https://wa.me/${wa}?text=${encodeURIComponent(kr.pesanWa || "Halo " + kr.nama + ", saya tertarik membuat undangan digital seperti ini.")}`
            : "";
        if (t === "ig")
          return /^[\w.]{1,30}$/.test(ig) ? "https://instagram.com/" + ig : "";
        return urlAman(t);
      };
      const mentah = String(kr.tagline || "");
      const re = /\[([^\]]+)\](?:\(([^)]*)\))?/g;
      let taglineHtml = "";
      let akhir = 0;
      let m;
      while ((m = re.exec(mentah))) {
        taglineHtml += esc(mentah.slice(akhir, m.index));
        const href = tujuan(m[2]);
        taglineHtml += href
          ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(m[1])}</a>`
          : esc(m[1]);
        akhir = re.lastIndex;
      }
      taglineHtml += esc(mentah.slice(akhir));

      wadahKredit.innerHTML = `<p class="kredit-label">${esc(kr.label)}</p>
        <p class="kredit-nama">${esc(kr.nama)}</p>
        <p class="kredit-tagline">${taglineHtml}</p>
        <p class="kredit-hak">© ${new Date().getFullYear()} ${esc(kr.nama)}</p>`;

      // Tinggi footer berubah-ubah (teks 1 atau 2 baris, font baru termuat, layar diputar).
      // Area isi di atasnya mengikuti otomatis lewat variabel --tinggi-kredit, jadi tidak pernah tumpang tindih.
      if (babAkhir) {
        const ukur = () =>
          babAkhir.style.setProperty(
            "--tinggi-kredit",
            wadahKredit.offsetHeight + 28 + "px",
          );
        ukur();
        if ("ResizeObserver" in window)
          new ResizeObserver(ukur).observe(wadahKredit);
        if (document.fonts && document.fonts.ready)
          document.fonts.ready.then(ukur);
        window.addEventListener("resize", ukur);
      }
    }
  }
})();
