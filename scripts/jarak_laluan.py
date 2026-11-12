"""Kira jarak laluan sebenar dari PPD Dalat ke setiap sekolah untuk senarai Lokasi Sekolah.

Peraturan sama seperti panel arah (public/assets/ppd-lokasi.js):
  - Jalan raya (OSRM) jika munasabah: kedua-dua hujung <= 1.5 km dari jalan, dan jarak <= max(4 x garis lurus, garis lurus + 10 km).
  - Jika tidak, sungai (graf public/assets/ppd-sungai.js) jika tebing <= 3 km dari kedua-dua tempat; masa pada 25 km/j.
  - Jika kedua-duanya tiada, guna laluan jalan yang panjang dan tandakan 'jauh'.
Output: blok JS JARAK_LALUAN untuk ditampal/diganti dalam ppd-lokasi.js.

Guna:  python scripts/jarak_laluan.py public/assets/ppd-lokasi.js public/assets/ppd-sungai.js > jarak.js
"""
import heapq, json, math, re, sys, time, urllib.request

lokasi_js, sungai_js = sys.argv[1], sys.argv[2]
src = open(lokasi_js, encoding='utf-8').read()
tempat = [(n, j, float(a), float(b)) for n, j, a, b in re.findall(r"nama: '([^']+)',\s+jenis: '(\w+)',\s+lat: ([\d.]+), lng: ([\d.]+)", src)]
SG = json.loads(re.search(r'window\.PPDSungai = (\{.*\});', open(sungai_js, encoding='utf-8').read(), re.S).group(1))
ppd = next(t for t in tempat if t[1] == 'PPD')

def garis(a, b):
    R, r = 6371, math.radians
    x = math.sin(r(b[0] - a[0]) / 2) ** 2 + math.cos(r(a[0])) * math.cos(r(b[0])) * math.sin(r(b[1] - a[1]) / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))

jiran = [[] for _ in SG['simpul']]
for i, t in enumerate(SG['tepi']):
    jiran[t[0]].append((t[1], t[2])); jiran[t[1]].append((t[0], t[2]))

def sungai(nA, nB):
    a, b = SG['akses'].get(nA), SG['akses'].get(nB)
    if not a or not b or a[1] > 3 or b[1] > 3: return None
    d = {a[0]: 0}; h = [(0, a[0])]
    while h:
        x, u = heapq.heappop(h)
        if u == b[0]: return x
        if x > d[u]: continue
        for v, w in jiran[u]:
            if x + w < d.get(v, 1e9): d[v] = x + w; heapq.heappush(h, (x + w, v))
    return None

out = {}
for nama, jenis, lat, lng in tempat:
    if jenis == 'PPD': continue
    g = garis((ppd[2], ppd[3]), (lat, lng))
    u = f"https://router.project-osrm.org/route/v1/driving/{ppd[3]},{ppd[2]};{lng},{lat}?overview=false"
    j = json.load(urllib.request.urlopen(u, timeout=30)); time.sleep(0.4)
    r, snaps = j['routes'][0], [w['distance'] for w in j['waypoints']]
    jalan_km, jalan_min = r['distance'] / 1000, r['duration'] / 60
    ok = max(snaps) <= 1500 and jalan_km <= max(4 * g, g + 10)
    s = sungai(ppd[0], nama)
    if ok:
        out[nama] = [round(jalan_km, 1), round(jalan_min), 'jalan']
    elif s is not None:
        out[nama] = [round(s, 1), round(s / 25 * 60), 'sungai']
    else:
        out[nama] = [round(jalan_km, 1), round(jalan_min), 'jauh']
    print(f"{nama:28} garis {g:5.1f}  -> {out[nama]}", file=sys.stderr)

print('  const JARAK_LALUAN = {')
for n, v in out.items():
    print(f"    '{n}': {json.dumps(v)},")
print('  };')
