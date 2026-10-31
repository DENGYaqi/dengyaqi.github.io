import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, copyFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NativeRuntime, fileHash, verifyFiles, processInfo } from '../local-launcher/native.mjs';
import { exportCatalog } from '../local-launcher/catalog.mjs';
import { LocalState } from '../local-launcher/state.mjs';
import { validateConfig } from '../local-launcher/config.mjs';
import { statusServer } from '../local-launcher/status.mjs';
import { localCatalog, localLaunchPanel, localProjectEnabled } from '../src/local-launch.js';

const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', hash='a'.repeat(64);
const program = {executable:process.execPath,sha256:hash,cwd:tmpdir(),args:[],files:[]};
const project = {title:'Demo',mode:'native',timeout_seconds:5,programs:[program]};
async function storage(t) {
  const directory=await mkdtemp(join(tmpdir(),'yaqi-native-'));
  const store=new LocalState(join(directory,'state.sqlite'));
  t.after(async()=>{store.close();await rm(directory,{recursive:true,force:true});});
  return {directory,store};
}
function fixture() {
  let next=10, spawnCount=0; const active=new Map();
  const runtime=new NativeRuntime({}, {verify:async()=>{},sleep:async()=>{},spawn:async(p)=>{spawnCount++;const pid=next++;active.set(pid,{pid,started_at:String(pid),executable:p.executable});return pid;},inspect:async pid=>active.get(pid)});
  return {runtime,active,get spawnCount(){return spawnCount;}};
}
test('native launch reuses its process, detects PID reuse and refuses changed configuration on a live process',async t=>{
  const {store}=await storage(t),f=fixture();
  await f.runtime.launch(project,id,store,()=>{},()=>{});
  await f.runtime.launch(project,id,store,()=>{},()=>{});
  assert.equal(f.spawnCount,1);
  await assert.rejects(f.runtime.launch({...project,programs:[{...program,args:['changed']}]},id,store,()=>{},()=>{}),/busy/);
  f.active.get(10).started_at='reused-pid';
  await f.runtime.launch(project,id,store,()=>{},()=>{});
  assert.equal(f.spawnCount,2);
});

test('failed native identity checks survive reopening storage and block duplicate starts until the PID exits',async t=>{
  const {store,directory}=await storage(t),f=fixture();
  f.runtime.inspect=async()=>{throw new Error('CIM unavailable');};
  await assert.rejects(f.runtime.launch(project,id,store,()=>{},()=>{}),/process/);
  assert.equal(store.instance(`${id}:0`).pid,10);
  assert.equal(store.instance(`${id}:0`).started_at,'');
  const reopened=new LocalState(join(directory,'state.sqlite'));
  try {
    f.runtime.inspect=async pid=>f.active.get(pid);
    await assert.rejects(f.runtime.launch(project,id,reopened,()=>{},()=>{}),/busy/);
    // Even the same executable at a reused PID cannot confirm an earlier unknown identity.
    f.active.get(10).started_at='reused-pid';
    await assert.rejects(f.runtime.launch(project,id,reopened,()=>{},()=>{}),/busy/);
    assert.equal(f.spawnCount,1);
    f.active.delete(10);
    await f.runtime.launch(project,id,reopened,()=>{},()=>{});
    assert.equal(f.spawnCount,2);
  } finally { reopened.close(); }
});

test('transient identity query failures are retried without spawning another process',async t=>{
  const {store}=await storage(t),f=fixture();let queries=0;
  f.runtime.inspect=async pid=>{if(++queries===1)throw new Error('temporary');return f.active.get(pid);};
  await f.runtime.launch(project,id,store,()=>{},()=>{});
  await f.runtime.launch(project,id,store,()=>{},()=>{});
  assert.equal(f.spawnCount,1);assert.equal(store.instance(`${id}:0`).started_at,'10');
});

test('native start reporting happens before identity checks and excludes reused processes',async t=>{
  const {store}=await storage(t),f=fixture(),started=[];
  f.runtime.inspect=async pid=>{assert.deepEqual(started,['native:10']);return f.active.get(pid);};
  await f.runtime.launch(project,id,store,()=>{},value=>started.push(value));
  await f.runtime.launch(project,id,store,()=>{},value=>started.push(value));
  assert.deepEqual(started,['native:10']);assert.equal(f.spawnCount,1);
});

test('uncertain or incomplete process queries never permit another start',async t=>{
  const {store}=await storage(t),f=fixture();
  await f.runtime.launch(project,id,store,()=>{},()=>{});
  for(const inspect of [async()=>{throw new Error('CIM denied');},async()=>({pid:10,started_at:'10',executable:null}),async()=>({pid:99,started_at:'10',executable:program.executable})]){
    f.runtime.inspect=inspect;
    await assert.rejects(f.runtime.launch(project,id,store,()=>{},()=>{}),/process/);
  }
  assert.equal(f.spawnCount,1);
});

test('native startup journals before spawning and stays blocked if PID persistence fails',async t=>{
  const {store}=await storage(t),f=fixture(),remember=store.remember.bind(store);
  store.remember=()=>{throw new Error('disk failure');};
  await assert.rejects(f.runtime.launch(project,id,store,()=>{},()=>{}),/disk failure/);
  assert.equal(f.spawnCount,0);
  store.remember=(key,fingerprint,process)=>{if(process.pid)throw new Error('disk failure');return remember(key,fingerprint,process);};
  await assert.rejects(f.runtime.launch(project,id,store,()=>{},()=>{}),/disk failure/);
  assert.equal(f.spawnCount,1);assert.equal(store.instance(`${id}:0`).pid,0);
  store.remember=remember;
  await assert.rejects(f.runtime.launch(project,id,store,()=>{},()=>{}),/busy/);
  assert.equal(f.spawnCount,1);
});

test('PID persistence failure still reports the created process and preserves duplicate-start protection',async t=>{
  const {store}=await storage(t),f=fixture(),remember=store.remember.bind(store),started=[];
  store.remember=(key,fingerprint,process)=>{if(process.pid)throw new Error('write failure');return remember(key,fingerprint,process);};
  await assert.rejects(f.runtime.launch(project,id,store,()=>{},value=>started.push(value)),/write failure/);
  assert.deepEqual(started,['native:10']);assert.equal(store.instance(`${id}:0`).pid,0);
  store.remember=remember;
  await assert.rejects(f.runtime.launch(project,id,store,()=>{},value=>started.push(value)),/busy/);
  assert.deepEqual(started,['native:10']);assert.equal(f.spawnCount,1);
});

test('a rejected spawn releases its reservation so a later retry can succeed',async t=>{
  const {store}=await storage(t),f=fixture(),spawn=f.runtime.spawn;
  f.runtime.spawn=async()=>{assert.equal(store.instance(`${id}:0`).pid,0);throw new Error('ENOENT');};
  await assert.rejects(f.runtime.launch(project,id,store,()=>{},()=>{}),/ENOENT/);
  assert.equal(store.instance(`${id}:0`),undefined);
  f.runtime.spawn=spawn;
  await f.runtime.launch(project,id,store,()=>{},()=>{});assert.equal(f.spawnCount,1);
});

test('a process that exits before identity confirmation can be restarted after absence is confirmed',async t=>{
  const {store}=await storage(t),f=fixture();let queries=0;
  f.runtime.inspect=async()=>{queries++;return null;};
  await assert.rejects(f.runtime.launch(project,id,store,()=>{},()=>{}),/process/);
  assert.equal(queries,3);assert.equal(f.spawnCount,1);
  f.active.delete(10);f.runtime.inspect=async pid=>f.active.get(pid);
  await f.runtime.launch(project,id,store,()=>{},()=>{});assert.equal(f.spawnCount,2);
});
test('all native artifacts are verified before any process or Docker dependency starts',async t=>{
  const {store,directory}=await storage(t);const path=join(directory,'artifact');await writeFile(path,'before');
  const sha256=await fileHash(path);await verifyFiles([{path,sha256}]);await writeFile(path,'after');
  let started=0;
  const runtime=new NativeRuntime({}, {docker:{startContainers:async()=>started++},spawn:async()=>started++});
  await assert.rejects(runtime.launch({...project,containers:[{}],programs:[{...program,sha256:await fileHash(process.execPath),files:[{path,sha256}]}]},id,store,()=>{},()=>{}),/artifact/);
  assert.equal(started,0);
});
test('native dependency order precedes processes and health checks',async t=>{
  const {store}=await storage(t),f=fixture(),steps=[];
  f.runtime.docker={startContainers:async()=>steps.push('containers'),launch:async()=>{steps.push('health');return 'http://127.0.0.1:1234/';}};
  const spawn=f.runtime.spawn;f.runtime.spawn=async(...args)=>{steps.push('process');return spawn(...args);};
  const result=await f.runtime.launch({...project,containers:[{}],open_url:'http://127.0.0.1:1234/'},id,store,()=>{},()=>{});
  assert.deepEqual(steps,['containers','process','health']);assert.equal(result.url,'http://127.0.0.1:1234/');
});

test('web readiness rejects exited or replaced processes after HTTP health succeeds, including reused processes',async t=>{
  for(const reused of [false,true]) for(const failedIndex of [0,1]) for(const fault of ['exit','creation','executable']) {
    const {store}=await storage(t),f=fixture(),p={...project,programs:[program,program]},url='http://127.0.0.1:1234/';
    if(reused)await f.runtime.launch(p,id,store,()=>{},()=>{});
    f.runtime.docker={launch:async()=>{
      const pid=10+failedIndex,current=f.active.get(pid);
      if(fault==='exit')f.active.delete(pid);
      else f.active.set(pid,{...current,...(fault==='creation'?{started_at:'another-process'}:{executable:join(tmpdir(),'other.exe')})});
      return url;
    }};
    await assert.rejects(f.runtime.launch({...p,open_url:url},id,store,()=>{},()=>{}),/process/);
    assert.equal(f.spawnCount,2);
  }
});

test('web readiness confirms all process identities after health and reuses healthy processes',async t=>{
  const {store}=await storage(t),f=fixture(),url='http://127.0.0.1:1234/',p={...project,programs:[program,program],open_url:url};
  let healthDone=false;const checked=[];
  f.runtime.docker={launch:async()=>{healthDone=true;return url;}};
  f.runtime.inspect=async pid=>{if(healthDone)checked.push(pid);return {...f.active.get(pid),executable:program.executable.toUpperCase()};};
  for(let attempt=0;attempt<2;attempt++) {
    healthDone=false;checked.length=0;
    assert.deepEqual(await f.runtime.launch(p,id,store,()=>{},()=>{}),{url});
    assert.deepEqual(checked,[10,11]);assert.equal(f.spawnCount,2);
  }
});

test('web readiness fails closed when the final identity query is unavailable or incomplete',async t=>{
  for(const unavailable of [true,false]) {
    const {store}=await storage(t),f=fixture();let healthDone=false;
    f.runtime.docker={launch:async()=>{healthDone=true;return 'http://127.0.0.1:1234/';}};
    f.runtime.inspect=async pid=>{
      if(!healthDone)return f.active.get(pid);
      if(unavailable)throw new Error('private CIM error');
      return {pid,started_at:'10',executable:null};
    };
    await assert.rejects(f.runtime.launch({...project,open_url:'http://127.0.0.1:1234/'},id,store,()=>{},()=>{}),{message:'process'});
    assert.equal(f.spawnCount,1);
  }
});
test('fixed samples have bounded output and errors do not leak command output',async t=>{
  const {store}=await storage(t),f=fixture();
  f.runtime.run=async(_file,_args,options)=>{assert.equal(options.timeout,5000);return{stdout:'x'.repeat(20000)};};
  assert.equal((await f.runtime.launch({...project,mode:'sample'},id,store,()=>{},()=>{})).output.length,16000);
  f.runtime.run=async()=>{throw new Error('private password');};
  await assert.rejects(f.runtime.launch({...project,mode:'sample'},id,store,()=>{},()=>{}),{message:'process'});
});
test('Android starts only its registered AVD and app; wrong AVD or version is rejected',async t=>{
  const {store}=await storage(t),calls=[];
  const android={adb:process.execPath,adb_sha256:hash,apk:join(tmpdir(),'app.apk'),apk_sha256:hash,serial:'emulator-5554',avd:'Demo',package:'com.demo.app',activity:'com.demo.app/.Main',version_code:'1',emulator:{...program,args:['-avd','Demo','-port','5554','-no-snapshot-save']}};
  let avd='Demo',version='1',installedHash=hash,spawns=0;
  const runtime=new NativeRuntime({}, {verify:async()=>{},sleep:async()=>{},spawn:async()=>{spawns++;},run:async(_file,args)=>{
    calls.push(args);const command=args.slice(2).join(' ');
    if(command==='get-state')throw new Error('offline');
    return{stdout:command==='shell getprop sys.boot_completed'?'1':command==='emu avd name'?`${avd}\r\r\nOK\r\r\n`:command.startsWith('shell pm path')?'package:/data/app/com.demo/base.apk':command.startsWith('shell dumpsys')?`versionCode=${version}`:command.startsWith('shell sha256sum')?`${installedHash}  /data/app/com.demo/base.apk`:'Status: ok'};
  }});
  const p={title:'Android',mode:'android',timeout_seconds:5,android};
  await runtime.launch(p,id,store,()=>{},()=>{});assert.equal(spawns,1);
  assert.ok(calls.every(args=>args[0]==='-s'&&args[1]==='emulator-5554'));
  assert.ok(calls.every(args=>!args.includes('install')&&!args.includes('grant')));
  avd='Other';await assert.rejects(runtime.launch(p,id,store,()=>{},()=>{}),/device/);
  avd='Demo';version='2';await assert.rejects(runtime.launch(p,id,store,()=>{},()=>{}),/device/);
  version='1';installedHash='b'.repeat(64);await assert.rejects(runtime.launch(p,id,store,()=>{},()=>{}),/device/);
  const owner=store.lock('android:emulator-5554');await assert.rejects(runtime.launch(p,id,store,()=>{},()=>{}),/busy/);assert.equal(store.unlock('android:emulator-5554',owner),true);
});
test('an expired emulator lock owner cannot release the replacement held by another connection',async t=>{
  const {store,directory}=await storage(t),other=new LocalState(join(directory,'state.sqlite')),key='android:emulator-5554';
  try {
    const first=store.lock(key);
    assert.throws(()=>other.lock(key),/busy/);
    store.db.prepare('UPDATE runtime_locks SET expires_at=0 WHERE key=?').run(key);
    const replacement=other.lock(key);
    assert.equal(typeof first,'string');assert.notEqual(first,replacement);
    assert.equal(store.unlock(key,first),false);
    assert.throws(()=>store.lock(key),/busy/);
    assert.equal(other.unlock(key,replacement),true);
    assert.equal(other.unlock(key,replacement),false);
    const next=store.lock(key);assert.notEqual(next,replacement);store.unlock(key,next);
  } finally {other.close();}
});

test('unlock requires the owner of the same emulator and rejects missing or incorrect tokens',async t=>{
  const {store}=await storage(t),key='android:emulator-5554',otherKey='android:emulator-5556';
  const owner=store.lock(key),otherOwner=store.lock(otherKey);
  for(const value of [undefined,null,'',crypto.randomUUID(),otherOwner])assert.equal(store.unlock(key,value),false);
  assert.equal(store.unlock(otherKey,owner),false);
  assert.throws(()=>store.lock(key),/busy/);assert.throws(()=>store.lock(otherKey),/busy/);
  assert.equal(store.unlock(key,owner),true);assert.equal(store.unlock(otherKey,otherOwner),true);
});

test('legacy runtime locks migrate without losing active locks or unrelated state',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'yaqi-native-')),path=join(directory,'state.sqlite'),legacy=new DatabaseSync(path);
  t.after(()=>rm(directory,{recursive:true,force:true}));
  legacy.exec("CREATE TABLE runtime_locks (key TEXT PRIMARY KEY, expires_at INTEGER NOT NULL); CREATE TABLE tickets (id TEXT PRIMARY KEY, expires_at INTEGER NOT NULL)");
  legacy.prepare('INSERT INTO runtime_locks VALUES (?,?)').run('active',Math.floor(Date.now()/1000)+240);
  legacy.prepare('INSERT INTO runtime_locks VALUES (?,?)').run('expired',0);
  legacy.prepare('INSERT INTO tickets VALUES (?,?)').run('retained-ticket',123);
  legacy.close();
  for(let pass=0;pass<2;pass++) {
    const store=new LocalState(path);
    try {
      assert.throws(()=>store.lock('active'),/busy/);
      assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM tickets').get().n,1);
      const owner=store.lock('expired');assert.equal(typeof owner,'string');assert.ok(owner);
      assert.equal(store.unlock('expired',owner),true);
      assert.equal(store.db.prepare('PRAGMA table_info(runtime_locks)').all().filter(column=>column.name==='owner').length,1);
    } finally {store.close();}
  }
});

test('Android failure cleanup cannot delete a lock acquired after its own lease expired',async t=>{
  const {store}=await storage(t),key='android:emulator-5554';let replacement;
  const android={adb:process.execPath,adb_sha256:hash,apk:join(tmpdir(),'app.apk'),apk_sha256:hash,serial:'emulator-5554',avd:'Demo',package:'com.demo.app',activity:'com.demo.app/.Main',version_code:'1',emulator:program};
  const runtime=new NativeRuntime({}, {verify:async()=>{},run:async(_file,args)=>{
    const command=args.slice(2).join(' ');
    if(command==='get-state')return{stdout:'device'};
    if(command==='shell getprop sys.boot_completed')return{stdout:'1'};
    if(command==='emu avd name')return{stdout:'Demo'};
    store.db.prepare('UPDATE runtime_locks SET expires_at=0 WHERE key=?').run(key);
    replacement=store.lock(key);throw new Error('device');
  }});
  await assert.rejects(runtime.launch({mode:'android',timeout_seconds:5,android},id,store,()=>{},()=>{}),/device/);
  assert.throws(()=>store.lock(key),/busy/);
  assert.equal(store.unlock(key,replacement),true);
});

test('progress for native apps and samples does not redirect to an undefined URL',async t=>{
  const server=await statusServer('zh','Sample');t.after(()=>server.close());
  server.set('ready','', '',false,'Offline only','<script>sample</script>');
  const state=await(await fetch(new URL('state',server.url))).json();assert.equal(state.url,undefined);assert.equal(state.output,'<script>sample</script>');
  const script=await(await fetch(new URL('client.js',server.url))).text();assert.match(script,/if\(state.url\)/);assert.match(script,/result.textContent=state.output/);
});
test('catalog uses localized launch types and escaped limits without enabling blocked projects',()=>{
  const note={zh:'<script>限制</script>',en:'Limit',ja:'制限',fr:'Limite'},env={LOCAL_LAUNCH_PROJECT_IDS:JSON.stringify([id]),LOCAL_LAUNCH_CATALOG:JSON.stringify({[id]:{kind:'desktop',note}})};
  for(const lang of ['zh','en','ja','fr']){const html=localLaunchPanel(id,{csrf_token:'x'},lang,env);assert.match(html,/data-local-launch/);assert.doesNotMatch(html,/<script>限制/);}
  env.LOCAL_LAUNCH_CATALOG=JSON.stringify({[id]:{kind:'unavailable',note}});assert.equal(localProjectEnabled(env,id),false);assert.doesNotMatch(localLaunchPanel(id,{},'zh',env),/<form/);
  env.LOCAL_LAUNCH_CATALOG=JSON.stringify({[id]:{kind:'document',note,file_id:id}});assert.match(localLaunchPanel(id,{},'zh',env),/href="\/files\//);assert.equal(localProjectEnabled(env,id),false);
  for(const broken of ['broken','{}','[]']){env.LOCAL_LAUNCH_CATALOG=broken;assert.equal(localProjectEnabled(env,id),false);}
});
test('native configuration rejects missing hashes, unsafe paths and non-loopback URLs',()=>{
  const base={version:1,issuer:'https://example.com',public_key:{kty:'EC',crv:'P-256',x:'a'.repeat(43),y:'a'.repeat(43)},docker_path:process.execPath,state_path:join(tmpdir(),'state.sqlite'),context:{name:'desktop-linux',endpoint:'npipe:////./pipe/dockerDesktopLinuxEngine'},projects:{[id]:project}};
  assert.ok(validateConfig(base));
  for(const p of [{...program,sha256:''},{...program,args:['bad\narg']},{...program,env_file:join(tmpdir(),'untracked.json')}])assert.throws(()=>validateConfig({...base,projects:{[id]:{...project,programs:[p]}}}),/config/);
  assert.throws(()=>validateConfig({...base,projects:{[id]:{...project,open_url:'http://example.com:1234',health_urls:['http://example.com:1234']}}}),/config/);
});

test('Windows process identity preserves non-ASCII executable paths', {skip:process.platform !== 'win32'}, async t=>{
  const {directory}=await storage(t),exe=join(directory,'启动器测试.exe');
  await copyFile(process.execPath,exe);
  const child=spawn(exe,['-e','setTimeout(()=>{},60000)'],{windowsHide:true,stdio:'ignore'});
  await once(child,'spawn');
  try {
    const info=await processInfo(child.pid);
    assert.equal(info.pid,child.pid);assert.equal(info.executable.toLowerCase(),exe.toLowerCase());
    assert.ok(info.started_at);
  } finally { const closed=once(child,'exit');child.kill();await closed; }
});

test('catalog export includes only public fields and never enables excluded or unavailable projects',()=>{
  const note={zh:'离线样例',en:'Offline sample',ja:'オフライン例',fr:'Exemple hors ligne'};
  const base={version:1,issuer:'https://example.com',public_key:{kty:'EC',crv:'P-256',x:'a'.repeat(43),y:'a'.repeat(43)},docker_path:process.execPath,state_path:join(tmpdir(),'state.sqlite'),context:{name:'desktop-linux',endpoint:'npipe:////./pipe/dockerDesktopLinuxEngine'}};
  const excluded='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const c={...base,projects:{[id]:{...project,mode:'sample',secret:'never-export',display:{kind:'sample',note}},[excluded]:{title:'Preserved',mode:'unavailable'}}};
  const result=exportCatalog(c);assert.deepEqual(JSON.parse(result.LOCAL_LAUNCH_PROJECT_IDS),[id]);
  assert.doesNotMatch(JSON.stringify(result),/never-export|executable|state_path/);
  const many={...base,projects:{}};
  for(let i=0;i<20;i++)many.projects[`aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12,'0')}`]={...c.projects[id],display:{kind:'sample',note:Object.fromEntries(['zh','en','ja','fr'].map(lang=>[lang,'说明'.repeat(80)]))}};
  const split=exportCatalog(many);
  assert.ok(JSON.parse(split.LOCAL_LAUNCH_CATALOG).parts>1);
  assert.ok(Object.values(split).every(value=>Buffer.byteLength(value)<=4500));
  assert.equal(Object.keys(localCatalog(split)).length,20);
  const sampleId=Object.keys(many.projects)[0];assert.equal(localProjectEnabled(split,sampleId),true);
  delete split.LOCAL_LAUNCH_CATALOG_2;assert.equal(localProjectEnabled(split,sampleId),false);
  assert.deepEqual(localCatalog({...split,LOCAL_LAUNCH_CATALOG:JSON.stringify({parts:99})}),{});
  c.projects[id].mode='unavailable';c.projects[id].display.kind='unavailable';
  assert.deepEqual(JSON.parse(exportCatalog(c).LOCAL_LAUNCH_PROJECT_IDS),[]);
  c.projects[id].display.note.fr=undefined;assert.throws(()=>exportCatalog(c),/catalog/);
});
