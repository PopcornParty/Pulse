(function(){
if(typeof homeView==="function"){
  var h=homeView;
  homeView=function(){return (typeof syncBanner==="function"?syncBanner():"")+h()};
}
if(typeof createView==="function"){
  var c=createView;
  createView=function(){return c().replace("Log into another account on this phone to check.","Safari on iPhone and Chrome share this post. Open the other browser after you share.")};
}
if(typeof overlay==="function"){
  var o=overlay;
  overlay=function(){
    var html=o();
    if(sheet==="menu" && html.indexOf("Sync now")<0){
      html=html.replace(">Owner tools</button>",">Owner tools</button><button class=\"sheetbtn\" onclick=\"syncNow();sheet=null;draw()\">Sync now (iPhone + Chrome)</button>");
    }
    return html;
  };
}
if(typeof authView==="function"){
  var a=authView;
  authView=function(){
    var html=a();
    if(html.indexOf("share the same Pulse")>=0)return html;
    return html.replace("<p>Welcome back</p>","<p>Welcome back</p><p class=\"muted\">iPhone Safari and Chrome share the same Pulse. Use the same username on both.</p>").replace("<p>Create your account</p>","<p>Create your account</p><p class=\"muted\">This account will work in Safari and Chrome.</p>");
  };
}
if(typeof draw==="function")try{draw()}catch(e){}
})();
