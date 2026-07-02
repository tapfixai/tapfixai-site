// TapFix i18n — per-language URLs (/xx/), auto-detect (CIS -> ru), manual switcher.
// Pre-rendered localized pages inject: TF_STATIC=true, TF_LANG, TF_PAGE, TF_AVAIL.
window.TF_LANGS = [
  {c:"en", n:"English"},
  {c:"es", n:"Español"},
  {c:"pt", n:"Português"},
  {c:"fr", n:"Français"},
  {c:"de", n:"Deutsch"},
  {c:"it", n:"Italiano"},
  {c:"nl", n:"Nederlands"},
  {c:"pl", n:"Polski"},
  {c:"uk", n:"Українська"},
  {c:"ru", n:"Русский"},
  {c:"tr", n:"Türkçe"},
  {c:"id", n:"Indonesia"},
  {c:"vi", n:"Tiếng Việt"},
  {c:"th", n:"ไทย"},
  {c:"zh", n:"中文"},
  {c:"ja", n:"日本語"},
  {c:"ko", n:"한국어"},
  {c:"hi", n:"हिन्दी"},
  {c:"ar", n:"العربية", rtl:true},
  {c:"fa", n:"فارسی", rtl:true}
];

(function(){
  var LANGS = window.TF_LANGS;
  var AVAIL = window.TF_AVAIL || ["en"];          // langs that have THIS page as a static URL
  var PAGE  = window.TF_PAGE  || "index.html";    // current page file
  var CUR   = window.TF_LANG  || "en";            // language of THIS page
  var STATIC= !!window.TF_STATIC;                 // true on pre-rendered pages
  var DATA  = {};

  function meta(l){ for(var i=0;i<LANGS.length;i++) if(LANGS[i].c===l) return LANGS[i]; return {c:l,n:l}; }
  function isRTL(l){ return !!meta(l).rtl; }
  function has(l){ return AVAIL.indexOf(l) !== -1; }
  function choices(){
    if(!STATIC) return LANGS;
    var out = [];
    for(var i=0;i<LANGS.length;i++) if(has(LANGS[i].c)) out.push(LANGS[i]);
    return out.length ? out : LANGS;
  }

  // browser/OS language -> one of our codes; CIS locales -> Russian
  function detect(){
    var navs = navigator.languages || [navigator.language || "en"];
    var cis = {ru:1,uk:1,be:1,kk:1,ky:1,tg:1,uz:1,hy:1,az:1,mo:1,tk:1};
    for(var i=0;i<navs.length;i++){
      var two=(navs[i]||"").slice(0,2).toLowerCase();
      if(cis[two]) return (two==="uk" && has("uk")) ? "uk" : "ru";
      for(var j=0;j<LANGS.length;j++) if(LANGS[j].c===two) return two;
    }
    return "en";
  }

  function urlFor(lang){
    var base = PAGE.replace(/\.html$/,"").replace(/^index$/,"");   // "" for home, "mac" for /mac
    return (lang==="en") ? ("/"+base) : ("/"+lang+"/"+base);
  }

  // client-side swap (only for languages that don't have a static page yet)
  function applySwap(lang){
    document.documentElement.lang=lang; document.documentElement.dir=isRTL(lang)?"rtl":"ltr";
    var dict=(lang==="en")?null:(DATA[lang]||{});
    document.querySelectorAll("[data-i18n]").forEach(function(el){
      if(el.dataset.en==null) el.dataset.en=el.innerHTML;
      var v=dict?dict[el.getAttribute("data-i18n")]:el.dataset.en;
      el.innerHTML=(v!=null&&v!=="")?v:el.dataset.en;
    });
    var il=(lang==="ru")?"ru":"en";
    document.querySelectorAll("img[data-base]").forEach(function(im){im.src="/images/"+im.dataset.base+"-"+il+".jpg";});
    document.querySelectorAll("img[data-pngbase]").forEach(function(im){im.src="/images/"+im.dataset.pngbase+"-"+il+".png?v=7";});
    var sel=document.getElementById("lang"); if(sel) sel.value=lang;
  }

  function go(lang){
    try{ localStorage.setItem("tapfix_lang", lang); }catch(e){}
    if(lang===CUR) return;
    if(has(lang)){ location.href=urlFor(lang); return; }            // navigate to localized URL
    if(STATIC) return;                                              // avoid partial swaps on pre-rendered pages
    if(Object.keys(DATA).length){ applySwap(lang); }                // fallback: swap in place
    else fetch((window.TF_I18N||"/i18n.json")+"?v=3").then(function(r){return r.json();}).then(function(j){DATA=j;applySwap(lang);}).catch(function(){});
  }

  function init(){
    var sel=document.getElementById("lang");
    if(sel){ sel.innerHTML=""; choices().forEach(function(o){var op=document.createElement("option");op.value=o.c;op.textContent=o.n;sel.appendChild(op);}); sel.value=CUR; sel.addEventListener("change",function(){go(this.value);}); }
    document.documentElement.dir=isRTL(CUR)?"rtl":"ltr";

    // first-visit/saved-language auto-detect for pre-rendered English pages
    if(STATIC && CUR==="en"){
      var saved=null; try{saved=localStorage.getItem("tapfix_lang");}catch(e){}
      var want=saved||detect();
      if(want!=="en" && has(want)){ location.replace(urlFor(want)); return; }
    }

    // non-pre-rendered pages keep the legacy in-place behaviour
    if(!STATIC){
      var s2=null; try{s2=localStorage.getItem("tapfix_lang");}catch(e){}
      var lang=s2||"en";
      applySwap(lang);
      if(lang!=="en") fetch((window.TF_I18N||"/i18n.json")+"?v=3").then(function(r){return r.json();}).then(function(j){DATA=j;applySwap(lang);}).catch(function(){});
      if(sel) sel.value=lang;
    }
  }
  if(document.readyState!=="loading") init(); else document.addEventListener("DOMContentLoaded",init);
})();
