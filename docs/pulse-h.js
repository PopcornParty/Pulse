(function(){
var FALL="https://placehold.co/900x900/111111/8e8e93/png?text=Pulse";
var VIDEO_MAX=8*1024*1024;
window.pendingMedia={url:"",kind:"image",ready:false,err:""};

function isData(u){return String(u||"").indexOf("data:")===0}
function isStock(u){return /picsum\.photos|placehold\.co/.test(String(u||""))}
function isHosted(u){return /^https?:\/\//.test(String(u||""))&&!isStock(u)}
function isVideoSrc(u,kind){
  if(kind==="video")return true;
  u=String(u||"");
  return /^data:video\//.test(u)||/\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
}
function bestImg(){
  var args=Array.prototype.slice.call(arguments);
  var i,x;
  for(i=0;i<args.length;i++){x=args[i];if(isHosted(x))return x}
  for(i=0;i<args.length;i++){x=args[i];if(isData(x))return x}
  for(i=0;i<args.length;i++){x=args[i];if(x)return x}
  return FALL;
}

function dataToBlob(url,name){
  try{
    var parts=String(url).split(",");
    var mime=(parts[0].match(/:(.*?);/)||[,"application/octet-stream"])[1];
    var bin=atob(parts[1]||"");
    var arr=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    return new File([arr],name||"pulse.jpg",{type:mime});
  }catch(e){return null}
}

function uploadFile(file){
  if(!file)return Promise.resolve("");
  function send(url,fields){
    var fd=new FormData();
    Object.keys(fields).forEach(function(k){fd.append(k,fields[k])});
    fd.append("fileToUpload",file,file.name||"pulse.bin");
    return fetch(url,{method:"POST",body:fd}).then(function(r){return r.text()}).then(function(t){
      t=String(t||"").trim();
      if(/^https?:\/\//.test(t)&&t.indexOf("<")<0)return t;
      return "";
    }).catch(function(){return ""});
  }
  return send("https://catbox.moe/user/api.php",{reqtype:"fileupload"}).then(function(u){
    if(u)return u;
    return send("https://litterbox.catbox.moe/resources/internals/api.php",{reqtype:"fileupload",time:"72h"});
  });
}

function shrinkPhoto(file,cb){
  var r=new FileReader();
  r.onload=function(){
    var img=new Image();
    img.onload=function(){
      var c=document.createElement("canvas");
      var w=img.width,h=img.height,max=720;
      if(w>max||h>max){var s=max/Math.max(w,h);w=(w*s)|0;h=(h*s)|0}
      c.width=w;c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      var q=0.7,url=c.toDataURL("image/jpeg",q);
      while(url.length>140000&&q>0.4){q-=0.08;url=c.toDataURL("image/jpeg",q)}
      cb(url);
    };
    img.onerror=function(){cb(r.result)};
    img.src=r.result;
  };
  r.onerror=function(){cb("")};
  r.readAsDataURL(file);
}

window.preparePostFile=function(file,cb){
  window.pendingMedia={url:"",kind:"image",ready:false,err:""};
  if(!file){cb&&cb("");return}
  var type=String(file.type||"");
  var name=String(file.name||"").toLowerCase();
  var video=type.indexOf("video")===0||/\.(mp4|webm|mov|m4v)$/.test(name);
  if(video){
    if(file.size>VIDEO_MAX){
      window.pendingMedia.err="Video is too big. Use one under 8 MB.";
      showPreview();
      cb&&cb("");
      return;
    }
    var r=new FileReader();
    r.onload=function(){
      window.pendingMedia={url:r.result,kind:"video",ready:true,err:"",file:file};
      showPreview();
      cb&&cb(r.result);
    };
    r.readAsDataURL(file);
    return;
  }
  shrinkPhoto(file,function(url){
    window.pendingMedia={url:url,kind:"image",ready:true,err:"",file:file};
    showPreview();
    cb&&cb(url);
  });
};
function showPreview(){
  var box=document.getElementById("mediaPrev");
  var err=document.getElementById("errp");
  var p=window.pendingMedia||{};
  if(err&&p.err)err.textContent=p.err;
  if(!box)return;
  if(p.err){box.innerHTML="";return}
  if(!p.ready||!p.url)return;
  box.innerHTML=p.kind==="video"
    ?'<video src="'+p.url+'" controls playsinline muted style="width:100%;border-radius:12px;max-height:240px;background:#000"></video><p class="muted">Ready to share.</p>'
    :'<img src="'+p.url+'" alt="" style="width:100%;border-radius:12px;max-height:240px;object-fit:cover"><p class="muted">Ready to share.</p>';
}

if(typeof shrinkImg==="function"){
  window.shrinkImg=function(file,cb){
    if(!file){cb&&cb("");return}
    var type=String(file.type||"");
    if(type.indexOf("video")===0){window.preparePostFile(file,cb);return}
    shrinkPhoto(file,cb);
  };
}

document.addEventListener("change",function(e){
  var t=e.target;
  if(!t||t.id!=="file"||!t.files||!t.files[0])return;
  window.lastType=Date.now();
  window.preparePostFile(t.files[0]);
},true);

if(typeof slimDB==="function"){
  var _slim=slimDB;
  window.slimDB=function(d){
    var x=_slim(d);
    (x.posts||[]).forEach(function(p){
      if(p.remote&&isHosted(p.remote))p.img=p.remote;
      else if(isData(p.img)&&p.img.length>180000)p.img=p.remote||FALL;
      if(isStock(p.img)&&p.remote&&isHosted(p.remote))p.img=p.remote;
    });
    return x;
  };
}

if(typeof packCloud==="function"){
  var _pack=packCloud;
  window.packCloud=function(d){
    var x=_pack(d);
    (x.posts||[]).forEach(function(p){
      if(p.remote&&isHosted(p.remote))p.img=p.remote;
      else if(isData(p.img))p.img=p.remote||FALL;
      if(isStock(p.img)&&p.remote&&isHosted(p.remote))p.img=p.remote;
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
      var versions=map[p.id]||[p];
      var imgs=versions.map(function(v){return v.img});
      var remotes=versions.map(function(v){return v.remote});
      p.img=bestImg.apply(null,imgs.concat(remotes));
      p.remote=bestImg.apply(null,remotes.concat(versions.map(function(v){return isHosted(v.img)?v.img:""})));
      if(versions.some(function(v){return v.kind==="video"}))p.kind="video";
    });
    return list;
  };
}

function attachRemote(id,url){
  if(!url||!id||typeof db==="undefined")return;
  var p=db.posts.find(function(x){return x.id===id});
  if(!p)return;
  p.remote=url;
  if(!isData(p.img)||isStock(p.img))p.img=url;
  try{if(typeof save==="function")save(db)}catch(e){}
}

function publishMedia(id,localUrl,file,kind){
  var blob=file||dataToBlob(localUrl,kind==="video"?"pulse.mp4":"pulse.jpg");
  if(!blob)return;
  uploadFile(blob).then(function(url){
    if(url)attachRemote(id,url);
  });
}

if(typeof publish==="function"){
  var _pub=publish;
  window.publish=function(){
    var cap=document.getElementById("cap");
    var t=cap?String(cap.value||"").trim():"";
    if(!t){if(_pub)_pub();return}
    var fileEl=document.getElementById("file");
    var pending=window.pendingMedia||{};
    var file=pending.file||(fileEl&&fileEl.files&&fileEl.files[0]);
    if(pending.err){
      var err=document.getElementById("errp");
      if(err)err.textContent=pending.err;
      return;
    }
    if(file&&!pending.ready){
      var b=document.getElementById("shareBtn");
      if(b){b.disabled=true;b.textContent="Preparing..."}
      window.preparePostFile(file,function(){window.publish()});
      return;
    }
    var kind=pending.kind||"image";
    var img=pending.url||"";
    if(!img){
      if(file){
        var b2=document.getElementById("shareBtn");
        if(b2){b2.disabled=true;b2.textContent="Preparing..."}
        window.preparePostFile(file,function(){window.publish()});
        return;
      }
      img=FALL;
      kind="image";
    }
    if(typeof posting!=="undefined")posting=true;
    var btn=document.getElementById("shareBtn");
    if(btn){btn.disabled=true;btn.textContent="Sharing..."}
    var id="p"+now();
    var text=typeof filtered==="function"?filtered(t):t;
    db.posts.unshift({id:id,by:me().id,text:text,img:img,remote:"",kind:kind,t:now(),likes:[],comments:[],saved:[],hidden:false,pinned:false,featured:false,locked:false,views:1});
    if(typeof logA==="function")logA("post by @"+me().username);
    window.pendingMedia={url:"",kind:"image",ready:false,err:""};
    window.pendingPostImg="";
    try{save(db)}catch(e){}
    publishMedia(id,img,file,kind);
    if(typeof posting!=="undefined")posting=false;
    go("home");
  };
}

window.postHTML=function(p){
  var a=usr(p.by);if(!a)return "";
  var liked=(p.likes||[]).indexOf(me().id)>=0;
  var saved=(p.saved||[]).indexOf(me().id)>=0;
  var src=bestImg(p.img,p.remote,FALL);
  var media;
  if(isVideoSrc(src,p.kind)){
    media='<video src="'+src+'" controls playsinline muted preload="metadata" style="width:100%;height:100%;object-fit:cover;background:#000"></video>';
  }else{
    media='<img src="'+src+'" alt="" onerror="this.onerror=null;this.src=\''+FALL+'\'">';
  }
  return '<article class="post"><div class="ph" data-act="profile" data-id="'+esc(a.id)+'">'+av(a)+'<div class="nm">'+esc(a.display)+badge(a)+(p.pinned?" pinned":"")+'<small>@'+esc(a.username)+'</small></div></div><div class="media" data-act="like" data-id="'+esc(p.id)+'">'+media+'</div><div class="acts"><button data-act="like" data-id="'+esc(p.id)+'">'+(liked?"Liked":"Like")+" "+(p.likes||[]).length+'</button><button data-act="comments" data-id="'+esc(p.id)+'">Comments</button><button data-act="save" data-id="'+esc(p.id)+'">'+(saved?"Saved":"Save")+'</button><button data-act="report" data-id="'+esc(p.id)+'">Report</button></div><div class="meta"><div class="likes">'+(p.likes||[]).length+" likes · "+(p.views||0)+' views</div><div><b data-act="profile" data-id="'+esc(a.id)+'">'+esc(a.username)+"</b> "+esc(p.text)+'</div><div class="time">'+ago(p.t)+" ago</div></div></article>";
};

if(typeof createView==="function"){
  var _cv=createView;
  window.createView=function(){
    var html=_cv();
    html=html.replace('accept="image/*"','accept="image/*,video/mp4,video/webm,video/quicktime"');
    var note='<p class="muted">Pick a photo and it stays the photo you chose — not a random picture. Short videos under 8 MB can be posted too. Bigger videos are skipped.</p>';
    if(html.indexOf("8 MB")<0)html=html.replace("</textarea>", "</textarea>"+note+'<div id="mediaPrev"></div>');
    var p=window.pendingMedia||{};
    if(p.err)html=html.replace('<div class="err" id="errp"></div>','<div class="err" id="errp">'+esc(p.err)+"</div>");
    if(p.ready&&p.url){
      var preview=p.kind==="video"
        ?'<video src="'+p.url+'" controls playsinline muted style="width:100%;border-radius:12px;margin:8px 0;max-height:240px;background:#000"></video>'
        :'<img src="'+p.url+'" alt="" style="width:100%;border-radius:12px;margin:8px 0;max-height:240px;object-fit:cover">';
      html=html.replace('<button class="pri" id="shareBtn">','<p class="muted">Ready to share.</p>'+preview+'<button class="pri" id="shareBtn">');
    }
    return html;
  };
}

if(typeof pickPfp==="function"){
  window.pickPfp=function(){
    var f=document.getElementById("pfp");
    if(!f||!f.files||!f.files[0])return;
    if(String(f.files[0].type||"").indexOf("video")===0){alert("Profile photo must be a picture.");return}
    shrinkPhoto(f.files[0],function(url){
      if(!url||!me())return;
      me().pic=url;
      var blob=dataToBlob(url,"pfp.jpg");
      if(blob)uploadFile(blob).then(function(link){if(link&&me()){me().pic=link;try{save(db)}catch(e){}}});
      try{save(db)}catch(e){}
      sheet="edit";
      draw();
    });
  };
}

var _bindH=window.bindUi;
window.bindUi=function(){
  if(_bindH)_bindH();
  if(typeof showPreview==="function")showPreview();
};
if(typeof official==="function"){
  window.official=function(){
    var t=prompt("Official Pulse post");
    if(!t)return;
    db.posts.unshift({id:"p"+now(),by:me().id,text:t,img:FALL,kind:"image",t:now(),likes:[],comments:[],saved:[],hidden:false,pinned:true,featured:true,locked:false,views:1});
    dirty();
  };
}
})();
