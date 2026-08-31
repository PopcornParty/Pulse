(function(){
var KV="https://keyvalue.immanuel.co/api/KeyVal/";
var KVAPP="5m3eiyzm";
var DEMO=["you","nova","milo","rio","iris","sage"];
var Q=["pulselive","pulselive2","pulselive3","pulseq0","pulseq1","pulseq2","pulseq3","pulseq4","pulseq5"];
window.pulseReg={users:[],posts:[],who:{}};
window.qSlot=0;

function kvGet(key){
  return fetch(KV+"GetValue/"+KVAPP+"/"+key+"?t="+Date.now()).then(function(r){return r.text()}).then(function(t){
    t=String(t||"").replace(/^"|"$/g,"").trim();
    if(!t||t==="null"||t.indexOf("Exception")>=0)return "";
    return t;
  }).catch(function(){return ""});
}
function kvSet(key,val){
  val=String(val||"").slice(0,180);
  return fetch(KV+"UpdateValue/"+KVAPP+"/"+key+"/"+encodeURIComponent(val),{method:"POST",headers:{"Content-Length":"0"}}).then(function(r){return r.ok}).catch(function(){return false});
}

function realName(u){
  if(!u||!u.id)return "";
  var n=String(u.username||"").toLowerCase().replace(/[^a-z0-9_]/g,"");
  if(!n||DEMO.indexOf(n)>=0||DEMO.indexOf(u.id)>=0)return "";
  if(/^p\d+$/.test(String(u.id)))return "";
  return n;
}
function byName(name){
  name=String(name||"").toLowerCase();
  return (db.users||[]).find(function(u){return u&&String(u.username||"").toLowerCase()===name});
}
function ensureUser(name,id){
  name=String(name||"").toLowerCase().replace(/[^a-z0-9_]/g,"");
  if(!name||DEMO.indexOf(name)>=0)return null;
  var u=byName(name);
  if(u){
    if(id) window.pulseReg.who[name]=u.id;
    return u;
  }
  if(id){u=(db.users||[]).find(function(x){return x&&x.id===id});if(u){if(!u.username)u.username=name;return u}}
  u={id:id||("u"+name),username:name,display:name,pass:"",bio:"",h:200,ver:false,crown:name==="popcorn",followers:0,following:0,blocked:false,staff:false,shadow:false,role:"member",pic:""};
  if(!db.users)db.users=[];
  db.users.push(u);
  window.pulseReg.who[name]=u.id;
  return u;
}
function rememberUsers(list){
  (list||[]).forEach(function(u){
    var n=realName(u);
    if(!n)return;
    window.pulseReg.who[n]=u.id;
    var got=ensureUser(n,u.id);
    if(got){
      if(u.display)got.display=u.display;
      if(u.pic&&String(u.pic).indexOf("http")===0)got.pic=u.pic;
      if(u.ver)got.ver=true;
      if(u.crown||n==="popcorn")got.crown=true;
    }
  });
}
function writeRoster(){
  var parts=[];
  Object.keys(window.pulseReg.who).forEach(function(n){
    parts.push(n+":"+window.pulseReg.who[n]);
  });
  if(!parts.length&&db.users){
    (db.users||[]).forEach(function(u){
      var n=realName(u);
      if(n)parts.push(n+":"+u.id);
    });
  }
  if(parts.length)kvSet("pulseroster",parts.join(",").slice(0,180));
}
function takeRoster(raw){
  if(!raw)return false;
  var changed=false;
  raw.split(",").forEach(function(bit){
    var p=bit.split(":");
    if(p.length<2)return;
    var n=p[0],id=p[1];
    if(!n||!id)return;
    var before=(db.users||[]).length;
    ensureUser(n,id);
    if((db.users||[]).length!==before)changed=true;
  });
  return changed;
}

function isHosted(u){return /^https?:\/\//.test(String(u||""))&&!/picsum\.photos|placehold\.co/.test(String(u||""))}
function upsertPost(p){
  if(!p||!p.id)return false;
  if(!db.posts)db.posts=[];
  var old=db.posts.find(function(x){return x.id===p.id});
  var img=isHosted(p.remote)?p.remote:(isHosted(p.img)?p.img:(p.img||""));
  if(old){
    var changed=false;
    if(img&&(!old.img||!isHosted(old.img))){old.img=img;old.remote=img;changed=true}
    if(p.text&&!old.text){old.text=p.text;changed=true}
    return changed;
  }
  var u=null;
  if(p.user)u=ensureUser(p.user,p.by);
  if(!u&&p.by&&typeof usr==="function")u=usr(p.by);
  db.posts.unshift({id:p.id,by:(u&&u.id)||p.by,text:p.text||"",img:img,remote:isHosted(img)?img:"",t:p.t||now(),likes:p.likes||[],comments:p.comments||[],saved:[],hidden:!!p.hidden,pinned:false,featured:false,locked:false,views:p.views||1});
  return true;
}

function cleanTalk(){
  function ok(m){
    if(!m||!String(m.text||"").trim())return false;
    if((m.t||0)<100000)return false;
    if(DEMO.indexOf(String(m.by||""))>=0)return false;
    return true;
  }
  (db.convos||[]).forEach(function(c){
    if(!c)return;
    c.msgs=(c.msgs||[]).filter(ok).sort(function(a,b){return (a.t||0)-(b.t||0)});
  });
  (db.threads||[]).forEach(function(t){
    if(!t)return;
    t.msgs=(t.msgs||[]).filter(ok).sort(function(a,b){return (a.t||0)-(b.t||0)});
  });
}

function takeLiveMsg(raw){
  if(!raw||raw.indexOf("|")<0)return false;
  var p=raw.split("|");
  if(p.length<5)return false;
  var left=p[0],right=p[1],from=p[2],t=parseInt(p[p.length-1],10)||0;
  var text=p.slice(3,p.length-1).join("|");
  if(!text||t<100000)return false;
  var sender=ensureUser(from);
  if(!sender)return false;
  ensureUser(left);ensureUser(right);
  if(!db.threads)db.threads=[];
  var pair=[left,right].sort().join("|");
  var th=db.threads.find(function(x){return x.pair===pair});
  if(!th){th={pair:pair,msgs:[]};db.threads.push(th)}
  if((th.msgs||[]).some(function(m){return String(m.text)===text&&Math.abs((m.t||0)-t)<15000}))return false;
  th.msgs.push({id:"m"+t+"-"+sender.id,by:sender.id,text:text,t:t});
  var self=typeof me==="function"?me():null;
  if(!self)return true;
  var my=String(self.username||"").toLowerCase();
  if(my!==left&&my!==right&&self.id!==sender.id)return true;
  var otherName=my===left?right:left;
  var other=byName(otherName);
  if(!other)return true;
  if(!db.convos)db.convos=[];
  var c=db.convos.find(function(x){return x.with===other.id});
  if(!c){c={id:"c"+other.id,with:other.id,msgs:[]};db.convos.push(c)}
  if(!(c.msgs||[]).some(function(m){return String(m.text)===text&&Math.abs((m.t||0)-t)<15000})){
    c.msgs.push({id:"m"+t+"-"+sender.id,by:sender.id,text:text,t:t});
  }
  return true;
}
function takeLivePost(raw){
  if(!raw)return false;
  if(raw.charAt(0)==="{"){
    try{
      var j=JSON.parse(raw);
      return upsertPost({id:j.id,by:j.by,user:j.u,text:j.tx||j.text||"",img:j.img||"",remote:j.img||"",t:j.t});
    }catch(e){return false}
  }
  if(raw.indexOf("|")<0)return false;
  var p=raw.split("|");
  if(p.length<4)return false;
  var user=p[0],id=p[1],t=parseInt(p[p.length-1],10)||0;
  var mid=p.slice(2,p.length-1);
  var img="",text=mid.join("|");
  if(mid.length>=2&&/^https?:/.test(mid[mid.length-1])){img=mid.pop();text=mid.join("|")}
  return upsertPost({id:id,user:user,text:text,img:img,remote:img,t:t});
}

function publishLiveMsg(text){
  var self=typeof me==="function"?me():null;
  if(!self||!chatWith)return;
  var other=typeof usr==="function"?usr(chatWith):null;
  if(!other||!other.username)return;
  var a=String(self.username).toLowerCase(),b=String(other.username).toLowerCase();
  var pair=[a,b].sort().join("|");
  var line=pair+"|"+a+"|"+String(text).replace(/\|/g,"/").slice(0,60)+"|"+now();
  kvSet("pulselive",line);
  var slot=Q[3+(window.qSlot++%6)];
  kvSet(slot,line);
}
function publishLivePost(p){
  if(!p||!me())return;
  var img=isHosted(p.remote)?p.remote:(isHosted(p.img)?p.img:"");
  var line=JSON.stringify({u:String(me().username).toLowerCase(),id:p.id,by:p.by,tx:String(p.text||"").slice(0,40),img:String(img).slice(0,80),t:p.t||now()});
  kvSet("pulsefeed",line.slice(0,180));
}

function paint(forceChat){
  cleanTalk();
  try{if(typeof saveLocal==="function")saveLocal(db)}catch(e){}
  if(typeof draw!=="function")return;
  if(!forceChat&&route!=="messages"&&route!=="home"&&route!=="search")return;
  var box=document.getElementById("mtext");
  var keep=box?box.value:"";
  var typing=document.activeElement&&(document.activeElement.tagName==="INPUT"||document.activeElement.tagName==="TEXTAREA")&&document.activeElement.id!=="mtext";
  if(typing){window.needDraw=true;return}
  draw();
  var b2=document.getElementById("mtext");
  if(b2){b2.value=keep;if(keep)b2.focus()}
  var chat=document.querySelector(".chat");
  if(chat)chat.scrollTop=chat.scrollHeight;
}

window.lastSeen={};
function tickFast(){
  Promise.all(["pulseroster","pulsefeed"].concat(Q).map(kvGet)).then(function(vals){
    var changed=takeRoster(vals[0]);
    if(vals[1]&&!window.lastSeen[vals[1]]){
      window.lastSeen[vals[1]]=1;
      if(takeLivePost(vals[1]))changed=true;
    }
    var i;
    for(i=2;i<vals.length;i++){
      var raw=vals[i];
      if(!raw||window.lastSeen[raw])continue;
      window.lastSeen[raw]=1;
      if(takeLiveMsg(raw))changed=true;
    }
    if(changed)paint(true);
  });
}

if(typeof applyRemote==="function"){
  var _ar=applyRemote;
  window.applyRemote=function(x){
    if(x&&x.users)rememberUsers(x.users);
    var ok=_ar(x);
    if(x&&x.users)rememberUsers(x.users);
    if(x&&x.posts)(x.posts||[]).forEach(upsertPost);
    rememberUsers(db.users);
    writeRoster();
    cleanTalk();
    return ok;
  };
}

if(typeof pushCloud==="function"){
  var _push=pushCloud;
  window.pushCloud=function(){
    rememberUsers(db.users);
    kvGet("pulseroster").then(function(raw){takeRoster(raw);writeRoster()});
    try{_push()}catch(e){}
  };
}

if(typeof send==="function"){
  var _s=send;
  window.send=function(){
    var box=document.getElementById("mtext");
    var text=box?String(box.value||"").trim():"";
    if(text)publishLiveMsg(text);
    _s();
    setTimeout(function(){var chat=document.querySelector(".chat");if(chat)chat.scrollTop=chat.scrollHeight},30);
  };
}
if(typeof publish==="function"){
  var _p=publish;
  window.publish=function(){
    var before=(db.posts&&db.posts[0]&&db.posts[0].id)||"";
    _p();
    setTimeout(function(){
      var p=db.posts&&db.posts[0];
      if(p&&p.id!==before)publishLivePost(p);
    },40);
  };
}

if(typeof messagesView==="function"){
  var _mv=messagesView;
  window.messagesView=function(){
    cleanTalk();
    return _mv();
  };
}

window.postHTML=function(p){
  if(!p||!p.id)return "";
  var a=(typeof usr==="function"?usr(p.by):null)||{id:p.by,username:"member",display:"Pulse member",h:200};
  var self=typeof me==="function"?me():{id:""};
  var liked=(p.likes||[]).indexOf(self.id)>=0;
  var src=(isHosted(p.remote)&&p.remote)||(isHosted(p.img)&&p.img)||(p.img&&String(p.img).indexOf("data:")===0&&p.img)||"https://placehold.co/900x900/111111/8e8e93/png?text=Pulse";
  var FALL="https://placehold.co/900x900/111111/8e8e93/png?text=Pulse";
  return '<article class="post"><div class="ph" data-act="profile" data-id="'+esc(a.id)+'">'+av(a)+'<div class="nm">'+esc(a.display||a.username)+(typeof badge==="function"?badge(a):"")+'<small>@'+esc(a.username)+'</small></div></div><div class="media"><img src="'+src+'" alt="" onerror="this.onerror=null;this.src=\''+FALL+'\'"></div><div class="acts"><button data-act="like" data-id="'+esc(p.id)+'">'+(liked?"Liked":"Like")+" "+(p.likes||[]).length+'</button><button data-act="comments" data-id="'+esc(p.id)+'">Comments</button><button data-act="save" data-id="'+esc(p.id)+'">Save</button><button data-act="report" data-id="'+esc(p.id)+'">Report</button></div><div class="meta"><div class="likes">'+(p.likes||[]).length+' likes</div><div><b>@'+esc(a.username)+"</b> "+esc(p.text||"")+'</div><div class="time">'+ago(p.t)+" ago</div></div></article>";
};

if(typeof mergeUsers==="function"){
  var _mu=mergeUsers;
  window.mergeUsers=function(a,b){
    var out=_mu(a,b);
    out.forEach(function(u){
      if(u&&String(u.username||"").toLowerCase()==="popcorn")u.crown=true;
    });
    rememberUsers(out);
    return out;
  };
}

try{
  rememberUsers(db.users);
  writeRoster();
  cleanTalk();
  tickFast();
  setInterval(tickFast,250);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)tickFast()});
}catch(e){}
})();
