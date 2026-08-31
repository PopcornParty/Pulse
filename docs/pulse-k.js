(function(){
window.sendingLock=false;
window.lastMsgKey="";
window.lastMsgAt=0;
window.commentLock=false;
window.lastCommentKey="";
window.lastCommentAt=0;

function pairKey(a,b){return [String(a||""),String(b||"")].sort().join("|")}

function dedupeMsgs(list){
  var out=[];
  (list||[]).forEach(function(m){
    if(!m||!String(m.text||"").trim())return;
    var text=String(m.text);
    var by=m.by;
    var t=m.t||0;
    var id=m.id||"";
    var hit=out.some(function(x){
      if(id&&x.id&&id===x.id)return true;
      return x.by===by&&String(x.text)===text&&Math.abs((x.t||0)-t)<12000;
    });
    if(!hit)out.push({id:id||("m"+t+"-"+by),by:by,text:text,t:t});
  });
  out.sort(function(a,b){return (a.t||0)-(b.t||0)});
  return out;
}

function cleanTalk(){
  if(typeof db==="undefined")return;
  if(db.convos)db.convos.forEach(function(c){if(c)c.msgs=dedupeMsgs(c.msgs)});
  if(db.threads)db.threads.forEach(function(t){if(t)t.msgs=dedupeMsgs(t.msgs)});
}

function writeThread(other,msg){
  if(!other||!me())return;
  if(!db.threads)db.threads=[];
  var key=pairKey(me().id,other);
  var th=db.threads.find(function(t){return t.pair===key});
  if(!th){th={pair:key,msgs:[]};db.threads.push(th)}
  th.msgs=dedupeMsgs((th.msgs||[]).concat([msg]));
}

window.send=function(){
  if(window.sendingLock)return;
  var box=document.getElementById("mtext");
  var t=((box&&box.value)||"").trim();
  if(!t||!chatWith||!me())return;
  var text=typeof filtered==="function"?filtered(t):t;
  var key=me().id+"|"+chatWith+"|"+text;
  var n=typeof now==="function"?now():Date.now();
  if(key===window.lastMsgKey&&n-(window.lastMsgAt||0)<4000){
    if(box)box.value="";
    return;
  }
  window.sendingLock=true;
  window.lastMsgKey=key;
  window.lastMsgAt=n;
  if(box)box.value="";
  var btn=document.getElementById("sendBtn");
  if(btn){btn.disabled=true;btn.textContent="Sent"}
  if(!db.convos)db.convos=[];
  var c=db.convos.find(function(x){return x.with===chatWith});
  if(!c){c={id:"c"+n,with:chatWith,msgs:[]};db.convos.push(c)}
  var last=(c.msgs||[])[c.msgs.length-1];
  if(last&&last.by===me().id&&last.text===text&&n-(last.t||0)<4000){
    window.sendingLock=false;
    if(btn){btn.disabled=false;btn.textContent="Send"}
    return;
  }
  var msg={id:"m"+n+"-"+me().id,by:me().id,text:text,t:n};
  c.msgs=dedupeMsgs((c.msgs||[]).concat([msg]));
  writeThread(chatWith,msg);
  cleanTalk();
  try{save(db)}catch(e){}
  if(typeof draw==="function")draw();
  setTimeout(function(){window.sendingLock=false},900);
};

window.addComment=function(){
  if(window.commentLock)return;
  var box=document.getElementById("ctext");
  var t=((box&&box.value)||"").trim();
  if(!t||!commentId)return;
  var p=db.posts.find(function(x){return x.id===commentId});
  if(!p||p.locked)return;
  var text=typeof filtered==="function"?filtered(t):t;
  var key=me().id+"|"+commentId+"|"+text;
  var n=typeof now==="function"?now():Date.now();
  if(key===window.lastCommentKey&&n-(window.lastCommentAt||0)<4000){
    if(box)box.value="";
    return;
  }
  var already=(p.comments||[]).some(function(c){return c.by===me().id&&c.text===text});
  if(already){
    if(box)box.value="";
    commentId=null;
    if(typeof draw==="function")draw();
    return;
  }
  window.commentLock=true;
  window.lastCommentKey=key;
  window.lastCommentAt=n;
  if(box)box.value="";
  var b=document.getElementById("cpost");
  if(b){b.disabled=true;b.textContent="Posted"}
  p.comments.push({by:me().id,text:text,t:n});
  commentId=null;
  try{save(db)}catch(e){}
  if(typeof draw==="function")draw();
  setTimeout(function(){window.commentLock=false},900);
};

if(typeof mergeMsgs==="function"){
  window.mergeMsgs=function(a,b){return dedupeMsgs((a||[]).concat(b||[]))};
  try{mergeMsgs=window.mergeMsgs}catch(e){}
}

if(typeof applyRemote==="function"){
  var _ar=applyRemote;
  window.applyRemote=function(x){
    var ok=_ar(x);
    cleanTalk();
    return ok;
  };
  try{applyRemote=window.applyRemote}catch(e){}
}

cleanTalk();

if(!window.pulseSendTap){
  window.pulseSendTap=true;
  document.addEventListener("click",function(e){
    var t=e.target;
    if(!t||!t.closest)return;
    var sendBtn=t.id==="sendBtn"?t:t.closest("#sendBtn");
    if(sendBtn){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      send();
      return;
    }
    var cpost=t.id==="cpost"?t:t.closest("#cpost");
    if(cpost){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      addComment();
    }
  },true);
  document.addEventListener("keydown",function(e){
    if(e.key!=="Enter")return;
    var t=e.target;
    if(!t)return;
    if(t.id==="mtext"){
      e.preventDefault();
      send();
    }
  },true);
}

var _bind=window.bindUi;
window.bindUi=function(){
  if(_bind)_bind();
  var sb=document.getElementById("sendBtn");
  if(sb)sb.onclick=function(ev){if(ev){ev.preventDefault();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation()}send()};
  var mt=document.getElementById("mtext");
  if(mt)mt.onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();send()}};
};
})();
