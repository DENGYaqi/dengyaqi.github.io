import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import net from 'node:net';
import { LocalDocker } from '../local-launcher/docker.mjs';
import { fingerprint } from '../local-launcher/config.mjs';

// Explicit opt-in: create one disposable container from an already present PHP image.
const image = process.argv[2];
if (!image) throw new Error('Usage: node scripts/check-local-launch-docker.mjs <existing-local-php-image>');
const execute = promisify(execFile), context = { name: 'desktop-linux', endpoint: 'npipe:////./pipe/dockerDesktopLinuxEngine' };
const docker = async args => (await execute('docker', ['--context', context.name, ...args], { shell: false, windowsHide: true, timeout: 30000 })).stdout.trim();
const [actualContext] = JSON.parse((await execute('docker',['context','inspect',context.name], { windowsHide: true })).stdout);
assert.equal(actualContext.Endpoints.docker.Host, context.endpoint);
await docker(['image','inspect',image]);
const listener = net.createServer();
await new Promise(resolve => listener.listen(0,'127.0.0.1',resolve));
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const label = `local-smoke-${crypto.randomUUID()}`;
let container;
try {
  const php = '$s=stream_socket_server("tcp://0.0.0.0:8080");while($c=@stream_socket_accept($s)){fwrite($c,"HTTP/1.1 200 OK\r\nContent-Length: 8\r\nConnection: close\r\n\r\nlocal-ok");fclose($c);}';
  container = await docker(['create','--pull','never','--name',label,'--label',`io.yaqi.local-smoke=${label}`,'--memory','128m','--cpus','0.5','--pids-limit','32','--restart','no','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--publish',`127.0.0.1:${port}:8080`,'--entrypoint','php',image,'-r',php]);
  const [info] = JSON.parse(await docker(['inspect',container]));
  const profile = { mode: 'docker', open_url: `http://127.0.0.1:${port}/`, health_urls: [`http://127.0.0.1:${port}/`], timeout_seconds: 15, containers: [{ id: container, fingerprint: fingerprint(info) }] };
  const runtime = new LocalDocker({ docker_path: 'docker', context }), started = [];
  assert.equal(await runtime.launch(profile, () => {}, id => started.push(id)), profile.open_url);
  assert.deepEqual(started,[container]);
  assert.equal(await (await fetch(profile.open_url)).text(),'local-ok');
  await runtime.launch(profile, () => {}, () => assert.fail('Running container restarted'));
  assert.equal(JSON.parse(await docker(['inspect',container]))[0].State.Running,true);
  console.log('PASS: stopped container starts, HTTP is ready, repeat launch reuses it, helper does not stop it.');
} finally {
  if (container && /^[0-9a-f]{64}$/.test(container)) {
    const [info] = JSON.parse(await docker(['inspect',container]));
    assert.equal(info.Config.Labels['io.yaqi.local-smoke'], label);
    await docker(['rm','--force',container]);
  }
}
