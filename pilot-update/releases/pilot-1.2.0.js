// PILOT Commander iOS module 1.2.0 — signed; minimal allowlisted operations only.
const SETTINGS=Object.freeze({owner:'kamikaze13016',repo:'FSDFGS',branch:'pilot-ping-20261105',id:'pilot-real-20261105-01',key:'PILOT_FSDFGS_WRITE_TOKEN_V1'});
const PREFIX='https://api.github.com/repos/'+SETTINGS.owner+'/'+SETTINGS.repo+'/contents/';
const HEAD={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Cache-Control':'no-cache'};
const fm=FileManager.local();
const folder=fm.joinPath(fm.libraryDirectory(),'PILOT_Commander');
if(!fm.fileExists(folder))fm.createDirectory(folder,true);
const stateFile=fm.joinPath(folder,'module-state-v120.json');
function getState(){try{return JSON.parse(fm.readString(stateFile));}catch(_){return {};}}
function putState(s){fm.writeString(stateFile,JSON.stringify(s));}
function filtered(e){let v=String(e&&e.message||e||'erreur');return /(401|403)/.test(v)?'Acces GitHub refuse':v.slice(0,90).replace(/[\r\n]/g,' ');}
async function get(path,token){
  const req=new Request(PREFIX+path+'?ref='+SETTINGS.branch+'&t='+Date.now());req.timeoutInterval=20;
  req.headers=token?{...HEAD,Authorization:'Bearer '+token}:HEAD;
  const body=await req.loadJSON();return {code:req.response.statusCode,body};
}
async function put(path,obj,token){
  const req=new Request(PREFIX+path);req.timeoutInterval=20;req.method='PUT';
  req.headers={...HEAD,'Content-Type':'application/json',Authorization:'Bearer '+token};
  req.body=JSON.stringify({branch:SETTINGS.branch,message:'PILOT: technical receipt '+obj.protocol,
    content:Data.fromString(JSON.stringify(obj,null,2)+'\n').toBase64String()});
  const response=await req.loadJSON();return {code:req.response.statusCode,body:response};
}
function decode(doc){
  if(!doc||doc.encoding!=='base64'||typeof doc.sha!=='string'||!/^[a-f0-9]{40}$/.test(doc.sha))throw Error('format Github invalide');
  const b=Data.fromBase64String(doc.content.replace(/\s/g,''));
  if(!b)throw Error('base64 invalide');return JSON.parse(b.toRawString());
}
async function ack(sha,id,token){
  if(!token)return 'non active';
  const path='pilot-results/ack-'+sha.slice(0,16)+'.json';
  const chk=await get(path,token);
  if(chk.code===200){
    const prior=decode(chk.body);
    if(prior.protocol==='PILOT_ACK_V1'&&prior.command_sha===sha&&prior.mission_id===id&&prior.status==='received_on_iphone')return 'deja publie';
    throw Error('resultat existant inattendu');
  }
  if(chk.code!==404)throw Error('HTTP '+chk.code);
  const payload={protocol:'PILOT_ACK_V1',mission_id:id,command_sha:sha,status:'received_on_iphone',note:'Test technique sans donnees personnelles',runtime:'1.2.0'};
  const result=await put(path,payload,token);
  if(result.code!==201&&result.code!==200)throw Error('HTTP '+result.code);
  if(!result.body||!result.body.content||typeof result.body.content.sha!=='string')throw Error('Resultat GitHub non confirme');
  return 'OK (publie sur GitHub)';
}
async function updateAck(version,token){
  if(!token) return 'non active';
  const path='pilot-results/update-'+version.replace(/\./g,'-')+'.json';
  const exists=await get(path,token);
  if(exists.code===200){
    const value=decode(exists.body);
    if(value.protocol==='PILOT_UPDATE_ACK_V1'&&value.version===version)return 'deja publie';
    throw Error('Rapport mise a jour inattendu');
  }
  if(exists.code!==404)throw Error('HTTP '+exists.code);
  const payload={protocol:'PILOT_UPDATE_ACK_V1',version, status:'module_executed_on_iphone',note:'Aucune donnee personnelle'};
  const r=await put(path,payload,token);
  if(r.code!==201&&r.code!==200)throw Error('HTTP '+r.code);
  return 'OK (GitHub)';
}
module.exports.run=async function(context){
  const lines=['PILOT Commander module '+context.version];
  lines.push('Mise a jour : '+context.update.status);
  let token=null;
  try{if(Keychain.contains(SETTINGS.key))token=Keychain.get(SETTINGS.key);}catch(_){ }
  try{
    const cmd=await get('ping.json',null);
    if(cmd.code!==200)throw Error('Lecture HTTP '+cmd.code);
    const c=decode(cmd.body);
    if(!c || c.id!==SETTINGS.id || !['ping','status'].includes(c.action) || typeof c.message!=='string'||c.message.length>300)
      throw Error('Commande non autorisee');
    const state=getState();
    lines.push('Commande : '+(state.sha===cmd.body.sha?'deja lue':'nouvelle'));
    lines.push('Action : '+c.action);
    lines.push('Message : '+c.message);
    state.sha=cmd.body.sha;putState(state);
    try{lines.push('Retour : '+await ack(cmd.body.sha,c.id,token));}
    catch(e){lines.push('Retour : '+filtered(e));}
  }catch(e){lines.push('Mission : '+filtered(e));}
  try{lines.push('Rapport version : '+await updateAck(context.version,token));}
  catch(e){lines.push('Rapport version : '+filtered(e));}
  const txt=lines.join('\n');
  if(typeof config!=='undefined'&&!config.runsInApp){
    if(typeof Script.setShortcutOutput==='function')Script.setShortcutOutput(txt);
  }else{
    const a=new Alert();a.title='PILOT Commander';a.message=txt;a.addAction('OK');await a.presentAlert();
  }
  if(typeof Pasteboard!=='undefined'&&config.runsInApp)Pasteboard.copyString(txt);
  return txt;
};
