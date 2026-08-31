(function(){
if(!document.getElementById("pulseCrownCss")){
  var st=document.createElement("style");
  st.id="pulseCrownCss";
  st.textContent=".cbadge{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;margin-left:4px;border-radius:50%;background:linear-gradient(135deg,#ffe082,#f5a623);box-shadow:0 0 0 1px #c98900;font-size:10px;line-height:1;vertical-align:middle}";
  document.head.appendChild(st);
}
window.badge=function(u){
  var s="";
  if(u&&u.crown)s+='<span class="cbadge" title="Owner">\uD83D\uDC51</span>';
  if(u&&u.ver)s+='<span class="vbadge" title="Verified">\u2713</span>';
  return s;
};
window.grantCrown=function(id){
  var u=typeof usr==="function"?usr(id):null;
  if(!u)return;
  u.crown=true;
  if(typeof logA==="function")logA("owner crown @"+u.username);
  if(typeof dirty==="function")dirty();
};
window.revokeCrown=function(id){
  var u=typeof usr==="function"?usr(id):null;
  if(!u)return;
  u.crown=false;
  if(typeof logA==="function")logA("remove crown @"+u.username);
  if(typeof dirty==="function")dirty();
};
var _mu=typeof mergeUsers==="function"?mergeUsers:null;
if(_mu){
  window.mergeUsers=function(a,b){
    var out=_mu(a,b)||[];
    var last={};
    (a||[]).concat(b||[]).forEach(function(u){if(u&&u.id)last[u.id]=u});
    out.forEach(function(u){
      var s=last[u.id];
      if(!s)return;
      if(Object.prototype.hasOwnProperty.call(s,"crown"))u.crown=!!s.crown;
      else u.crown=!!(u.crown||s.crown);
    });
    return out;
  };
  try{mergeUsers=window.mergeUsers}catch(e){}
}
function crownButtons(u){
  return '<button type="button" class="edit abtn" data-act="grantCrown" data-id="'+esc(u.id)+'"><b>'+(u.crown?"Owner crown on":"Give owner crown")+'</b><small class="tool-desc">Gold crown next to their name. Separate from the blue tick.</small></button>'+
    '<button type="button" class="edit abtn" data-act="revokeCrown" data-id="'+esc(u.id)+'"><b>Remove owner crown</b><small class="tool-desc">Takes the crown off. The blue tick is not changed.</small></button>';
}
var prev=window.adminView;
window.adminView=function(){
  var html=prev?prev():"";
  if(!ownerOk)return html;
  var u=window.adminUser&&typeof usr==="function"?usr(window.adminUser):null;
  if(!u)return html;
  if(html.indexOf('data-act="grantCrown"')>=0)return html;
  if(html.indexOf('data-act="unverify"')<0)return html;
  return html.replace(/(<button[^>]*data-act="unverify"[\s\S]*?<\/button>)/,"$1"+crownButtons(u));
};
})();
