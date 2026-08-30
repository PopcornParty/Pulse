(function(){
window.q=function(id){return "'"+String(id||"").replace(/'/g,"")+"'"};
window.lastType=0;
window.needDraw=false;
window.pendingPostImg="";
var FALL="https://placehold.co/900x900/111111/8e8e93/png?text=Pulse";
window.pic=function(s){return "https://picsum.photos/seed/"+encodeURIComponent(String(s||"pulse"))+"/900/900"};
function typingNow(){
  var el=document.activeElement;
  if(el&&(el.tagName==="INPUT"||el.tagName==="TEXTAREA"||el.isContentEditable))return true;
  if(Date.now()-(window.lastType||0)<4000)return true;
  return false;
}
document.addEventListener("input",function(){window.lastType=Date.now()},true);
document.addEventListener("keydown",function(){window.lastType=Date.now()},true);
document.addEventListener("change",function(e){
  var t=e.target;
  if(!t||!t.files||!t.files[0])return;
  if(t.id==="file"||t.id==="pfp"){
    window.lastType=Date.now();
    if(typeof shrinkImg==="function"){
      shrinkImg(t.files[0],function(url){
        if(t.id==="file")window.pendingPostImg=url;
        if(t.id==="pfp"&&typeof me==="function"&&me()){me().pic=url;try{save(db)}catch(err){}}
      });
    }
  }
},true);
if(!window.pulseTap){
  window.pulseTap=true;
  document.addEventListener("click",function(e){
    var t=e.target;
    if(!t)return;
    var btn=t.closest("[data-act]");
    if(btn){
      e.preventDefault();
      e.stopPropagation();
      window.lastType=0;
      var act=btn.getAttribute("data-act");
      var id=btn.getAttribute("data-id");
      if(act==="like"&&typeof like==="function")like(id);
      else if(act==="save"&&typeof saveP==="function")saveP(id);
      else if(act==="report"&&typeof reportP==="function")reportP(id);
      else if(act==="comments"){commentId=id;if(typeof draw==="function")draw()}
      else if(act==="profile"&&typeof openProfile==="function")openProfile(id);
      else if(act==="share"&&typeof publish==="function")publish();
      else if(act==="cpost"&&typeof addComment==="function")addComment();
      return;
    }
    if(t.id==="shareBtn"||(t.closest&&t.closest("#shareBtn"))){if(typeof publish==="function")publish();return}
    if(t.id==="cpost"||(t.closest&&t.closest("#cpost"))){if(typeof addComment==="function")addComment();return}
  },true);
}
window.postHTML=function(p){
  var a=usr(p.by);if(!a)return "";
  var liked=p.likes.indexOf(me().id)>=0;
  var saved=p.saved.indexOf(me().id)>=0;
  var src=p.img&&String(p.img)||pic(p.id||"x");
  return '<article class="post"><div class="ph" data-act="profile" data-id="'+esc(a.id)+'">'+av(a)+'<div class="nm">'+esc(a.display)+badge(a)+(p.pinned?" pinned":"")+'<small>@'+esc(a.username)+'</small></div></div><div class="media" data-act="like" data-id="'+esc(p.id)+'"><img src="'+src+'" alt="" onerror="this.onerror=null;this.src=\''+FALL+'\'"></div><div class="acts"><button data-act="like" data-id="'+esc(p.id)+'">'+(liked?"Liked":"Like")+" "+p.likes.length+'</button><button data-act="comments" data-id="'+esc(p.id)+'">Comments</button><button data-act="save" data-id="'+esc(p.id)+'">'+(saved?"Saved":"Save")+'</button><button data-act="report" data-id="'+esc(p.id)+'">Report</button></div><div class="meta"><div class="likes">'+p.likes.length+" likes \u00b7 "+(p.views||0)+' views</div><div><b data-act="profile" data-id="'+esc(a.id)+'">'+esc(a.username)+"</b> "+esc(p.text)+'</div><div class="time">'+ago(p.t)+" ago</div></div></article>";
};
if(typeof draw==="function"){
  var _draw=draw;
  window.draw=function(){
    if(typingNow()){window.needDraw=true;return}
    window.needDraw=false;
    if(typeof recount==="function")recount();
    _draw();
    var sb=document.getElementById("shareBtn");
    if(sb)sb.onclick=function(ev){if(ev)ev.preventDefault();publish()};
    var cp=document.getElementById("cpost");
    if(cp)cp.onclick=function(ev){if(ev)ev.preventDefault();addComment()};
  };
}
setInterval(function(){
  if(window.needDraw&&!typingNow()&&typeof window.draw==="function")window.draw();
},800);
window.DEMO_IDS=["you","nova","milo","rio","iris","sage"];
window.isDemo=function(u){
  if(!u)return false;
  return window.DEMO_IDS.indexOf(u.id)>=0||window.DEMO_IDS.indexOf(u.username)>=0;
};
window.recount=function(){
  if(typeof db==="undefined"||!db.users)return;
  var follows=db.follows||[];
  db.users.forEach(function(u){
    u.following=follows.filter(function(f){return f[0]===u.id}).length;
    u.followers=follows.filter(function(f){return f[1]===u.id}).length;
  });
};
if(typeof visiblePosts==="function"){
  var _vis=visiblePosts;
  window.visiblePosts=function(){
    var list=_vis();
    var self=typeof me==="function"?me():null;
    if(self&&window.isDemo(self))return list;
    return list.filter(function(p){
      var u=typeof usr==="function"?usr(p.by):null;
      return !window.isDemo(u);
    });
  };
}
if(typeof searchView==="function"){
  var _search=searchView;
  window.searchView=function(){
    var keep=db.users;
    db.users=keep.filter(function(u){return !window.isDemo(u)||(typeof me==="function"&&me()&&u.id===me().id)});
    var html=_search();
    db.users=keep;
    return html;
  };
}
if(typeof homeView==="function"){
  var _home=homeView;
  window.homeView=function(){
    var keepS=db.stories;
    if(keepS)db.stories=keepS.filter(function(s){var u=typeof usr==="function"?usr(s.by):null;return !window.isDemo(u)||(typeof me==="function"&&me()&&s.by===me().id)});
    var html=_home();
    db.stories=keepS;
    return html;
  };
}
if(typeof db!=="undefined"&&db.users){
  recount();
  db.users=db.users.filter(function(u){
    if(!window.isDemo(u))return true;
    return !!(db.session&&u.id===db.session);
  });
}
if(typeof publish==="function"){
  var _pub=publish;
  window.publish=function(){
    var cap=document.getElementById("cap");
    var t=cap?String(cap.value||"").trim():"";
    if(!t){if(_pub)_pub();return}
    var img=window.pendingPostImg||pic("new"+now());
    window.pendingPostImg="";
    if(typeof posting!=="undefined")posting=true;
    var b=document.getElementById("shareBtn");
    if(b){b.disabled=true;b.textContent="Sharing..."}
    db.posts.unshift({id:"p"+now(),by:me().id,text:typeof filtered==="function"?filtered(t):t,img:img,t:now(),likes:[],comments:[],saved:[],hidden:false,pinned:false,featured:false,locked:false,views:1});
    if(typeof logA==="function")logA("post by @"+me().username);
    try{save(db)}catch(err){}
    if(typeof posting!=="undefined")posting=false;
    go("home");
  };
}
if(typeof draw==="function")try{if(!typingNow())draw()}catch(e){}
})();
