(function(){
window.lastType=0;
window.needDraw=false;
window.pendingPostImg="";
function typingNow(){
  var el=document.activeElement;
  if(el&&(el.tagName==="INPUT"||el.tagName==="TEXTAREA"||el.isContentEditable))return true;
  if(Date.now()-(window.lastType||0)<6000)return true;
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
      });
    }
  }
},true);
if(typeof draw==="function"){
  var _draw=draw;
  window.draw=function(){
    if(typingNow()){window.needDraw=true;return}
    window.needDraw=false;
    if(typeof recount==="function")recount();
    _draw();
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
    var self=db.session&&u.id===db.session;
    return !!self;
  });
}
if(typeof publish==="function"){
  var _pub=publish;
  window.publish=function(){
    var cap=document.getElementById("cap");
    var t=cap?String(cap.value||"").trim():"";
    if(!t){if(_pub)_pub();return}
    if(window.pendingPostImg){
      if(typeof posting!=="undefined")posting=true;
      var b=document.getElementById("shareBtn");
      if(b){b.disabled=true;b.textContent="Sharing..."}
      var img=window.pendingPostImg;
      window.pendingPostImg="";
      db.posts.unshift({id:"p"+now(),by:me().id,text:typeof filtered==="function"?filtered(t):t,img:img,t:now(),likes:[],comments:[],saved:[],hidden:false,pinned:false,featured:false,locked:false,views:1});
      if(typeof logA==="function")logA("post by @"+me().username);
      try{save(db)}catch(e){}
      if(typeof posting!=="undefined")posting=false;
      go("home");
      return;
    }
    if(_pub)_pub();
  };
}
if(typeof like==="function"){
  var _like=like;
  window.like=function(id){window.lastType=0;_like(id)};
}
if(typeof saveP==="function"){
  var _saveP=saveP;
  window.saveP=function(id){window.lastType=0;_saveP(id)};
}
if(typeof reportP==="function"){
  var _rep=reportP;
  window.reportP=function(id){window.lastType=0;_rep(id)};
}
if(typeof draw==="function")try{if(!typingNow())draw()}catch(e){}
})();
