// =====================================================================
// CORE.JS  —  koneksi database + fitur bersama
// JANGAN diedit per klien atau per tema. Pengaturan klien ada di js/konfigurasi.js.
//
// Core hanya mengisi elemen yang ADA di halaman; elemen yang tidak ada dilewati tanpa error.
// Karena itu tema baru bebas mengubah tata letak, asalkan memakai "kontrak" di bawah.
//
// ---------------------------------------------------------------------
// KONTRAK UNTUK TEMA (cara tema terhubung ke database)
// ---------------------------------------------------------------------
// A. Isi teks otomatis. Beri elemen apa saja atribut  data-isi="kunci"  (tema baru; boleh dipakai berkali-kali):
//    nama_wanita, nama_pria, nama_pasangan, inisial_wanita, inisial_pria,
//    tanggal_panjang (Kamis, 31 Desember 2026), tanggal_sedang (31 Desember 2026),
//    hari, tanggal_angka (31), bulan_tahun (Desember 2026), lokasi, nama_tamu
//    Tautan peta:  <a data-href="maps">  (otomatis diisi dan disembunyikan bila url_maps kosong)
// B. ID lama (tema Velvet Rose, tetap didukung): berdua-wanita, berdua-pria, mono-wanita, mono-pria,
//    berdua-tanggal, mempelai-wanita, mempelai-pria, acara-hari, acara-tgl, acara-bln, info-lokasi,
//    penutup-nama, link-maps, nama-tamu, input-nama
// C. Fitur (semua opsional, aktif bila ID ada): hitung mundur (cd-hari, cd-jam, cd-menit, cd-detik, cd-pesan),
//    kalender (kal-google, kal-ics; baris acara .acara-item > .acara-nama + .acara-waktu),
//    peta (peta, peta-wrap), RSVP (rsvp-form, input-kehadiran, input-ucapan, submit-btn, rsvp-status,
//    input-nama), buku tamu + balasan (daftar-ucapan), salin (.btn-salin[data-salin] > .btn-label),
//    lagu (<audio id="musik">)
// D. Tema wajib menyediakan kelas  .hidden { display: none }.
//    Kartu buku tamu memakai kelas penanda: u-ucapan, u-nama, u-tgl, u-isi, u-balasan, u-balasan-item,
//    u-balasan-nama, u-balasan-isi, u-btn-balas, u-form-balas, u-status (u-status-ok / u-status-galat).
// E. Kait untuk tema:  Undangan.saatData((detail) => { ... })  dipanggil saat data pasangan siap
//    (detail = { data, nilai, nw, np }), plus peristiwa  document "undangan:data".
//    Undangan.musik.play()/pause()/toggle()/onUbah(fn).  Undangan.$ / isi / escapeHtml / reduceMotion.
// F. Nilai dropdown kehadiran harus persis  Hadir  dan  Tidak Hadir.
// ---------------------------------------------------------------------
(function () {
  if (!window.supabase) {
    console.error("[core] Pustaka Supabase belum dimuat. Pastikan script supabase-js ada SEBELUM core.js.");
    return;
  }
  const K = window.KONFIG_UNDANGAN || {};
  if (!K.supabaseUrl || !K.supabaseAnonKey) {
    console.error("[core] js/konfigurasi.js belum dimuat atau belum diisi. Muat konfigurasi.js SEBELUM core.js.");
    return;
  }
  const _supabase = window.supabase.createClient(K.supabaseUrl, K.supabaseAnonKey);
  window._supabase = _supabase; // dipakai juga untuk uji di Console (F12)

  // Pengaturan klien (dari konfigurasi.js, dengan nilai bawaan)
  const ACARA = Object.assign({ jam: 8, menit: 0, durasiJam: 6, zona: "+07:00" }, K.acara || {});
  const PENGINGAT_MENIT = K.pengingatMenit || [1440, 180];
  const CATATAN_TAMBAHAN = K.catatanTambahan || [];
  const PETA_QUERY = K.petaQuery || "";
  const VOLUME_LAGU = typeof K.volumeLagu === "number" ? K.volumeLagu : 0.7;

const $ = (id) => document.getElementById(id);
function isi(id, teks) {
  const el = $(id);
  if (el) el.textContent = teks;
}
function escapeHtml(t) {
  return String(t ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ==========================================
  // PARAMETER LINK & SLUG
  // ==========================================
  const urlParams = new URLSearchParams(window.location.search);
  // Slug pasangan (kolom slug di tabel pasangan), urutan prioritas:
  // 1) slug di js/konfigurasi.js  -> halaman TERKUNCI pada pasangan itu (paket klien)
  // 2) <html data-slug="...">      -> sama (cara lama, tetap didukung)
  // 3) ?slug= di alamat            -> untuk demo dan uji coba
  // 4) "demo"
  const slugTetap = String(K.slug || document.documentElement.dataset.slug || "").trim();
  const slugPasangan = slugTetap || urlParams.get("slug") || "demo";
  const namaTamuParam = urlParams.get("to"); // sudah otomatis di-decode oleh URLSearchParams

  const inputNamaEl = $("input-nama");
  const coverNamaEl = $("nama-tamu");
  if (coverNamaEl) coverNamaEl.textContent = namaTamuParam || "Tamu Undangan";
  if (inputNamaEl) inputNamaEl.value = namaTamuParam || "Tamu Umum";
  const namaPengirim = () => (inputNamaEl ? inputNamaEl.value : namaTamuParam || "Tamu Umum");

  let currentCoupleId = null;

  // Kait untuk tema: dipanggil saat data pasangan siap (atau langsung bila sudah siap)
  let detailData = null;
  const penunggu = [];
  function saatData(fn) {
    if (detailData) {
      try { fn(detailData); } catch (e) { console.error(e); }
    } else penunggu.push(fn);
  }

// Kolom tanggal_acara bertipe timestamptz: Supabase mengirimnya dalam UTC
// (mis. "2026-12-30T17:00:00+00:00"). Karena itu tanggalnya dibaca menurut ZONA ACARA (ACARA.zona),
// bukan zona perangkat tamu, supaya harinya tidak bergeser. Jam di kolom itu diabaikan:
// jam mulai diatur di ACARA.jam / ACARA.menit.
function zonaMenit() {
  const m = /^([+-])(\d{2}):?(\d{2})$/.exec(ACARA.zona);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}
function tanggalDiZona(str) {
  const d = new Date(str);
  if (isNaN(d)) {
    const [y, m, dd] = String(str).slice(0, 10).split("-").map(Number);
    return { y, m, d: dd };
  }
  const g = new Date(d.getTime() + zonaMenit() * 60000);
  return { y: g.getUTCFullYear(), m: g.getUTCMonth() + 1, d: g.getUTCDate() };
}
// Tanggal untuk ditampilkan sebagai teks
function tanggalTampil(str) {
  const { y, m, d } = tanggalDiZona(str);
  return new Date(y, m - 1, d);
}
// Waktu mulai acara sebagai titik waktu mutlak (dengan zona acara), untuk hitung mundur & kalender
function waktuAcara(str, tambahJam = 0) {
  const { y, m, d } = tanggalDiZona(str);
  const p = (n) => String(n).padStart(2, "0");
  const t = new Date(`${y}-${p(m)}-${p(d)}T${p(ACARA.jam)}:${p(ACARA.menit)}:00${ACARA.zona}`);
  return new Date(t.getTime() + tambahJam * 3600 * 1000);
}
function inisial(nama) {
  return String(nama || "").trim().charAt(0).toUpperCase();
}


  // ID lama -> kunci data (supaya tema Velvet Rose tetap jalan tanpa perubahan HTML)
  const PETA_ID = {
    "berdua-wanita": "nama_wanita", "berdua-pria": "nama_pria",
    "mono-wanita": "inisial_wanita", "mono-pria": "inisial_pria",
    "berdua-tanggal": "tanggal_sedang",
    "mempelai-wanita": "nama_wanita", "mempelai-pria": "nama_pria",
    "acara-hari": "hari", "acara-tgl": "tanggal_angka", "acara-bln": "bulan_tahun",
    "info-lokasi": "lokasi", "penutup-nama": "nama_pasangan",
  };

  async function loadWeddingData() {
    const { data, error } = await _supabase.from("pasangan").select("*").eq("slug", slugPasangan).single();
    if (error || !data) {
      console.error("Data pasangan tidak ditemukan:", error);
      alert("Data slug tidak ditemukan di Supabase. Pastikan sudah ada data dengan slug: " + slugPasangan);
      return;
    }

    currentCoupleId = data.id;
    const nw = data.nama_wanita;
    const np = data.nama_pria;
    const tgl = tanggalTampil(data.tanggal_acara);
    const fmt = (opsi) => tgl.toLocaleDateString("id-ID", opsi);
    const nilai = {
      nama_wanita: nw,
      nama_pria: np,
      nama_pasangan: `${nw} & ${np}`,
      inisial_wanita: inisial(nw),
      inisial_pria: inisial(np),
      tanggal_panjang: fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      tanggal_sedang: fmt({ day: "numeric", month: "long", year: "numeric" }),
      hari: fmt({ weekday: "long" }),
      tanggal_angka: String(tgl.getDate()).padStart(2, "0"),
      bulan_tahun: fmt({ month: "long", year: "numeric" }),
      lokasi: data.lokasi_acara || "",
      nama_tamu: namaTamuParam || "Tamu Undangan",
    };

    // 1) ID lama   2) atribut data-isi (tema baru)
    Object.keys(PETA_ID).forEach((id) => isi(id, nilai[PETA_ID[id]]));
    document.querySelectorAll("[data-isi]").forEach((el) => {
      const k = el.dataset.isi;
      if (Object.prototype.hasOwnProperty.call(nilai, k)) el.textContent = nilai[k];
    });

    // Tautan peta
    document.querySelectorAll("#link-maps, [data-href='maps']").forEach((a) => {
      if (data.url_maps) a.href = data.url_maps;
      else a.classList.add("hidden");
    });

    mulaiHitungMundur(waktuAcara(data.tanggal_acara));
    siapkanKalender(data, nw, np);
    isiPeta(data);
    muatUcapanRealtime(currentCoupleId);

    // Beri tahu tema (mis. untuk menata nama di cover atau menghitung ulang tinggi section)
    detailData = { data, nilai, nw, np };
    penunggu.splice(0).forEach((fn) => {
      try { fn(detailData); } catch (e) { console.error(e); }
    });
    document.dispatchEvent(new CustomEvent("undangan:data", { detail: detailData }));
  }

// ==========================================
// SIMPAN KE KALENDER (Google Kalender & file .ics untuk Apple/Outlook)
// Isi catatan disusun dari data undangan, jadi tamu mendapat pengingat lengkap di kalendernya.
// ==========================================
function formatUtc(dt) {
  return dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function escIcs(t) {
  return String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
// Baris .ics maksimal 75 byte; baris yang lebih panjang dilipat dengan spasi di awal baris lanjutan.
function lipatIcs(baris) {
  const enc = new TextEncoder();
  const hasil = [];
  let cur = "";
  let len = 0;
  for (const ch of baris) {
    const b = enc.encode(ch).length;
    if (len + b > 72) {
      hasil.push(cur);
      cur = " " + ch;
      len = 1 + b;
    } else {
      cur += ch;
      len += b;
    }
  }
  hasil.push(cur);
  return hasil.join("\r\n");
}

function susunCatatan(data, nw, np) {
  const baris = [`Undangan Pernikahan ${nw} & ${np}`];
  if (namaTamuParam) baris.push(`Kepada: ${namaTamuParam}`);
  baris.push("");
  // Rundown acara diambil dari section Acara di HTML (satu sumber data)
  document.querySelectorAll(".acara-item").forEach((el) => {
    const n = el.querySelector(".acara-nama")?.textContent.trim();
    const w = el.querySelector(".acara-waktu")?.textContent.trim();
    if (n && w) baris.push(`${n}: ${w}`);
  });
  baris.push("");
  if (data.lokasi_acara) baris.push(`Lokasi: ${data.lokasi_acara}`);
  if (data.url_maps) baris.push(`Peta: ${data.url_maps}`);
  CATATAN_TAMBAHAN.forEach((t) => baris.push(t));
  baris.push("");
  baris.push(`Undangan: ${window.location.href}`);
  return baris.join("\n");
}

function siapkanKalender(data, nw, np) {
  const mulai = waktuAcara(data.tanggal_acara);
  const selesai = waktuAcara(data.tanggal_acara, ACARA.durasiJam);
  const judul = `Pernikahan ${nw} & ${np}`; // CUSTOM: judul acara di kalender tamu
  const catatan = susunCatatan(data, nw, np);
  const lokasi = data.lokasi_acara || "";

  // Google Kalender: tautan siap pakai
  const g = new URL("https://calendar.google.com/calendar/render");
  g.searchParams.set("action", "TEMPLATE");
  g.searchParams.set("text", judul);
  g.searchParams.set("dates", `${formatUtc(mulai)}/${formatUtc(selesai)}`);
  g.searchParams.set("details", catatan);
  g.searchParams.set("location", lokasi);
  const linkGoogle = $("kal-google");
  if (linkGoogle) linkGoogle.href = g.toString();

  // Apple Kalender / Outlook: file .ics dibuat saat tombol ditekan
  const tombolIcs = $("kal-ics");
  if (!tombolIcs) return;
  tombolIcs.addEventListener("click", () => {
    const baris = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Wedding Code//Undangan Digital//ID",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${slugPasangan}-${mulai.getTime()}@weddingcode`,
      `DTSTAMP:${formatUtc(new Date())}`,
      `DTSTART:${formatUtc(mulai)}`,
      `DTEND:${formatUtc(selesai)}`,
      `SUMMARY:${escIcs(judul)}`,
      `LOCATION:${escIcs(lokasi)}`,
      `DESCRIPTION:${escIcs(catatan)}`,
      `URL:${window.location.href}`,
    ];
    PENGINGAT_MENIT.forEach((m) => {
      baris.push("BEGIN:VALARM", `TRIGGER:-PT${m}M`, "ACTION:DISPLAY", `DESCRIPTION:${escIcs(judul)}`, "END:VALARM");
    });
    baris.push("END:VEVENT", "END:VCALENDAR");

    const isiIcs = baris.map(lipatIcs).join("\r\n") + "\r\n";
    const blob = new Blob([isiIcs], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pernikahan-${slugPasangan}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
}

// Pratinjau peta sederhana (embed Google Maps tanpa API key)
function isiPeta(data) {
  const q = (PETA_QUERY || data.lokasi_acara || "").trim();
  const frame = $("peta");
  const wadah = $("peta-wrap");
  if (!frame || !wadah || !q) return;
  frame.src = "https://maps.google.com/maps?q=" + encodeURIComponent(q) + "&z=15&output=embed";
  wadah.classList.remove("hidden");
}


// ==========================================
// 2. HITUNG MUNDUR
// ==========================================
function mulaiHitungMundur(target) {
  if (!$("cd-hari")) return;
  const pad = (n) => String(n).padStart(2, "0");
  let timer = null;
  function tick() {
    const sisa = Math.floor((target.getTime() - Date.now()) / 1000);
    if (sisa <= 0) {
      ["cd-hari", "cd-jam", "cd-menit", "cd-detik"].forEach((id) => isi(id, "00"));
      $("cd-pesan")?.classList.remove("hidden");
      clearInterval(timer);
      return;
    }
    isi("cd-hari", pad(Math.floor(sisa / 86400)));
    isi("cd-jam", pad(Math.floor((sisa % 86400) / 3600)));
    isi("cd-menit", pad(Math.floor((sisa % 3600) / 60)));
    isi("cd-detik", pad(sisa % 60));
  }
  tick();
  timer = setInterval(tick, 1000);
}


  // ==========================================
  // LAGU (API untuk tema; tampilan tombolnya diurus tema)
  // ==========================================
  const musikEl = $("musik");
  const musik = {
    elemen: musikEl,
    play() { return musikEl ? musikEl.play().catch(() => {}) : undefined; },
    pause() { if (musikEl) musikEl.pause(); },
    toggle() { if (musikEl) { if (musikEl.paused) musik.play(); else musikEl.pause(); } },
    get sedangMain() { return !!musikEl && !musikEl.paused; },
    onUbah(fn) {
      if (!musikEl) return;
      musikEl.addEventListener("play", () => fn(true));
      musikEl.addEventListener("pause", () => fn(false));
    },
  };
  if (musikEl) {
    musikEl.volume = VOLUME_LAGU;
    // Lagu berhenti saat tab/aplikasi ditinggal, lanjut saat kembali (jika sebelumnya diputar)
    let diputarSebelumDitinggal = false;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        diputarSebelumDitinggal = !musikEl.paused;
        musikEl.pause();
      } else if (diputarSebelumDitinggal) {
        musik.play();
      }
    });
  }

// ==========================================
// 7. GIFT: tombol salin nomor rekening / alamat
// ==========================================
async function salinTeks(teks) {
  try {
    await navigator.clipboard.writeText(teks);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = teks;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    ta.remove();
    return ok;
  }
}
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-salin");
  if (!btn) return;
  const label = btn.querySelector(".btn-label") || btn;
  label.dataset.asli = label.dataset.asli || label.textContent;
  const ok = await salinTeks(btn.dataset.salin);
  label.textContent = ok ? "Tersalin" : "Gagal, salin manual"; // CUSTOM: teks konfirmasi
  clearTimeout(btn._timer);
  btn._timer = setTimeout(() => (label.textContent = label.dataset.asli), 2000);
});


// ==========================================
// 9. BUKU TAMU + BALASAN
// Ucapan dari tabel ucapan_tamu, balasan dari tabel balasan_ucapan (lihat SQL di panduan).
// Badge hadir/tidak hadir tidak ditampilkan di sini; rekapnya dilihat di halaman admin.
// ==========================================
let balasanAktif = true; // otomatis false kalau tabel balasan_ucapan belum dibuat
let ucapanIdAsli = new Map(); // id (teks) -> id asli dari database

function tglPendek(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function kartuUcapan(item, daftarBalasan) {
  const id = escapeHtml(String(item.id));
  const balasHtml = daftarBalasan
    .map(
      (b) => `
        <div class="u-balasan-item">
          <p class="u-balasan-nama font-quote text-base text-blush leading-tight">${escapeHtml(b.nama)}</p>
          <p class="u-balasan-isi text-ivory/65 leading-relaxed mt-0.5">${escapeHtml(b.isi)}</p>
        </div>`,
    )
    .join("");

  // CUSTOM: teks tombol "Balas", placeholder, dan batas panjang (maxlength) balasan
  const formBalas = balasanAktif
    ? `
      <button type="button" class="btn-balas u-btn-balas mt-3" data-balas="${id}">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 14L4 9l5-5M4 9h10a6 6 0 016 6v3"/></svg>
        Balas
      </button>
      <form class="form-balas u-form-balas hidden mt-3 space-y-2" data-id="${id}">
        <textarea rows="2" maxlength="300" required class="field" placeholder="Tulis balasan..."></textarea>
        <div class="flex items-center gap-2">
          <button type="submit" class="btn-mini">Kirim</button>
          <button type="button" class="btn-mini btn-mini-ghost btn-batal-balas">Batal</button>
          <span class="status-balas text-[11px] ml-1" aria-live="polite"></span>
        </div>
      </form>`
    : "";

  return `
    <div class="ucapan-card u-ucapan rounded-xl border border-blush/15 bg-white/[0.04] p-4 text-xs" data-id="${id}">
      <div class="flex justify-between items-baseline gap-3">
        <span class="u-nama font-quote text-lg text-ivory leading-tight">${escapeHtml(item.nama)}</span>
        <span class="u-tgl shrink-0 text-[10px] text-blush/50">${escapeHtml(tglPendek(item.dibuat_pada))}</span>
      </div>
      <p class="u-isi text-ivory/70 leading-relaxed mt-1.5">${escapeHtml(item.ucapan)}</p>
      ${balasHtml ? `<div class="u-balasan mt-3 ml-1 pl-3 border-l border-blush/25 space-y-3">${balasHtml}</div>` : ""}
      ${formBalas}
    </div>`;
}

async function muatUcapanRealtime(coupleId) {
  const wadah = $("daftar-ucapan");
  if (!wadah) return; // tema tanpa buku tamu: lewati
  const posisi = wadah.scrollTop;

  const [resU, resB] = await Promise.all([
    _supabase.from("ucapan_tamu").select("*").eq("pasangan_id", coupleId).order("dibuat_pada", { ascending: false }),
    _supabase.from("balasan_ucapan").select("*").eq("pasangan_id", coupleId).order("dibuat_pada", { ascending: true }),
  ]);

  if (resU.error || !resU.data || resU.data.length === 0) {
    wadah.innerHTML = '<p class="text-xs text-blush/60 text-center italic">Belum ada ucapan.</p>';
    return;
  }

  let balasan = [];
  if (resB.error) {
    balasanAktif = false;
    console.warn("Tabel balasan_ucapan belum siap, tombol Balas disembunyikan:", resB.error.message);
  } else {
    balasanAktif = true;
    balasan = resB.data || [];
  }

  const petaBalasan = new Map();
  balasan.forEach((b) => {
    const k = String(b.ucapan_id);
    if (!petaBalasan.has(k)) petaBalasan.set(k, []);
    petaBalasan.get(k).push(b);
  });
  ucapanIdAsli = new Map(resU.data.map((u) => [String(u.id), u.id]));

  // Semua teks dari tamu di-escape agar aman dari XSS
  wadah.innerHTML = resU.data.map((u) => kartuUcapan(u, petaBalasan.get(String(u.id)) || [])).join("");
  wadah.scrollTop = posisi;
}


  const daftarEl = $("daftar-ucapan");
  const formRsvp = $("rsvp-form");

// Buka/tutup form balasan
if (daftarEl) daftarEl.addEventListener("click", (e) => {
  const tombol = e.target.closest(".btn-balas");
  if (tombol) {
    const form = tombol.closest(".ucapan-card").querySelector(".form-balas");
    form.classList.toggle("hidden");
    if (!form.classList.contains("hidden")) form.querySelector("textarea").focus();
    return;
  }
  const batal = e.target.closest(".btn-batal-balas");
  if (batal) batal.closest(".form-balas").classList.add("hidden");
});

// Kirim balasan ke Supabase
if (daftarEl) daftarEl.addEventListener("submit", async (e) => {
  const form = e.target.closest(".form-balas");
  if (!form) return;
  e.preventDefault();

  const isiBalasan = form.querySelector("textarea").value.trim();
  const status = form.querySelector(".status-balas");
  if (!isiBalasan || !currentCoupleId) return;

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  status.className = "status-balas u-status text-[11px] ml-1 text-blush";
  status.textContent = "Mengirim...";

  const { error } = await _supabase.from("balasan_ucapan").insert([
    {
      ucapan_id: ucapanIdAsli.get(form.dataset.id),
      pasangan_id: currentCoupleId,
      nama: namaPengirim(),
      isi: isiBalasan,
    },
  ]);

  if (error) {
    status.className = "status-balas u-status u-status-galat text-[11px] ml-1 text-rose-300";
    status.textContent = "Gagal: " + error.message;
    btn.disabled = false;
  } else {
    muatUcapanRealtime(currentCoupleId); // daftar digambar ulang beserta balasan baru
  }
});

// ==========================================
// 10. KIRIM RSVP & UCAPAN KE SUPABASE
// ==========================================
function tampilStatus(teks, galat) {
  const el = $("rsvp-status");
  if (!el) return;
  el.textContent = teks;
  el.className = "u-status " + (galat ? "u-status-galat " : "u-status-ok ") + "text-center text-xs min-h-[1rem] " + (galat ? "text-rose-300" : "text-emerald-300");
}

if (formRsvp) formRsvp.addEventListener("submit", async (e) => {
  e.preventDefault();

  const ucapan = $("input-ucapan").value.trim();
  if (!currentCoupleId) {
    tampilStatus("Data belum termuat. Coba muat ulang halaman.", true);
    return;
  }
  if (!ucapan) {
    tampilStatus("Silakan tulis ucapan terlebih dahulu.", true);
    return;
  }

  const btn = $("submit-btn");
  const labelAsli = btn.textContent;
  btn.textContent = "Mengirim...";
  btn.disabled = true;

  const { error } = await _supabase.from("ucapan_tamu").insert([
    {
      pasangan_id: currentCoupleId,
      nama: namaPengirim(),
      kehadiran: $("input-kehadiran").value,
      ucapan,
    },
  ]);

  if (error) {
    tampilStatus("Gagal mengirim pesan: " + error.message, true);
  } else {
    // CUSTOM: pesan sukses
    tampilStatus("Terima kasih, ucapan Anda sudah terkirim.", false);
    $("input-ucapan").value = "";
    muatUcapanRealtime(currentCoupleId);
  }

  btn.textContent = labelAsli;
  btn.disabled = false;
});


  // ==========================================
  // JALANKAN
  // ==========================================
  window.Undangan = {
    $, isi, escapeHtml, reduceMotion, salinTeks,
    supabase: _supabase,
    slug: slugPasangan,
    namaTamu: namaTamuParam,
    config: K,
    musik,
    saatData,
    get data() { return detailData; },
  };

  function mulai() {
    loadWeddingData();
    // Diagnosa: beri tahu di Console (F12) kalau ada gambar yang gagal dimuat
    document.querySelectorAll("img").forEach((img) => {
      img.addEventListener("error", () => {
        console.warn("Gambar gagal dimuat, cek nama/lokasi file:", img.getAttribute("src"));
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mulai);
  else mulai();
})();
