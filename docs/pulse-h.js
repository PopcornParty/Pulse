(function(){
var FALL="https://placehold.co/900x900/111111/8e8e93/png?text=Pulse";
window.pixCache=window.pixCache||{};
window.pendingMedia={url:"",ready:false,err:"",file:null};
function isData(u){return String(u||"").indexOf("data:")===0}
function isStock(u){return /picsum\.photos|placehold\.co/.test(String(u||""))}
function isHosted(u){return /^https?:\/\//.test(String(u||""))&&!isStock(u)}
function bestSrc(){
  var a=Array.prototype.slice.call(arguments),i,x;
  for(i=0;i<a.length;i++){x=a[i];if(isHosted(x))return x}
  for(i=0;i<a.length;i++){x=a[i];if(isData(x))return x}
  for(i=0;i<a.length;i++){x=a[i];if(x&&!isStock(x))return x}
  return FALL;
}
function pixPut(id,url){
  if(!id||!url)return;
  window.pixCache[id]=url;
  if(typeof idbOpen!=="function")return;
  idbOpen(function(dbx){
    if(!dbx)return;
    try{dbx.transaction("kv","readwrite").objectStore("kv").put(url,"pix-"+id)}catch(e){}
  });
}
function pixGet(id,cb){
  if(!id){cb&&cb("");return}
  if(window.pixCache[id]){cb&&cb(window.pixCache[id]);return}
  if(typeof idbOpen!=="function"){cb&&cb("");return}
  idbOpen(function(dbx){
    if(!dbx){cb&&cb("");return}
    try{
      var r=dbx.transaction("kv").objectStore("kv").get("pix-"+id);
      r.onsuccess=function(){var v=r.result||"";if(v)window.pixCache[id]=v;cb&&cb(v)};
      r.onerror=function(){cb&&cb("")};
    }catch(e){cb&&cb("")}
  });
}
function dataToBlob(url,name){
  try{
    var parts=String(url).split(",");
    var mime=(parts[0].match(/:(.*?);/)||[,"image/jpeg"])[1];
    var bin=atob(parts[1]||"");
    var arr=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    return new File([arr],name||"pulse.jpg",{type:mime});
  }catch(e){return null}
}
function uploadPhoto(file){
  if(!file)return Promise.resolve("");
  var fd=new FormData();
  fd.append("reqtype","fileupload");
  fd.append("time","72h");
  fd.append("fileToUpload",file,file.name||"pulse.jpg");
  return fetch("https://litterbox.catbox.moe/resources/internals/api.php",{method:"POST",body:fd}).then(function(r){return r.text()}).then(function(t){
    t=String(t||"").trim();
    if(/^https?:\/\//.test(t)&&t.indexOf("<")<0)return t;
    return "";
  }).catch(function(){return ""});
}
function shrinkPhoto(file,cb){
  if(!file){cb&&cb("");return}
  if(String(file.type||"").indexOf("image")!==0&&!/\.(png|jpe?g|gif|webp|heic)$/i.test(file.name||"")){cb&&cb("");return}
  var r=new FileReader();
  r.onload=function(){
    var img=new Image();
    img.onload=function(){
      var c=document.createElement("canvas");
      var w=img.width,h=img.height,max=720;
      if(w>max||h>max){var s=max/Math.max(w,h);w=(w*s)|0;h=(h*s)|0}
      c.width=w;c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      var q=0.72,url=c.toDataURL("image/jpeg",q);
      while(url.length>160000&&q>0.45){q-=0.08;url=c.toDataURL("image/jpeg",q)}
      cb(url);
    };
    img.onerror=function(){cb(r.result||"")};
    img.src=r.result;
  };
  r.onerror=function(){cb("")};
  r.readAsDataURL(file);
}
function showPreview(){
  var box=document.getElementById("mediaPrev");
  var err=document.getElementById("errp");
  var p=window.pendingMedia||{};
  if(err)err.textContent=p.err||"";
  if(!box)return;
  if(p.err||!p.ready||!p.url){if(p.err)box.innerHTML="";return}
  box.innerHTML='<img src="'+p.url+'" alt="" style="width:100%;border-radius:12px;max-height:240px;object-fit:cover"><p class="muted">This photo is ready.</p>';
}
window.preparePostFile=function(file,cb){
  window.pendingMedia={url:"",ready:false,err:"",file:null};
  if(!file){cb&&cb("");return}
  if(String(file.type||"").indexOf("video")===0){
    window.pendingMedia.err="Photos only.";
    showPreview();cb&&cb("");return;
  }
  shrinkPhoto(file,function(url){
    if(!url){window.pendingMedia.err="Could not read that photo. Try another one.";showPreview();cb&&cb("");return}
    window.pendingMedia={url:url,ready:true,err:"",file:file};
    showPreview();cb&&cb(url);
  });
};
window.shrinkImg=function(file,cb){if(!file||String(file.type||"").indexOf("video")===0){cb&&cb("");return}shrinkPhoto(file,cb)};
document.addEventListener("change",function(e){
  var t=e.target;
  if(!t||t.id!=="file"||!t.files||!t.files[0])return;
  window.lastType=Date.now();
  window.preparePostFile(t.files[0]);
},true);
if(typeof slimDB==="function"){
  var _slim=slimDB;
  window.slimDB=function(d){
    var keep={};
    (d.posts||[]).forEach(function(p){if(p&&p.id)keep[p.id]={remote:p.remote,img:p.img}});
    var x=_slim(d);
    (x.posts||[]).forEach(function(p){
      var k=keep[p.id]||{};
      if(k.remote&&isHosted(k.remote)){p.remote=k.remote;p.img=k.remote;return}
      if(isHosted(k.img)){p.img=k.img;return}
      if(isData(p.img)||isStock(p.img))p.img=k.remote||"";
    });
    return x;
  };
}
if(typeof packCloud==="function"){
  var _pack=packCloud;
  window.packCloud=function(d){
    var x=_pack(d);
    (x.posts||[]).forEach(function(p){
      var local=(d.posts||[]).find(function(y){return y&&y.id===p.id});
      var remote=local&&local.remote;
      if(isHosted(remote))p.img=remote;
      else if(isData(p.img)||isStock(p.img))p.img="";
      p.remote=isHosted(remote)?remote:(isHosted(p.img)?p.img:"");
    });
    return x;
  };
}
if(typeof mergePosts==="function"){
  var _mp=mergePosts;
  window.mergePosts=function(a,b){
    var list=_mp(a,b);
    var map={};
    (a||[]).concat(b||[]).forEach(function(p){if(p&&p.id)map[p.id]=(map[p.id]||[]).concat([p])});
    list.forEach(function(p){
      var vs=map[p.id]||[p];
      var imgs=vs.map(function(v){return v.img}).concat(vs.map(function(v){return v.remote}));
      p.img=bestSrc.apply(null,imgs);
      p.remote=bestSrc.apply(null,vs.map(function(v){return v.remote}).concat(vs.map(function(v){return isHosted(v.img)?v.img:""})));
    });
    return list;
  };
}
function hydratePics(){
  if(typeof db==="undefined"||!db.posts)return;
  db.posts.forEach(function(p){
    if(!p||!p.id||window.pixCache[p.id])return;
    pixGet(p.id,function(url){
      if(!url)return;
      var img=document.querySelector('img[data-pix="'+p.id+'"]');
      if(img)img.src=url;
    });
  });
}
if(typeof publish==="function"){
  window.publish=function(){
    var cap=document.getElementById("cap");
    var t=cap?String(cap.value||"").trim():"";
    if(!t){var err=document.getElementById("errp");if(err)err.textContent="Write a caption first";return}
    var pending=window.pendingMedia||{};
    var fileEl=document.getElementById("file");
    var file=pending.file||(fileEl&&fileEl.files&&fileEl.files[0]);
    if(pending.err){var e2=document.getElementById("errp");if(e2)e2.textContent=pending.err;return}
    if(file&&!pending.ready){
      var b=document.getElementById("shareBtn");
      if(b){b.disabled=true;b.textContent="Preparing photo..."}
      window.preparePostFile(file,function(){window.publish()});
      return;
    }
    var photo=pending.url||"";
    if(typeof posting!=="undefined")posting=true;
    var btn=document.getElementById("shareBtn");
    if(btn){btn.disabled=true;btn.textContent="Sharing..."}
    var id="p"+now();
    var text=typeof filtered==="function"?filtered(t):t;
    if(photo)pixPut(id,photo);
    db.posts.unshift({id:id,by:me().id,text:text,img:photo||"",remote:"",t:now(),likes:[],comments:[],saved:[],hidden:false,pinned:false,featured:false,locked:false,views:1});
    if(typeof logA==="function")logA("post by @"+me().username);
    window.pendingMedia={url:"",ready:false,err:"",file:null};
    window.pendingPostImg="";
    try{save(db)}catch(err){}
    if(photo){
      var blob=file&&String(file.type||"").indexOf("image")===0?file:dataToBlob(photo,"pulse.jpg");
      if(blob)uploadPhoto(blob).then(function(url){
        var p=db.posts.find(function(x){return x.id===id});
        if(p&&url){p.remote=url;if(!p.img||isStock(p.img))p.img=url;try{save(db)}catch(e){}}
      });
    }
    if(typeof posting!=="undefined")posting=false;
    go("home");
  };
}
window.postHTML=function(p){
  var a=usr(p.by);if(!a)return "";
  var liked=(p.likes||[]).indexOf(me().id)>=0;
  var saved=(p.saved||[]).indexOf(me().id)>=0;
  var src=bestSrc(window.pixCache[p.id],p.img,p.remote,FALL);
  if(isStock(src)&&window.pixCache[p.id])src=window.pixCache[p.id];
  if(!window.pixCache[p.id])pixGet(p.id);
  return '<article class="post"><div class="ph" data-act="profile" data-id="'+esc(a.id)+'">'+av(a)+'<div class="nm">'+esc(a.display)+badge(a)+(p.pinned?" pinned":"")+'<small>@'+esc(a.username)+'</small></div></div><div class="media" data-act="like" data-id="'+esc(p.id)+'"><img data-pix="'+esc(p.id)+'" src="'+src+'" alt="" onerror="this.onerror=null;this.src=\''+FALL+'\'"></div><div class="acts"><button data-act="like" data-id="'+esc(p.id)+'">'+(liked?"Liked":"Like")+" "+(p.likes||[]).length+'</button><button data-act="comments" data-id="'+esc(p.id)+'">Comments</button><button data-act="save" data-id="'+esc(p.id)+'">'+(saved?"Saved":"Save")+'</button><button data-act="report" data-id="'+esc(p.id)+'">Report</button></div><div class="meta"><div class="likes">'+(p.likes||[]).length+" likes · "+(p.views||0)+' views</div><div><b data-act="profile" data-id="'+esc(a.id)+'">'+esc(a.username)+"</b> "+esc(p.text)+'</div><div class="time">'+ago(p.t)+" ago</div></div></article>";
};
if(typeof createView==="function"){
  var _cv=createView;
  window.createView=function(){
    var html=_cv();
    html=html.replace('accept="image/*,video/mp4,video/webm,video/quicktime"','accept="image/*"');
    var note='<p class="muted">Choose a photo. You should see your picture under the caption before you tap Share.</p><div id="mediaPrev"></div>';
    if(html.indexOf("mediaPrev")<0)html=html.replace("</textarea>","</textarea>"+note);
    return html;
  };
}
if(typeof pickPfp==="function"){
  window.pickPfp=function(){
    var f=document.getElementById("pfp");
    if(!f||!f.files||!f.files[0])return;
    if(String(f.files[0].type||"").indexOf("image")!==0){alert("Pick a photo.");return}
    shrinkPhoto(f.files[0],function(url){
      if(!url||!me())return;
      me().pic=url;
      var blob=dataToBlob(url,"pfp.jpg");
      if(blob)uploadPhoto(blob).then(function(link){if(link&&me()){me().pic=link;try{save(db)}catch(e){}}});
      try{save(db)}catch(e){}
      sheet="edit";draw();
    });
  };
}
var _bindH=window.bindUi;
window.bindUi=function(){if(_bindH)_bindH();showPreview();hydratePics()};
setTimeout(hydratePics,400);
})();
