// Variables used by Scriptable.
// icon-color: deep-blue; icon-glyph: shield-check;
// PILOT Commander: minimal iOS bridge. Local execution; Github transports only harmless ping/ack.
// INSTALLATION: import .scriptable or paste this JavaScript into Scriptable.
// Limitation: can't control other iOS apps or start messages. No secret leaves Keychain except GitHub auth request.
const CONF = Object.freeze({
  owner: 'kamikaze13016', repo: 'FSDFGS', branch: 'pilot-ping-20261105',
  key: 'PILOT_FSDFGS_WRITE_TOKEN_V1',
  acceptedId: 'pilot-real-20261105-01',
  ackProtocol: 'PILOT_ACK_V1',
  host: 'https://api.github.com/repos/kamikaze13016/FSDFGS/contents/'
});
const HEAD = {
  'Accept':'application/vnd.github+json',
  'X-GitHub-Api-Version':'2022-11-28',
  'Cache-Control':'no-cache'
};
const fm = FileManager.local();
const directory = fm.joinPath(fm.libraryDirectory(), 'PILOT_Commander');
if (!fm.fileExists(directory)) fm.createDirectory(directory, true);
const statePath = fm.joinPath(directory, 'state-v1.json');
function readState() {
  try {
    if (!fm.fileExists(statePath)) return {lastSha:null, lastAckSha:null, feedbackPrompted:false};
    const s = JSON.parse(fm.readString(statePath));
    return {lastSha:typeof s.lastSha==='string'?s.lastSha:null,
            lastAckSha:typeof s.lastAckSha==='string'?s.lastAckSha:null,
            feedbackPrompted:s.feedbackPrompted===true};
  } catch (_) {return {lastSha:null, lastAckSha:null, feedbackPrompted:false};}
}
function saveState(obj) {
  const next = {lastSha:obj.lastSha||null,lastAckSha:obj.lastAckSha||null,
    feedbackPrompted:obj.feedbackPrompted===true,
    updatedAt: new Date().toISOString()};
  fm.writeString(statePath, JSON.stringify(next));
}
function cleanError(e) {
  // No request/response bodies, bearer tokens, or user-provided strings in any error report.
  const s=String((e && e.message) || e || 'Erreur inconnue');
  if (/\b(401|403)\b/.test(s)) return 'Acces GitHub refuse : verifier les permissions du jeton.';
  if (/\b(404)\b/.test(s)) return 'Fichier de mission introuvable.';
  if (/network|timed out|timeout|offline|internet/i.test(s)) return 'Connexion indisponible.';
  return 'Echec de la mission (code: ' + String(s).slice(0,55).replace(/[\r\n]/g,' ') + ').';
}
function validSha(value){ return typeof value==='string' && /^[a-f0-9]{40}$/.test(value); }
function decodeContent(doc) {
  if (!doc || doc.encoding !== 'base64' || !validSha(doc.sha) || typeof doc.content !== 'string')
    throw new Error('Format Github invalide');
  const bytes=Data.fromBase64String(doc.content.replace(/\s/g,''));
  if (!bytes) throw new Error('Base64 invalide');
  return JSON.parse(bytes.toRawString());
}
function validateMission(m){
  if(!m || Array.isArray(m) || typeof m!=='object' ||
     m.action!=='ping' || m.id!==CONF.acceptedId ||
     typeof m.message!=='string' || m.message.length>300 || m.message.length<1)
    throw new Error('Commande non autorisee');
  return m;
}
async function githubGet(path, token){
  const req=new Request(CONF.host + path + '?ref=' + encodeURIComponent(CONF.branch) + '&t=' + Date.now());
  req.timeoutInterval=20;
  req.headers=token ? {...HEAD, 'Authorization':'Bearer '+token}:HEAD;
  const response=await req.loadJSON();
  return {code: req.response.statusCode, body:response};
}
async function githubPut(path, content, token){
  const req=new Request(CONF.host + path);
  req.timeoutInterval=20;
  req.method='PUT';
  req.headers={...HEAD, 'Content-Type':'application/json', 'Authorization':'Bearer '+token};
  req.body=JSON.stringify({branch:CONF.branch,message:'PILOT: accuse de reception technique',
    content:Data.fromString(JSON.stringify(content,null,2)+'\n').toBase64String()});
  const result=await req.loadJSON();
  return {code:req.response.statusCode, body:result};
}
async function tokenOptional(){
  try {return Keychain.contains(CONF.key)?Keychain.get(CONF.key):null;}
  catch(_) {return null;}
}
async function enableFeedback(){
  const a=new Alert();
  a.title='Activer le retour automatique';
  a.message='Uniquement un jeton GitHub a permissions fines pour FSDFGS (Contents Read/Write), 7 jours. Ce depot est public : aucun message prive. Le jeton reste dans le trousseau local.';
  a.addSecureTextField('Jeton GitHub limite', '');
  a.addAction('Activer'); a.addCancelAction('Plus tard');
  if(await a.presentAlert()!==0) return false;
  const raw=a.textFieldValue(0).trim();
  if(!/^github_pat_[A-Za-z0-9_]{15,}$/.test(raw)) throw new Error('Jeton incompatible');
  // Validate token without printing or logging it. Metadata read requires authorization.
  const check=await githubGet('ping.json',raw);
  if(check.code!==200) throw new Error('Permissions de lecture insuffisantes');
  Keychain.set(CONF.key,raw);
  return true;
}
async function sendReceipt(sha, mission, token, state){
  if(!token) return 'non active';
  if(state.lastAckSha===sha) return 'deja confirme';
  const path='pilot-results/ack-'+sha.slice(0,16)+'.json';
  const existing=await githubGet(path,token);
  if(existing.code===200){
    const prior=decodeContent(existing.body);
    if(prior.protocol===CONF.ackProtocol && prior.command_sha===sha &&
       prior.mission_id===CONF.acceptedId && prior.status==='received_on_iphone'){
      state.lastAckSha=sha; saveState(state); return 'deja publie';
    }
    throw new Error('Accuse existant non reconnu');
  }
  if(existing.code!==404) throw new Error('GitHub HTTP '+existing.code);
  const payload={protocol:CONF.ackProtocol,mission_id:mission.id,
      command_sha:sha,status:'received_on_iphone',note:'Test technique sans donnees personnelles'};
  const posted=await githubPut(path,payload,token);
  if(posted.code!==201 && posted.code!==200) throw new Error('GitHub HTTP '+posted.code);
  if(!posted.body || !posted.body.content || !validSha(posted.body.content.sha))
    throw new Error('Verification de publication impossible');
  state.lastAckSha=sha; saveState(state);
  return 'OK (publie sur GitHub)';
}
let title='PILOT Commander';
let lines=[];
try {
  const file=await githubGet('ping.json',null);
  if(file.code!==200) throw new Error('GitHub HTTP '+file.code);
  const mission=validateMission(decodeContent(file.body));
  const state=readState();
  const changed=state.lastSha!==file.body.sha;
  state.lastSha=file.body.sha; saveState(state);
  lines.push('Lecture GitHub : OK');
  lines.push('Commande : '+(changed?'nouvelle version':'deja lue'));
  lines.push('Message : '+mission.message);
  let token=await tokenOptional();
  if(!token && config.runsInApp && !state.feedbackPrompted){
    state.feedbackPrompted=true;saveState(state);
    const m=new Alert();
    m.title='PILOT : liaison active';
    m.message='La lecture a reussi. Pour me renvoyer automatiquement un accuse, il faut une autorisation GitHub. Tu peux l activer plus tard.';
    m.addAction('Activer le retour');m.addCancelAction('Plus tard');
    if(await m.presentAlert()===0){
      try { if(await enableFeedback()) token=await tokenOptional(); }
      catch(_){lines.push('Retour : autorisation non activee');}
    }
  }
  try { lines.push('Retour : '+await sendReceipt(file.body.sha,mission,token,state)); }
  catch(e){lines.push('Retour : '+cleanError(e));}
} catch(e){title='PILOT : erreur';lines=['Diagnostic : '+cleanError(e)];}
const report=lines.join('\n');
if(typeof Pasteboard!=='undefined') Pasteboard.copyString(report);
if(typeof config!=='undefined' && !config.runsInApp){
  if(typeof Script.setShortcutOutput==='function') Script.setShortcutOutput(report);
}else{
  const result=new Alert();result.title=title;result.message=report;
  result.addAction('OK');await result.presentAlert();
}
Script.complete();