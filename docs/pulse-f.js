(function(){
if(!db.settings)db.settings={};
if(!window.adminUser)window.adminUser=null;
if(!window.adminPost)window.adminPost=null;
if(!window.adminQ)window.adminQ="";
if(!document.getElementById("pulseAdminCss")){
  var st=document.createElement("style");
  st.id="pulseAdminCss";
  st.textContent=".admin-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 12px}.admin-tabs .pill{border:1px solid var(--line);padding:8px 10px;font-weight:700}.admin-tabs .pill.on{border-color:var(--accent);color:var(--accent)}.abtn{text-align:left}.abtn b{display:block}.tool-desc{display:block;font-weight:500;margin-top:3px;color:var(--muted)}.acard{border:1px solid var(--line);border-radius:12px;padding:10px;margin:8px 0;background:var(--card)}";
  document.head.appendChild(st);
}
function tool(act,title,desc,id){
  return '<button type="button" class="edit abtn" data-act="'+act+'"'+(id?(' data-id="'+esc(id)+'"'):'')+'><b>'+title+'</b><small class="tool-desc">'+desc+'</small></button>';
}
function tabBtn(act,label,id){
  return '<button type="button" class="pill abtn'+(adminTab===id?" on":"")+'" data-act="'+act+'">'+label+'</button>';
}
function forceDraw(){window.lastType=0;window.needDraw=false;if(typeof draw==="function")draw()}
window.forceDraw=forceDraw;
window.tabDash=function(){adminTab="dash";window.adminUser=null;window.adminPost=null;forceDraw()};
window.tabPeople=function(){adminTab="people";window.adminPost=null;forceDraw()};
window.tabPosts=function(){adminTab="posts";window.adminUser=null;forceDraw()};
window.tabReports=function(){adminTab="reports";forceDraw()};
window.tabLogs=function(){adminTab="logs";forceDraw()};
window.tabChats=function(){adminTab="chats";forceDraw()};
window.tabServer=function(){adminTab="server";forceDraw()};
window.openMember=function(id){window.adminUser=id;adminTab="people";forceDraw()};
window.closeMember=function(){window.adminUser=null;adminTab="people";forceDraw()};
window.openPost=function(id){window.adminPost=id;adminTab="posts";forceDraw()};
window.closePost=function(){window.adminPost=null;adminTab="posts";forceDraw()};
window.searchMembers=function(){var el=document.getElementById("ms");window.adminQ=el?String(el.value||"").toLowerCase():"";adminTab="people";forceDraw()};
window.warnUser=function(id){var u=usr(id);if(!u)return;u.warned=(u.warned||0)+1;db.notes.unshift({id:now(),text:"Warning for @"+u.username,read:false});logA("warn @"+u.username);dirty()};
window.muteUser=function(id){var u=usr(id);if(!u)return;u.muted=!u.muted;dirty()};
window.freezeUser=function(id){var u=usr(id);if(!u)return;u.frozen=!u.frozen;dirty()};
window.timeoutUser=function(id){var u=usr(id);if(!u)return;var n=prompt("Timeout minutes (0 = clear)","10");if(n===null)return;var m=parseInt(n,10)||0;u.timeoutUntil=m>0?now()+m*60000:0;dirty()};
window.noDmsUser=function(id){var u=usr(id);if(!u)return;u.noDms=!u.noDms;dirty()};
window.hideSearchUser=function(id){var u=usr(id);if(!u)return;u.hideSearch=!u.hideSearch;dirty()};
window.clearCommentsUser=function(id){db.posts.forEach(function(p){p.comments=(p.comments||[]).filter(function(c){return c.by!==id})});dirty()};
window.clearDmsUser=function(id){if(db.threads)db.threads=db.threads.filter(function(t){return String(t.pair||"").indexOf(id)<0});if(db.convos)db.convos=db.convos.filter(function(c){return c.with!==id});dirty()};
window.wipeLikesUser=function(id){db.posts.forEach(function(p){p.likes=(p.likes||[]).filter(function(x){return x!==id});p.saved=(p.saved||[]).filter(function(x){return x!==id})});dirty()};
window.promoteMod=function(id){var u=usr(id);if(!u)return;u.role=u.role==="mod"?"member":"mod";u.staff=u.role==="mod"||u.role==="staff";dirty()};
window.verifyAll=function(){db.users.forEach(function(u){u.ver=true});dirty()};
window.unverifyAll=function(){db.users.forEach(function(u){u.ver=false});dirty()};
window.massUnban=function(){db.users.forEach(function(u){u.blocked=false});dirty()};
window.clearReports=function(){db.reports=[];dirty()};
window.toggleSlow=function(){db.settings.slowMode=!db.settings.slowMode;dirty()};
window.toggleImagesOff=function(){db.settings.imagesOff=!db.settings.imagesOff;dirty()};
window.toggleLockComments=function(){db.settings.lockComments=!db.settings.lockComments;dirty()};
window.toggleDmsOff=function(){db.settings.dmsOff=!db.settings.dmsOff;dirty()};
window.toggleReadOnly=function(){db.settings.readOnly=!db.settings.readOnly;dirty()};
window.announce=function(){var t=prompt("Home announcement",db.settings.banner||"");if(t===null)return;db.settings.banner=t;dirty()};
window.purgeOld=function(){if(!confirm("Delete posts older than 7 days?"))return;var cut=now()-7*86400000;db.posts=db.posts.filter(function(p){return (p.t||0)>cut});dirty()};
window.deleteAllPosts=function(){if(!confirm("Delete EVERY post?"))return;db.posts=[];dirty()};
window.clearAllDms=function(){if(!confirm("Clear every private chat?"))return;db.convos=[];db.threads=[];dirty()};
window.clearNotes=function(){db.notes=[];dirty()};
window.clearAudit=function(){db.audit=[{t:now(),msg:"Audit cleared"}];dirty()};
window.forceLogout=function(){db.settings.kickAll=now();alert("Others must log in again.");dirty()};
window.hideAllReported=function(){(db.reports||[]).forEach(function(r){var p=db.posts.find(function(x){return x.id===r.post});if(p)p.hidden=true});dirty()};
window.setMaxCap=function(){var n=prompt("Max caption length",db.settings.maxCap||220);if(!n)return;db.settings.maxCap=parseInt(n,10)||220;dirty()};
window.syncPushNow=function(){if(typeof syncNow==="function")syncNow();else dirty()};
window.deleteReport=function(id){db.reports=(db.reports||[]).filter(function(r){return r.id!==id&&r.post!==id});dirty()};
function runAdmin(act,id){var fn=window[act];if(!fn)return;window.lastType=0;if(id)fn(id);else fn()}
window.runAdmin=runAdmin;
function memberActions(u){
  return '<div class="acard"><div class="ph" style="padding:0 0 8px">'+av(u)+'<div class="nm">@'+esc(u.username)+badge(u)+'<small>'+esc(u.display)+'</small></div></div>'+
    tool("closeMember","Back to member list","Return to everyone.")+
    tool("verify","Verify","Adds the blue tick next to their name.",u.id)+
    tool("unverify","Unverify","Removes the blue tick.",u.id)+
    tool("warnUser","Warn","Sends a warning note and adds 1 to their warn count.",u.id)+
    tool("timeoutUser","Timeout","Blocks posting and chat for a set number of minutes.",u.id)+
    tool("muteUser",u.muted?"Unmute":"Mute","Stops them posting until you unmute.",u.id)+
    tool("freezeUser",u.frozen?"Unfreeze":"Freeze","Freezes the account so it cannot post or chat.",u.id)+
    tool("shadow",u.shadow?"Unshadow":"Shadowban","Their posts stay hidden from other people.",u.id)+
    tool("ban",u.blocked?"Restore account":"Ban","Permanent ban from this Pulse. They cannot log in.",u.id)+
    tool("staff",u.staff?"Remove staff":"Make staff","Staff can still enter during maintenance.",u.id)+
    tool("promoteMod",u.role==="mod"?"Remove mod":"Make moderator","Marks them as a helper / moderator.",u.id)+
    tool("noDmsUser",u.noDms?"Allow DMs":"Block DMs","Stops this account sending private chats.",u.id)+
    tool("hideSearchUser",u.hideSearch?"Show in search":"Hide from search","Hides them on the Explore people list.",u.id)+
    tool("wipe","Wipe posts","Deletes every post they made.",u.id)+
    tool("clearCommentsUser","Wipe comments","Deletes every comment they wrote.",u.id)+
    tool("clearDmsUser","Wipe their chats","Deletes private chats with this account.",u.id)+
    tool("wipeLikesUser","Clear likes / saves","Removes their likes and saves.",u.id)+
    tool("resetPass","Reset password","Sets their password to pulse123.",u.id)+
    tool("impersonate","Log in as them","Opens Pulse as this account so you can check it.",u.id)+
    tool("kick","Kick / delete account","Removes the account from Pulse forever.",u.id)+
  "</div>";
}
window.adminView=function(){
  if(!ownerOk){
    return '<div class="top"><button type="button" onclick="goProfile()">Back</button><h1 class="logo">Owner tools</h1><span></span></div><div class="pad"><p class="muted">Private area. Enter the owner code each visit.</p><input id="oc" class="field" type="password" placeholder="Owner code" autocomplete="off"><div class="err" id="err"></div><button class="pri" id="unlockBtn">Unlock</button></div>';
  }
  var likes=db.posts.reduce(function(n,p){return n+(p.likes?p.likes.length:0)},0);
  var banned=db.users.filter(function(u){return u.blocked}).length;
  var tabs='<div class="admin-tabs">'+tabBtn("tabDash","Overview","dash")+tabBtn("tabPeople","Members","people")+tabBtn("tabPosts","Posts","posts")+tabBtn("tabReports","Reports","reports")+tabBtn("tabChats","Chats","chats")+tabBtn("tabServer","Server","server")+tabBtn("tabLogs","Audit","logs")+"</div>";
  var dash='<div class="kpi"><div><b>'+db.users.length+'</b><span class="muted">members</span></div><div><b>'+db.posts.length+'</b><span class="muted">posts</span></div><div><b>'+likes+'</b><span class="muted">likes</span></div><div><b>'+banned+'</b><span class="muted">banned</span></div></div><p class="muted">Tap a category above. Every button has a note under it.</p>'+
    tool("official","Official Pulse post","Posts a pinned message as the owner account.")+
    tool("broadcast","Broadcast notice","Sends a note to every member inbox.")+
    tool("announce","Home announcement","Sets the yellow banner at the top of Home.")+
    tool("syncPushNow","Sync now","Pushes bans, posts and chats to iPhone and Chrome.")+
    tool("toggleMaint","Maintenance: "+(db.settings.maintenance?"ON":"off"),"When on, only owner and staff can log in.")+
    tool("toggleReg","Signups: "+(db.settings.regOpen===false?"closed":"open"),"Closed means nobody can create a new account.")+
    tool("toggleInvite","Invite only: "+(db.settings.inviteOnly?"ON":"off"),"Stops random signups if you want a private Pulse.")+
    tool("toggleReadOnly","Read only: "+(db.settings.readOnly?"ON":"off"),"Nobody can post, comment or chat.")+
    tool("toggleSlow","Slow mode: "+(db.settings.slowMode?"ON":"off"),"Reminds members not to spam posts.")+
    tool("toggleImagesOff","Images: "+(db.settings.imagesOff?"blocked":"allowed"),"Turns photo posts off or on.")+
    tool("toggleLockComments","Lock all comments: "+(db.settings.lockComments?"ON":"off"),"Stops new comments on every post.")+
    tool("toggleDmsOff","Private chats: "+(db.settings.dmsOff?"OFF":"on"),"Turns DMs off for the whole server.")+
    tool("setFilter","Word filter","Blocks listed words in posts and comments.")+
    tool("setWelcome","Welcome text","Message new accounts receive after signup.")+
    tool("setMaxCap","Caption limit","Sets how long a post caption can be.")+
    tool("verifyAll","Verify everyone","Adds the blue tick to every account.")+
    tool("unverifyAll","Remove every tick","Takes the blue tick off every account.")+
    tool("massUnban","Unban everyone","Restores every banned account.")+
    tool("exportData","Export JSON","Downloads a backup file of this Pulse.")+
    tool("importData","Import JSON","Replaces this Pulse with a pasted backup.")+
    tool("forceLogout","Force re-login","Makes other devices sign in again.")+
    tool("resetNet","Reset network","Wipes Pulse back to empty starter data. Danger.");
  var people;
  if(window.adminUser&&usr(window.adminUser)) people=memberActions(usr(window.adminUser));
  else{
    var q=window.adminQ||"";
    var list=db.users.filter(function(u){return !q||("@"+u.username+" "+(u.display||"")).toLowerCase().indexOf(q)>=0});
    people='<p class="muted">Tap a member to open tools for that one account.</p><input class="field" id="ms" placeholder="Search members" value="'+esc(q)+'">'+tool("searchMembers","Search","Filter the list by username.")+(list.map(function(u){return tool("openMember","@"+u.username,esc(u.display)+(u.blocked?" · banned":"")+(u.ver?" · verified":"")+" — tap to manage",u.id)}).join("")||'<p class="muted">No members.</p>');
  }
  var postsHtml;
  if(window.adminPost){
    var p=db.posts.find(function(x){return x.id===window.adminPost});
    if(!p) postsHtml=tool("closePost","Back","That post is gone.");
    else{
      var a=usr(p.by)||{username:"gone"};
      postsHtml='<div class="acard"><div class="nm">@'+esc(a.username)+'<small>'+esc(p.text)+'</small></div>'+tool("closePost","Back to post list","Return to every post.")+tool("hideP",p.hidden?"Unhide post":"Hide post","Hides this post from the public feed.",p.id)+tool("pinP",p.pinned?"Unpin":"Pin post","Keeps this post at the top of Home.",p.id)+tool("featP",p.featured?"Unfeature":"Feature post","Marks the post as featured.",p.id)+tool("lockP",p.locked?"Unlock comments":"Lock comments","Stops new comments on this post.",p.id)+tool("delP","Delete post","Removes this post for everyone.",p.id)+"</div>";
    }
  }else{
    postsHtml='<p class="muted">Tap a post to manage it.</p>'+(db.posts.map(function(p){var a=usr(p.by)||{username:"gone"};return tool("openPost","@"+a.username,esc((p.text||"").slice(0,80))+(p.hidden?" · hidden":"")+" — tap to manage",p.id)}).join("")||'<p class="muted">No posts.</p>');
  }
  var reports=(db.reports&&db.reports.length)?db.reports.map(function(r){return '<div class="acard"><div class="nm">'+esc(r.post)+'<small>by '+(usr(r.by)||{username:"?"}).username+'</small></div>'+tool("delP","Delete reported post","Removes the reported post.",r.post)+tool("deleteReport","Dismiss report","Clears this report.",r.id||r.post)+"</div>"}).join("")+tool("hideAllReported","Hide all reported","Hides every post that was reported.")+tool("clearReports","Clear report list","Empties the report queue."):'<p class="muted">No reports.</p>';
  var logs='<p class="muted">Owner history.</p>'+((db.audit||[]).map(function(a){return '<div class="muted">'+ago(a.t)+" · "+esc(a.msg)+"</div>"}).join("")||'<p class="muted">Empty.</p>')+tool("clearAudit","Clear audit log","Deletes owner history notes.");
  var chats='<p class="muted">Private chat tools.</p>'+tool("clearAllDms","Clear every DM","Deletes all private chats for everyone.")+tool("toggleDmsOff","Private chats: "+(db.settings.dmsOff?"OFF":"on"),"Turns DMs off or on.");
  var server='<p class="muted">Danger zone.</p>'+tool("purgeOld","Purge posts older than 7 days","Deletes old posts to shrink the database.")+tool("deleteAllPosts","Delete every post","Wipes the whole feed. Cannot undo.")+tool("clearNotes","Clear activity inbox","Empties the Activity page.")+tool("resetNet","Reset whole Pulse","Erases members and posts. Danger.");
  var body=adminTab==="people"?people:adminTab==="posts"?postsHtml:adminTab==="reports"?reports:adminTab==="logs"?logs:adminTab==="chats"?chats:adminTab==="server"?server:dash;
  return '<div class="top"><button type="button" onclick="goProfile()">Back</button><h1 class="logo">Admin</h1><span></span></div><div class="pad">'+tabs+body+"</div>";
};
if(!window.pulseAdminTap){
  window.pulseAdminTap=true;
  document.addEventListener("click",function(e){
    if(typeof route==="undefined"||route!=="admin")return;
    var b=e.target&&e.target.closest&&e.target.closest(".abtn");
    if(!b)return;
    var act=b.getAttribute("data-act");
    if(!act)return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    window.lastType=0;
    runAdmin(act,b.getAttribute("data-id"));
  },true);
}
var _bind=window.bindUi;
window.bindUi=function(){
  if(_bind)_bind();
  var u=document.getElementById("unlockBtn");
  if(u)u.onclick=function(ev){if(ev)ev.preventDefault();window.lastType=0;unlock()};
  var oc=document.getElementById("oc");
  if(oc)oc.onkeydown=function(e){if(e.key==="Enter"){window.lastType=0;unlock()}};
  var ms=document.getElementById("ms");
  if(ms)ms.onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();searchMembers()}};
};
})();
