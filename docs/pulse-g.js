(function(){
window.resetNet=function(){alert("Reset network is turned off.")};
window.deleteAllPosts=function(){alert("Delete all posts is turned off.")};
window.clearAllDms=function(){alert("Clear all chats is turned off.")};
window.purgeOld=function(){alert("Bulk delete is turned off.")};
window.tabDev=function(){adminTab="dev";window.lastType=0;if(typeof forceDraw==="function")forceDraw();else draw()};
window.tabServer=function(){window.tabDev()};
window.devStats=function(){
  var ls=0;try{ls=(localStorage.getItem(KEY)||"").length}catch(e){}
  var pix=window.pixCache?Object.keys(window.pixCache).length:0;
  alert("rev "+(db.rev||0)+"\nmembers "+db.users.length+"\nposts "+db.posts.length+"\nchats "+((db.threads&&db.threads.length)||(db.convos&&db.convos.length)||0)+"\nstorage "+ls+"\nphotos cached "+pix+"\nsession "+(db.session||"-"));
};
window.devSession=function(){alert("Logged in as "+((me()&&me().username)||"?")+"\nid "+(db.session||"-"))};
window.devCopyState=function(){
  var raw=JSON.stringify({rev:db.rev,users:(db.users||[]).map(function(u){return u.username}),posts:(db.posts||[]).length,settings:db.settings},null,2);
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(raw).then(function(){alert("Copied debug snapshot.")});
  else prompt("Snapshot",raw);
};
window.devRepair=function(){
  if(typeof normalize==="function")normalize(db);
  if(!db.posts)db.posts=[];if(!db.users)db.users=[];if(!db.follows)db.follows=[];
  db.posts.forEach(function(p){if(!p.likes)p.likes=[];if(!p.comments)p.comments=[];if(!p.saved)p.saved=[]});
  if(typeof recount==="function")recount();
  dirty();alert("Repaired missing fields.");
};
window.devRecount=function(){if(typeof recount==="function")recount();dirty();alert("Follower counts rebuilt.")};
window.devOrphans=function(){
  var missing=db.posts.filter(function(p){return !usr(p.by)}).map(function(p){return p.id});
  alert(missing.length?("Orphan posts: "+missing.join(", ")):"No orphan posts.");
};
window.devSettings=function(){prompt("Settings",JSON.stringify(db.settings||{}))};
window.devBumpRev=function(){db.rev=now();dirty();alert("rev "+db.rev)};
window.devPull=function(){if(typeof syncNow==="function")syncNow();alert("Pull started.")};
window.devPush=function(){if(typeof pushCloud==="function")pushCloud();else if(typeof syncNow==="function")syncNow();alert("Push started.")};
window.devFlags=function(){db.settings.debug=!db.settings.debug;dirty()};
window.devExportUsers=function(){
  var raw=JSON.stringify((db.users||[]).map(function(u){return {id:u.id,username:u.username,display:u.display,ver:u.ver,role:u.role,blocked:u.blocked}}),null,2);
  var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([raw],{type:"application/json"}));a.download="pulse-users.json";a.click();
};
window.devPing=function(){
  fetch("https://litterbox.catbox.moe/resources/internals/api.php",{method:"POST",body:new FormData()}).then(function(r){alert("Photo host "+r.status)}).catch(function(){alert("Photo host did not answer")});
};
function tool(act,title,desc){
  return '<button type="button" class="edit abtn" data-act="'+act+'"><b>'+title+'</b><small class="tool-desc">'+desc+'</small></button>';
}
function tabBtn(act,label,id){
  return '<button type="button" class="pill abtn'+(adminTab===id?" on":"")+'" data-act="'+act+'">'+label+'</button>';
}
function tabsOnly(){
  return '<div class="admin-tabs">'+tabBtn("tabDash","Overview","dash")+tabBtn("tabPeople","Members","people")+tabBtn("tabPosts","Posts","posts")+tabBtn("tabReports","Reports","reports")+tabBtn("tabChats","Chats","chats")+tabBtn("tabDev","Dev","dev")+tabBtn("tabLogs","Audit","logs")+"</div>";
}
function devPanel(){
  return '<p class="muted">Developer tools. These inspect Pulse. They do not wipe the network.</p>'+
    tool("devStats","Show runtime stats","Rev, counts, session and storage size.")+
    tool("devSession","Who is logged in","Shows the current account id.")+
    tool("devCopyState","Copy debug snapshot","Copies a short JSON snapshot.")+
    tool("devRepair","Repair missing fields","Fills empty arrays so the app does not crash.")+
    tool("devRecount","Rebuild follower counts","Counts follows again from the follows list.")+
    tool("devOrphans","Find orphan posts","Lists posts whose author account is gone.")+
    tool("devSettings","Inspect settings","Shows the raw settings object.")+
    tool("devBumpRev","Bump revision","Marks local data as newest for sync.")+
    tool("devPull","Force cloud pull","Downloads the shared Pulse now.")+
    tool("devPush","Force cloud push","Uploads this device now.")+
    tool("devFlags","Toggle debug banner","Shows extra sync text on Home.")+
    tool("devExportUsers","Download user list","Saves usernames and roles as JSON.")+
    tool("devPing","Ping photo host","Checks the photo upload server.")+
    tool("syncPushNow","Sync now","Normal iPhone + Chrome sync.")+
    tool("exportData","Export JSON","Downloads a backup file of this Pulse.");
}
var _av=window.adminView;
window.adminView=function(){
  if(!ownerOk){
    return '<div class="top"><button type="button" onclick="goProfile()">Back</button><h1 class="logo">Owner tools</h1><span></span></div><div class="pad"><p class="muted">Private area. Enter the owner code each visit.</p><input id="oc" class="field" type="password" placeholder="Owner code" autocomplete="off"><div class="err" id="err"></div><button class="pri" id="unlockBtn">Unlock</button></div>';
  }
  if(adminTab==="dev"||adminTab==="server"){
    return '<div class="top"><button type="button" onclick="goProfile()">Back</button><h1 class="logo">Admin</h1><span></span></div><div class="pad">'+tabsOnly()+devPanel()+"</div>";
  }
  var html=_av?_av():"";
  html=html.replace(">Server</button",">Dev</button>");
  html=html.replace('data-act="tabServer"','data-act="tabDev"');
  html=html.replace(/<button[^>]*data-act="resetNet"[\s\S]*?<\/button>/,"");
  html=html.replace(/<button[^>]*data-act="deleteAllPosts"[\s\S]*?<\/button>/,"");
  html=html.replace(/<button[^>]*data-act="clearAllDms"[\s\S]*?<\/button>/,"");
  html=html.replace(/<button[^>]*data-act="purgeOld"[\s\S]*?<\/button>/,"");
  html=html.replace(/<button[^>]*data-act="clearNotes"[\s\S]*?<\/button>/,"");
  return html;
};
})();
