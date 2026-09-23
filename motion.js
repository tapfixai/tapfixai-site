/* TapFix — motion: hero phone straightens on scroll, sticky scroll story, reveals, nav hide. */
(function(){
  var d=document, root=d.documentElement;
  root.classList.add("js");
  var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- mobile menu button
  var nv=d.querySelector(".nav"), nr=d.querySelector(".navright");
  if(nv && nr && nv.querySelector(".links")){
    var b=d.createElement("button"); b.className="menu-btn"; b.type="button"; b.setAttribute("aria-label","Menu"); b.setAttribute("aria-expanded","false");
    b.innerHTML='<svg class="bars" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h16M4 16h16"/></svg><svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    nr.appendChild(b);
    b.addEventListener("click",function(){var o=nv.classList.toggle("open");b.setAttribute("aria-expanded",o);});
    nv.querySelectorAll(".links a").forEach(function(a){a.addEventListener("click",function(){nv.classList.remove("open");});});
    d.addEventListener("click",function(e){if(!nv.contains(e.target))nv.classList.remove("open");});
  }

  // --- scroll story (desktop): one sticky phone, screens change per step
  var sc=d.querySelector("#screens .wrap"), feats=sc?[].slice.call(sc.querySelectorAll(".feature")):[];
  if(sc && feats.length && matchMedia("(min-width: 961px)").matches){
    var grid=d.createElement("div"); grid.className="story-grid";
    var stage=d.createElement("div"); stage.className="story-stage";
    stage.innerHTML='<div class="phone"><div class="screen"></div></div>';
    var scr=stage.querySelector(".screen"), steps=d.createElement("div");
    feats.forEach(function(f,i){
      var img=f.querySelector(".media img");
      if(img){var c=img.cloneNode(); c.loading="eager"; c.removeAttribute("id"); if(i===0)c.classList.add("on"); scr.appendChild(c);}
      steps.appendChild(f);
    });
    grid.appendChild(stage); grid.appendChild(steps); sc.appendChild(grid);
    sc.parentElement.classList.add("story");
    feats[0].classList.add("on");
    var imgs=scr.querySelectorAll("img");
    var so=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting) return;
      var i=feats.indexOf(e.target);
      feats.forEach(function(f,j){f.classList.toggle("on",j===i);});
      [].forEach.call(imgs,function(im,j){im.classList.toggle("on",j===i);});
    });},{rootMargin:"-45% 0px -45% 0px"});
    feats.forEach(function(f){so.observe(f);});
  }

  // --- reveals
  d.querySelectorAll(".section-head,.card,#screens:not(.story) .feature .media,#screens:not(.story) .feature .ftext,.panel,details.data").forEach(function(el){
    el.classList.add("reveal");
    if(el.classList.contains("card")) el.style.setProperty("--d",([].indexOf.call(el.parentElement.children,el)%3)*0.08+"s");
  });
  if(reduce||!("IntersectionObserver" in window)){
    d.querySelectorAll(".reveal").forEach(function(el){el.classList.add("in");});
  } else {
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}
    });},{rootMargin:"0px 0px -8% 0px",threshold:.1});
    d.querySelectorAll(".reveal").forEach(function(el){io.observe(el);});
  }

  // --- hero phone tilts flat + grows as you scroll; nav hides on scroll down
  var ph=d.querySelector(".hero-phone .phone"), nav=d.querySelector(".nav"), last=0, tick=false;
  function frame(){
    var y=scrollY;
    if(ph && !reduce){
      var p=Math.min(1,Math.max(0,y/(innerHeight*0.6)));
      ph.style.setProperty("--tilt",(16*(1-p)).toFixed(2)+"deg");
      ph.style.setProperty("--sc",(0.92+0.08*p).toFixed(3));
    }
    if(nav && !nav.classList.contains("open")) nav.style.transform=(y>last && y>300)?"translateY(-140%)":"none";
    last=y; tick=false;
  }
  addEventListener("scroll",function(){if(!tick){tick=true;requestAnimationFrame(frame);}},{passive:true});
  frame();
})();
