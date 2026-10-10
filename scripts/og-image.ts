import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const sky = JSON.parse(readFileSync('static/data/sky.json', 'utf8')) as { aircraft: { lon: number; lat: number; alt: number }[] };
const dots = sky.aircraft.map((a) => [a.lon, a.lat, a.alt]);
const html = `<!doctype html><html><body style="margin:0;background:#0a0d14">
<canvas id="c" width="1200" height="630"></canvas>
<div style="position:absolute;left:64px;bottom:72px;font-family:Georgia,serif;color:#fff">
  <div style="font:600 18px system-ui;letter-spacing:.14em;text-transform:uppercase;color:#c3c2b7">A data story · live EUROCONTROL data</div>
  <div style="font-size:76px;font-weight:700;margin:8px 0">A Full Flight Story</div>
  <div style="font:400 26px system-ui;color:#c3c2b7">How a flight becomes a flight in Europe</div>
</div>
<script>
const d=${JSON.stringify(dots)};const c=document.getElementById('c').getContext('2d');
const X=(lon)=>600+(lon-10)*22, Y=(lat)=>330-(lat-48)*30;
for(const [lon,lat,alt] of d){c.fillStyle=alt>30000?'#9ec5f4':alt>15000?'#5598e7':'#2a78d6';c.globalAlpha=.85;c.beginPath();c.arc(X(lon),Y(lat),1.8,0,7);c.fill();}
</script></body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html);
await p.waitForTimeout(300);
await p.screenshot({ path: 'static/og.png' });
await b.close();
console.log('wrote static/og.png');
