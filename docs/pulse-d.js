(function(){
if(typeof homeView==="function"){
  var h=homeView;
  homeView=function(){return (typeof syncBanner==="function"?syncBanner():"")+h()};
}
if(typeof authView==="function"){
  var a=authView;
  authView=function(){
    var html=a();
    if(html.indexOf("auto-sync")<0){
      html=html.replace("<p>Welcome back</p>","<p>Welcome back</p><p class=\"muted\">Every account auto-syncs. Your friend only needs Chrome and this same link.</p>");
      html=html.replace("<p>Create your account</p>","<p>Create your account</p><p class=\"muted\">This account is shared with every phone on Pulse.</p>");
    }
    return html;
  };
}
if(typeof overlay==="function"){
  var o=overlay;
  overlay=function(){
    var html=o();
    if(typeof sheet!=="undefined"&&sheet==="menu"&&html.indexOf("Sync now")<0){
      html=html.replace("Owner tools</button>","Owner tools</button><button class=\"sheetbtn\" onclick=\"syncNow();sheet=null;draw()\">Sync now (iPhone + Chrome)</button>");
    }
    return html;
  };
}
if(typeof draw==="function")try{if(!(document.activeElement&&(document.activeElement.tagName==="INPUT"||document.activeElement.tagName==="TEXTAREA")))draw()}catch(e){}
})();
