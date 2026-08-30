const KEY="pulse.net.v1";
const CODE="FERRARI1";
const $=function(s){return document.querySelector(s)};
const now=function(){return Date.now()};
function ago(t){var s=Math.max(1,((now()-t)/1000)|0);if(s<60)return s+"s";var m=(s/60)|0;if(m<60)return m+"m";var h=(m/60)|0;if(h<24)return h+"h";return ((h/24)|0)+"d"}
function col(h){return "hsl("+h+" 62% 40%)"}
function pic(s){return "https://picsum.photos/seed/"+s+"/900/900"}
function esc(s){return String(s||"")}
function q(id){return JSON.stringify(String(id))}
function logA(msg){db.audit.unshift({t:now(),msg:msg});if(db.audit.length>80)db.audit=db.audit.slice(0,80)}
function seed(){function U(id,username,display,h,bio,ver){return {id:id,username:username,display:display,pass:"pulse123",bio:bio,h:h,ver:!!ver,followers:80+h,following:40,blocked:false,staff:false,shadow:false,role:"member"}}var users=[U("you","you","Jordan Hale",18,"Sunsets and trails."),U("nova","nova","Nova Chen",262,"Night sky diaries.",1),U("milo","milo","Milo Park",32,"Bread and broth.",1),U("rio","rio","Rio Alvarez",198,"Tiny games.",1),U("iris","iris","Iris Holm",280,"Type and paper.",1),U("sage","sage","Sage Okonkwo",148,"Quiet miles.")];function P(id,by,text,seedName,hours,likes){return {id:id,by:by,text:text,img:pic(seedName),t:now()-hours*3600000,likes:likes.slice(),comments:[{by:"you",text:"This is beautiful."}],saved:[],hidden:false,pinned:false,featured:false,locked:false,views:40+hours}}return {users:users,follows:[["you","nova"],["you","milo"],["you","iris"],["nova","you"]],posts:[P("p1","nova","Perseids over the ridge.","stars1",2,["you","iris"]),P("p2","milo","Sunday loaf.","bread1",5,["you"]),P("p3","iris","Harbor Grotesk specimen.","type1",9,["you"]),P("p4","sage","Fog was the view.","trail1",14,["you"]),P("p5","rio","Lighthouse tileset.","pixel1",20,["you"])],stories:users.map(function(u){return {id:"s"+u.id,by:u.id,img:"https://picsum.photos/seed/st"+u.id+"/720/1280",seen:false}}),convos:[{id:"c1",with:"nova",msgs:[{by:"nova",text:"Did you catch the north sky?"},{by:"you",text:"Two meteors."}]}],notes:[{id:1,text:"nova liked your post",read:false}],reports:[],audit:[{t:now(),msg:"Network created"}],settings:{banner:"",maintenance:false,regOpen:true,inviteOnly:false,wordFilter:"",welcome:"Welcome to Pulse",theme:"dark",skin:"classic"},session:null,owner:false}}
function normalize(x){if(!x.settings)x.settings={banner:"",maintenance:false,regOpen:true,inviteOnly:false,wordFilter:"",welcome:"Welcome to Pulse",theme:"dark",skin:"classic"};if(!x.settings.theme)x.settings.theme="dark";if(!x.settings.skin)x.settings.skin="classic";if(!x.audit)x.audit=[];if(!x.reports)x.reports=[];if(!x.posts)x.posts=[];if(!x.follows)x.follows=[];if(!x.users)x.users=[];return x}
function slimDB(d){var x;try{x=JSON.parse(JSON.stringify(d))}catch(e){return d}(x.posts||[]).forEach(function(p){if(p.img&&String(p.img).indexOf("data:")===0&&p.img.length>60000)p.img=pic(p.id||"x")});(x.users||[]).forEach(function(u){if(u.pic&&String(u.pic).indexOf("data:")===0&&u.pic.length>60000)u.pic=""});return x}
function idbOpen(cb){try{var req=indexedDB.open("pulse.net",1);req.onupgradeneeded=function(){req.result.createObjectStore("kv")};req.onsuccess=function(){cb(req.result)};req.onerror=function(){cb(null)}}catch(e){cb(null)}}
function idbPut(d){idbOpen(function(dbx){if(!dbx)return;try{dbx.transaction("kv","readwrite").objectStore("kv").put(d,"db")}catch(e){}})}
function idbGet(cb){idbOpen(function(dbx){if(!dbx){cb(null);return}try{var r=dbx.transaction("kv").objectStore("kv").get("db");r.onsuccess=function(){cb(r.result||null)};r.onerror=function(){cb(null)}}catch(e){cb(null)}})}
function save(d){var raw;try{raw=JSON.stringify(d)}catch(e){raw="{}"}try{localStorage.setItem(KEY,raw)}catch(e){try{localStorage.removeItem(KEY);localStorage.setItem(KEY,JSON.stringify(slimDB(d)))}catch(e2){}}try{idbPut(d)}catch(e){}}
function load(){try{var x=JSON.parse(localStorage.getItem(KEY));if(x&&x.users)return normalize(x)}catch(e){}var d=seed();try{save(d)}catch(e){}return d}
var db=load(),route="home",authPage="login",sheet=null,openStory=null,commentId=null,viewUser=null,adminTab="dash",ownerOk=false;
idbGet(function(x){if(!x||!x.users)return;normalize(x);var more=(x.posts&&x.posts.length>(db.posts||[]).length)||(x.users&&x.users.length>(db.users||[]).length);if(!more&&!(x.posts&&x.posts.length===(db.posts||[]).length&&x.users.length>=(db.users||[]).length))return;var sess=db.session;x.session=sess||x.session;db=x;try{save(db)}catch(e){}if(typeof draw==="function")draw()});
function me(){return db.users.find(function(u){return u.id===db.session})}
function usr(id){return db.users.find(function(u){return u.id===id})}
function go(r){route=r;sheet=null;openStory=null;commentId=null;if(r!=="profile")viewUser=null;draw()}
function av(u,sz){sz=sz||36;if(u&&u.pic)return '<img class="av" alt="" src="'+u.pic+'" style="width:'+sz+'px;height:'+sz+'px;object-fit:cover">';return '<div class="av" style="width:'+sz+'px;height:'+sz+'px;background:'+col((u&&u.h)||0)+'">'+((u&&(u.display||u.username))||"?")[0].toUpperCase()+'</div>'}
function badge(u){return (u&&u.ver)?'<span class="vbadge" title="Verified">\u2713</span>':""}
function following(id){return db.follows.some(function(f){return f[0]===me().id&&f[1]===id})}
function openProfile(id){viewUser=id;route="profile";sheet=null;draw()}
function dirty(){try{save(db)}catch(e){}draw()}
function showLogin(){authPage="login";draw()}
function showSignup(){authPage="signup";draw()}
function setSheet(v){sheet=v;draw()}
function setAdmin(v){adminTab=v;draw()}
function logout(){ownerOk=false;db.session=null;save(db);authPage="login";draw()}
function saveProfile(){var n=$("#dn");var b=$("#bio");if(!n)return;me().display=(n.value||"").trim()||me().username;me().bio=b?b.value:me().bio;save(db);sheet=null;draw()}
function setBanner(){var t=prompt("Site banner",db.settings.banner||"");if(t!==null){db.settings.banner=t;dirty()}}
function setFilter(){var t=prompt("Blocked words, comma separated",db.settings.wordFilter||"");if(t!==null){db.settings.wordFilter=t;dirty()}}
function setWelcome(){var t=prompt("Welcome text",db.settings.welcome);if(t){db.settings.welcome=t;dirty()}}
function resetNet(){if(confirm("Reset whole network on this phone?")){try{localStorage.removeItem(KEY)}catch(e){}idbOpen(function(dbx){if(dbx)try{dbx.transaction("kv","readwrite").objectStore("kv").delete("db")}catch(e){}});db=seed();db.owner=true;ownerOk=true;save(db);draw()}}
function toggleMaint(){db.settings.maintenance=!db.settings.maintenance;dirty()}
function toggleReg(){db.settings.regOpen=!db.settings.regOpen;dirty()}
function toggleInvite(){db.settings.inviteOnly=!db.settings.inviteOnly;dirty()}
function goNotes(){go("notes")}
function goHome(){go("home")}
function goSearch(){go("search")}
function goProfile(){go("profile")}
function goAdmin(){ownerOk=false;adminTab="dash";go("admin")}
function setMenu(){setSheet("menu")}
function setEdit(){setSheet("edit")}
function tabDash(){setAdmin("dash")}
function tabPeople(){setAdmin("people")}
function tabPosts(){setAdmin("posts")}
function tabReports(){setAdmin("reports")}
function tabLogs(){setAdmin("logs")}
var chatWith=null,chatQuery="";
function goCreate(){go("create")}
function goMessages(){chatWith=null;go("messages")}
function closeChat(){chatWith=null;draw()}
function startChat(id){if(!id||!me()||id===me().id)return;if(!db.convos)db.convos=[];if(!db.convos.some(function(x){return x.with===id})){db.convos.push({id:"c"+now(),with:id,msgs:[]});save(db)}chatWith=id;route="messages";sheet=null;draw()}
function skins(){return [{id:"classic",name:"Classic blue"},{id:"ocean",name:"Ocean"},{id:"ember",name:"Orange red"},{id:"sunset",name:"Sunset"},{id:"grape",name:"Purple"},{id:"forest",name:"Forest"},{id:"aurora",name:"Aurora"}]}
function applyTheme(){if(!db.settings)db.settings={};var t=db.settings.theme||"dark";var s=db.settings.skin||"classic";document.documentElement.className=(t==="light"?"light ":"")+"skin-"+s;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="light"?"#fafafa":"#000000")}
function toggleTheme(){if(!db.settings)db.settings={};db.settings.theme=db.settings.theme==="light"?"dark":"light";save(db);applyTheme();draw()}
function setSkin(id){if(!db.settings)db.settings={};db.settings.skin=id;save(db);applyTheme();sheet="themes";draw()}
function openThemes(){sheet="themes";draw()}
function shrinkImg(file,cb){var r=new FileReader();r.onload=function(){var img=new Image();img.onload=function(){var c=document.createElement("canvas");var w=img.width,h=img.height,max=640;if(w>max||h>max){var s=max/Math.max(w,h);w=(w*s)|0;h=(h*s)|0}c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);cb(c.toDataURL("image/jpeg",0.72))};img.onerror=function(){cb(r.result)};img.src=r.result};r.readAsDataURL(file)}
function pickPfp(){var f=$("#pfp");if(!f||!f.files||!f.files[0])return;shrinkImg(f.files[0],function(url){me().pic=url;try{save(db)}catch(e){}sheet="edit";draw()})}
function clearPfp(){me().pic="";save(db);sheet="edit";draw()}
