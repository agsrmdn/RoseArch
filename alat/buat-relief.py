"""Generator relief plester v3 (tema Relief).
Peta tinggi (SVG, kecerahan = tinggi) -> dirender Chromium -> pencahayaan fisik di numpy
(normal + spekular + ambient occlusion + bayangan jatuh) -> RGBA highlight/bayangan (WebP).
Hasil transparan, jadi menyatu dengan warna palet apa pun."""
import math, random, io, sys
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

# ---------------------------------------------------------------- util
def g(v):
    v = max(0, min(1, v)); c = int(round(v * 255)); return f"rgb({c},{c},{c})"

def gauss(a, s):
    if s <= 0: return a
    h, w = a.shape
    ky = np.fft.fftfreq(h)[:, None]; kx = np.fft.rfftfreq(w)[None, :]
    G = np.exp(-2 * (np.pi ** 2) * (s ** 2) * (kx ** 2 + ky ** 2))
    return np.fft.irfft2(np.fft.rfft2(a) * G, s=a.shape)

_uid = [0]
def uid(p="g"):
    _uid[0] += 1; return f"{p}{_uid[0]}"

DEFS = [f'''<radialGradient id="gBola" cx=".38" cy=".33" r=".72"><stop offset="0" stop-color="{g(.98)}"/><stop offset=".6" stop-color="{g(.6)}"/><stop offset="1" stop-color="{g(.18)}"/></radialGradient>''']

def rgrad(base, spread=.34, cy=.32, r=.8):
    i = uid("p")
    DEFS.append(f'<radialGradient id="{i}" cx=".5" cy="{cy}" r="{r}"><stop offset="0" stop-color="{g(base+spread*.6)}"/><stop offset=".55" stop-color="{g(base)}"/><stop offset="1" stop-color="{g(base-spread*.55)}"/></radialGradient>')
    return i

# ---------------------------------------------------------------- bentuk
def lintasan(pts):
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"

def kelopak(a, L, W, base, ruffle=.08, takik=0.0):
    """kelopak peony: ujung membulat, tepi atas bergelombang lembut."""
    n = 44; kanan = []
    for i in range(n + 1):
        s = i / n
        w = W * math.sin(math.pi * s ** 0.72) ** 0.9
        if s > .55: w *= 1 + ruffle * math.sin(s * 13 + 1.2) * (s - .45) * 2.0
        kanan.append((w, -L * s))
    kiri = [(-x, y) for x, y in reversed(kanan)]
    gid = rgrad(base, .30)
    alur = f'<path d="M0 {-L*.1:.1f}Q{W*.04:.1f} {-L*.5:.1f} 0 {-L*.8:.1f}" stroke="{g(base-.1)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
    return f'<g transform="rotate({a:.1f})"><path d="{lintasan(kanan + kiri)}" fill="url(#{gid})" stroke="{g(base-.12)}" stroke-width=".9" stroke-linejoin="round"/>{alur}</g>'

def peony(cx, cy, R, rnd, rot=0):
    out = []
    lapis = 7
    for k in range(lapis):
        frac = 1 - k / lapis
        n = 9 - (k // 2) + (1 if k % 2 else 0)
        n = max(5, n)
        pj = R * (0.45 + 0.62 * frac); lb = R * (0.30 + 0.2 * frac)
        base = .2 + .1 * k
        off = rnd.uniform(0, 360) + rot
        for i in range(n):
            a = off + i * 360 / n + rnd.uniform(-7, 7)
            out.append(kelopak(a, pj * rnd.uniform(.92, 1.06), lb, base, ruffle=.14 * frac + .05))
    for r, v in ((R * .17, .74), (R * .11, .84), (R * .06, .94)):
        out.append(f'<circle r="{r:.1f}" fill="{g(v)}" stroke="{g(v-.25)}" stroke-width="1"/>')
    for i in range(10):
        a = i * 36 + rnd.uniform(-10, 10); d = R * .24
        out.append(f'<circle cx="{d*math.cos(math.radians(a)):.1f}" cy="{d*math.sin(math.radians(a)):.1f}" r="{R*.026:.1f}" fill="{g(.96)}"/>')
    return f'<g transform="translate({cx:.1f},{cy:.1f})">{"".join(out)}</g>'

def tunas(cx, cy, R, rnd):
    """kuncup mawar: kelopak melingkar rapat."""
    out = []
    for k in range(4):
        n = 5 - (k > 1)
        for i in range(n):
            a = i * 360 / n + k * 31 + rnd.uniform(-8, 8)
            out.append(kelopak(a, R * (1 - .2 * k), R * (.52 - .07 * k), .3 + .14 * k, ruffle=.05))
    out.append(f'<circle r="{R*.12:.1f}" fill="{g(.9)}" stroke="{g(.6)}" stroke-width=".8"/>')
    return f'<g transform="translate({cx:.1f},{cy:.1f}) rotate({rnd.uniform(0,360):.0f})">{"".join(out)}</g>'

def bunga5(cx, cy, R, rnd):
    out = []; rot = rnd.uniform(0, 72)
    for i in range(5):
        a = rot + i * 72
        n = 18; kn = []
        for j in range(n + 1):
            s = j / n; w = R * .5 * math.sin(math.pi * s ** .9)
            kn.append((w, -R * s))
        kr = [(-x, y) for x, y in reversed(kn)]
        # takik di ujung kelopak (bentuk hati)
        kr[0] = (0, -R * .86)
        gid = rgrad(.42, .3)
        out.append(f'<path transform="rotate({a:.1f})" d="{lintasan(kn+kr)}" fill="url(#{gid})" stroke="{g(.26)}" stroke-width="1"/>')
    out.append(f'<circle r="{R*.22:.1f}" fill="url(#gBola)"/>')
    for i in range(9):
        a = i * 40; out.append(f'<circle cx="{R*.34*math.cos(math.radians(a)):.1f}" cy="{R*.34*math.sin(math.radians(a)):.1f}" r="{R*.05:.1f}" fill="{g(.9)}"/>')
    return f'<g transform="translate({cx:.1f},{cy:.1f})">{"".join(out)}</g>'

def daun(x, y, ang, L, W, base=.5):
    n = 22; kn = []
    for i in range(n + 1):
        s = i / n; w = W * math.sin(math.pi * s ** .8) * (1 + .09 * math.sin(s * 34) * (s > .15))
        kn.append((w, -L * s))
    kr = [(-xx, yy) for xx, yy in reversed(kn)]
    gid = rgrad(base, .36, .5, .7)
    urat = "".join(
        f'<path d="M0 {-L*t:.1f}L{W*.8*(1-t*.6):.1f} {-L*(t+.14):.1f}M0 {-L*t:.1f}L{-W*.8*(1-t*.6):.1f} {-L*(t+.14):.1f}" stroke="{g(base+.18)}" stroke-width="1.1" fill="none" stroke-linecap="round"/>'
        for t in (.22, .38, .54, .7))
    return (f'<g transform="translate({x:.1f},{y:.1f}) rotate({ang:.1f})"><path d="{lintasan(kn+kr)}" fill="url(#{gid})" stroke="{g(base-.25)}" stroke-width="1"/>'
            f'<path d="M0 -2L0 {-L*.92:.1f}" stroke="{g(base+.3)}" stroke-width="{max(1.4,W*.09):.1f}" stroke-linecap="round"/>{urat}</g>')

def beri(cx, cy, r):
    return f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="url(#gBola)" stroke="{g(.15)}" stroke-width=".8"/>'

def ranting(x0, y0, x1, y1, lengkung, rnd, n=6, L=36, beri_ok=True, tebal=3.2):
    mx, my = (x0 + x1) / 2 + lengkung, (y0 + y1) / 2 - lengkung * .6
    p = [f'<path d="M{x0:.1f} {y0:.1f}Q{mx:.1f} {my:.1f} {x1:.1f} {y1:.1f}" fill="none" stroke="{g(.6)}" stroke-width="{tebal}" stroke-linecap="round"/>']
    for i in range(1, n + 1):
        t = i / (n + 1)
        x = (1-t)**2*x0 + 2*(1-t)*t*mx + t*t*x1; y = (1-t)**2*y0 + 2*(1-t)*t*my + t*t*y1
        dx = 2*(1-t)*(mx-x0) + 2*t*(x1-mx); dy = 2*(1-t)*(my-y0) + 2*t*(y1-my)
        ang = math.degrees(math.atan2(dy, dx)) + 90
        for s in (-1, 1):
            p.append(daun(x, y, ang + s * rnd.uniform(45, 70), L * rnd.uniform(.75, 1.1), L * .27, rnd.uniform(.44, .58)))
        if beri_ok and i % 2 == 0: p.append(beri(x + rnd.uniform(-7, 7), y + rnd.uniform(-7, 7), 4.2))
    p.append(beri(x1, y1, 4.6))
    return "".join(p)

def sulur(x, y, ang, ukuran, rnd):
    """tendril: spiral renda."""
    pts = []
    for i in range(40):
        t = i / 39; r = ukuran * (1 - t) ** 1.2; a = math.radians(ang) + t * 9.5
        pts.append((x + (t * ukuran * 2.2) * math.cos(math.radians(ang)) + r * .55 * math.cos(a), y + (t * ukuran * 2.2) * math.sin(math.radians(ang)) + r * .55 * math.sin(a)))
    d = "M" + " L".join(f"{a:.1f} {b:.1f}" for a, b in pts)
    return f'<path d="{d}" fill="none" stroke="{g(.55)}" stroke-width="2.2" stroke-linecap="round"/>' + beri(*pts[-1], 3.2)

def pakis(x, y, ang, L, rnd):
    p = [f'<path transform="translate({x:.1f},{y:.1f}) rotate({ang:.1f})" d="M0 0Q{L*.08:.1f} {-L*.5:.1f} 0 {-L}" fill="none" stroke="{g(.58)}" stroke-width="2.6" stroke-linecap="round"/>']
    n = 9
    for i in range(1, n + 1):
        t = i / (n + 1)
        for s in (-1, 1):
            p.append(daun(0, -L * t, s * (62 + 10 * t), L * .22 * (1 - t * .55), L * .05, .5).replace('<g transform="', f'<g transform="translate({x:.1f},{y:.1f}) rotate({ang:.1f}) ', 1)
                     .replace(f'translate(0.0,{-L*t:.1f})', f'translate(0,{-L*t:.1f})'))
    return "".join(p)

# ---------------------------------------------------------------- gugus (komposisi sudut)
def gugus(rnd, S=1.0, rapat=1.0):
    bw = []   # lapisan bawah
    for (x0, y0, x1, y1, l) in [(30, 70, 570, 250, 46), (70, 30, 250, 590, -44), (30, 30, 480, 480, 22), (100, 250, 400, 590, -34), (240, 60, 610, 150, 24)]:
        bw.append(ranting(x0, y0, x1, y1, l, rnd, 6, 38))
    for (x, y, a, uk) in [(120, 120, 20, 30), (210, 90, 60, 26), (80, 260, 80, 28), (300, 190, 40, 24), (160, 330, 70, 24)]:
        bw.append(sulur(x, y, a + rnd.uniform(-20, 20), uk, rnd))
    for (x, y, a, L) in [(40, 330, -10, 120), (330, 40, 80, 120), (250, 330, 30, 100)]:
        bw.append(pakis(x, y, a, L, rnd))
    dn = []
    for _ in range(int(34 * rapat)):
        x = 30 + rnd.random() * 520; y = 30 + rnd.random() * 520
        if x + y > 760: continue
        dn.append(daun(x, y, rnd.uniform(0, 360), rnd.uniform(42, 78), rnd.uniform(11, 18), rnd.uniform(.44, .6)))
    bg = []
    for (cx, cy, R) in [(150, 40, 24), (40, 150, 24), (330, 90, 24), (90, 380, 24), (250, 230, 28), (190, 160, 26), (400, 250, 20), (260, 420, 20), (430, 130, 20), (130, 250, 22), (340, 330, 22), (60, 470, 18), (480, 60, 18)]:
        bg.append(bunga5(cx, cy, R, rnd))
    pn = []; defs_n = []
    for (cx, cy, R) in [(100, 96, 112), (310, 62, 68), (58, 316, 72), (236, 232, 60), (420, 170, 44), (166, 410, 48)]:
        pn.append(peony(cx, cy, R, rnd, rnd.uniform(0, 360)))
    tn = [tunas(x, y, r, rnd) for (x, y, r) in [(200, 130, 26), (130, 200, 26), (372, 118, 22), (110, 350, 24), (300, 280, 22), (50, 410, 20)]]
    br = []
    for _ in range(int(38 * rapat)):
        x = rnd.uniform(50, 540); y = rnd.uniform(50, 540)
        if x + y < 700: br.append(beri(x, y, rnd.uniform(3, 6)))
    return "".join(bw + dn + bg + pn + tn + br)

def tata(body, S, x, y, sx=1, sy=1, klip=None):
    c = f' clip-path="url(#{klip})"' if klip else ""
    return f'<g{c}><g transform="translate({x},{y}) scale({sx*S},{sy*S})">{body}</g></g>'

# ---------------------------------------------------------------- render + cahaya
def svg_doc(W, H, vbw, vbh, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {vbw} {vbh}"><defs>{"".join(DEFS)}</defs>'
            f'<rect width="{vbw}" height="{vbh}" fill="#000"/>{body}</svg>')

def render_tinggi(page, body, vbw, vbh, W, H):
    page.set_viewport_size({"width": W, "height": H})
    page.set_content(f'<html><body style="margin:0;background:#000">{svg_doc(W,H,vbw,vbh,body)}</body></html>')
    page.wait_for_timeout(250)
    png = page.screenshot(clip={"x": 0, "y": 0, "width": W, "height": H}, type="png")
    return np.asarray(Image.open(io.BytesIO(png)).convert("L"), dtype=np.float32) / 255.0

def cahaya(h, kedalaman=14, halus=1.1, sh=(96, 50, 42), krem=(255, 247, 238), kuat=1.0, pad=True):
    PAD = 40 if pad else 0
    if pad: h = np.pad(h, PAD, mode="edge")
    hs = gauss(h, halus)
    dy, dx = np.gradient(hs)
    nx, ny = -dx * kedalaman, -dy * kedalaman
    nz = np.ones_like(nx); ln = np.sqrt(nx*nx + ny*ny + nz*nz); nx, ny, nz = nx/ln, ny/ln, nz/ln
    L = np.array([-.52, -.68, .52]); L /= np.linalg.norm(L)
    diff = nx*L[0] + ny*L[1] + nz*L[2]
    shade = diff - L[2]
    Hv = L + np.array([0, 0, 1.0]); Hv /= np.linalg.norm(Hv)
    spec = np.clip(nx*Hv[0] + ny*Hv[1] + nz*Hv[2], 0, 1) ** 70
    ao = np.clip(gauss(h, 6) - h, 0, 1)
    lambat = np.roll(h, (int(9), int(11)), axis=(0, 1))
    cast = np.clip(gauss(lambat, 3.2) - h - .015, 0, 1)
    lift = gauss(h, .8)
    gelap = np.clip(-shade * 2.7 + ao * 1.25 + cast * 1.15, 0, 1) * kuat
    terang = np.clip(shade * 2.3 + spec * .85 + lift * .24, 0, 1) * kuat
    a_d = gelap * .66; a_l = terang * .88
    a = a_l + a_d * (1 - a_l)
    c_l = np.array(krem, dtype=np.float32); c_d = np.array(sh, dtype=np.float32)
    with np.errstate(divide="ignore", invalid="ignore"):
        w = np.where(a > 1e-4, a_l / a, 0)[..., None]
    rgb = c_l * w + c_d * (1 - w)
    rgba = np.dstack([rgb, a * 255])
    if pad: rgba = rgba[PAD:-PAD, PAD:-PAD]
    return Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), "RGBA")

def simpan(im, path, q=80):
    im.save(path, "WEBP", quality=q, method=6, alpha_quality=92)

def buat(page, body, vbw, vbh, W, H, path, kedalaman=14, q=80, oversample=1.6, halus=1.1):
    Wr, Hr = int(W * oversample), int(H * oversample)
    h = render_tinggi(page, body, vbw, vbh, Wr, Hr)
    img = Image.fromarray((h * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    h2 = np.asarray(img, dtype=np.float32) / 255.0
    im = cahaya(h2, kedalaman, halus)
    simpan(im, path, q); return im

def preview(path, out, warna=(235, 205, 191)):
    im = Image.open(path).convert("RGBA"); bg = Image.new("RGBA", im.size, warna + (255,)); bg.alpha_composite(im); bg.convert("RGB").save(out)

# ---------------------------------------------------------------- komposisi aset
def punggung(d, lebar_tinggi):
    """lis timbul bulat: beberapa goresan menumpuk, makin sempit makin tinggi."""
    return "".join(f'<path d="{d}" fill="none" stroke="{g(h)}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>' for w, h in lebar_tinggi)

def skala_path(path, sx, sy, cx, cy):
    import re
    toks = re.findall(r"[A-Za-z]|-?\d+\.?\d*", path); out = []; idx = 0
    for t in toks:
        if t.isalpha(): out.append(t); idx = 0
        else:
            v = float(t); v = cx + (v - cx) * sx if idx % 2 == 0 else cy + (v - cy) * sy
            out.append(f"{v:.1f}"); idx += 1
    return " ".join(out)

ARCH = "M2 540 L2 128 C2 104 16 94 34 88 C70 76 96 58 114 36 C126 20 136 2 150 2 C164 2 174 20 186 36 C204 58 230 76 266 88 C284 94 298 104 298 128 L298 540 Q298 558 280 558 L20 558 Q2 558 2 540Z"

def pintu_body(W=390, H=844):
    DEFS.append(f'<clipPath id="kL"><rect x="0" y="0" width="{W/2-9}" height="{H}"/></clipPath><clipPath id="kR"><rect x="{W/2+9}" y="0" width="{W/2-9}" height="{H}"/></clipPath>')
    r = random.Random
    kiri = (tata(gugus(r(21)), .64, -34, -26, 1, 1) + tata(gugus(r(22), rapat=.8), .6, -34, H + 26, 1, -1)
            + ranting(10, H * .36, 34, H * .62, -26, r(31), 8, 34) + ranting(60, H * .44, 84, H * .58, 20, r(32), 5, 26))
    kanan = (tata(gugus(r(23), rapat=.8), .52, W + 34, -26, -1, 1) + tata(gugus(r(24)), .68, W + 34, H + 26, -1, -1)
             + ranting(W - 10, H * .3, W - 36, H * .56, 26, r(33), 8, 34) + ranting(W - 60, H * .38, W - 82, H * .5, -20, r(34), 5, 26))
    lis = "".join(punggung(f"M{x} 14L{x} {H-14}", [(15, .14), (11, .24), (7, .34), (3, .42)]) for x in (W / 2 - 13, W / 2 + 13))
    return f'<g clip-path="url(#kL)">{kiri}</g><g clip-path="url(#kR)">{kanan}</g>{lis}'

def segel_body(rnd):
    cx, cy = 210, 280
    b = [f'<ellipse cx="{cx}" cy="{cy}" rx="196" ry="266" fill="{g(.5)}" stroke="{g(.92)}" stroke-width="10"/>',
         f'<ellipse cx="{cx}" cy="{cy}" rx="164" ry="234" fill="{g(.26)}" stroke="{g(.78)}" stroke-width="4"/>']
    for i in range(52):
        a = i * 2 * math.pi / 52
        b.append(f'<circle cx="{cx+180*math.cos(a):.1f}" cy="{cy+250*math.sin(a):.1f}" r="4.6" fill="url(#gBola)"/>')
    b.append(f'<path d="M210 460Q204 380 210 280T210 120" fill="none" stroke="{g(.68)}" stroke-width="5" stroke-linecap="round"/>')
    for (y, ang, L) in [(410, -52, 78), (410, 52, 78), (360, -62, 70), (360, 62, 70), (308, -56, 62), (308, 56, 62)]:
        b.append(daun(210, y, ang, L, 18, .56))
    b.append(peony(210, 250, 62, rnd, 20))
    for (x, y) in [(156, 168), (264, 172), (210, 128)]:
        b.append(bunga5(x, y, 26, rnd))
    for (x, y) in [(140, 330), (280, 336), (120, 266), (300, 262)]:
        b.append(beri(x, y, 6))
    return "".join(b)

def bingkai_body(rnd):
    luar = skala_path(ARCH, 2, 2, 0, 0)
    dalam = skala_path(ARCH, (300 - 22) / 300, (560 - 22) / 560, 150, 280); dalam = skala_path(dalam, 2, 2, 0, 0)
    b = punggung(luar, [(18, .2), (13, .32), (8.5, .46), (4.5, .6), (2, .72)])
    b += punggung(dalam, [(9, .24), (5.5, .4), (2.4, .56), (1, .66)])
    b += bunga5(300, 30, 26, rnd) + daun(300, 56, 42, 62, 16, .52) + daun(300, 56, -42, 62, 16, .52)
    return f'<g transform="translate(24,24)">{b}</g>'

KARTUS_BESAR = "M84 6 L216 6 C230 6 236 22 250 32 C264 42 282 40 294 56 L294 324 C282 340 264 338 250 348 C236 358 230 374 216 374 L84 374 C70 374 64 358 50 348 C36 338 18 340 6 324 L6 56 C18 40 36 42 50 32 C64 22 70 6 84 6 Z"
KARTUS_KECIL = "M40 4 L160 4 C170 4 176 16 186 22 C194 27 198 36 196 48 C198 60 194 69 186 74 C176 80 170 92 160 92 L40 92 C30 92 24 80 14 74 C6 69 2 60 4 48 C2 36 6 27 14 22 C24 16 30 4 40 4 Z"

def kartus_body(path, vbw, vbh, sk, ornamen, rnd, inner=None, oy=None):
    """bingkai kartus berelief: lis ganda + ornamen bunga kecil di tengah atas/bawah."""
    luar = skala_path(path, sk, sk, 0, 0)
    ix, iy = inner or ((.93, .86) if vbw < 250 else (.94, .95))
    dalam = skala_path(skala_path(path, ix, iy, vbw / 2, vbh / 2), sk, sk, 0, 0)
    oy = oy if oy is not None else (4 if vbw < 250 else 6)
    b = punggung(luar, [(10, .2), (7, .34), (4.5, .5), (2, .64)])
    b += punggung(dalam, [(5, .26), (2.6, .44), (1, .56)])
    R = ornamen * sk
    for (cx, cy, rot) in ((vbw / 2 * sk, oy * sk, 0), (vbw / 2 * sk, (vbh - oy) * sk, 180)):
        b += f'<g transform="translate({cx:.1f},{cy:.1f}) rotate({rot})">' + bunga5(0, 0, R, rnd) + daun(0, R * .6, 62, R * 2.1, R * .55, .52) + daun(0, R * .6, -62, R * 2.1, R * .55, .52) + '</g>'
    return f'<g transform="translate(24,24)">{b}</g>'

def kelopak_bulat(a, L, W, base):
    """kelopak lebar berujung bulat (bunga mekar), ada lekukan halus di tengah."""
    n = 40; kn = []
    for i in range(n + 1):
        s_ = i / n
        kn.append((W * (math.sin(math.pi * s_ ** 0.62)) ** 0.7, -L * s_))
    kr = [(-x, y) for x, y in reversed(kn)]
    gid = rgrad(base, .36, .3, .85)
    return (f'<g transform="rotate({a:.1f})"><path d="{lintasan(kn + kr)}" fill="url(#{gid})" stroke="{g(base-.14)}" stroke-width="1" stroke-linejoin="round"/>'
            f'<path d="M0 {-L*.12:.1f}Q{W*.03:.1f} {-L*.5:.1f} 0 {-L*.78:.1f}" stroke="{g(base-.1)}" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>')

def bunga_musik_body(rnd):
    """bunga mekar simetris untuk tombol musik: cincin daun kecil + 4 lapis kelopak bulat + putik bermanik."""
    c = 128; b = []
    for i in range(10):
        b.append(daun(c, c, i * 36 + 18, 122, 15, .46))
    for (n, L, W, base, off) in [(9, 106, 44, .30, 0), (9, 86, 42, .42, 20), (8, 66, 36, .54, 0), (6, 44, 26, .68, 30)]:
        for i in range(n):
            b.append(f'<g transform="translate({c},{c})">' + kelopak_bulat(off + i * 360 / n, L, W, base) + '</g>')
    b.append(f'<circle cx="{c}" cy="{c}" r="14" fill="{g(.8)}" stroke="{g(.55)}" stroke-width="1"/>')
    for i in range(12):
        a_ = math.radians(i * 30)
        b.append(f'<circle cx="{c+23*math.cos(a_):.1f}" cy="{c+23*math.sin(a_):.1f}" r="2.6" fill="{g(.95)}"/>')
    b.append(f'<circle cx="{c}" cy="{c}" r="7" fill="url(#gBola)"/>')
    return "".join(b)

PELAT_TAMU = None

def tekstur_plester(n=512, seed=3):
    rng = np.random.default_rng(seed)
    h = np.zeros((n, n), dtype=np.float32)
    for sg, amp in ((1.2, .5), (3, .6), (9, .5), (26, .35)):
        z = rng.standard_normal((n, n)).astype(np.float32); z = gauss(z, sg); z /= z.std() + 1e-6; h += z * amp
    h = (h - h.min()) / (h.max() - h.min())
    im = cahaya(h, kedalaman=5.0, halus=.6, kuat=.55, pad=False)
    return im

if __name__ == "__main__":
    out = sys.argv[1]; modus = sys.argv[2] if len(sys.argv) > 2 else "semua"
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        if modus in ("sudut", "semua"):
            buat(pg, tata(gugus(random.Random(5)), 1, 0, 0), 640, 640, 720, 720, f"{out}/relief-sudut.webp", kedalaman=16, q=78)
            preview(f"{out}/relief-sudut.webp", f"{out}/p_sudut.png"); print("sudut ok")
        if modus in ("segel", "semua"):
            buat(pg, segel_body(random.Random(3)), 420, 560, 420, 560, f"{out}/relief-segel.webp", kedalaman=15, q=82)
            preview(f"{out}/relief-segel.webp", f"{out}/p_segel.png"); print("segel ok")
        if modus in ("pintu", "semua"):
            buat(pg, pintu_body(), 390, 844, 624, 1350, f"{out}/relief-pintu.webp", kedalaman=12, q=70)
            preview(f"{out}/relief-pintu.webp", f"{out}/p_pintu.png"); print("pintu ok")
        if modus in ("tanggal", "semua"):
            buat(pg, kartus_body(KARTUS_BESAR, 300, 380, 2, 15, random.Random(11)), 648, 808, 648, 808, f"{out}/relief-kartus-besar.webp", kedalaman=9, q=80)
            preview(f"{out}/relief-kartus-besar.webp", f"{out}/p_kartus_besar.png"); print("kartus besar ok")
            buat(pg, kartus_body(KARTUS_KECIL, 200, 96, 2, 9, random.Random(12)), 448, 240, 448, 240, f"{out}/relief-kartus-kecil.webp", kedalaman=7, q=82)
            preview(f"{out}/relief-kartus-kecil.webp", f"{out}/p_kartus_kecil.png"); print("kartus kecil ok")
        if modus in ("pelat", "semua"):
            path = skala_path(KARTUS_KECIL, 1.5, 1.5, 0, 0)
            buat(pg, kartus_body(path, 300, 144, 2, 11, random.Random(13), inner=(.94, .84), oy=4), 648, 336, 648, 336, f"{out}/relief-pelat-tamu.webp", kedalaman=8, q=82)
            preview(f"{out}/relief-pelat-tamu.webp", f"{out}/p_pelat.png"); print("pelat ok")
        if modus in ("bunga", "semua"):
            buat(pg, bunga_musik_body(random.Random(4)), 256, 256, 256, 256, f"{out}/relief-bunga-musik.webp", kedalaman=11, q=84)
            preview(f"{out}/relief-bunga-musik.webp", f"{out}/p_bunga.png"); print("bunga ok")
        if modus in ("bingkai", "semua"):
            buat(pg, bingkai_body(random.Random(9)), 648, 1168, 648, 1168, f"{out}/relief-bingkai.webp", kedalaman=9, q=80)
            preview(f"{out}/relief-bingkai.webp", f"{out}/p_bingkai.png"); print("bingkai ok")
        b.close()
    if modus in ("tekstur", "semua"):
        simpan(tekstur_plester(), f"{out}/tekstur-plester.webp", 80); print("tekstur ok")
