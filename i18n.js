// TapFix i18n — per-language URLs (/xx/), auto-detect (CIS -> ru), manual switcher.
// Pre-rendered localized pages inject: TF_STATIC=true, TF_LANG, TF_PAGE, TF_AVAIL.
window.TF_LANGS = [
  {c:"en", n:"English"}, {c:"en-gb", n:"English (UK)"}, {c:"en-au", n:"English (Australia)"}, {c:"en-ca", n:"English (Canada)"},
  {c:"es", n:"Español"}, {c:"es-mx", n:"Español (México)"},
  {c:"pt", n:"Português"}, {c:"pt-pt", n:"Português (Portugal)"},
  {c:"fr", n:"Français"}, {c:"fr-ca", n:"Français (Canada)"},
  {c:"de", n:"Deutsch"}, {c:"it", n:"Italiano"}, {c:"nl", n:"Nederlands"}, {c:"pl", n:"Polski"},
  {c:"uk", n:"Українська"}, {c:"ru", n:"Русский"}, {c:"tr", n:"Türkçe"},
  {c:"id", n:"Bahasa Indonesia"}, {c:"vi", n:"Tiếng Việt"}, {c:"th", n:"ไทย"},
  {c:"zh", n:"简体中文"}, {c:"zh-hant", n:"繁體中文"}, {c:"ja", n:"日本語"}, {c:"ko", n:"한국어"},
  {c:"hi", n:"हिन्दी"}, {c:"ar", n:"العربية", rtl:true}, {c:"fa", n:"فارسی", rtl:true},
  {c:"bn", n:"বাংলা"}, {c:"ca", n:"Català"}, {c:"hr", n:"Hrvatski"}, {c:"cs", n:"Čeština"},
  {c:"da", n:"Dansk"}, {c:"fi", n:"Suomi"}, {c:"el", n:"Ελληνικά"}, {c:"gu", n:"ગુજરાતી"},
  {c:"he", n:"עברית", rtl:true}, {c:"hu", n:"Magyar"}, {c:"kn", n:"ಕನ್ನಡ"}, {c:"ms", n:"Bahasa Melayu"},
  {c:"ml", n:"മലയാളം"}, {c:"mr", n:"मराठी"}, {c:"no", n:"Norsk"}, {c:"or", n:"ଓଡ଼ିଆ"},
  {c:"pa", n:"ਪੰਜਾਬੀ"}, {c:"ro", n:"Română"}, {c:"sk", n:"Slovenčina"}, {c:"sl", n:"Slovenščina"},
  {c:"sv", n:"Svenska"}, {c:"ta", n:"தமிழ்"}, {c:"te", n:"తెలుగు"}, {c:"ur", n:"اردو", rtl:true}
];

(function(){
  var LANGS = window.TF_LANGS;
  var AVAIL = window.TF_AVAIL || ["en"];          // langs that have THIS page as a static URL
  var PAGE  = window.TF_PAGE  || "index.html";    // current page file
  var CUR   = window.TF_LANG  || "en";            // language of THIS page
  var STATIC= !!window.TF_STATIC;                 // true on pre-rendered pages
  var PARAMS= new URLSearchParams(window.location.search || "");
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

  function keepUrlState(url){
    return url + (window.location.search || "") + (window.location.hash || "");
  }

  function shouldStayOnCurrentUrl(){
    return (PARAMS.get("source") === "mac_app" && !!PARAMS.get("price_id")) || PARAMS.has("checkout");
  }

  function urlFor(lang, keepState){
    var base = PAGE.replace(/\.html$/,"").replace(/^index$/,"");   // "" for home, "mac" for /mac
    var url = (lang==="en") ? ("/"+base) : ("/"+lang+"/"+base);
    return keepState ? keepUrlState(url) : url;
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
    if(has(lang)){ location.href=urlFor(lang, true); return; }      // navigate to localized URL, keep query/hash
    if(STATIC) return;                                              // avoid partial swaps on pre-rendered pages
    if(Object.keys(DATA).length){ applySwap(lang); }                // fallback: swap in place
    else fetch((window.TF_I18N||"/i18n.json")+"?v=3").then(function(r){return r.json();}).then(function(j){DATA=j;applySwap(lang);}).catch(function(){});
  }

  function init(){
    var sel=document.getElementById("lang");
    if(sel){ sel.innerHTML=""; choices().forEach(function(o){var op=document.createElement("option");op.value=o.c;op.textContent=o.n;sel.appendChild(op);}); sel.value=CUR; sel.addEventListener("change",function(){go(this.value);}); }
    document.documentElement.dir=isRTL(CUR)?"rtl":"ltr";

    // first-visit/saved-language auto-detect for pre-rendered English pages
    if(STATIC && CUR==="en" && !shouldStayOnCurrentUrl()){
      var saved=null; try{saved=localStorage.getItem("tapfix_lang");}catch(e){}
      var want=saved||detect();
      if(want!=="en" && has(want)){ location.replace(urlFor(want, true)); return; }
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
