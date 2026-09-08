#!/usr/bin/env python3
"""Regenerate the Brazil Boogie confirmed-crew one-pager. Edit CREW/ORG, run, PDF is rebuilt via Chrome headless."""
import html, base64, subprocess, os, re
HERE=os.path.dirname(os.path.abspath(__file__))
def img(h): return "data:image/png;base64,"+base64.b64encode(open(f'{HERE}/photos/{h}.png','rb').read()).decode()
CREW=[  # (name, handle, followers, sort_value, niche)
 ("Shelby Robins","shelbyrobinss","850K",850000,"Fitness"),
 ("Jack Rosenthal","jackrosen6","300K",300000,"Travel, YouTube"),
 ("Yusef Reown","yusefireown","264K",264000,"Comedy"),
 ("Phillip Pham","phillip3s","162K",162000,"Travel, lifestyle, photography"),
 ("Sarah Rosenborg","sarahrosenborg","73.5K",73500,"Travel, brand deals"),
 ("Shiv","shivsocial","41.8K",41800,"Lifestyle"),
 ("Cora Schwan","cora_schwan","34K",34000,"Travel, lifestyle"),
 ("James Adams","thatjamesadams","15.2K",15200,"Travel, fitness, extreme sports"),
 ("Isaac Bass","iisaacbass","7,220",7220,"Healthy lifestyle"),
 ("Keoni Anderson","keoni.anderson","2,404",2404,"Skydive lifestyle"),
]
ORG=[
 ("Callie Rounds","callie.rounds","499K",499000,"Skydiving, travel, adventure"),
 ("Kyle Zellner","kyle.zellner","153K",153000,"Travel, extreme sports"),
]
CREW.sort(key=lambda r:-r[3])
def row(i,r):
    name,h,f,_,niche=r
    return f'<tr><td class="n">{i}</td><td><img src="{img(h)}"></td><td class="nm">{html.escape(name)}</td><td><a href="https://www.instagram.com/{h}/">@{h}</a></td><td class="f">{f}</td><td>{html.escape(niche)}</td></tr>'
th='<tr><th>#</th><th></th><th>Name</th><th>Instagram</th><th>Followers</th><th>Niche</th></tr>'
cg='<colgroup><col class="c1"><col class="c2"><col class="c3"><col class="c4"><col class="c5"><col></colgroup>'
page=f'''<!doctype html><html><head><meta charset="utf-8"><title>Brazil Boogie Confirmed Crew</title>
<style>
@page{{size:A4 landscape;margin:9mm 12mm}}
body{{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#222;margin:0}}
h1{{font-size:22px;margin:0 0 8px}}
h2{{font-size:12px;margin:12px 0 5px;letter-spacing:.08em;text-transform:uppercase;color:#555}}
table{{border-collapse:collapse;width:100%;font-size:10.5px;table-layout:fixed}}
th{{text-align:left;background:#161616;color:#fff;padding:5px 8px;font-weight:600}}
td{{padding:3px 8px;border-bottom:1px solid #ddd;vertical-align:middle}}
tr:nth-child(even) td{{background:#f9f8f7}}
td img{{width:34px;height:34px;border-radius:50%;display:block}}
col.c1{{width:20px}} col.c2{{width:44px}} col.c3{{width:120px}} col.c4{{width:130px}} col.c5{{width:70px}}
td.n{{color:#888}} td.nm{{font-weight:600}} td.f{{font-weight:600}}
a{{color:#2E7D6F;font-weight:600;text-decoration:underline}}
</style></head><body>
<h1>Brazil Boogie, Confirmed Crew</h1>
<table>{cg}<thead>{th}</thead><tbody>{''.join(row(i+1,r) for i,r in enumerate(CREW))}</tbody></table>
<h2>Organizers</h2>
<table>{cg}<thead>{th}</thead><tbody>{''.join(row('',r) for r in ORG)}</tbody></table>
</body></html>'''
open(f'{HERE}/confirmed-crew.html','w').write(page)
subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome","--headless","--disable-gpu","--no-pdf-header-footer",f"--print-to-pdf={HERE}/confirmed-crew.pdf",f"file://{HERE}/confirmed-crew.html"],capture_output=True)
pages=len(re.findall(rb'/Type\s*/Page[^s]',open(f'{HERE}/confirmed-crew.pdf','rb').read()))
print(f"{len(CREW)} crew, {pages} page(s)")
