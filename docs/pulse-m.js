(function(){
var KV="https://keyvalue.immanuel.co/api/KeyVal/";
var KVAPP="5m3eiyzm";
var DEMO=["you","nova","milo","rio","iris","sage"];
var CHUNK=160;
window.cloudPulled=false;

function kvGet(key){
  return fetch(KV+"GetValue/"+KVAPP+"/"+key).then(function(r){return r.text()}).then(function(t){
    t=String(t||"").replace(/^"|"$/g,"").trim();
    if(!t||t==="null"||t.indexOf("Exception")>=0)return "";
    return t;
  }).catch(function(){return ""});
}
function kvSet(key,val){
  val=String(val||"").slice(0,180);
  return fetch(KV+"UpdateValue/"+KVAPP+"/"+key+"/"+encodeURIComponent(val),{method:"POST",headers:{"Content-Length":"0"}}).then(function(r){return r.ok}).catch(function(){return false});
}
function b64e(s){try{return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}catch(e){return ""}}
function b64d(s){
  try{
    s=String(s||"").replace(/-/g,"+").replace(/_/g,"/");
    while(s.length%4)s+="=";
    return decodeURIComponent(escape(atob(s)));
  }catch(e){return ""}
}
function loadSeries(prefix){
  return kvGet(prefix+"n").then(function(n){
    n=parseInt(n,10)||0;
    if(n<1||n>80)return null;
    var jobs=[],i;
    for(i=0;i<n;i++)jobs.push(kvGet(prefix+"c"+i));
    return Promise.all(jobs).then(function(parts){
      try{return JSON.parse(b64d(parts.join("")))}catch(e){return null}
    });
  });
}
function saveSeries(prefix, obj){
  var raw=b64e(JSON.stringify(obj));
  var n=Math.ceil(raw.length/CHUNK)||1;
  if(n>80)return Promise.resolve(false);
  var chain=Promise.resolve(true),i;
  for(i=0;i<n;i++){(function(i){var bit=raw.slice(i*CHUNK,(i+1)*CHUNK);chain=chain.then(function(){return kvSet(prefix+"c"+i,bit)})})(i)}
  return chain.then(function(){return kvSet(prefix+"n",String(n))});
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
  if(db.posts)db.posts=(db.posts||[]).filter(function(p){return p&&p.id&&DEMO.indexOf(p.by)<0});
  if(db.stories)db.stories=[];
}
scrubLocal();

if(typeof mergeUsers==="function"){
  var _mu=mergeUsers;
  window.mergeUsers=function(a,b){return cleanUsers(_mu(a,b), db&&db.session)};
  try{mergeUsers=window.mergeUsers}catch(e){}
}
if(typeof packCloud==="function"){
  var _pack=packCloud;
  window.packCloud=function(d){
    var x=_pack(d);
    x.stories=[];
    x.users=cleanUsers(x.users||[], null);
    x.posts=(x.posts||[]).filter(function(p){return p&&p.id&&DEMO.indexOf(p.by)<0}).slice(0,80);
    (x.posts||[]).forEach(function(p){
      if(p.img&&(String(p.img).indexOf("data:")===0||/picsum/.test(p.img)))p.img=p.remote||"";
    });
    x.audit=[];x.notes=(x.notes||[]).slice(0,8);
    return x;
  };
}

if(typeof applyRemote==="function"){
  var _ar=applyRemote;
  window.applyRemote=function(x){
    if(!x)return false;
    if(x.users)x.users=cleanUsers(x.users, db&&db.session);
    if(x.stories)x.stories=[];
    var keep="";
    var box=document.getElementById("mtext");
    if(box)keep=box.value;
    var ok=_ar(x);
    scrubLocal();
    window.cloudPulled=true;
    window.cloudNote="Auto-sync on · "+((db.users||[]).length)+" accounts · "+((db.posts||[]).length)+" posts";
    if(typeof route!=="undefined"&&route==="messages"&&typeof draw==="function"){
      draw();
      var b2=document.getElementById("mtext");
      if(b2){b2.value=keep;if(keep)b2.focus()}
    }
    return ok;
  };
  try{applyRemote=window.applyRemote}catch(e){}
}

function slimUsers(){
  return (db.users||[]).filter(realUser).concat((db.users||[]).filter(function(u){return db.session&&u.id===db.session})).filter(function(u,i,a){return a.findIndex(function(x){return x.id===u.id})===i}).map(function(u){
    return {id:u.id,username:u.username,display:u.display||u.username,pass:u.pass||"",bio:u.bio||"",h:u.h||0,ver:!!u.ver,crown:!!u.crown,followers:0,following:0,blocked:!!u.blocked,staff:!!u.staff,shadow:!!u.shadow,role:u.role||"member",pic:(u.pic&&String(u.pic).indexOf("http")===0&&!/picsum/.test(u.pic))?u.pic:""};
  });
}
function slimPosts(){
  return (db.posts||[]).filter(function(p){return p&&p.id&&DEMO.indexOf(p.by)<0}).slice(0,80).map(function(p){
    return {id:p.id,by:p.by,text:p.text||"",img:(p.remote&&String(p.remote).indexOf("http")===0)?p.remote:((p.img&&String(p.img).indexOf("http")===0&&!/picsum/.test(p.img))?p.img:""),remote:p.remote||"",t:p.t||0,likes:p.likes||[],comments:[],saved:p.saved||[],hidden:!!p.hidden,pinned:!!p.pinned,featured:!!p.featured,locked:!!p.locked,views:p.views||1};
  });
}
function pairOf(a,b){return [String(a||""),String(b||"")].sort().join("|")}
function slimThreads(){
  var map={};
  function add(pair, msgs){
    if(!pair||pair.indexOf("|")<0)return;
    if(!map[pair])map[pair]=[];
    map[pair]=map[pair].concat(msgs||[]);
  }
  (db.threads||[]).forEach(function(t){if(t)add(t.pair,t.msgs)});
  var self=db.session;
  (db.convos||[]).forEach(function(c){
    if(!c||!c.with||!self)return;
    add(pairOf(self,c.with),c.msgs||[]);
  });
  return Object.keys(map).map(function(k){
    var seen={},msgs=[];
    map[k].forEach(function(m){
      if(!m||!String(m.text||"").trim())return;
      var id=m.id||"";
      var key=id||((m.by||"")+"|"+(m.text||"")+"|"+Math.round((m.t||0)/8000));
      if(seen[key])return;
      seen[key]=1;
      msgs.push({id:id||("m"+(m.t||0)+"-"+(m.by||"")),by:m.by,text:String(m.text),t:m.t||0});
    });
    msgs.sort(function(a,b){return (a.t||0)-(b.t||0)});
    if(msgs.length>80)msgs=msgs.slice(-80);
    return {pair:k,msgs:msgs};
  }).filter(function(t){return t.msgs.length});
}

window.pullCloud=function(){
  if(window.cloudBusy){window.cloudQueued=true;return}
  window.cloudBusy=true;
  var done=function(){
    window.cloudBusy=false;
    window.cloudReady=true;
    if(window.cloudQueued){window.cloudQueued=false;window.pullCloud()}
  };
  Promise.all([loadSeries("pulseu"),loadSeries("pulsep"),loadSeries("pulsem"),loadSeries("pulse")]).then(function(parts){
    var usersPack=parts[0], postsPack=parts[1], msgPack=parts[2], full=parts[3];
    var remote={users:[],posts:[],follows:[],stories:[],threads:[],convos:[],notes:[],reports:[],settings:{},deletedPosts:[],kicked:[],rev:0};
    if(full&&full.users){
      remote.users=full.users;
      remote.posts=full.posts||[];
      remote.follows=full.follows||[];
      remote.threads=full.threads||[];
      remote.settings=full.settings||{};
      remote.rev=full.rev||0;
    }
    if(usersPack&&usersPack.users)remote.users=(remote.users||[]).concat(usersPack.users);
    if(postsPack&&postsPack.posts)remote.posts=(remote.posts||[]).concat(postsPack.posts);
    if(msgPack&&msgPack.threads)remote.threads=(remote.threads||[]).concat(msgPack.threads);
    if(!(remote.users&&remote.users.length)&&!(remote.threads&&remote.threads.length))return false;
    if(typeof applyRemote==="function")applyRemote(remote);
    return true;
  }).then(function(ok){
    if(!ok)window.cloudNote="Auto-sync will retry…";
    done();
  }).catch(function(){window.cloudNote="Auto-sync will retry…";done()});
};

var pushing=false,pushAgain=false;
window.pushCloud=function(){
  if(!window.cloudPulled){pushAgain=true;return}
  if(typeof db==="undefined"||!db.users)return;
  if(pushing){pushAgain=true;return}
  pushing=true;
  var users=slimUsers();
  var posts=slimPosts();
  var threads=slimThreads();
  Promise.all([
    saveSeries("pulseu",{users:users,rev:now()}),
    saveSeries("pulsep",{posts:posts,rev:now()}),
    saveSeries("pulsem",{threads:threads,rev:now()})
  ]).then(function(){
    pushing=false;
    window.cloudNote="Auto-sync on · "+users.length+" accounts · "+posts.length+" posts · "+threads.length+" chats";
    if(pushAgain){pushAgain=false;window.pushCloud()}
  }).catch(function(){pushing=false});
};

if(typeof save==="function"){
  var _save=save;
  window.save=function(d){
    _save(d);
    setTimeout(function(){try{window.pushCloud()}catch(e){}},200);
  };
}

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

if(typeof send==="function"){
  var _sendM=send;
  window.send=function(){
    _sendM();
    window.cloudPulled=true;
    setTimeout(function(){try{window.pushCloud()}catch(e){}},100);
  };
}

try{
  window.cloudReady=true;
  window.pullCloud();
  setInterval(function(){
    var el=document.activeElement;
    if(el&&el.id!=="mtext"&&(el.tagName==="INPUT"||el.tagName==="TEXTAREA"))return;
    window.pullCloud();
  },3000);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)window.pullCloud()});
  window.addEventListener("focus",function(){window.pullCloud()});
  window.addEventListener("online",function(){window.pullCloud();window.pushCloud()});
}catch(e){}
})();
