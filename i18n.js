// TapFix site i18n — 20 languages, English is the in-page source, others load from i18n.json
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
  var DATA = {};
  function isRTL(l){ for(var i=0;i<window.TF_LANGS.length;i++){ if(window.TF_LANGS[i].c===l) return !!window.TF_LANGS[i].rtl; } return false; }

  function apply(lang){
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL(lang) ? "rtl" : "ltr";
    var dict = (lang === "en") ? null : (DATA[lang] || {});
    document.querySelectorAll("[data-i18n]").forEach(function(el){
      if(el.dataset.en == null){ el.dataset.en = el.innerHTML; }
      var v = dict ? dict[el.getAttribute("data-i18n")] : el.dataset.en;
      el.innerHTML = (v != null && v !== "") ? v : el.dataset.en; // fall back to English
    });
    // screenshots: only English and Russian variants exist; everything else uses English shots
    var imgLang = (lang === "ru") ? "ru" : "en";
    document.querySelectorAll("img[data-base]").forEach(function(img){
      img.src = "images/" + img.dataset.base + "-" + imgLang + ".jpg";
    });
    document.querySelectorAll("img[data-pngbase]").forEach(function(img){
      img.src = "images/" + img.dataset.pngbase + "-" + imgLang + ".png?v=7";
    });
    var sel = document.getElementById("lang");
    if(sel) sel.value = lang;
  }

  function init(){
    var sel = document.getElementById("lang");
    if(sel){
      sel.innerHTML = "";
      window.TF_LANGS.forEach(function(o){
        var op = document.createElement("option");
        op.value = o.c; op.textContent = o.n;
        sel.appendChild(op);
      });
    }
    document.querySelectorAll("[data-i18n]").forEach(function(el){ if(el.dataset.en==null) el.dataset.en = el.innerHTML; });
    var saved = null; try { saved = localStorage.getItem("tapfix_lang"); } catch(e){}
    var lang = saved || "en";
    apply(lang); // immediate (EN correct; others briefly fall back to EN until data loads)
    fetch((window.TF_I18N || "i18n.json") + "?v=2").then(function(r){ return r.json(); }).then(function(j){ DATA = j; apply(lang); }).catch(function(){});
    if(sel) sel.addEventListener("change", function(){
      apply(this.value);
      try { localStorage.setItem("tapfix_lang", this.value); } catch(e){}
    });
  }

  if(document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
