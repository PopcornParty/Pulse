(function(){
var KV="https://keyvalue.immanuel.co/api/KeyVal/";
var KVAPP="5m3eiyzm";
var DEMO=["you","nova","milo","rio","iris","sage"];

function kvGet(key){
  return fetch(KV+"GetValue/"+KVAPP+"/"+key).then(function(r){return r.text()}).then(function(t){
    t=String(t||"").replace(/^"|"$/g,"").trim();
    if(!t||t==="null"||t.indexOf("Exception")>=0)return "";
    return t;
  }).catch(function(){return ""});
}
function b64d(s){
  try{
    s=String(s||"").replace(/-/g,"+").replace(/_/g,"/");
    while(s.length%4)s+="=";
    return decodeURIComponent(escape(atob(s)));
  }catch(e){return ""}
}

function realUser(u){
  if(!u||!u.id)return false;
  var name=String(u.username||"").trim();
  if(!name)return false;
  if(DEMO.indexOf(u.id)>=0||DEMO.indexOf(name.toLowerCase())>=0)return false;
  if(/^p\d+$/.test(String(u.id)))return false;
  return true;
}

function cleanUsers(list, keepId){
  var out=[], seen={};
  (list||[]).forEach(function(u){
    if(!u||!u.id)return;
    if(keepId&&u.id===keepId){
      if(!String(u.username||"").trim())u.username=u.display||"you";
      if(!seen[u.id]){seen[u.id]=1;out.push(u)}
      return;
    }
    if(!realUser(u))return;
    var key="@"+String(u.username).toLowerCase();
    if(seen[u.id]||seen[key])return;
    seen[u.id]=1;seen[key]=1;
    out.push(u);
  });
  return out;
}

function scrubLocal(){
  if(typeof db==="undefined"||!db.users)return;
  db.users=cleanUsers(db.users, db.session);
  if(db.posts)db.posts=db.posts.filter(function(p){return p&&p.id});
}

scrubLocal();

if(typeof mergeUsers==="function"){
  var _mu=mergeUsers;
  window.mergeUsers=function(a,b){
    return cleanUsers(_mu(a,b), typeof db!=="undefined"?db.session:null);
  };
  try{mergeUsers=window.mergeUsers}catch(e){}
}

if(typeof applyRemote==="function"){
  var _ar=applyRemote;
  window.applyRemote=function(x){
    if(x&&x.users)x.users=cleanUsers(x.users, db&&db.session);
    var ok=_ar(x);
    scrubLocal();
    window.cloudNote="Linked. "+((db.users||[]).length)+" accounts, "+((db.posts||[]).length)+" posts.";
    return ok;
  };
  try{applyRemote=window.applyRemote}catch(e){}
}

function loadChunks(){
  return kvGet("pulsen").then(function(n){
    n=parseInt(n,10)||0;
    if(n<1||n>500)return null;
    var jobs=[],i;
    for(i=0;i<n;i++)jobs.push(kvGet("pulsec"+i));
    return Promise.all(jobs).then(function(parts){
      var raw=b64d(parts.join(""));
      try{return JSON.parse(raw)}catch(e){return null}
    });
  });
}

window.pullCloud=function(){
  if(window.cloudBusy){window.cloudQueued=true;return}
  window.cloudBusy=true;
  var done=function(){
    window.cloudBusy=false;
    window.cloudReady=true;
    if(window.cloudQueued){window.cloudQueued=false;window.pullCloud()}
  };
  loadChunks().then(function(y){
    if(y&&y.users&&typeof applyRemote==="function"){applyRemote(y);return true}
    return false;
  }).then(function(ok){
    if(!ok)window.cloudNote="Saved here. Auto-sync will retry…";
    done();
  }).catch(function(){
    window.cloudNote="Saved here. Auto-sync will retry…";
    done();
  });
};

if(typeof searchView==="function"){
  var _sv=searchView;
  window.searchView=function(){
    var keep=db.users;
    db.users=cleanUsers(keep, db.session);
    var html=_sv();
    db.users=keep;
    return html;
  };
}
if(typeof messagesView==="function"){
  var _mv=messagesView;
  window.messagesView=function(){
    var keep=db.users;
    db.users=cleanUsers(keep, db.session);
    var html=_mv();
    db.users=keep;
    return html;
  };
}

try{
  window.cloudReady=true;
  setTimeout(function(){window.pullCloud()},400);
}catch(e){}
})();
