import { now, uuidPattern } from './runtime-shared.js';

const encode = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const bytes = value => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4)), char => char.charCodeAt(0));
const json = value => encode(new TextEncoder().encode(JSON.stringify(value)));
const read = value => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes(value)));
const algorithm = { name: 'ECDSA', namedCurve: 'P-256' };

export async function issueLocalTicket(privateKey, projectId, lang, issuer, timestamp = now()) {
  const header = json({ alg: 'ES256', typ: 'JWT' });
  const payload = json({ iss: issuer, aud: 'yaqi-local', act: 'launch', sub: projectId, lang, iat: timestamp, exp: timestamp + 60, jti: crypto.randomUUID() });
  const key = await crypto.subtle.importKey('jwk', privateKey, algorithm, false, ['sign']);
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${encode(new Uint8Array(signature))}`;
}

export async function verifyLocalTicket(ticket, publicKey, issuer, timestamp = now()) {
  if (typeof ticket !== 'string' || ticket.length > 1800 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(ticket)) throw new Error('ticket');
  const [headerPart, payloadPart, signaturePart] = ticket.split('.');
  const header = read(headerPart), payload = read(payloadPart);
  if (header.alg !== 'ES256' || header.typ !== 'JWT' || Object.keys(header).length !== 2) throw new Error('ticket');
  const key = await crypto.subtle.importKey('jwk', publicKey, algorithm, false, ['verify']);
  if (!await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, bytes(signaturePart), new TextEncoder().encode(`${headerPart}.${payloadPart}`))) throw new Error('ticket');
  if (Object.keys(payload).sort().join(',') !== 'act,aud,exp,iat,iss,jti,lang,sub' || payload.iss !== issuer || payload.aud !== 'yaqi-local' || payload.act !== 'launch' || !uuidPattern.test(payload.sub) || !uuidPattern.test(payload.jti) || !['zh','en','ja','fr'].includes(payload.lang) || !Number.isInteger(payload.iat) || !Number.isInteger(payload.exp) || payload.iat > timestamp + 5 || payload.exp <= timestamp || payload.exp - payload.iat !== 60) throw new Error('ticket');
  return payload;
}

export function parseLocalUri(value) {
  if (typeof value !== 'string' || value.length > 2000 || /[\s"'\\]/.test(value)) throw new Error('ticket');
  const url = new URL(value);
  if (url.protocol !== 'yaqi-local:' || url.host !== 'launch' || url.pathname || url.username || url.password || url.hash || [...url.searchParams.keys()].join(',') !== 'ticket') throw new Error('ticket');
  return url.searchParams.get('ticket');
}
