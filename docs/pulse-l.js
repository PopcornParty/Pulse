(function(){
var FALL="https://placehold.co/900x900/111111/8e8e93/png?text=Pulse";

var BASE_FILTER="damn,hell,crap,ass,asshole,bastard,bitch,bollocks,bugger,cock,crap,cunt,dick,dickhead,dildo,fag,faggot,fuck,fucked,fucker,fucking,horseshit,jackass,jerkoff,kike,nigger,nigga,piss,pissed,prick,pussy,retard,retarded,shit,shitty,slut,spastic,twat,wank,wanker,whore,wtf";

function ensureFilter(){
  if(typeof db==="undefined"||!db.settings)return;
  var cur=String(db.settings.wordFilter||"");
  if(db.settings.filterReady)return;
  var have={};
  cur.split(",").concat(BASE_FILTER.split(",")).forEach(function(w){
    w=String(w||"").trim().toLowerCase();
    if(w)have[w]=1;
  });
  db.settings.wordFilter=Object.keys(have).join(",");
  db.settings.filterReady=true;
}
ensureFilter();

function rxEscape(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}

window.filtered=function(text){
  ensureFilter();
  var t=String(text||"");
  var w=String((db.settings&&db.settings.wordFilter)||BASE_FILTER).split(",");
  w.forEach(function(x){
    x=String(x||"").trim();
    if(x.length<2)return;
    try{t=t.replace(new RegExp("\\b"+rxEscape(x)+"\\b","gi"),"***")}catch(e){}
  });
  return t;
};

window.pic=function(){return FALL};

function stubUser(id){
  return {id:id||"gone",username:"member",display:"Pulse member",h:210,ver:false,crown:false,blocked:false,pic:""};
}

window.visiblePosts=function(){
  var self=typeof me==="function"?me():null;
  var list=(db.posts||[]).filter(function(p){
    if(!p||!p.id)return false;
    if(p.hidden&&!db.owner)return false;
    var a=typeof usr==="function"?usr(p.by):null;
    if(a&&a.blocked)return false;
    if(a&&a.shadow&&self&&a.id!==self.id&&!db.owner)return false;
    return true;
  });
  list.sort(function(a,b){return ((b.pinned?1:0)-(a.pinned?1:0))||((b.t||0)-(a.t||0))});
  return list;
};

window.postHTML=function(p){
  var a=(typeof usr==="function"&&usr(p.by))||stubUser(p.by);
  var self=typeof me==="function"?me():null;
  var my=self?self.id:"";
  var liked=(p.likes||[]).indexOf(my)>=0;
  var saved=(p.saved||[]).indexOf(my)>=0;
  var src="";
  if(typeof bestSrc==="function")src=bestSrc(window.pixCache&&window.pixCache[p.id],p.img,p.remote,FALL);
  else src=p.remote||p.img||FALL;
  if((!src||/picsum\.photos|placehold\.co/.test(src))&&window.pixCache&&window.pixCache[p.id])src=window.pixCache[p.id];
  if(!src)src=FALL;
  if(typeof pixGet==="function"&&!(window.pixCache&&window.pixCache[p.id]))pixGet(p.id);
  var name=a.display||a.username||"member";
  var handle=a.username||"member";
  return '<article class="post"><div class="ph" data-act="profile" data-id="'+esc(a.id)+'">'+av(a)+'<div class="nm">'+esc(name)+(typeof badge==="function"?badge(a):"")+(p.pinned?" pinned":"")+'<small>@'+esc(handle)+'</small></div></div><div class="media" data-act="like" data-id="'+esc(p.id)+'"><img data-pix="'+esc(p.id)+'" src="'+src+'" alt="" onerror="this.onerror=null;this.src=\''+FALL+'\'"></div><div class="acts"><button data-act="like" data-id="'+esc(p.id)+'">'+(liked?"Liked":"Like")+" "+(p.likes||[]).length+'</button><button data-act="comments" data-id="'+esc(p.id)+'">Comments</button><button data-act="save" data-id="'+esc(p.id)+'">'+(saved?"Saved":"Save")+'</button><button data-act="report" data-id="'+esc(p.id)+'">Report</button></div><div class="meta"><div class="likes">'+(p.likes||[]).length+" likes · "+(p.views||0)+' views</div><div><b data-act="profile" data-id="'+esc(a.id)+'">'+esc(handle)+"</b> "+esc(p.text)+'</div><div class="time">'+ago(p.t)+" ago</div></div></article>";
};

function noteNewPosts(beforeIds){
  if(!db.notes)db.notes=[];
  var self=typeof me==="function"?me():null;
  if(!self)return;
  (db.posts||[]).forEach(function(p){
    if(!p||beforeIds[p.id])return;
    if(p.by===self.id)return;
    if(p.t&&now()-p.t>1000*60*60*24)return;
    var a=usr(p.by);
    var who=a?("@"+a.username):"Someone";
    var text=who+" posted"+(p.text?(": "+String(p.text).slice(0,40)):"");
    if(db.notes.some(function(n){return n.text===text}))return;
    db.notes.unshift({id:now()+Math.random(),text:text,read:false,t:p.t||now()});
  });
  if(db.notes.length>30)db.notes=db.notes.slice(0,30);
}

if(typeof applyRemote==="function"){
  var _ar=applyRemote;
  window.applyRemote=function(x){
    var before={};
    (db.posts||[]).forEach(function(p){if(p&&p.id)before[p.id]=1});
    var ok=_ar(x);
    noteNewPosts(before);
    return ok;
  };
  try{applyRemote=window.applyRemote}catch(e){}
}

if(typeof packCloud==="function"){
  var _pack=packCloud;
  window.packCloud=function(d){
    var x=_pack(d);
    (x.posts||[]).forEach(function(p){
      if(!p)return;
      if(p.remote&&String(p.remote).indexOf("http")===0&&!/picsum\.photos/.test(p.remote))p.img=p.remote;
      else if(p.img&&String(p.img).indexOf("data:")===0)p.img=p.remote||"";
      if(/picsum\.photos/.test(String(p.img||"")))p.img=p.remote&&!/picsum/.test(p.remote)?p.remote:"";
    });
    return x;
  };
}

window.grantCrown=function(id){
  var u=typeof usr==="function"?usr(id):null;
  if(!u)return;
  u.crown=true;
  if(typeof logA==="function")logA("owner crown @"+u.username);
  if(typeof dirty==="function")dirty();
};
window.revokeCrown=function(id){
  var u=typeof usr==="function"?usr(id):null;
  if(!u)return;
  u.crown=false;
  if(typeof logA==="function")logA("remove crown @"+u.username);
  if(typeof dirty==="function")dirty();
};

if(typeof unlock==="function"){
  var _un=unlock;
  window.unlock=function(){
    _un();
    if(ownerOk&&typeof me==="function"&&me()){
      me().crown=true;
      try{save(db)}catch(e){}
    }
  };
}

window.badge=function(u){
  var s="";
  if(u&&u.crown)s+='<span class="cbadge" title="Owner">\uD83D\uDC51</span>';
  if(u&&u.ver)s+='<span class="vbadge" title="Verified">\u2713</span>';
  return s;
};

if(!document.getElementById("pulseCrownCss")){
  var st=document.createElement("style");
  st.id="pulseCrownCss";
  st.textContent=".cbadge{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;margin-left:4px;border-radius:50%;background:linear-gradient(135deg,#ffe082,#f5a623);box-shadow:0 0 0 1px #c98900;font-size:10px;line-height:1;vertical-align:middle}";
  document.head.appendChild(st);
}

function crownRow(u){
  return '<div class="acard" style="margin:6px 0"><div class="ph" style="padding:0">'+av(u)+'<div class="nm">@'+esc(u.username)+badge(u)+'<small>'+esc(u.display)+(u.crown?" · owner crown":"")+(u.ver?" · verified":"")+'</small></div></div>'+
    '<button type="button" class="pill abtn" data-act="grantCrown" data-id="'+esc(u.id)+'">Give crown</button>'+
    '<button type="button" class="pill abtn" data-act="revokeCrown" data-id="'+esc(u.id)+'">Remove crown</button>'+
    '<button type="button" class="pill abtn" data-act="openMember" data-id="'+esc(u.id)+'">More tools</button></div>';
}

var prevAdmin=window.adminView;
window.adminView=function(){
  var html=prevAdmin?prevAdmin():"";
  if(!ownerOk)return html;
  if(adminTab!=="people")return html;
  if(html.indexOf("Give crown")>=0&&window.adminUser)return html;
  if(window.adminUser&&usr(window.adminUser)){
    if(html.indexOf('data-act="grantCrown"')>=0)return html;
    var u=usr(window.adminUser);
    return html.replace("</div></div>", "</div></div>"+crownRow(u));
  }
  var extra='<p class="muted">Owner crown is separate from the blue tick. Give it on a member below, or open them and tap Give owner crown.</p>';
  var rows=(db.users||[]).map(crownRow).join("");
  if(html.indexOf("Tap a member")>=0)return html.replace('<p class="muted">Tap a member to open tools for that one account.</p>',extra)+rows;
  return html+extra+rows;
};

if(typeof ADMIN==="object"&&ADMIN){
  ADMIN.grantCrown=window.grantCrown;
  ADMIN.revokeCrown=window.revokeCrown;
}

if(typeof homeView==="function"){
  var _home=homeView;
  window.homeView=function(){
    var html=_home();
    var n=(typeof visiblePosts==="function"?visiblePosts():(db.posts||[])).length;
    var bar='<p class="muted" style="padding:0 14px">Showing '+n+' post'+(n===1?"":"s")+' from everyone on Pulse. Pull to refresh or tap Sync now in the menu if a friend just posted.</p>';
    if(html.indexOf("Showing ")>=0)return html;
    return html.replace('</div><div class="stories">','</div>'+bar+'<div class="stories">') || (html+bar);
  };
}
})();
