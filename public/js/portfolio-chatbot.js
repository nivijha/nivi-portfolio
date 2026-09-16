(() => {
  const KB_URL = "/data/portfolio-kb.json";
  let kb = null;
  const els = {};
  const quickChips = ["hard skills","soft skills","projects","hobbies","contact"];
  function q(id){return document.getElementById(id)}
  function normalize(s){return s.toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim()}
  function tokens(s){return normalize(s).split(" ").filter(Boolean)}
  function scoreDoc(qt, dt){ let sc=0; for(const t of qt){ if(dt.includes(t)) sc+=2; else if(dt.some(d=>d.startsWith(t)||t.startsWith(d))) sc+=1; } return sc; }
  function link(href,label){return `<a href="${href}" target="_self">${label}</a>`}
  function saveState(){ try{ sessionStorage.setItem("nivi-cb-open", els.panel.hidden ? "0" : "1"); sessionStorage.setItem("nivi-cb-history", els.body.innerHTML); }catch(e){} }
  function restoreState(){ try{ const h=sessionStorage.getItem("nivi-cb-history"); if(h){ els.body.innerHTML=h; els.body.scrollTop=els.body.scrollHeight; return true; } }catch(e){} return false; }
  function renderBot(html){
    const b=els.body; const w=document.createElement("div"); w.className="nivi-cb-msg bot"; w.innerHTML=html; b.appendChild(w); b.scrollTop=b.scrollHeight; saveState();
    w.querySelectorAll("a[href^='/']").forEach(a=>{
      a.addEventListener("click",async e=>{
        const href=a.getAttribute("href"); if(href===window.location.pathname) return; if(a.getAttribute("target")==="_blank") return;
        e.preventDefault(); saveState(); sessionStorage.setItem("nivi-cb-open","1");
        try{
          const res=await fetch(href,{credentials:"same-origin"}); const text=await res.text();
          const doc=new DOMParser().parseFromString(text,"text/html"); const nm=doc.querySelector("main"); const cm=document.querySelector("main");
          if(nm&&cm) cm.innerHTML=nm.innerHTML; if(window.runPageInit) window.runPageInit();
          window.history.pushState({}, "", href);
          document.querySelectorAll(".nav-links a").forEach(l=>{ const p=new URL(l.href).pathname; if(p===href){ l.classList.add("active"); l.setAttribute("aria-current","page"); } else { l.classList.remove("active"); l.removeAttribute("aria-current"); } });
          saveState();
        }catch(err){ window.location.href=href; }
      });
    });
  }
  function renderUser(t){ const d=document.createElement("div"); d.className="nivi-cb-msg user"; d.textContent=t; els.body.appendChild(d); els.body.scrollTop=els.body.scrollHeight; saveState(); }
  function renderChips(list){ const r=document.createElement("div"); r.className="nivi-cb-chips"; list.forEach(t=>{ const b=document.createElement("button"); b.className="nivi-cb-chip"; b.textContent=t; b.addEventListener("click",()=>handleQuery(t)); r.appendChild(b); }); els.body.appendChild(r); els.body.scrollTop=els.body.scrollHeight; saveState(); }
  function typing(on){ let t=q("nivi-cb-typing"); if(on){ if(t) return; t=document.createElement("div"); t.id="nivi-cb-typing"; t.className="nivi-cb-typing"; t.innerHTML='<i></i><i></i><i></i> purr…'; els.body.appendChild(t); els.body.scrollTop=els.body.scrollHeight; } else { if(t) t.remove(); } }
  function buildDocs(){
    const docs=[]; const hs=kb.hardSkills;
    docs.push({id:"hard",text:`hard skills ${hs.programming.join(" ")} ${hs.webBackend.join(" ")} ${hs.databases.join(" ")} ${hs.systemsTools.join(" ")} ${hs.mlAi.join(" ")} ${hs.cloud.join(" ")} ${hs.coreStack.join(" ")}`,kind:"hard"});
    docs.push({id:"soft",text:kb.softSkills.map(s=>s.name+" "+s.evidence).join(" "),kind:"soft"});
    kb.projects.forEach((p,i)=>docs.push({id:"proj"+i,text:`project ${p.name} ${p.impact} ${p.stack.join(" ")} ${p.overview}`,kind:"proj",idx:i}));
    kb.education.forEach((e,i)=>docs.push({id:"edu"+i,text:`education ${e.degree} ${e.school} ${e.location||""} ${e.duration||e.year||""} ${e.score||""} ${(e.coursework||[]).join(" ")}`,kind:"edu",idx:i}));
    kb.experience.forEach((e,i)=>docs.push({id:"exp"+i,text:`experience ${e.role} ${e.org} ${e.duration} ${e.bullets.join(" ")}`,kind:"exp",idx:i}));
    kb.community.forEach((c,i)=>docs.push({id:"com"+i,text:`community ${c.title} ${c.org} ${c.kicker} ${c.detail}`,kind:"com",idx:i}));
    docs.push({id:"hobby",text:`hobbies ${kb.hobbies.polaroids.join(" ")} ${kb.hobbies.photographer||""} ${kb.hobbies.music||""} ${kb.hobbies.facts.join(" ")}`,kind:"hobby"});
    docs.push({id:"contact",text:`contact ${kb.contact.email} ${kb.contact.github} ${kb.contact.linkedin} ${kb.availability}`,kind:"contact"});
    docs.push({id:"about",text:`about ${kb.profile.name} ${kb.profile.title} ${kb.profile.bio} ${kb.profile.tagline}`,kind:"about"});
    return docs.map(d=>({...d,toks:tokens(d.text)}));
  }
  let docs=[];
  function answerFor(query){
    const qn=normalize(query); if(!qn) return null;
    if(/^(hi|hello|hey|hai|hii|yo)\b/.test(qn)) return {html:`ฅ^•ﻌ•^ฅ hey! tap a chip —`,chips:quickChips.slice(0,3)};
    if(/what can.*do for me|hire.*nivi|what can nivi do|can you help me|work with nivi|what would you do for/.test(qn)) return {html:`<b>What Nivi can do for you</b><br>• Full-stack (React/Node/Mongo, 36 endpoints in MedTracker)<br>• AI: YOLOv8 94.4% mAP, FastAPI, LLaMA→Gemini<br>• Cloud: Lambda/DynamoDB + Linux auto<br><span class="nivi-cb-meta">Open to internships & projects — ${link("/contact","Contact →")} · ${link("/projects","Projects →")}</span>`,chips:["hard skills","projects","contact"]};
    if(/soft skill|non.?technical|apart from technical|what else.*bring|beyond tech|what else.*nivi|human skill|strengths/.test(qn)){
      const s=kb.softSkills.slice(0,3).map(x=>x.name).join(" · ");
      return {html:`<b>Beyond tech</b><br>${s} — Leadership (JYC/IEEE), Teamwork (SIH/Murious), Ownership (6 projects)<br><span class="nivi-cb-meta">+ budget Android eye — ${link("/community","Community →")} · ${link("/hobbies","Hobbies →")}</span>`,chips:["hard skills","community","hobbies"]};
    }
    if(/who are you|what can you do|help/.test(qn)) return {html:`I'm Nivi's cat — only Nivi stuff. <span class="nivi-cb-meta">try: hard skills / projects / hobbies</span>`,chips:quickChips.slice(0,3)};
    if(/hard skill|tech stack|stack|technolog|programming language/.test(qn)){
      const h=kb.hardSkills;
      return {html:`<b>Hard skills</b><br>• ${h.coreStack.join(", ")}<br>• ${h.programming.slice(0,3).join(", ")} · ${h.webBackend.slice(0,2).join(", ")}<br><span class="nivi-cb-meta">${link("/skills","View stack →")}</span>`,chips:["soft skills","projects"]};
    }
    if(/project|medtracker|cardiovision|chat constellation|review analyzer|linux monitor|security agent/.test(qn)){
      const m=kb.projects.find(p=>qn.includes(normalize(p.name)));
      if(m) return {html:`<b>${m.name}</b> — ${m.impact}<br><span class="nivi-cb-meta">[${m.stack.slice(0,3).join(", ")}]</span><br><a href="${m.links.github||"/projects"}" target="_blank">GitHub ↗</a> · ${link("/projects","All →")}`,chips:["hard skills","contact"]};
      return {html:`<b>6 projects</b><br>${kb.projects.map(p=>`• ${p.name}`).join("<br>")}<br><span class="nivi-cb-meta">${link("/projects","Open projects →")}</span>`,chips:kb.projects.slice(0,3).map(p=>p.name)};
    }
    if(/education|b\.?tech|cgpa|gpa|school|juit|university|college|coursework|certificate/.test(qn)){
      const b=kb.education[0];
      return {html:`<b>${b.degree}</b><br>${b.school}<br><span class="nivi-cb-meta">${b.duration} · ${b.score}</span>`,chips:["hard skills","experience"]};
    }
    if(/experience|intern|iit delhi|work experience/.test(qn)){
      const e=kb.experience[0];
      return {html:`<b>${e.role}</b><br>${e.org} · ${e.duration}<br><span class="nivi-cb-meta">Python/REST/Docker · ${link("/about","About →")}</span>`,chips:["projects","hard skills"]};
    }
    if(/community|hackathon|sih|murious|gdg|azure|ieee|jyc|event|team lead/.test(qn)){
      return {html:`<b>Community</b><br>JYC & IEEE lead · SIH & Murious org.<br><span class="nivi-cb-meta">${link("/community","View →")}</span>`,chips:["soft skills","hobbies"]};
    }
    if(/music|track|song|audio|spotify|playlist/.test(qn)){
      return {html:`<b>♪ 3 tracks</b> — tap ♪ in nav<br>• dancingCat · goto-anthem · me-currently<br><span class="nivi-cb-meta">plays while you scroll</span>`,chips:["hobbies","contact"]};
    }
    if(/hobb|off the clock|photography|photo|android|travel|mountain/.test(qn)){
      return {html:`<b>Off the clock</b><br>📸 Budget Android, bougie eye — cracked screen, clean shots.<br><span class="nivi-cb-meta">${link("/hobbies","Hobbies →")} · ♪ 3 tracks</span>`,chips:["music","contact"]};
    }
    if(/contact|email|linkedin|github|resume|reach|available|hire/.test(qn)){
      return {html:`<b>Contact</b><br><a href="mailto:${kb.contact.email}">${kb.contact.email}</a><br><span class="nivi-cb-meta">${kb.availability}</span>`,chips:["projects","hobbies"]};
    }
    if(/about|who is nivi|bio|principle|tell me about nivi|about yourself/.test(qn)){
      return {html:`<b>Nivi Jha</b> — ${kb.profile.title}<br><span class="nivi-cb-meta">correctness > clarity > scale</span>`,chips:quickChips.slice(0,3)};
    }
    let best=null, sc=-1;
    const qt=tokens(qn);
    for(const d of docs){ const s=scoreDoc(qt,d.toks); if(s>sc){ sc=s; best=d; } }
    if(best && sc>=2){
      if(best.kind==="hard") return {html:`<b>Hard skills</b><br>• ${kb.hardSkills.coreStack.join(", ")}<br><span class="nivi-cb-meta">${link("/skills","View stack →")}</span>`,chips:["soft skills","projects"]};
      if(best.kind==="soft") { const s=kb.softSkills.slice(0,3).map(x=>x.name).join(" · "); return {html:`<b>Soft skills</b><br>${s}`,chips:["hard skills","community"]}; }
      if(best.kind==="proj"){ const p=kb.projects[best.idx]; return {html:`<b>${p.name}</b> — ${p.impact}<br><span class="nivi-cb-meta">[${p.stack.slice(0,3).join(", ")}]</span>`,chips:["hard skills","contact"]}; }
      if(best.kind==="edu"){ const b=kb.education[best.idx]||kb.education[0]; return {html:`<b>${b.degree}</b><br>${b.school}`,chips:["hard skills","experience"]}; }
      if(best.kind==="exp"){ const e=kb.experience[0]; return {html:`<b>${e.role}</b><br>${e.org}`,chips:["projects","hard skills"]}; }
      if(best.kind==="com") return {html:`<b>Community</b><br>${kb.community.slice(0,2).map(c=>c.title).join(" · ")}`,chips:["soft skills","hobbies"]};
      if(best.kind==="hobby") return {html:`<b>Off the clock</b><br>${kb.hobbies.tagline}`,chips:["music","contact"]};
      if(best.kind==="about") return {html:`<b>Nivi Jha</b> — ${kb.profile.title}`,chips:quickChips.slice(0,3)};
      if(best.kind==="contact") return {html:`<b>Contact</b><br><a href="mailto:${kb.contact.email}">${kb.contact.email}</a>`,chips:["projects","hobbies"]};
    }
    return null;
  }
  function friendlyRefusal(){ return `Only Nivi stuff, meow — I only know her portfolio. <span class="nivi-cb-meta">try: hard skills / projects / hobbies</span>`; }
  async function handleQuery(raw){
    const t=raw.trim(); if(!t) return;
    renderUser(t); els.input.value=""; typing(true);
    try{
      const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:t})});
      const data=await r.json().catch(()=>({}));
      if(r.ok && data.reply){ typing(false); renderBot(data.reply.replace(/\n/g,"<br>")); renderChips(quickChips.slice(0,3)); return; }
      if(data.fallback) throw new Error("fallback");
      if(!r.ok) throw new Error(data.error||"error");
    }catch(e){}
    typing(false);
    let a=answerFor(t);
    if(!a) a={html:friendlyRefusal(),chips:quickChips.slice(0,3)};
    renderBot(a.html); if(a.chips) renderChips(a.chips);
  }
  function initState(){ if(restoreState()) return; renderBot(`ฅ^•ﻌ•^ฅ <b>meow!</b> Ask about Nivi — skills, projects, more.`); renderChips(quickChips.slice(0,3)); saveState(); }
  async function boot(){
    els.btn=q("nivi-cb-btn"); els.panel=q("nivi-cb-panel"); els.body=q("nivi-cb-body"); els.input=q("nivi-cb-input"); els.send=q("nivi-cb-send"); els.close=q("nivi-cb-close"); els.clear=q("nivi-cb-clear");
    if(!els.btn) return;
    try{ const r=await fetch(KB_URL); kb=await r.json(); docs=buildDocs(); }catch(e){kb=null;}
    if(!kb){ renderBot(`Couldn't load. Refresh.`); return; }
    initState();
    try{ if(sessionStorage.getItem("nivi-cb-open")==="1"){ els.panel.hidden=false; els.btn.setAttribute("aria-expanded","true"); const cat=document.getElementById("oneko"); if(cat){ cat.style.position="fixed"; cat.style.right="42px"; cat.style.bottom="18px"; cat.style.zIndex="1005"; } if(cat) cat.setAttribute("aria-expanded","true"); } }catch(e){}
    window.addEventListener("popstate", ()=>{ try{ if(sessionStorage.getItem("nivi-cb-open")==="1"){ els.panel.hidden=false; } }catch(e){} });
    let last=null;
    function dockCatToPanel(open){
      const cat=document.getElementById("oneko"); if(!cat) return;
      if(open){ cat.style.position="fixed"; cat.style.left="auto"; cat.style.top="auto"; cat.style.right="42px"; cat.style.bottom="18px"; cat.style.zIndex="1005"; cat.style.transition="right .28s ease, bottom .28s ease"; }
      else { cat.style.position=""; cat.style.left=""; cat.style.top=""; cat.style.right=""; cat.style.bottom=""; cat.style.zIndex=""; cat.style.transition=""; if(window.innerWidth<=768 && typeof window.placeNavbarCat==="function") try{window.placeNavbarCat&&window.placeNavbarCat()}catch(e){} }
    }
    function open(tr){ els.panel.hidden=false; els.btn.setAttribute("aria-expanded","true"); last=tr||els.btn; const c=document.getElementById("oneko"); if(c) c.setAttribute("aria-expanded","true"); dockCatToPanel(true); saveState(); els.input.focus(); els.body.scrollTop=els.body.scrollHeight; }
    function close(){ els.panel.hidden=true; els.btn.setAttribute("aria-expanded","false"); const c=document.getElementById("oneko"); if(c) c.setAttribute("aria-expanded","false"); dockCatToPanel(false); saveState(); if(last && document.contains(last)) last.focus(); else { const co=document.getElementById("oneko"); if(co&&co.dataset.cbBound) co.focus(); else els.btn.focus(); } last=null; }
    function toggle(tr){ els.panel.hidden?open(tr):close(); }
    els.btn.addEventListener("click",()=>toggle(els.btn));
    els.close.addEventListener("click",close);
    els.clear.addEventListener("click",()=>{ els.body.innerHTML=""; try{ sessionStorage.removeItem("nivi-cb-history"); }catch(e){} initState(); saveState(); });
    els.send.addEventListener("click",()=>handleQuery(els.input.value));
    els.input.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); handleQuery(els.input.value);} if(e.key==="Escape") close(); });
    document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!els.panel.hidden) close(); });
    function bindCat(){ const cat=document.getElementById("oneko"); if(!cat||cat.dataset.cbBound) return; cat.dataset.cbBound="1"; cat.setAttribute("role","button"); cat.setAttribute("tabindex","0"); cat.setAttribute("aria-label","Chat with Nivi"); cat.setAttribute("aria-controls","nivi-cb-panel"); cat.setAttribute("aria-expanded","false"); cat.style.cursor="pointer"; cat.addEventListener("click",()=>toggle(cat)); cat.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); toggle(cat); }}); }
    bindCat(); const obs=new MutationObserver(bindCat); obs.observe(document.body,{childList:true}); setTimeout(bindCat,800); setInterval(bindCat,2000);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();
