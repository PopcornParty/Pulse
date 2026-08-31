(function(){
function clearComposer(){
  window.pendingMedia={url:"",ready:false,err:"",file:null};
  window.pendingPostImg="";
  var cap=document.getElementById("cap");
  if(cap)cap.value="";
  var file=document.getElementById("file");
  if(file)try{file.value=""}catch(e){}
  var prev=document.getElementById("mediaPrev");
  if(prev)prev.innerHTML="";
  var err=document.getElementById("errp");
  if(err)err.textContent="";
}
window.clearComposer=clearComposer;
window.shareBusy=false;
window.lastPostKey=window.lastPostKey||"";
window.lastPostAt=window.lastPostAt||0;
var _pub=window.publish;
window.publish=function(){
  if(window.shareBusy)return;
  var pending=window.pendingMedia||{};
  var fileEl=document.getElementById("file");
  var hasFile=!!(pending.file||(fileEl&&fileEl.files&&fileEl.files[0]));
  if(hasFile&&!pending.ready&&!pending.err){
    if(_pub)_pub();
    return;
  }
  var cap=document.getElementById("cap");
  var text=cap?String(cap.value||"").trim():"";
  var key=((typeof me==="function"&&me()&&me().id)||"")+"|"+text;
  if(text&&key===window.lastPostKey&&Date.now()-(window.lastPostAt||0)<5000){
    clearComposer();
    if(typeof go==="function")go("home");
    return;
  }
  window.shareBusy=true;
  if(text){window.lastPostKey=key;window.lastPostAt=Date.now()}
  try{
    if(_pub)_pub();
  }finally{
    clearComposer();
    setTimeout(function(){window.shareBusy=false},1500);
    if(typeof go==="function")go("home");
  }
};
if(typeof goCreate==="function"){
  var _gc=goCreate;
  window.goCreate=function(){clearComposer();_gc()};
}
})();
