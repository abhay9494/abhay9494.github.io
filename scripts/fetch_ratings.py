#!/usr/bin/env python3
"""Fetch Codeforces and CodeChef rating history into assets/data/ratings.json.

Runs every day from .github/workflows/ratings.yml. The site draws both rating
graphs from this file (Codeforces is also refreshed live in the browser).
A platform that fails keeps its previous data, so one outage never empties a graph.
"""
import datetime
import json
import pathlib
import re
import sys
import urllib.request

OUT = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'data' / 'ratings.json'
HEADERS = {'User-Agent': 'Mozilla/5.0 (rating sync for https://abhay9494.github.io)'}
IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))


def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read().decode('utf-8', 'replace')


def codeforces(handle='abhay9494'):
    data = json.loads(get(f'https://codeforces.com/api/user.rating?handle={handle}'))
    if data.get('status') != 'OK':
        raise RuntimeError(f"status {data.get('status')}")
    return [[x['ratingUpdateTimeSeconds'], x['newRating'], x['rank'],
             x['contestName'].replace('Codeforces ', 'CF ').replace('Educational ', 'Edu ')]
            for x in data['result']]


def codechef(handle='abhay9492'):
    html = get(f'https://www.codechef.com/users/{handle}')
    m = re.search(r'var all_rating\s*=\s*(\[.*?\]);', html, re.S)
    if not m:
        raise RuntimeError('rating data not found on the profile page')
    rows = []
    for x in json.loads(m.group(1)):
        t = datetime.datetime.strptime(x['end_date'], '%Y-%m-%d %H:%M:%S').replace(tzinfo=IST)
        name = x['name'].replace(' (Rated)', '').replace('Division ', 'Div. ')
        rows.append([int(t.timestamp()), int(x['rating']), int(x['rank']), name])
    return rows


def main():
    old = json.loads(OUT.read_text('utf-8')) if OUT.exists() else {}
    new = dict(old)
    fetched = 0
    failed = []
    for key, fetch in (('codeforces', codeforces), ('codechef', codechef)):
        try:
            rows = fetch()
        except Exception as e:  # keep the previous data for this platform
            print(f'{key}: {e}', file=sys.stderr)
            failed.append(key)
            continue
        if rows:
            new[key] = rows
            fetched += 1
    if not fetched:
        sys.exit('nothing could be fetched')
    strip = lambda d: {k: v for k, v in d.items() if k != 'updated'}
    if strip(new) == strip(old) and 'updated' in old:
        print('no change')
    else:
        new['updated'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(new, separators=(',', ':'), ensure_ascii=False) + '\n', 'utf-8')
        print('updated', {k: len(v) for k, v in strip(new).items()})
    if failed:  # whatever did arrive is saved above; flag the run so the failure is visible
        sys.exit('could not fetch: ' + ', '.join(failed))


if __name__ == '__main__':
    main()
