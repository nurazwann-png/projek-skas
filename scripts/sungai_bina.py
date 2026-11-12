"""Bina graf sungai padat untuk pelayar.
Input: sungai_osm.json (Overpass), ppd-lokasi.js (koordinat tempat). Output: ppd-sungai.js.
Simpul graf = simpang, hujung sungai, dan titik sungai terdekat bagi setiap tempat.
Setiap tepi menyimpan panjang (km) dan garis yang dipermudah (Douglas-Peucker)."""
import json, sys, re, math, heapq
from collections import defaultdict

osm = json.load(open(sys.argv[1], encoding='utf-8'))
src = open(sys.argv[2], encoding='utf-8').read()
JENIS_OK = set(sys.argv[4].split(',')) if len(sys.argv) > 4 else {'river', 'canal'}
tempat = [(n, (float(a), float(b))) for n, j, a, b in re.findall(r"nama: '([^']+)',\s+jenis: '(\w+)',\s+lat: ([\d.]+), lng: ([\d.]+)", src)]

def km(a, b):
    R, r = 6371, math.radians
    x = math.sin(r(b[0] - a[0]) / 2) ** 2 + math.cos(r(a[0])) * math.cos(r(b[0])) * math.sin(r(b[1] - a[1]) / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))

key = lambda p: (round(p['lat'], 6), round(p['lon'], 6))
adj = defaultdict(dict); namaTepi = {}
for w in osm['elements']:
    if w['tags'].get('waterway') not in JENIS_OK: continue
    g = w.get('geometry') or []
    nm = w['tags'].get('name')
    for a, b in zip(g, g[1:]):
        A, B = key(a), key(b)
        if A == B: continue
        adj[A][B] = adj[B][A] = km(A, B)
        if nm: namaTepi[frozenset((A, B))] = nm

# komponen terbesar sahaja
komp = {}; c = 0
for s in list(adj):
    if s in komp: continue
    c += 1; st = [s]; komp[s] = c
    while st:
        u = st.pop()
        for v in adj[u]:
            if v not in komp: komp[v] = c; st.append(v)
saiz = defaultdict(int)
for v in komp.values(): saiz[v] += 1
# Pilih komponen yang paling banyak tempat (bukan yang terbesar): sungai sekitar Dalat
from collections import Counter
semua = list(adj)
utama = Counter(komp[min(semua, key=lambda x: km(p, x))] for _, p in tempat).most_common(1)[0][0]
nod = [n for n in adj if komp[n] == utama]
print('jenis', sorted(JENIS_OK), '| nod komponen utama', len(nod), 'daripada', len(adj), '| komponen', c)

# titik sungai terdekat setiap tempat
akses = {}
for n, p in tempat:
    q = min(nod, key=lambda x: km(p, x)); akses[n] = (q, km(p, q))
lindung = {q for q, _ in akses.values()}

# runtuhkan rantai darjah-2 kepada tepi
simpul = {n for n in nod if len(adj[n]) != 2 or n in lindung}
tepi = []; dilawat = set()
for s in simpul:
    for v in adj[s]:
        if frozenset((s, v)) in dilawat: continue
        laluan = [s, v]; dilawat.add(frozenset((s, v)))
        while laluan[-1] not in simpul:
            u = laluan[-1]; w = next(x for x in adj[u] if x != laluan[-2])
            dilawat.add(frozenset((u, w))); laluan.append(w)
        panjang = sum(adj[a][b] for a, b in zip(laluan, laluan[1:]))
        nama = next((namaTepi[frozenset((a, b))] for a, b in zip(laluan, laluan[1:]) if frozenset((a, b)) in namaTepi), None)
        tepi.append((laluan[0], laluan[-1], panjang, laluan, nama))

def dp(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    def jarak(p):
        (y1, x1), (y2, x2), (y0, x0) = a, b, p
        dx, dy = x2 - x1, y2 - y1
        if dx == dy == 0: return math.hypot(x0 - x1, y0 - y1)
        t = max(0, min(1, ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy)))
        return math.hypot(x0 - (x1 + t * dx), y0 - (y1 + t * dy))
    i, m = max(((i, jarak(p)) for i, p in enumerate(pts[1:-1], 1)), key=lambda z: z[1])
    if m > tol: return dp(pts[:i + 1], tol)[:-1] + dp(pts[i:], tol)
    return [a, b]

idx = {n: i for i, n in enumerate(sorted(simpul))}
S = [[round(n[0], 5), round(n[1], 5)] for n in sorted(simpul)]
E = []
for a, b, pj, laluan, nama in tepi:
    g = dp(laluan, 0.00012)  # kira-kira 13 m
    E.append([idx[a], idx[b], round(pj, 3), [[round(p[0], 5), round(p[1], 5)] for p in g[1:-1]], nama])

# uji Dijkstra
G = defaultdict(list)
for k, (a, b, pj, _, _) in enumerate(E): G[a].append((b, pj)); G[b].append((a, pj))
def dij(s, t):
    d = {s: 0}; h = [(0, s)]
    while h:
        x, u = heapq.heappop(h)
        if u == t: return x
        if x > d[u]: continue
        for v, w in G[u]:
            if x + w < d.get(v, 1e9): d[v] = x + w; heapq.heappush(h, (x + w, v))
    return None
ppd = 'PEJABAT PENDIDIKAN DAERAH DALAT'
for n in ['SK ST LUKE NG BAOH', 'SK SG PINANG', 'SMK BATANG IGAN', 'SJK(C) SAN SAN', 'SK KG KLID/PLAJAU', 'SK SG RASAU', 'SMK OYA', 'SK KG BUNGAN']:
    r = dij(idx[akses[ppd][0]], idx[akses[n][0]])
    print(f"PPD -> {n:22} sungai {r:6.1f} km  (+ darat {akses[ppd][1]+akses[n][1]:.1f} km)  garis {km(dict(tempat)[ppd], dict(tempat)[n]):5.1f} km")

AKSES = {n: [idx[q], round(d, 3)] for n, (q, d) in akses.items()}
out = ('/* Rangkaian sungai Daerah Dalat untuk laluan bot — dijana daripada OpenStreetMap (waterway=river, canal).\n'
       '   Simpul: [lat,lng]; tepi: [a, b, km, titik perantaraan, nama sungai]. Akses: titik sungai terdekat setiap tempat. */\n'
       'window.PPDSungai = ' + json.dumps({'simpul': S, 'tepi': E, 'akses': AKSES}, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(sys.argv[3], 'w', encoding='utf-8').write(out)
print('simpul', len(S), 'tepi', len(E), 'titik', sum(len(e[3]) for e in E), '| saiz', round(len(out) / 1024), 'KB')
for n, (q, d) in akses.items():
    if d > 0.6: print('  akses jauh:', n, round(d, 2), 'km')
