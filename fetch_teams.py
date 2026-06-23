# -*- coding: utf-8 -*-
import urllib.request
import urllib.parse
import json
import time

teams = ['Flamengo', 'Palmeiras', 'Sao Paulo', 'Corinthians', 'Fluminense', 'Gremio', 'Internacional', 'Atletico Mineiro', 'Cruzeiro', 'Botafogo', 'Vasco da Gama', 'Santos']
res = []

for t in teams:
    try:
        url = 'https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=' + urllib.parse.quote(t)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req).read().decode('utf-8')
        data = json.loads(response)
        if data['teams']:
            team = data['teams'][0]
            res.append({
                'id': team['idTeam'],
                'nome': team['strTeam'],
                'escudo': team['strBadge'].replace('https://', 'https://r2.'),
                'tipo': 'Serie A' if t != 'Santos' else 'Serie B'
            })
        time.sleep(0.5)
    except Exception as e:
        print('Error fetching:', t, e)

with open('teams.json', 'w', encoding='utf-8') as f:
    json.dump(res, f, ensure_ascii=False, indent=4)
