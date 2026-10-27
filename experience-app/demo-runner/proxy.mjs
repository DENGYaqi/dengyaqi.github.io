import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, now, publicOrigin, signature, tokenPattern } from '../src/runtime-shared.js';
import { loopbackUrl } from './runner.mjs';

export function validateProxy(config) {
  if (!tokenPattern.test(config.secret) || !Number.isInteger(config.port) || config.port < 1024 || config.port > 65535 || !config.routes || typeof config.routes !== 'object') throw new Error('config');
  for (const [key, route] of Object.entries(config.routes)) {
    if (!/^[a-z][a-z0-9_-]{0,63}$/.test(key) || !publicOrigin(route.public_origin)) throw new Error('route');
    const target = loopbackUrl(route.target);
    if (target.pathname !== '/' || target.search) throw new Error('route');
    if (route.write_routes && (!Array.isArray(route.write_routes) || route.write_routes.some(rule => !['POST','PUT','PATCH','DELETE'].includes(rule.method) || !/^\/(?!\/)[^?#\\]*$/.test(rule.path)))) throw new Error('route');
  }
  return config;
}
export function createProxy(config) {
  validateProxy(config);
  async function authorize(request, body) {
    const key = request.headers['x-demo-key'], deadline = Number(request.headers['x-demo-deadline']);
    const route = config.routes[key], supplied = request.headers['x-demo-signature'];
    if (!route || !Number.isInteger(deadline) || deadline <= now() || deadline > now() + 20 || !/^[0-9a-f]{64}$/.test(supplied) || !request.url.startsWith('/') || request.url.startsWith('//') || request.url.includes('\\')) return null;
    if (!['GET','HEAD','OPTIONS'].includes(request.method) && !route.write_routes?.some(rule => rule.method === request.method && rule.path === request.url.split('?')[0])) return null;
    const expected = await signature(config.secret, `${request.method}\n${request.url}\n${key}\n${deadline}\n${await digest(body)}`);
    return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)) ? route : null;
  }
  function options(request, route) {
    const target = loopbackUrl(route.target), headers = { ...request.headers };
    for (const key of Object.keys(headers)) if (/^(?:cf-|x-demo-|x-forwarded-)/i.test(key) || ['host', 'forwarded'].includes(key)) delete headers[key];
    headers.host = new URL(route.public_origin).host;
    headers['x-forwarded-host'] = headers.host;
    headers['x-forwarded-proto'] = 'https';
    return { hostname: target.hostname.replace(/^\[|\]$/g, ''), port: Number(target.port), path: request.url, method: request.method, headers };
  }
  const server = http.createServer(async (request, response) => {
    try {
      const chunks = []; let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 8 * 1024 * 1024) { response.writeHead(413).end(); return; }
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks), route = await authorize(request, body);
      if (!route) { response.writeHead(403).end(); return; }
      const upstream = http.request(options(request, route), remote => {
        response.writeHead(remote.statusCode, remote.headers);
        remote.pipe(response);
        response.on('close', () => remote.destroy());
      });
      upstream.setTimeout(30000, () => upstream.destroy());
      upstream.on('error', () => { if (!response.headersSent) response.writeHead(502); response.end(); });
      response.on('close', () => upstream.destroy());
      upstream.end(body);
    } catch { if (!response.headersSent) response.writeHead(400); response.end(); }
  });
  server.on('upgrade', async (request, socket, head) => {
    try {
      const route = await authorize(request, new Uint8Array());
      if (!route || request.headers.origin !== route.public_origin || head.length > 65536) { socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return; }
      const upstream = http.request(options(request, route));
      upstream.on('upgrade', (response, remote, remoteHead) => {
        remote.setTimeout(0);
        socket.write(`HTTP/1.1 101 Switching Protocols\r\n${response.rawHeaders.reduce((lines, value, index, all) => index % 2 ? lines : lines + `${value}: ${all[index + 1]}\r\n`, '')}\r\n`);
        if (remoteHead.length) socket.write(remoteHead);
        if (head.length) remote.write(head);
        const timer = setTimeout(() => { socket.destroy(); remote.destroy(); }, 1800 * 1000);
        socket.on('close', () => { clearTimeout(timer); remote.destroy(); });
        remote.on('close', () => { clearTimeout(timer); socket.destroy(); });
        socket.on('error', () => remote.destroy()); remote.on('error', () => socket.destroy());
        socket.pipe(remote); remote.pipe(socket);
      });
      upstream.setTimeout(10000, () => upstream.destroy());
      upstream.on('response', response => { response.resume(); socket.destroy(); });
      upstream.on('error', () => socket.destroy());
      upstream.end();
    } catch { socket.destroy(); }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Usage: node proxy.mjs <private-proxy.json>');
  const config = validateProxy(JSON.parse(await readFile(process.argv[2], 'utf8')));
  createProxy(config).listen(config.port, '127.0.0.1');
}
