import { createHash } from 'node:crypto';
import { createReadStream, mkdirSync, openSync, closeSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { promisify } from 'node:util';
import { LocalDocker } from './docker.mjs';

const execute = promisify(execFile), sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const samePath = (a, b) => a.replaceAll('\\','/').toLowerCase() === b.replaceAll('\\','/').toLowerCase();
export async function fileHash(path) {
  const hash = createHash('sha256');
  for await (const part of createReadStream(path)) hash.update(part);
  return hash.digest('hex');
}
export async function verifyFiles(files) {
  try { for (const file of files) if (await fileHash(file.path) !== file.sha256) throw new Error(); }
  catch { throw new Error('artifact'); }
}
export async function processInfo(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return null;
  const source = '$ErrorActionPreference="Stop"; [Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false); $p=Get-CimInstance Win32_Process -Filter ("ProcessId = " + $env:YAQI_PROCESS_ID); if($p){@{pid=$p.ProcessId;started_at=$p.CreationDate.ToUniversalTime().ToString("o");executable=$p.ExecutablePath}|ConvertTo-Json -Compress}';
  const result = await execute(join(process.env.SystemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe'), ['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(source,'utf16le').toString('base64')], { windowsHide:true, timeout:10000, env:{...process.env,YAQI_PROCESS_ID:String(pid)} });
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}
async function startProgram(program, env, visible, logPath) {
  const log = logPath ? openSync(logPath,'a') : null;
  try {
    const child = spawn(program.executable, program.args, { cwd:program.cwd, env, shell:false, windowsHide:!visible, detached:true, stdio:log === null ? 'ignore' : ['ignore',log,log] });
    await new Promise((resolve, reject) => { child.once('spawn',resolve); child.once('error',reject); });
    const pid = child.pid; child.unref(); return pid;
  } finally { if (log !== null) closeSync(log); }
}
export class NativeRuntime {
  constructor(config, dependencies = {}) {
    this.docker = dependencies.docker || new LocalDocker(config);
    this.inspect = dependencies.inspect || processInfo;
    this.spawn = dependencies.spawn || startProgram;
    this.run = dependencies.run || ((file, args, options) => execute(file,args,{ shell:false, windowsHide:true, maxBuffer:128*1024, ...options }));
    this.verify = dependencies.verify || verifyFiles;
    this.sleep = dependencies.sleep || sleep;
    this.logDirectory = config.state_path ? join(dirname(config.state_path),'process-logs') : null;
  }
  async preflight(program) { await this.verify([{path:program.executable,sha256:program.sha256},...program.files]); }
  async environment(program) {
    const env = { ...process.env };
    // Do not pass the website's ticket or launcher-specific values to project processes.
    for (const key of Object.keys(env)) if (key.startsWith('YAQI_')) delete env[key];
    if (program.env_file) {
      const values = JSON.parse(await readFile(program.env_file,'utf8'));
      if (!values || Array.isArray(values) || typeof values !== 'object' || Object.entries(values).some(([key,value]) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || typeof value !== 'string' || value.includes('\0'))) throw new Error('config');
      Object.assign(env,values);
    }
    return env;
  }
  async inspectProgram(pid, requirePresent = false) {
    for (let attempt=0;attempt<3;attempt++) {
      try {
        const current = await this.inspect(pid);
        if (current == null && !requirePresent) return null;
        if (!current || current.pid !== pid || typeof current.started_at !== 'string' || !current.started_at || typeof current.executable !== 'string' || !current.executable) throw new Error('process');
        return current;
      } catch {
        if (attempt === 2) throw new Error('process');
        await this.sleep(500);
      }
    }
  }
  async ensureProgram(program, key, store, visible, recordStarted = () => {}) {
    const fingerprint = createHash('sha256').update(JSON.stringify(program)).digest('hex');
    const previous = store.instance(key);
    if (previous) {
      // A crash before recording the PID leaves an unknown start, not permission to spawn again.
      if (previous.pid === 0) throw new Error('busy');
      const current = await this.inspectProgram(previous.pid);
      if (current && !previous.started_at) throw new Error('busy');
      if (current && current.started_at === previous.started_at && samePath(current.executable,previous.executable)) {
        if (previous.fingerprint !== fingerprint) throw new Error('busy');
        return current;
      }
    }
    let logPath;
    if (this.logDirectory) {
      mkdirSync(this.logDirectory,{recursive:true});
      logPath = join(this.logDirectory,createHash('sha256').update(key).digest('hex')+'.log');
    }
    const env = await this.environment(program);
    // Persist before spawning, then retain the PID even if identity confirmation fails.
    // Empty started_at means unconfirmed; never adopt a live PID from such a record.
    store.remember(key,fingerprint,{pid:0,started_at:'',executable:program.executable});
    let pid;
    try { pid = await this.spawn(program, env, visible, logPath); }
    catch (error) { store.forget(key); throw error; }
    try { store.remember(key,fingerprint,{pid,started_at:'',executable:program.executable}); }
    finally { recordStarted(`native:${pid}`); } // Creation already happened, even if persistence fails.
    await this.sleep(1200);
    const current = await this.inspectProgram(pid,true);
    if (!current || !samePath(current.executable,program.executable)) throw new Error('process');
    store.remember(key,fingerprint,current);
    return current;
  }
  async launch(project, id, store, update, recordStarted) {
    if (project.mode === 'android') return this.android(project,store,update);
    // Check every executable and artifact before starting dependencies or programs.
    for (const program of project.programs) await this.preflight(program);
    if (project.containers) await this.docker.startContainers(project,update,recordStarted);
    update('starting');
    if (project.mode === 'sample') {
      const program = project.programs[0];
      let result;
      try { result = await this.run(program.executable,program.args,{cwd:program.cwd,env:await this.environment(program),timeout:project.timeout_seconds*1000}); }
      catch { throw new Error('process'); }
      return { output:String(result.stdout || '').slice(0,16000) };
    }
    const processes = [];
    for (const [index, program] of project.programs.entries()) processes.push(await this.ensureProgram(program,`${id}:${index}`,store,!project.open_url,recordStarted));
    const url = project.open_url ? await this.docker.launch({...project,mode:'open'},update,recordStarted) : undefined;
    // HTTP success alone may come from another service after our process exits.
    for (const process of processes) {
      const current = await this.inspectProgram(process.pid);
      if (!current || current.started_at !== process.started_at || !samePath(current.executable,process.executable)) throw new Error('process');
    }
    return url ? {url} : {};
  }
  async android(project, store, update) {
    const a = project.android, key = `android:${a.serial}`;
    await this.verify([{path:a.adb,sha256:a.adb_sha256},{path:a.apk,sha256:a.apk_sha256}]);
    await this.preflight(a.emulator);
    const adb = async args => (await this.run(a.adb,['-s',a.serial,...args],{timeout:10000})).stdout.trim();
    const owner = store.lock(key);
    try {
      let ready = false;
      try { ready = await adb(['get-state']) === 'device'; } catch { /* Only the registered AVD may be started. */ }
      if (!ready) { update('emulator'); await this.spawn(a.emulator,await this.environment(a.emulator),true); }
      const deadline = Date.now()+project.timeout_seconds*1000;
      do {
        try {
          if (await adb(['shell','getprop','sys.boot_completed']) === '1') { ready=true; break; }
        } catch { /* Wait for boot without installing applications or granting permissions. */ }
        ready=false; await this.sleep(1000);
      } while(Date.now()<deadline);
      if (!ready) throw new Error('device');
      const avd = (await adb(['emu','avd','name'])).split(/\r?\n/)[0].trim();
      if (avd !== a.avd) throw new Error('device');
      const installed = (await adb(['shell','pm','path',a.package])).replace(/^package:/,'');
      if (!/^\/data\/app\/[A-Za-z0-9_/+=.~-]+\/base\.apk$/.test(installed)) throw new Error('device');
      if ((await adb(['shell','dumpsys','package',a.package])).match(/versionCode=(\d+)/)?.[1] !== a.version_code) throw new Error('device');
      if ((await adb(['shell','sha256sum',installed])).split(/\s+/)[0] !== a.apk_sha256) throw new Error('device');
      const result = await adb(['shell','am','start','-W','-n',a.activity]);
      if (!/Status: ok/.test(result) || /Error:|Exception/.test(result)) throw new Error('device');
      return {};
    } finally { store.unlock(key,owner); }
  }
}
