import { isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { uuidPattern, publicOrigin } from '../src/runtime-shared.js';

export function localUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1','localhost','[::1]'].includes(url.hostname) || !url.port || url.username || url.password || /[\s"'\\]/.test(value)) throw new Error('config');
  return url.toString();
}
export function fingerprint(info) {
  // Docker inspect does not guarantee mount or map ordering between requests.
  const byJson = (a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), 'en');
  const ports = Object.fromEntries(Object.entries(info.HostConfig?.PortBindings || {}).sort(([a], [b]) => a.localeCompare(b, 'en')).map(([key, values]) => [key, values?.map(value => ({ ip: value.HostIp, port: value.HostPort })).sort(byJson) ?? null]));
  const mounts = (info.Mounts?.map(mount => ({ type: mount.Type, source: mount.Source, destination: mount.Destination, rw: mount.RW })) || []).sort(byJson);
  const identity = { id: info.Id, name: info.Name, image: info.Image, project: info.Config?.Labels?.['com.docker.compose.project'] || '', service: info.Config?.Labels?.['com.docker.compose.service'] || '', ports, mounts };
  return createHash('sha256').update(JSON.stringify(identity)).digest('hex');
}
export function validateConfig(config) {
  if (config.version !== 1 || !publicOrigin(config.issuer) || !isAbsolute(config.docker_path) || !isAbsolute(config.state_path) || config.public_key?.kty !== 'EC' || config.public_key.crv !== 'P-256' || config.public_key.d || !/^[A-Za-z0-9_-]{43}$/.test(config.public_key.x) || !/^[A-Za-z0-9_-]{43}$/.test(config.public_key.y) || !/^[a-zA-Z0-9_-]+$/.test(config.context?.name) || !/^npipe:\/\/\/\/\.\/pipe\/[a-zA-Z0-9_-]+$/.test(config.context.endpoint) || !config.projects || Array.isArray(config.projects)) throw new Error('config');
  for (const [id, project] of Object.entries(config.projects)) {
    if (!uuidPattern.test(id) || typeof project.title !== 'string' || project.title.length > 160 || !['docker','open','unavailable'].includes(project.mode)) throw new Error('config');
    if (project.reason && (typeof project.reason !== 'object' || Object.entries(project.reason).some(([lang, text]) => !['zh','en','ja','fr'].includes(lang) || typeof text !== 'string' || text.length > 600))) throw new Error('config');
    if (project.mode === 'unavailable') continue;
    localUrl(project.open_url);
    if (!Array.isArray(project.health_urls) || !project.health_urls.length || project.health_urls.length > 8 || !Number.isInteger(project.timeout_seconds) || project.timeout_seconds < 5 || project.timeout_seconds > 180) throw new Error('config');
    project.health_urls.forEach(localUrl);
    if (project.mode === 'docker') {
      if (!Array.isArray(project.containers) || !project.containers.length || project.containers.length > 20 || new Set(project.containers.map(item => item.id)).size !== project.containers.length) throw new Error('config');
      for (const item of project.containers) if (!/^[0-9a-f]{64}$/.test(item.id) || !/^[0-9a-f]{64}$/.test(item.fingerprint)) throw new Error('config');
    }
  }
  return config;
}
