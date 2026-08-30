(function(){
var KV="https://keyvalue.immanuel.co/api/KeyVal/";
var KVAPP="5m3eiyzm";
var KVKEY="pulsecloud";
var BLOB="https://jsonblob.com/api/jsonBlob";
var CHUNK=120;
window.cloudReady=false;
window.cloudBusy=false;
window.cloudQueued=false;
window.cloudNote=window.cloudNote||"Auto-sync is on. Linking users, posts and chats…";
if(typeof db!=="undefined"){
  if(!db.deletedPosts)db.deletedPosts=[];
  if(!db.kicked)db.kicked=[];
  if(!db.threads)db.threads=[];
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
window.syncNow=function(){window.cloudReady=true;window.cloudNote="Syncing users, posts and DMs…";if(typeof draw==="function")draw();pullCloud(true);try{pushCloud()}catch(e){}};
function b64e(s){try{return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}catch(e){return ""}}
function b64d(s){try{s=String(s||"").replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return decodeURIComponent(escape(atob(s)))}catch(e){return ""}}
function kvGet(key){return fetch(KV+"GetValue/"+KVAPP+"/"+key).then(function(r){return r.text()}).then(function(t){t=String(t||"").replace(/^"|"$/g,"").trim();if(!t||t==="null"||t.indexOf("Exception")>=0)return "";return t}).catch(function(){return ""})}
function kvSet(key,val){val=String(val||"").slice(0,180);return fetch(KV+"UpdateValue/"+KVAPP+"/"+key+"/"+encodeURIComponent(val),{method:"POST",headers:{"Content-Length":"0"}}).then(function(r){return r.ok}).catch(function(){return false})}
function pairKey(a,b){return [String(a),String(b)].sort().join("|")}
function mergeMsgs(a,b){
  var seen={},out=[];
  (a||[]).concat(b||[]).forEach(function(m){
    if(!m)return;
    var k=(m.by||"")+"|"+(m.text||"")+"|"+(m.t||"");
    if(seen[k])return;
    seen[k]=1;out.push({by:m.by,text:m.text,t:m.t||0});
  });
  out.sort(function(x,y){return (x.t||0)-(y.t||0)});
  return out;
}
function mergeThreads(a,b){
  var m={};
  (a||[]).concat(b||[]).forEach(function(t){
    if(!t)return;
    var key=t.pair||(t.a&&t.b?pairKey(t.a,t.b):"");
    if(!key||key.indexOf("|")<0)return;
    if(!m[key])m[key]={pair:key,msgs:[]};
    m[key].msgs=mergeMsgs(m[key].msgs,t.msgs||[]);
  });
  return Object.keys(m).map(function(k){return m[k]});
}
function convosToThreads(convos, session){
  var out=[];
  (convos||[]).forEach(function(c){
    if(!c||!c.with)return;
    var me=c.me||c.a||session;
    if(!me)return;
    out.push({pair:pairKey(me,c.with),msgs:c.msgs||[]});
  });
  return out;
}
function threadsToConvos(threads, session){
  if(!session)return [];
  return (threads||[]).filter(function(t){
    var p=String(t.pair||"").split("|");
    return p[0]===session||p[1]===session;
  }).map(function(t){
    var p=String(t.pair).split("|");
    var other=p[0]===session?p[1]:p[0];
    return {id:"c"+other,with:other,msgs:t.msgs||[]};
  });
}
function packCloud(d){
  var x=slimDB(d);
  var session=d.session;
  x.threads=mergeThreads(x.threads||[],convosToThreads(x.convos||[],session));
  x.session=null;x.owner=false;x.rev=d.rev||now();
  (x.posts||[]).forEach(function(p){if(p.img&&String(p.img).indexOf("data:")===0)p.img=pic(p.id||"x")});
  (x.users||[]).forEach(function(u){if(u.pic&&String(u.pic).indexOf("data:")===0)u.pic=""});
  if((x.audit||[]).length>12)x.audit=x.audit.slice(0,12);
  if((x.notes||[]).length>20)x.notes=x.notes.slice(0,20);
  x.convos=[];
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
    var merged={id:o.id,username:u.username||o.username,display:u.display||o.display,pass:u.pass||o.pass,bio:u.bio||o.bio,h:u.h||o.h,ver:!!(u.ver||o.ver),followers:Math.max(u.followers||0,o.followers||0),following:Math.max(u.following||0,o.following||0),blocked:!!(u.blocked||o.blocked),staff:!!(u.staff||o.staff),shadow:!!(u.shadow||o.shadow),role:u.role||o.role||"member",pic:u.pic||o.pic};
    byId[merged.id]=merged;if(name)byName[name]=merged;
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
function applyRemote(x){
  if(!x||!x.users)return false;
  normalize(x);
  var sess=db.session,own=db.owner;
  var kicked=union(db.kicked||[],x.kicked||[]);
  var deleted=union(db.deletedPosts||[],x.deletedPosts||[]);
  db.users=mergeUsers(db.users,x.users).filter(function(u){return kicked.indexOf(u.id)<0});
  db.posts=mergePosts(db.posts,x.posts).filter(function(p){return deleted.indexOf(p.id)<0});
  db.follows=mergeFollows(db.follows,x.follows);
  var localThreads=mergeThreads(db.threads||[],convosToThreads(db.convos||[],sess));
  var remoteThreads=mergeThreads(x.threads||[],convosToThreads(x.convos||[],x.session||null));
  db.threads=mergeThreads(localThreads,remoteThreads);
  db.convos=threadsToConvos(db.threads,sess);
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
  window.cloudNote="Users, posts and DMs are auto-syncing";
  if(typeof draw==="function")draw();
  return true;
}
var cloudId=null;
function pullChunks(){
  return kvGet("pulsen").then(function(n){
    n=parseInt(n,10)||0;
    if(n<1||n>120)return null;
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
  if(n>120){
    pack.audit=[];pack.notes=(pack.notes||[]).slice(0,8);
    (pack.posts||[]).forEach(function(p){if(p.img&&String(p.img).indexOf("http")!==0)p.img=pic(p.id||"x")});
    raw=b64e(JSON.stringify(pack));
    n=Math.ceil(raw.length/CHUNK);
  }
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
function pullCloud(){
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
  if(typeof db!=="undefined"&&db.session){
    db.threads=mergeThreads(db.threads||[],convosToThreads(db.convos||[],db.session));
  }
  if(pushing){pushAgain=true;return}
  pushing=true;
  var pack=packCloud(db);
  pushBlob(pack).then(function(){return pushChunks(pack)}).then(function(){
    window.cloudNote="Users, posts and DMs are auto-syncing";
    pushing=false;
    if(pushAgain){pushAgain=false;pushCloud()}
  }).catch(function(){pushing=false});
}
function afterCloud(fn){
  pullCloud();
  setTimeout(function(){try{fn()}catch(e){}},800);
}
var _login=window.login;
window.login=function(){afterCloud(function(){if(_login)_login();setTimeout(function(){if(db.session){db.convos=threadsToConvos(db.threads||[],db.session);save(db)}},50)})};
var _signup=window.signup;
window.signup=function(){afterCloud(function(){if(_signup)_signup();setTimeout(function(){try{pushCloud()}catch(e){}},100)})};
var _publish=window.publish;
window.publish=function(){if(_publish)_publish();setTimeout(function(){try{pushCloud()}catch(e){}},200)};
var _send=window.send;
window.send=function(){
  if(_send)_send();
  if(db.session)db.threads=mergeThreads(db.threads||[],convosToThreads(db.convos||[],db.session));
  setTimeout(function(){try{pushCloud()}catch(e){}},150);
};
var _start=window.startChat;
window.startChat=function(id){
  if(_start)_start(id);
  if(db.session&&id){
    db.threads=mergeThreads(db.threads||[],[{pair:pairKey(db.session,id),msgs:[]}]);
    db.convos=threadsToConvos(db.threads,db.session);
    save(db);
  }
};
window.pullCloud=pullCloud;
window.pushCloud=pushCloud;
var _kick=window.kick;
window.kick=function(id){if(!db.kicked)db.kicked=[];db.kicked.push(id);if(_kick)_kick(id);else{db.users=db.users.filter(function(u){return u.id!==id});dirty()}};
var _delP=window.delP;
window.delP=function(id){if(!db.deletedPosts)db.deletedPosts=[];db.deletedPosts.push(id);if(_delP)_delP(id);else{db.posts=db.posts.filter(function(p){return p.id!==id});dirty()}};
try{
  pullCloud();
  setTimeout(function(){window.cloudReady=true;try{pushCloud()}catch(e){}},1000);
  setInterval(function(){pullCloud()},3000);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)pullCloud()});
  window.addEventListener("focus",function(){pullCloud()});
  window.addEventListener("online",function(){pullCloud();pushCloud()});
}catch(e){window.cloudReady=true}
})();
