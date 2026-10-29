import http from 'node:http';
import { localCopy } from '../src/local-launch-copy.js';
import { randomToken } from '../src/runtime-shared.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export async function statusServer(lang, title, dependencies = {}) {
  const c = localCopy[lang] || localCopy.zh, token = randomToken(), base = `/status/${token}`;
  let state = { stage: 'checking', message: c.checking }, origin;
  const script = `(() => { const text=document.querySelector('[role=status]'), link=document.querySelector('#open'); async function poll(){try{const response=await fetch('./state',{cache:'no-store'});if(!response.ok)throw new Error();const state=await response.json();text.textContent=state.message;if(state.stage==='ready'){if(state.output){const result=document.createElement('pre');result.style.whiteSpace='pre-wrap';result.textContent=state.output;text.after(result);}if(state.url){link.href=state.url;link.hidden=false;location.replace(state.url);}return;}if(state.stage==='failed')return;}catch{text.textContent=${JSON.stringify(c.unknown)};return;}setTimeout(poll,700);}poll();})();`;
  const server = http.createServer((request, response) => {
    const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'" };
    if (request.method !== 'GET' || request.headers.host !== new URL(origin).host || (request.headers.origin && request.headers.origin !== origin) || request.headers['sec-fetch-site'] === 'cross-site') { response.writeHead(403, headers).end('Forbidden'); return; }
    if (request.url === `${base}/state`) { response.writeHead(200, { ...headers, 'Content-Type': 'application/json' }).end(JSON.stringify(state)); return; }
    if (request.url === `${base}/client.js`) { response.writeHead(200, { ...headers, 'Content-Type': 'text/javascript' }).end(script); return; }
    if (request.url !== `${base}/`) { response.writeHead(404, headers).end('Not found'); return; }
    response.writeHead(200, { ...headers, 'Content-Type': 'text/html; charset=utf-8' }).end(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${c.title}</title><style>body{margin:0;background:#171717;color:#f7f4ef;font:17px/1.7 system-ui}main{max-width:700px;margin:12vh auto;padding:2rem;border:1px solid #55402c;border-radius:16px;background:#24201b}h1{font-size:1.7rem}a,[role=status]{color:#ff9d36}p{overflow-wrap:anywhere}[hidden]{display:none}small{color:#bbb}@media(max-width:760px){main{margin:8vh 1rem}}</style></head><body><main><h1>${c.title}</h1><h2>${escape(title)}</h2><p role="status" aria-live="polite">${escape(state.message)}</p><a id="open" hidden>${c.open}</a><p><small>${c.unchanged}</small></p></main><script src="${base}/client.js" defer></script></body></html>`);
  });
  server.requestTimeout = 10000; server.headersTimeout = 5000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0,'127.0.0.1',resolve); });
  origin = `http://127.0.0.1:${server.address().port}`;
  const timer = setTimeout(() => { server.closeAllConnections(); server.close(); }, dependencies.lifetime ?? 15 * 60 * 1000);
  return { url: origin + base + '/', set(stage, error = '', url = '', partial = false, reason = '', output = '') { state = { stage, message: stage === 'failed' ? `${c[error] || c.unknown}${reason ? ' ' + reason : ''}${partial ? ' ' + c.partial : ''}` : `${c[stage]}${reason ? ' ' + reason : ''}`, ...(url ? { url } : {}), ...(output ? {output:String(output).slice(0,16000)} : {}) }; }, close() { clearTimeout(timer); server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); } };
}
