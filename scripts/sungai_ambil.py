import json, sys, urllib.request, urllib.parse
q = """[out:json][timeout:90];
(way["waterway"~"^(river|canal|stream)$"](2.40,111.55,3.00,112.30););
out geom;"""
data = urllib.parse.urlencode({'data': q}).encode()
req = urllib.request.Request('https://overpass-api.de/api/interpreter', data=data, headers={'User-Agent': 'PPD-Dalat-prototaip/1.0'})
j = json.load(urllib.request.urlopen(req, timeout=120))
open(sys.argv[1], 'w', encoding='utf-8').write(json.dumps(j))
from collections import Counter
c = Counter(e['tags'].get('waterway') for e in j['elements'])
n = Counter(e['tags'].get('name') for e in j['elements'] if e['tags'].get('waterway') == 'river')
print('ways', len(j['elements']), dict(c))
print('sungai bernama:', n.most_common(25))
