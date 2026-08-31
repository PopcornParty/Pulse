(function(){
var KV="https://keyvalue.immanuel.co/api/KeyVal/";
var KVAPP="5m3eiyzm";

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

function byName(name){
  name=String(name||"").toLowerCase();
  return (db.users||[]).find(function(u){return u&&String(u.username||"").toLowerCase()===name});
}
function unameOf(id){
  var u=typeof usr==="function"?usr(id):null;
  return u?String(u.username||"").toLowerCase():String(id||"").toLowerCase();
}
function namePair(a,b){
  return [String(a||"").toLowerCase(),String(b||"").toLowerCase()].filter(Boolean).sort().join("|");
}

function lockCrowns(){
  if(typeof db==="undefined"||!db.users)return;
  db.users.forEach(function(u){
    if(!u)return;
    if(String(u.username||"").toLowerCase()==="popcorn")u.crown=true;
    if(db.owner&&db.session&&u.id===db.session)u.crown=true;
  });
}
window.badge=function(u){
  if(!u)return "";
  var owner=!!u.crown||String(u.username||"").toLowerCase()==="popcorn"||(typeof db!=="undefined"&&db.owner&&me()&&u.id===me().id);
  var s="";
  if(owner)s+='<span class="cbadge" title="Owner">\uD83D\uDC51</span>';
  if(u.ver)s+='<span class="vbadge" title="Verified">\u2713</span>';
  return s;
};
lockCrowns();

function takeLiveMsg(raw){
  if(!raw||raw.indexOf("|")<0)return false;
  var p=raw.split("|");
  if(p.length<5)return false;
  var left=p[0],right=p[1],from=p[2],t=parseInt(p[p.length-1],10)||0;
  var text=p.slice(3,p.length-1).join("|");
  if(!text)return false;
  var a=byName(left),b=byName(right),sender=byName(from);
  if(!sender)return false;
  if(!db.threads)db.threads=[];
  var pairIds=a&&b?namePair(a.id,b.id):namePair(left,right);
  var pairNames=namePair(left,right);
  var th=db.threads.find(function(x){return x.pair===pairIds||x.pair===pairNames});
  if(!th){th={pair:pairIds||pairNames,msgs:[]};db.threads.push(th)}
  if((th.msgs||[]).some(function(m){return m.by===sender.id&&m.text===text&&Math.abs((m.t||0)-t)<15000}))return false;
  th.msgs=th.msgs||[];
  th.msgs.push({id:"m"+t+"-"+sender.id,by:sender.id,text:text,t:t});
  if(!db.convos)db.convos=[];
  var self=typeof me==="function"?me():null;
  if(self&&((a&&self.id===a.id)||(b&&self.id===b.id)||unameOf(self.id)===left||unameOf(self.id)===right)){
    var other=(a&&self.id===a.id)?b:a;
    if(other){
      var c=db.convos.find(function(x){return x.with===other.id});
      if(!c){c={id:"c"+other.id,with:other.id,msgs:[]};db.convos.push(c)}
      if(!(c.msgs||[]).some(function(m){return m.by===sender.id&&m.text===text&&Math.abs((m.t||0)-t)<15000})){
        c.msgs.push({id:"m"+t+"-"+sender.id,by:sender.id,text:text,t:t});
      }
    }
  }
  return true;
}

function takeLivePost(raw){
  if(!raw||raw.indexOf("|")<0)return false;
  var p=raw.split("|");
  if(p.length<4)return false;
  var user=p[0],id=p[1],t=parseInt(p[p.length-1],10)||0;
  var text=p.slice(2,p.length-1).join("|");
  var u=byName(user);
  if(!u||!id)return false;
  if((db.posts||[]).some(function(x){return x.id===id}))return false;
  if(!db.posts)db.posts=[];
  db.posts.unshift({id:id,by:u.id,text:text,img:"",t:t,likes:[],comments:[],saved:[],hidden:false,pinned:false,featured:false,locked:false,views:1});
  return true;
}

function publishLiveMsg(text){
  var self=typeof me==="function"?me():null;
  if(!self||!chatWith)return;
  var other=typeof usr==="function"?usr(chatWith):null;
  if(!other||!other.username)return;
  var line=namePair(self.username,other.username)+"|"+String(self.username).toLowerCase()+"|"+String(text).replace(/\|/g,"/").slice(0,80)+"|"+now();
  kvSet("pulselive",line);
}
function publishLivePost(p){
  if(!p||!me())return;
  var line=String(me().username).toLowerCase()+"|"+p.id+"|"+String(p.text||"").replace(/\|/g,"/").slice(0,80)+"|"+(p.t||now());
  kvSet("pulsefeed",line);
}

window.lastLive="";
window.lastFeed="";
function tickLive(){
  Promise.all([kvGet("pulselive"),kvGet("pulsefeed")]).then(function(vals){
    var live=vals[0],feed=vals[1],changed=false;
    if(live&&live!==window.lastLive){
      window.lastLive=live;
      if(takeLiveMsg(live))changed=true;
    }
    if(feed&&feed!==window.lastFeed){
      window.lastFeed=feed;
      if(takeLivePost(feed))changed=true;
    }
    lockCrowns();
    if(!changed)return;
    try{saveLocal(db)}catch(e){}
    if(typeof draw==="function"){
      var box=document.getElementById("mtext");
      var keep=box?box.value:"";
      if(!(document.activeElement&&document.activeElement.id!=="mtext"&&(document.activeElement.tagName==="INPUT"||document.activeElement.tagName==="TEXTAREA"))){
        draw();
        var b2=document.getElementById("mtext");
        if(b2){b2.value=keep;if(keep)b2.focus()}
      }else window.needDraw=true;
    }
  });
}

if(typeof send==="function"){
  var _s=send;
  window.send=function(){
    var box=document.getElementById("mtext");
    var text=box?String(box.value||"").trim():"";
    _s();
    if(text)publishLiveMsg(text);
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
    },50);
  };
}

if(typeof grantCrown==="function"){
  var _gc=grantCrown;
  window.grantCrown=function(id){
    _gc(id);
    var u=usr(id);if(u)u.crown=true;
    lockCrowns();
    if(typeof dirty==="function")dirty();
  };
}

try{
  lockCrowns();
  tickLive();
  setInterval(tickLive,1200);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)tickLive()});
}catch(e){}
})();
