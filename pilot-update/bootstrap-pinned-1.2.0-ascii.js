// Variables used by Scriptable.
// icon-color: deep-blue; icon-glyph: shield-check;
// PILOT Bootstrap v1.2 - permanent, signed modules only; never downloads unverified executable code.
// One-time iPhone install. iOS Shortcuts may launch this script; it does not bypass iOS sandbox.

// PILOT signed release policy v1 - pure JS (JavaScriptCore and Node compatible).
// RSA-2048 PKCS#1 v1.5 + SHA-256; strict PKCS#1 encoding and pinned public key.
// Public verification only. The signing PRIVATE key must never be deployed on iPhone/GitHub.
function createPilotReleaseCore(pinnedModulusHex) {
  const SHA256_K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  function utf8(text) {
    const out=[];
    for (const c of String(text)) {
      const n=c.codePointAt(0);
      if(n<=127)out.push(n);
      else if(n<=2047)out.push(0xc0|(n>>>6),0x80|(n&63));
      else if(n<=65535)out.push(0xe0|(n>>>12),0x80|((n>>>6)&63),0x80|(n&63));
      else out.push(0xf0|(n>>>18),0x80|((n>>>12)&63),0x80|((n>>>6)&63),0x80|(n&63));
    }
    return out;
  }
  function sha256(text) {
    const src=utf8(text), bytes=src.slice(), bits=src.length*8;
    bytes.push(0x80);
    while(bytes.length % 64 !== 56)bytes.push(0);
    const hi=Math.floor(bits/4294967296),lo=bits>>>0;
    for(let shift=24;shift>=0;shift-=8)bytes.push((hi>>>shift)&255);
    for(let shift=24;shift>=0;shift-=8)bytes.push((lo>>>shift)&255);
    const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const rotr=(v,n)=>(v>>>n)|(v<<(32-n));
    for(let offset=0;offset<bytes.length;offset+=64){
      const w=new Array(64);
      for(let i=0;i<16;i++){let j=offset+i*4;w[i]=((bytes[j]<<24)|(bytes[j+1]<<16)|(bytes[j+2]<<8)|bytes[j+3])>>>0;}
      for(let i=16;i<64;i++){
        const x=w[i-15],y=w[i-2],s0=rotr(x,7)^rotr(x,18)^(x>>>3),s1=rotr(y,17)^rotr(y,19)^(y>>>10);
        w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;
      }
      let [a,b,c,d,e,f,g,hh]=h;
      for(let i=0;i<64;i++){
        const t1=(hh+(rotr(e,6)^rotr(e,11)^rotr(e,25))+((e&f)^(~e&g))+SHA256_K[i]+w[i])>>>0;
        const t2=((rotr(a,2)^rotr(a,13)^rotr(a,22))+((a&b)^(a&c)^(b&c)))>>>0;
        hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
      }
      const nxt=[a,b,c,d,e,f,g,hh];for(let i=0;i<8;i++)h[i]=(h[i]+nxt[i])>>>0;
    }
    return h.map(x=>x.toString(16).padStart(8,'0')).join('');
  }
  function b64bytes(s){
    if(typeof s!=='string'||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))return null;
    const abc='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';const bytes=[];
    for(let i=0;i<s.length;i+=4){
      const x=abc.indexOf(s[i]),y=abc.indexOf(s[i+1]),z=s[i+2]==='='?0:abc.indexOf(s[i+2]),w=s[i+3]==='='?0:abc.indexOf(s[i+3]);
      if([x,y,z,w].some(t=>t<0))return null;
      bytes.push((x<<2)|(y>>>4));
      if(s[i+2]!=='=')bytes.push(((y&15)<<4)|(z>>>2));
      if(s[i+3]!=='=')bytes.push(((z&3)<<6)|w);
    }
    return bytes;
  }
  function semver(v){
    if(typeof v!=='string'||!/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(v))return null;
    const n=v.split('.').map(Number); return n.every(x=>Number.isSafeInteger(x)&&x<1000000)?n:null;
  }
  function compareVersions(a,b){
    const x=semver(a),y=semver(b); if(!x||!y)throw Error('Version invalide');
    for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]<y[i]?-1:1;return 0;
  }
  function manifestPayload(m){return 'PILOT_RELEASE\n1\n'+m.version+'\n'+m.script_path+'\n'+m.sha256+'\n';}
  function validManifest(m){
    if(!m||typeof m!=='object'||Array.isArray(m))return false;
    const keys=Object.keys(m),expected=['schema','version','script_path','sha256','signature'];
    if(keys.length!==expected.length||!expected.every(k=>Object.prototype.hasOwnProperty.call(m,k)))return false;
    if(m.schema!==1||!semver(m.version))return false;
    if(typeof m.script_path!=='string'||m.script_path!=='pilot-update/releases/pilot-'+m.version+'.js')return false;
    if(typeof m.sha256!=='string'||!/^[a-f0-9]{64}$/.test(m.sha256))return false;
    if(typeof m.signature!=='string'||m.signature.length!==344)return false;
    return true;
  }
  function powmod(base,exp,mod){let v=1n,x=base%mod;for(;exp>0n;exp>>=1n){if(exp&1n)v=(v*x)%mod;x=(x*x)%mod;}return v;}
  function verifySignature(m){
    if(!validManifest(m))return false;
    if(typeof BigInt==='undefined')return false; // Fail closed on older JSCore.
    const bytes=b64bytes(m.signature);if(!bytes||bytes.length!==256)return false;
    const n=BigInt('0x'+pinnedModulusHex), sig=BigInt('0x'+bytes.map(x=>x.toString(16).padStart(2,'0')).join(''));
    if(sig<=0n||sig>=n)return false;
    let encoded=powmod(sig,65537n,n).toString(16).padStart(512,'0');
    const digestInfo='3031300d060960864801650304020105000420'+sha256(manifestPayload(m));
    if(!encoded.startsWith('0001')||!encoded.endsWith('00'+digestInfo))return false;
    const filler=encoded.slice(4,encoded.length-(2+digestInfo.length));
    return filler.length>=16&&filler.length%2===0&&/^f+$/.test(filler);
  }
  function checkRelease(m,script,installedVersion){
    if(!validManifest(m))return {ok:false,reason:'manifest_invalid'};
    if(compareVersions(m.version,installedVersion)<=0)return {ok:false,reason:'not_newer'};
    if(!verifySignature(m))return {ok:false,reason:'signature_invalid'};
    if(typeof script!=='string'||script.length<100||utf8(script).length>120000)return {ok:false,reason:'script_invalid'};
    if(sha256(script)!==m.sha256)return {ok:false,reason:'content_mismatch'};
    if(!script.startsWith('// PILOT Commander iOS module'))return {ok:false,reason:'script_marker_missing'};
    return {ok:true,reason:'verified'};
  }
  return {sha256,validManifest,verifySignature,checkRelease,compareVersions,manifestPayload};
}

const VERIFY = createPilotReleaseCore('c3df38351737fc30295268fbc495786e3e7e49316b2fa503bf6f69240afcc54159db63c69acd99868cb4f1b1203a3a1311c16f74e50aa98cfaf9d2be9372a6d4e79441d91e1f62125303105b62b37b1c0678fb0934bb6578088b86a329057201137c837e8f6bab2b82f08e08af2ea7e11c2fa5c28d4926cef69d581bf148aea6431c853ffc6a85a74d506510368282e6295299a23899867cf880478fd1294636648822b99a31aa6da486178b49a6ef52b9eadff22828aa0d49008decd94c981c54b9bc71956bba200443ed005a72da2040c1b52f54d59894f6ec2c3a27ea65a1173e2d91004ba02134ba41cba8c443386acac73683b3bed4ece03b044fd7d075');
const CFG = Object.freeze({
  owner:'kamikaze13016', repo:'FSDFGS', branch:'pilot-ping-20261105',
  manifest:'pilot-update/latest.json',
  dataFolder:'PILOT_Signed_Runtime',
  maxScriptChars:120000
});
const FILE = FileManager.local();
const ROOT = FILE.joinPath(FILE.libraryDirectory(), CFG.dataFolder);
if(!FILE.fileExists(ROOT)) FILE.createDirectory(ROOT, true);
const CURRENT = FILE.joinPath(ROOT, 'current.js');
const PREVIOUS = FILE.joinPath(ROOT, 'previous.js');
const STATE = FILE.joinPath(ROOT, 'state.json');
const PREVSTATE = FILE.joinPath(ROOT, 'previous-state.json');
const STAGE = FILE.joinPath(ROOT, 'stage.js');
const ACTIVE_MANIFEST = FILE.joinPath(ROOT, 'active-manifest.json');
const PREVIOUS_MANIFEST = FILE.joinPath(ROOT, 'previous-manifest.json');
const BLOCKED = FILE.joinPath(ROOT, 'blocked-release.json');
const BASE = 'https://api.github.com/repos/'+CFG.owner+'/'+CFG.repo+'/contents/';
const HEADERS = {'Accept':'application/vnd.github+json',
  'X-GitHub-Api-Version':'2022-11-28', 'Cache-Control':'no-cache'};

function cleanError(e){
  const s=String((e&&e.message)||e||'erreur');
  if(/(401|403)/.test(s)) return 'Acces GitHub indisponible';
  if(/(429|rate limit)/i.test(s)) return 'Limite temporaire GitHub';
  if(/(network|internet|offline|time.?out)/i.test(s)) return 'Connexion indisponible';
  if(/(signature|content_mismatch|sha256|hash)/i.test(s)) return 'Integrite de mise a jour refusee';
  return 'Erreur securisee ('+s.slice(0,65).replace(/[\r\n]/g,' ')+')';
}
function validState(s){
  return !!s&&s.schema===1&&typeof s.version==='string'&&
    /^[0-9]+\.[0-9]+\.[0-9]+$/.test(s.version)&&
    typeof s.sha256==='string'&&/^[a-f0-9]{64}$/.test(s.sha256);
}
function loadState(path){
  if(!FILE.fileExists(path)) return null;
  const s=JSON.parse(FILE.readString(path));
  if(!validState(s)) throw Error('Etat local invalide');
  return s;
}
function verifyLocal(path,state,manifestPath){
  if(!state||!FILE.fileExists(path)||!FILE.fileExists(manifestPath))return false;
  const m=JSON.parse(FILE.readString(manifestPath));
  return VERIFY.validManifest(m)&&VERIFY.verifySignature(m)&&
    m.version===state.version&&m.sha256===state.sha256&&
    VERIFY.sha256(FILE.readString(path))===state.sha256;
}
function storeText(path,text){FILE.writeString(path,text);}
function saveState(path,s){storeText(path,JSON.stringify(s,null,2));}
function makeState(m){return {schema:1,version:m.version,sha256:m.sha256};}
function restorePrevious(){
  const ps=loadState(PREVSTATE);
  if(!verifyLocal(PREVIOUS,ps,PREVIOUS_MANIFEST)) return false;
  // On-disk state must reflect the restored source.
  storeText(CURRENT,FILE.readString(PREVIOUS));
  saveState(STATE,ps);
  storeText(ACTIVE_MANIFEST,FILE.readString(PREVIOUS_MANIFEST));
  return true;
}
async function ghContent(path,limit){
  const r=new Request(BASE+path+'?ref='+encodeURIComponent(CFG.branch)+'&nonce='+Date.now());
  r.timeoutInterval=20;
  r.headers=HEADERS;
  const reply=await r.loadString();
  const code=r.response&&r.response.statusCode;
  if(code!==200) throw Error('GitHub HTTP '+code);
  if(reply.length>Math.max(4096,limit*2+4096)) throw Error('Reponse trop volumineuse');
  const body=JSON.parse(reply);
  if(body.encoding!=='base64'||typeof body.content!=='string'||body.content.length>limit*2)
    throw Error('Encodage inattendu');
  const raw=Data.fromBase64String(body.content.replace(/\s/g,''));
  if(!raw) throw Error('Base64 invalide');
  const txt=raw.toRawString();
  if(txt.length>limit) throw Error('Fichier trop volumineux');
  return txt;
}
async function maybeUpdate(){
  let local=loadState(STATE);
  if(local&&!verifyLocal(CURRENT,local,ACTIVE_MANIFEST)){
    if(!restorePrevious()) throw Error('Integrite locale invalide, aucun rollback utilisable');
    local=loadState(STATE);
  }
  if(!local&&FILE.fileExists(CURRENT)) throw Error('Module local non approuve');
  const raw=await ghContent(CFG.manifest,6000);
  const manifest=JSON.parse(raw);
  if(!VERIFY.validManifest(manifest)||!VERIFY.verifySignature(manifest)) throw Error('Signature non valide');
  if(local&&VERIFY.compareVersions(manifest.version,local.version)<=0)
    return {status:'up_to_date',version:local.version};
  if(FILE.fileExists(BLOCKED)){
    let bad=null;try{bad=JSON.parse(FILE.readString(BLOCKED));}catch(_){}
    if(bad&&bad.version===manifest.version&&bad.sha256===manifest.sha256)
      return {status:'quarantined',version:local?local.version:'none'};
  }
  // Verify all bytes before writing or running anything.
  const script=await ghContent(manifest.script_path,CFG.maxScriptChars);
  const v=VERIFY.checkRelease(manifest,script,local?local.version:'0.0.0');
  if(!v.ok) throw Error('Integrite de mise a jour refusee: '+v.reason);
  storeText(STAGE,script);
  if(VERIFY.sha256(FILE.readString(STAGE))!==manifest.sha256) throw Error('Integrite staging invalide');
  // Preserve last known-good module. Use a new module in the next Scriptable import call.
  if(local){
    storeText(PREVIOUS,FILE.readString(CURRENT));
    saveState(PREVSTATE,local);
    storeText(PREVIOUS_MANIFEST,FILE.readString(ACTIVE_MANIFEST));
  }
  try{
    storeText(CURRENT,FILE.readString(STAGE));
    if(VERIFY.sha256(FILE.readString(CURRENT))!==manifest.sha256)throw Error('Integrite installation invalide');
    storeText(ACTIVE_MANIFEST,JSON.stringify(manifest));
    saveState(STATE,makeState(manifest));
    if(!verifyLocal(CURRENT,makeState(manifest),ACTIVE_MANIFEST))throw Error('Integrite manifeste local invalide');
  }catch(e){
    if(local){restorePrevious();}else{
      if(FILE.fileExists(CURRENT)) FILE.remove(CURRENT);
      if(FILE.fileExists(STATE)) FILE.remove(STATE);
      if(FILE.fileExists(ACTIVE_MANIFEST)) FILE.remove(ACTIVE_MANIFEST);
    }
    throw e;
  }finally{if(FILE.fileExists(STAGE)) FILE.remove(STAGE);}
  return {status:'updated',version:manifest.version};
}
async function runInstalled(info){
  let local=loadState(STATE);
  if(!verifyLocal(CURRENT,local,ACTIVE_MANIFEST)) throw Error('Module actif invalide');
  try{
    const mod=importModule(CURRENT);
    if(!mod||typeof mod.run!=='function') throw Error('Module sans fonction run');
    return await mod.run({version:local.version, update:info, bootstrap:'1.2.0'});
  }catch(e){
    // Quarantine a release that cannot run. Do not execute the same bad module repeatedly.
    storeText(BLOCKED,JSON.stringify({version:local.version,sha256:local.sha256}));
    if(restorePrevious()) throw Error('Nouvelle version retiree, ancienne version restauree');
    throw Error('Nouvelle version refusee; ancien PILOT v1.1 reste disponible');
  }
}
async function showError(message){
  const text='PILOT : '+message;
  if(typeof config!=='undefined'&&!config.runsInApp){
    if(typeof Script.setShortcutOutput==='function') Script.setShortcutOutput(text);
    return;
  }
  const a=new Alert();a.title='PILOT - Verification';a.message=text;
  a.addAction('OK');await a.presentAlert();
}
async function main(){
  let update={status:'no_network'};
  try{update=await maybeUpdate();}
  catch(e){update={status:'update_failed',reason:cleanError(e)};}
  try{await runInstalled(update);}
  catch(e){await showError('aucun module exploitable. '+cleanError(e));}
  Script.complete();
}
module.exports.run = main;
