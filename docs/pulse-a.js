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
function seed(){function U(id,username,display,h,bio,ver){return {id:id,username:username,display:display,pass:"pulse123",bio:bio,h:h,ver:!!ver,followers:80+h,following:40,blocked:false,staff:false,shadow:false,role:"member"}}var users=[U("you","you","Jordan Hale",18,"Sunsets and trails."),U("nova","nova","Nova Chen",262,"Night sky diaries.",1),U("milo","milo","Milo Park",32,"Bread and broth.",1),U("rio","rio","Rio Alvarez",198,"Tiny games.",1),U("iris","iris","Iris Holm",280,"Type and paper.",1),U("sage","sage","Sage Okonkwo",148,"Quiet miles.")];function P(id,by,text,seedName,hours,likes){return {id:id,by:by,text:text,img:pic(seedName),t:now()-hours*3600000,likes:likes.slice(),comments:[{by:"you",text:"This is beautiful."}],saved:[],hidden:false,pinned:false,featured:false,locked:false,views:40+hours}}return {users:users,follows:[["you","nova"],["you","milo"],["you","iris"],["nova","you"]],posts:[P("p1","nova","Perseids over the ridge.","stars1",2,["you","iris"]),P("p2","milo","Sunday loaf.","bread1",5,["you"]),P("p3","iris","Harbor Grotesk specimen.","type1",9,["you"]),P("p4","sage","Fog was the view.","trail1",14,["you"]),P("p5","rio","Lighthouse tileset.","pixel1",20,["you"])],stories:users.map(function(u){return {id:"s"+u.id,by:u.id,img:"https://picsum.photos/seed/st"+u.id+"/720/1280",seen:false}}),convos:[{id:"c1",with:"nova",msgs:[{by:"nova",text:"Did you catch the north sky?"},{by:"you",text:"Two meteors."}]}],notes:[{id:1,text:"nova liked your post",read:false}],reports:[],audit:[{t:now(),msg:"Network created"}],settings:{banner:"",maintenance:false,regOpen:true,inviteOnly:false,wordFilter:"",welcome:"Welcome to Pulse"},session:null,owner:false}}
function load(){try{var x=JSON.parse(localStorage.getItem(KEY));if(x&&x.users){if(!x.settings)x.settings={banner:"",maintenance:false,regOpen:true,inviteOnly:false,wordFilter:"",welcome:"Welcome to Pulse"};if(!x.audit)x.audit=[];if(!x.reports)x.reports=[];return x}}catch(e){}var d=seed();save(d);return d}
function save(d){localStorage.setItem(KEY,JSON.stringify(d))}
var db=load(),route="home",authPage="login",sheet=null,openStory=null,commentId=null,viewUser=null,adminTab="dash";
function me(){return db.users.find(function(u){return u.id===db.session})}
function usr(id){return db.users.find(function(u){return u.id===id})}
function go(r){route=r;sheet=null;openStory=null;commentId=null;if(r!=="profile")viewUser=null;draw()}
function av(u,sz){sz=sz||36;return '<div class="av" style="width:'+sz+'px;height:'+sz+'px;background:'+col(u.h)+'">'+(u.display||u.username||"?")[0].toUpperCase()+'</div>'}
function following(id){return db.follows.some(function(f){return f[0]===me().id&&f[1]===id})}
function openProfile(id){viewUser=id;route="profile";sheet=null;draw()}
function dirty(){save(db);draw()}
function showLogin(){authPage="login";draw()}
function showSignup(){authPage="signup";draw()}
function setSheet(v){sheet=v;draw()}
function setAdmin(v){adminTab=v;draw()}
function logout(){db.session=null;save(db);authPage="login";draw()}
function saveProfile(){var n=$("#dn");var b=$("#bio");if(!n)return;me().display=(n.value||"").trim()||me().username;me().bio=b?b.value:me().bio;save(db);sheet=null;draw()}
function setBanner(){var t=prompt("Site banner",db.settings.banner||"");if(t!==null){db.settings.banner=t;dirty()}}
function setFilter(){var t=prompt("Blocked words, comma separated",db.settings.wordFilter||"");if(t!==null){db.settings.wordFilter=t;dirty()}}
function setWelcome(){var t=prompt("Welcome text",db.settings.welcome);if(t){db.settings.welcome=t;dirty()}}
function resetNet(){if(confirm("Reset whole network on this phone?")){localStorage.removeItem(KEY);db=load();db.owner=true;dirty()}}
function toggleMaint(){db.settings.maintenance=!db.settings.maintenance;dirty()}
function toggleReg(){db.settings.regOpen=!db.settings.regOpen;dirty()}
function toggleInvite(){db.settings.inviteOnly=!db.settings.inviteOnly;dirty()}
function goNotes(){go("notes")}
function goHome(){go("home")}
function goSearch(){go("search")}
function goProfile(){go("profile")}
function goAdmin(){go("admin")}
function setMenu(){setSheet("menu")}
function setEdit(){setSheet("edit")}
function tabDash(){setAdmin("dash")}
function tabPeople(){setAdmin("people")}
function tabPosts(){setAdmin("posts")}
function tabReports(){setAdmin("reports")}
function tabLogs(){setAdmin("logs")}
