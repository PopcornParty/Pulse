(function(){
var KV="https://keyvalue.immanuel.co/api/KeyVal/";
var KVAPP="5m3eiyzm";
var KVKEY="pulsecloud";
var BLOB="https://jsonblob.com/api/jsonBlob";
var CHUNK=120;
window.cloudReady=false;
window.cloudBusy=false;
window.cloudQueued=false;
window.cloudNote=window.cloudNote||"Auto-sync is on. Linking every account…";
if(typeof db!=="undefined"){
  if(!db.deletedPosts)db.deletedPosts=[];
  if(!db.kicked)db.kicked=[];
  if(!db.rev)db.rev=1;
}
function saveLocal(d){
  var raw;try{raw=JSON.stringify(d)}catch(e){raw="{}"}
  try{localStorage.setItem(KEY,raw)}catch(e){try{localStorage.removeItem(KEY);localStorage.setItem(KEY,JSON.stringify(slimDB(d)))}catch(e2){}}
  try{idbPut(d)}catch(e){}
}
window.save=function(d){d.rev=now();saveLocal(d);try{pushCloud()}catch(e){}};
window.dirty=function(){try{save(db)}catch(e){}draw()};
window.syncBanner=function(){return '<div class="banner">'+esc(window.cloudNote)+'</div>'};
window.syncNow=function(){window.cloudReady=true;window.cloudNote="Syncing every account…";if(typeof draw==="function")draw();pullCloud(true);try{pushCloud()}catch(e){}};
function b64e(s){try{return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}catch(e){return ""}}
function b64d(s){try{s=String(s||"").replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return decodeURIComponent(escape(atob(s)))}catch(e){return ""}}
function kvGet(key){return fetch(KV+"GetValue/"+KVAPP+"/"+key).then(function(r){return r.text()}).then(function(t){t=String(t||"").replace(/^"|"$/g,"").trim();if(!t||t==="null"||t.indexOf("Exception")>=0)return "";return t}).catch(function(){return ""})}
function kvSet(key,val){val=String(val||"").slice(0,180);return fetch(KV+"UpdateValue/"+KVAPP+"/"+key+"/"+encodeURIComponent(val),{method:"POST",headers:{"Content-Length":"0"}}).then(function(r){return r.ok}).catch(function(){return false})}
function packCloud(d){
  var x=slimDB(d);
  x.session=null;x.owner=false;x.rev=d.rev||now();
  (x.posts||[]).forEach(function(p){if(p.img&&String(p.img).indexOf("data:")===0)p.img=pic(p.id||"x")});
  (x.users||[]).forEach(function(u){if(u.pic&&String(u.pic).indexOf("data:")===0)u.pic=""});
  if((x.audit||[]).length>12)x.audit=x.audit.slice(0,12);
  if((x.notes||[]).length>20)x.notes=x.notes.slice(0,20);
  return x;
}
function union(a,b){var m={};(a||[]).forEach(function(x){m[x]=1});(b||[]).forEach(function(x){m[x]=1});return Object.keys(m)}
function mergeUsers(a,b){
  var byId={},byName={},out=[];
  function put(u){
    if(!u||!u.id)return;
    var name=String(u.username||"").toLowerCase();
    var o=byId[u.id]||(name?byName[name]:null);
    if(!o){byId[u.id]=u;if(name)byName[name]=u;return}
    var m={id:o.id,username:u.username||o.username,display:u.display||o.display,pass:u.pass||o.pass,bio:u.bio||o.bio,h:u.h||o.h,ver:!!(u.ver||o.ver),followers:Math.max(u.followers||0,o.followers||0),following:Math.max(u.following||0,o.following||0),blocked:!!(u.blocked||o.blocked),staff:!!(u.staff||o.staff),shadow:!!(u.shadow||o.shadow),role:u.role||o.role||"member",pic:u.pic||o.pic};
    byId[m.id]=m;if(name)byName[name]=m;
  }
  (a||[]).concat(b||[]).forEach(put);
  Object.keys(byId).forEach(function(k){out.push(byId[k])});
  return out;
}
function mergePosts(a,b){
  var m={},out=[];
  (a||[]).concat(b||[]).forEach(function(p){
    if(!p||!p.id)return;
    var o=m[p.id];
    if(!o){m[p.id]=p;return}
    var likes=union(o.likes||[],p.likes||[]);
    var saved=union(o.saved||[],p.saved||[]);
    var comments=(o.comments||[]).concat(p.comments||[]);
    var seen={};
    comments=comments.filter(function(c){var k=(c.by||"")+"|"+(c.text||"");if(seen[k])return false;seen[k]=1;return true});
    m[p.id]={id:p.id,by:p.by||o.by,text:p.text||o.text,img:(p.img&&String(p.img).indexOf("data:")!==0?p.img:o.img)||p.img||o.img,t:Math.max(p.t||0,o.t||0),likes:likes,comments:comments,saved:saved,hidden:!!(p.hidden||o.hidden),pinned:!!(p.pinned||o.pinned),featured:!!(p.featured||o.featured),locked:!!(p.locked||o.locked),views:Math.max(p.views||0,o.views||0)};
  });
  Object.keys(m).forEach(function(k){out.push(m[k])});
  out.sort(function(x,y){return (y.t||0)-(x.t||0)});
  return out;
}
function mergeFollows(a,b){var m={};(a||[]).concat(b||[]).forEach(function(f){if(!f||!f.length)return;m[f[0]+">"+f[1]]=f});return Object.keys(m).map(function(k){return m[k]})}
function mergeConvos(a,b){
  var m={},out=[];
  (a||[]).concat(b||[]).forEach(function(c){
    if(!c||!c.with)return;
    var o=m[c.with];
    if(!o){m[c.with]=c;return}
    var msgs=(o.msgs||[]).concat(c.msgs||[]);
    var seen={};
    msgs=msgs.filter(function(x){var k=(x.by||"")+"|"+(x.text||"")+"|"+(x.t||"");if(seen[k])return false;seen[k]=1;return true});
    m[c.with]={id:c.id||o.id,with:c.with,msgs:msgs};
  });
  Object.keys(m).forEach(function(k){out.push(m[k])});
  return out;
}
function applyRemote(x){
  if(!x||!x.users)return false;
  normalize(x);
  var sess=db.session,own=db.owner;
  var kicked=union(db.kicked||[],x.kicked||[]);
  var deleted=union(db.deletedPosts||[],x.deletedPosts||[]);
  db.users=mergeUsers(db.users,x.users).filter(function(u){return kicked.indexOf(u.id)<0});
  db.posts=mergePosts(db.posts,x.posts).filter(function(p){return deleted.indexOf(p.id)<0});
  db.follows=mergeFollows(db.follows,x.follows);
  db.convos=mergeConvos(db.convos,x.convos);
  db.notes=(((x.notes||[]).length>=(db.notes||[]).length)?x.notes:db.notes)||[];
  db.reports=(((x.reports||[]).length>=(db.reports||[]).length)?x.reports:db.reports)||[];
  var settings=Object.assign({},db.settings||{},x.settings||{});
  settings.theme=(db.settings&&db.settings.theme)||settings.theme;
  settings.skin=(db.settings&&db.settings.skin)||settings.skin;
  db.settings=settings;
  db.deletedPosts=deleted;
  db.kicked=kicked;
  db.rev=Math.max(db.rev||0,x.rev||0);
  db.session=sess;
  db.owner=own;
  saveLocal(db);
  window.cloudNote="All accounts auto-sync on Safari and Chrome";
  if(typeof draw==="function")draw();
  return true;
}
var cloudId=null;
function pullChunks(){
  return kvGet("pulsen").then(function(n){
    n=parseInt(n,10)||0;
    if(n<1||n>80)return null;
    var jobs=[],i;
    for(i=0;i<n;i++)jobs.push(kvGet("pulsec"+i));
    return Promise.all(jobs).then(function(parts){
      var raw=b64d(parts.join(""));
      try{return JSON.parse(raw)}catch(e){return null}
    });
  });
}
function pushChunks(pack){
  var raw=b64e(JSON.stringify(pack));
  if(!raw)return Promise.resolve(false);
  var n=Math.ceil(raw.length/CHUNK);
  if(n>80){pack.posts=(pack.posts||[]).slice(0,25);pack.audit=[];raw=b64e(JSON.stringify(pack));n=Math.ceil(raw.length/CHUNK)}
  var chain=Promise.resolve(true),i;
  for(i=0;i<n;i++){(function(i){var bit=raw.slice(i*CHUNK,(i+1)*CHUNK);chain=chain.then(function(){return kvSet("pulsec"+i,bit)})})(i)}
  return chain.then(function(){return kvSet("pulsen",String(n))});
}
function pullBlob(id){
  if(!id)return Promise.resolve(null);
  return fetch(BLOB+"/"+id,{headers:{Accept:"application/json"}}).then(function(r){return r.ok?r.json():null}).catch(function(){return null});
}
function pushBlob(pack){
  var body=JSON.stringify(pack);
  var headers={"Content-Type":"application/json","Accept":"application/json"};
  var put=function(id){return fetch(BLOB+"/"+id,{method:"PUT",headers:headers,body:body}).then(function(r){return r.ok}).catch(function(){return false})};
  if(cloudId)return put(cloudId);
  return kvGet(KVKEY).then(function(t){
    if(t&&t!=="null"&&t.length>8&&t.indexOf("test")<0){cloudId=t;return put(t)}
    return fetch(BLOB,{method:"POST",headers:headers,body:body}).then(function(r){
      var loc=r.headers.get("Location")||"";
      var m=loc.match(/jsonBlob\/([^/?]+)/);
      if(m){cloudId=m[1];kvSet(KVKEY,cloudId);return true}
      return false;
    }).catch(function(){return false});
  });
}
function pullCloud(force){
  if(window.cloudBusy){window.cloudQueued=true;return}
  window.cloudBusy=true;
  var done=function(){
    window.cloudBusy=false;
    window.cloudReady=true;
    if(window.cloudQueued){window.cloudQueued=false;pullCloud()}
  };
  kvGet(KVKEY).then(function(id){
    if(id&&id.length>8&&id.indexOf("test")<0)cloudId=id;
    return pullBlob(cloudId);
  }).then(function(x){
    if(x&&x.users){applyRemote(x);return true}
    return pullChunks().then(function(y){if(y&&y.users){applyRemote(y);return true}return false});
  }).then(function(ok){
    if(!ok)window.cloudNote="Saved here. Auto-sync will retry…";
    done();
  }).catch(function(){
    window.cloudNote="Saved here. Auto-sync will retry…";
    done();
  });
}
var pushing=false,pushAgain=false;
function pushCloud(){
  window.cloudReady=true;
  if(pushing){pushAgain=true;return}
  pushing=true;
  var pack=packCloud(db);
  pushBlob(pack).then(function(){return pushChunks(pack)}).then(function(){
    window.cloudNote="All accounts auto-sync on Safari and Chrome";
    pushing=false;
    if(pushAgain){pushAgain=false;pushCloud()}
  }).catch(function(){pushing=false});
}
function afterCloud(fn){
  pullCloud(true);
  setTimeout(function(){try{fn()}catch(e){}},700);
}
var _login=window.login;
window.login=function(){
  afterCloud(function(){if(_login)_login()});
};
var _signup=window.signup;
window.signup=function(){
  afterCloud(function(){if(_signup)_signup()});
};
var _publish=window.publish;
window.publish=function(){
  if(_publish)_publish();
  setTimeout(function(){try{pushCloud()}catch(e){}},200);
};
var _send=window.send;
window.send=function(){
  if(_send)_send();
  setTimeout(function(){try{pushCloud()}catch(e){}},200);
};
window.pullCloud=pullCloud;
window.pushCloud=pushCloud;
var _kick=window.kick;
window.kick=function(id){if(!db.kicked)db.kicked=[];db.kicked.push(id);if(_kick)_kick(id);else{db.users=db.users.filter(function(u){return u.id!==id});dirty()}};
var _delP=window.delP;
window.delP=function(id){if(!db.deletedPosts)db.deletedPosts=[];db.deletedPosts.push(id);if(_delP)_delP(id);else{db.posts=db.posts.filter(function(p){return p.id!==id});dirty()}};
try{
  pullCloud(true);
  setTimeout(function(){window.cloudReady=true;try{pushCloud()}catch(e){}},1200);
  setInterval(function(){pullCloud()},3000);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)pullCloud(true)});
  window.addEventListener("focus",function(){pullCloud(true)});
  window.addEventListener("online",function(){pullCloud(true);pushCloud()});
}catch(e){window.cloudReady=true}
})();
