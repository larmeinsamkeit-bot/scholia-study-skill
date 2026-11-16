const CONTENT_LANGS = (DATA && DATA.course && (DATA.course.contentLangs || [DATA.course.lang || "zh-Hant"])) || ["zh-Hant"];

/* ---------- storage ---------- */
const COURSE = DATA && DATA.course ? DATA.course : {title:"Scholia",lang:"zh-Hant"};
const KEY = "scholia:" + (typeof COURSE.title === "string" ? COURSE.title : JSON.stringify(COURSE.title));
const DAY = 86400000;
const MASTER_DAYS = 21;   // an item counts as mastered once its review interval reaches three weeks
/* SM-2-style spaced repetition. q is recall quality 0–5 (≥ 3 = remembered). */
function sched(item, q){
  item.ef = item.ef || 2.5; item.reps = item.reps || 0; item.ivl = item.ivl || 0;
  if (q < 3) { item.reps = 0; item.ivl = 1; }
  else { item.reps++; item.ivl = item.reps === 1 ? 1 : item.reps === 2 ? 3 : Math.round(item.ivl * item.ef); }
  item.ef = Math.max(1.3, item.ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  item.due = startOfDay(Date.now()) + item.ivl * DAY;
  return item;
}
/* wrong → 1; right but guessing → 3; fairly sure → 4; certain → 5 */
const quality = (ok, conf) => !ok ? 1 : conf === 0 ? 3 : conf === 1 ? 4 : 5;
/* Bring progress saved by older versions up to date. */
function migrate(s){
  for (const id in s.nb) { const e = s.nb[id]; if (e.ivl == null) { e.reps = e.streak || 0; e.ivl = [1, 1, 3, 7][Math.min(e.reps, 3)]; e.ef = 2.5; delete e.streak; } }
  for (const k in s.fc) { const v = s.fc[k]; if (typeof v === "string") s.fc[k] = sched({}, v === "know" ? 4 : 2); }
  return s;
}
function blank(){ return {v:1, att:{}, nb:{}, done:{}, cq:{}, fc:{}, obj:{}, hw:{}, exam:{}, lang:null, theme:null}; }
function loadState(){ try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && s.v === 1 ? Object.assign(blank(), s) : blank(); } catch(e){ return blank(); } }
let S = migrate(loadState());
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} }

/* ---------- helpers ---------- */
let LANG = S.lang || COURSE.lang || "zh-Hant"; if (!LANGS.includes(LANG)) LANG = "zh-Hant";
const t = (k, p) => { let s = (UI[LANG] && UI[LANG][k]) ?? UI.en[k] ?? k; if (p) for (const x in p) s = s.split("{"+x+"}").join(p[x]); return s; };
const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function tx(v){
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") { if (v[LANG]) return v[LANG]; if (LANG === "zh-Hans" && v["zh-Hant"]) return v["zh-Hant"]; if (LANG === "zh-Hant" && v["zh-Hans"]) return v["zh-Hans"]; if (v[COURSE.lang]) return v[COURSE.lang]; const k = Object.keys(v)[0]; return k ? v[k] : ""; }
  return String(v);
}
function inline(s){
  return s.replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g,"$1<em>$2</em>");
}
function md(v){
  let s = tx(v); if (!s) return "";
  const math = [];
  s = s.replace(/\\\$/g, "\u0001");   // escaped dollar sign = literal $
  s = s.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, m => { math.push(m.replace(/\u0001/g, "\\$")); return "\u0000" + (math.length-1) + "\u0000"; });
  s = esc(s);
  const out = [];
  for (const block of s.split(/\n{2,}/)) {
    const lines = block.split("\n"); let i = 0;
    while (i < lines.length) {
      if (/^\s*[-*•] /.test(lines[i])) { const items=[]; while (i<lines.length && /^\s*[-*•] /.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*•] /,"")); out.push("<ul>"+items.map(x=>"<li>"+inline(x)+"</li>").join("")+"</ul>"); }
      else if (/^\s*\d+[.)] /.test(lines[i])) { const items=[]; while (i<lines.length && /^\s*\d+[.)] /.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)] /,"")); out.push("<ol>"+items.map(x=>"<li>"+inline(x)+"</li>").join("")+"</ol>"); }
      else { const para=[]; while (i<lines.length && !/^\s*([-*•]|\d+[.)]) /.test(lines[i])) para.push(lines[i++]); out.push("<p>"+inline(para.join("<br>"))+"</p>"); }
    }
  }
  // a literal $ goes in its own element so KaTeX's auto-render (which works per text node) never pairs it
  return out.join("").replace(/\u0000(\d+)\u0000/g, (_, n) => esc(math[+n])).replace(/\u0001/g, "<span>$</span>");
}
function mdi(v){ return md(v).replace(/^<p>|<\/p>$/g, ""); }
const plain = v => tx(v).replace(/[*`$]/g, "");
function fmtDay(ts){
  const d = Math.round((startOfDay(ts) - startOfDay(Date.now())) / DAY);
  if (d <= 0) return t("today"); if (d === 1) return t("tomorrow"); return t("inDays",{n:d});
}
function startOfDay(ts){ const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime(); }
function fmtDate(iso){
  if (!iso) return ""; const d = new Date(iso + "T00:00:00"); if (isNaN(d)) return iso;
  return LANG === "en" ? d.toLocaleDateString("en-GB",{day:"numeric",month:"short"}) : (d.getMonth()+1) + "月" + d.getDate() + "日";
}
function toast(msg){ const el = document.getElementById("toast"); el.textContent = msg; el.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => el.hidden = true, 2600); }
async function copyText(text){
  try { await navigator.clipboard.writeText(text); toast(t("copied")); return true; }
  catch(e){ toast(t("copyFail")); return false; }
}

/* ---------- course model ---------- */
const UNITS = (DATA && DATA.units) || [];
const REVIEWS = ["midterm","final"].filter(k => DATA && DATA[k]);
const STAGES = ["prestudy","prequiz","premistakes","classroom","review","postmistakes","homework"];
const PHASE = {prestudy:"before",prequiz:"before",premistakes:"before",classroom:"inClass",review:"after",postmistakes:"after",homework:"after"};
const QIDX = {};
UNITS.forEach((u, ui) => {
  (u.prequiz||[]).forEach(q => QIDX[q.id] = {q, unit:u.id, ui, stage:"prequiz"});
  (u.postquiz||[]).forEach(q => QIDX[q.id] = {q, unit:u.id, ui, stage:"postquiz"});
});
REVIEWS.forEach(k => (DATA[k].exam||[]).forEach(q => QIDX[q.id] = {q, unit:k, ui:-1, stage:"exam"}));
const unitById = id => UNITS.find(u => u.id === id);
const unitNum = id => UNITS.findIndex(u => u.id === id) + 1;
function stagesOf(u){ return STAGES.filter(s => s !== "homework" || (u.homework && u.homework.length)); }
function isDone(u, s){ return !!S.done[u.id + ":" + s]; }
function setDone(u, s, v){ if (v) S.done[u.id + ":" + s] = Date.now(); else delete S.done[u.id + ":" + s]; save(); }
function doneCount(u){ return stagesOf(u).filter(s => isDone(u, s)).length; }
function nextStage(u){ return stagesOf(u).find(s => !isDone(u, s)); }
function currentUnit(){ return UNITS.find(u => nextStage(u)) || null; }
function stageNum(s){ return STAGES.indexOf(s) + 1; }

/* answers */
function isRight(q, choice){
  if (choice == null) return false;
  if (q.type === "single") return choice === q.answer;
  if (q.type === "tf") return choice === q.answer;
  if (q.type === "multi") { const a = [...q.answer].sort().join(","), b = [...choice].sort().join(","); return a === b; }
  if (q.type === "short") return choice === true;
  return false;
}
function answerText(q, choice){
  if (choice == null) return "—";
  if (q.type === "single") return mdi((q.options||[])[choice]);
  if (q.type === "multi") return (choice||[]).map(i => mdi(q.options[i])).join("；");
  if (q.type === "tf") return t(choice ? "true" : "false");
  return "";
}
function correctText(q){
  if (q.type === "single") return mdi(q.options[q.answer]);
  if (q.type === "multi") return q.answer.map(i => mdi(q.options[i])).join("；");
  if (q.type === "tf") return t(q.answer ? "true" : "false");
  return md(q.answer);
}
function record(q, ok, conf, choice, mode){
  const info = QIDX[q.id] || {};
  const a = S.att[q.id] || {n:0, wrongs:0};
  a.n++; a.ok = ok; a.conf = conf; a.choice = choice; a.ts = Date.now(); if (!ok) a.wrongs++;
  S.att[q.id] = a;
  const lucky = ok && conf === 0;
  let e = S.nb[q.id];
  if (mode === "retest" && e) {
    sched(e, quality(ok, conf)); if (!ok) e.misses++;
    if (e.ivl >= MASTER_DAYS) e.mastered = Date.now(); else delete e.mastered;
  } else if (!ok || lucky) {
    if (!e) e = S.nb[q.id] = {unit: info.unit, stage: info.stage, added: Date.now(), misses: 0, ef: 2.5};
    e.misses++; e.reps = 0; e.ivl = 1; e.ef = Math.max(1.3, (e.ef || 2.5) - 0.2); e.wasRight = ok; e.lastChoice = choice; e.lastConf = conf; e.due = startOfDay(Date.now()) + DAY; delete e.mastered;
  }
  save();
  return !ok || lucky;
}
function weakSpots(filterUnits){
  const m = {};
  for (const id in S.nb) { const e = S.nb[id], info = QIDX[id]; if (!info) continue; if (filterUnits && !filterUnits.includes(info.unit)) continue;
    const c = plain(info.q.concept) || "—"; m[c] = (m[c] || 0) + (S.att[id] ? S.att[id].wrongs || 1 : 1); }
  return Object.entries(m).filter(([,n]) => n >= 2).sort((a,b) => b[1]-a[1]).slice(0, 5);
}
function dueList(){ const now = Date.now(); return Object.keys(S.nb).filter(id => QIDX[id] && !S.nb[id].mastered && S.nb[id].due <= now); }
function readiness(u){
  const qs = [...(u.prequiz||[]), ...(u.postquiz||[])]; if (!qs.length) return null;
  const tried = qs.filter(q => S.att[q.id]); if (!tried.length) return null;
  return Math.round(100 * qs.filter(q => S.att[q.id] && S.att[q.id].ok && S.att[q.id].conf > 0).length / qs.length);
}

/* ---------- router ---------- */
function route(){ const h = location.hash.replace(/^#\/?/, "").split("/"); return {view: h[0] || "home", a: h[1], b: h[2]}; }
const QS = {};   // transient quiz state by key
const FC = {};   // transient flashcard state
const HWV = {};  // transient homework reveal
let examTimer = null;

/* ---------- top bar ---------- */
function topBar(sub){
  const cur = currentUnit();
  return `<header class="top">
    <div class="brand"><a class="logo" href="#/">Scholia<span>.</span></a><span class="label">${esc(sub || [tx(COURSE.title), tx(COURSE.subtitle)].filter(Boolean).join(" · "))}</span></div>
    <div class="top-actions">
      <div class="seg" role="group" aria-label="${esc(t("langLabel"))}">${LANGS.map(l => `<button type="button" data-act="lang" data-v="${l}" aria-pressed="${l===LANG}">${esc(UI[l].langName)}</button>`).join("")}</div>
      <button type="button" class="btn" data-act="export">${esc(t("export"))}</button>
      ${cur ? `<a class="btn dark" href="#/u/${esc(cur.id)}/${nextStage(cur)}">${esc(t("continueUnit",{n:unitNum(cur.id)}))}</a>` : ""}
    </div></header>${CONTENT_LANGS.includes(LANG) ? "" : `<div class="langnote" role="note">${esc(t("contentOnly",{langs: CONTENT_LANGS.map(l => UI[l].langName).join(" / ")}))}</div>`}`;
}
function stageBar(u, active){
  const ss = stagesOf(u);
  return `<nav class="stagebar" aria-label="${esc(t("units"))}">` + ss.map((s, i) => {
    const sep = (s === "classroom" || s === "review") ? `<span class="sep" aria-hidden="true">·</span>` : "";
    const cls = s === active ? "pill on" : (isDone(u, s) ? "pill" : "pill todo");
    return sep + `<a class="${cls}" href="#/u/${esc(u.id)}/${s}" ${s===active?'aria-current="step"':""}><span class="n">${stageNum(s)}</span>${esc(t("s_"+s))}${isDone(u,s)&&s!==active?' <span aria-hidden="true" style="color:var(--blue)">✓</span>':""}</a>`;
  }).join("") + `</nav>`;
}
function sideNav(activeUnit, activeView){
  const nbCount = Object.keys(S.nb).filter(id => QIDX[id] && !S.nb[id].mastered).length;
  return `<nav class="side" aria-label="${esc(t("course"))}">
    <span class="label">${esc(t("course"))}</span>
    <a href="#/" class="${activeView==="home"?"on":""}">${esc(t("dashboard"))}</a>
    <a href="#/notebook" class="${activeView==="notebook"?"on":""}">${esc(t("notebook"))} <span class="mono" style="color:var(--orange)">${nbCount||""}</span></a>
    ${REVIEWS.map(k => `<a href="#/review/${k}" class="${activeView===k?"on":""}">${esc(tx(DATA[k].title) || t(k))} <span class="mono">${esc(fmtDate(DATA[k].date))}</span></a>`).join("")}
    <span class="label">${esc(t("units"))}</span>
    ${UNITS.map((u, i) => `<a href="#/u/${esc(u.id)}/${nextStage(u) || "review"}" class="${activeUnit===u.id?"on":""}" style="justify-content:flex-start"><span class="num">${i+1}</span>${esc(plain(u.title))}</a>`).join("")}
  </nav>`;
}

/* ---------- views ---------- */
function viewHome(){
  const cur = currentUnit();
  const sel = cur || UNITS[UNITS.length-1];
  const n = unitNum(sel.id);
  const ns = nextStage(sel);
  const ss = stagesOf(sel);
  const stagesHtml = ss.map(s => {
    const st = isDone(sel, s) ? "done" : (s === ns ? "now" : "");
    const detail = s === "prequiz" ? t("d_prequiz",{n:(sel.prequiz||[]).length}) : t("d_"+s);
    return `<a class="stage ${st}" href="#/u/${esc(sel.id)}/${s}">
      <span class="between label" style="letter-spacing:.06em"><span>${esc(t(PHASE[s]))}</span><span style="color:${st==="done"?"var(--blue)":"var(--rubric)"}">${st==="done"?esc(t("done")):st==="now"?esc(t("next")):""}</span></span>
      <span class="t"><span style="color:var(--rubric)">${stageNum(s)}</span> ${esc(t("s_"+s))}</span>
      <span class="small muted" style="line-height:1.45">${esc(detail)}</span></a>`;
  }).join("");
  const cards = UNITS.map((u, i) => {
    const dc = doneCount(u), tot = stagesOf(u).length, nx = nextStage(u);
    return `<a class="unitcard ${u===sel&&cur?"cur":""}" href="#/u/${esc(u.id)}/${nx || "review"}">
      <span class="between mono small muted" style="font-size:12px"><span style="color:var(--rubric)">${esc(t("unitN",{n:i+1}))}</span><span>${esc(fmtDate(u.date))}</span></span>
      <span class="t">${mdi(u.title)}</span>
      <span class="dots" role="img" aria-label="${esc(t("doneOf",{a:dc,b:tot}))}">${stagesOf(u).map(s => `<i class="${isDone(u,s)?"d":(s===nx?"n":"")}"></i>`).join("")}</span></a>`;
  }).join("");
  return topBar() + `<div class="shell">${sideNav(null,"home")}
  <main class="main">
    <section class="stack g8">
      <span class="label r">${esc(fmtDate(sel.date) ? t("unitN",{n}) + " · " + fmtDate(sel.date) : t("unitN",{n}))}</span>
      <h1 class="big" style="font-size:40px;line-height:1.15">${esc(cur ? t("greeting",{n, s:stageNum(ns)}) : t("allDone"))}</h1>
      <p class="muted" style="max-width:62ch">${mdi(sel.title)}${sel.summary ? " — " + mdi(sel.summary) : ""}</p>
    </section>
    <section class="card stack g16" aria-label="${esc(t("pathFor",{n}))}">
      <div class="between"><h2 style="font-size:22px">${esc(t("pathFor",{n}))}</h2><span class="mono small muted">${esc(t("doneOf",{a:doneCount(sel),b:ss.length}))}</span></div>
      <div class="stages">${stagesHtml}</div>
    </section>
    <section class="stack g14"><h2 style="font-size:22px">${esc(t("allUnits"))}</h2><div class="grid-auto">${cards}</div></section>
  </main>
  ${marginHome()}
  </div>`;
}
function dueCards(){
  const now = Date.now();
  return Object.keys(S.fc).filter(k => {
    const it = S.fc[k], [uid, i] = k.split(":"), u = unitById(uid);
    return it && typeof it === "object" && it.due <= now && u && ((u.review || {}).flashcards || [])[+i];
  });
}
function todayPanel(due){
  const cards = dueCards(), cur = currentUnit(), ns = cur && nextStage(cur);
  const rows = [];
  if (due.length) rows.push(`<a class="today-row" href="#/retest"><span>${esc(t("todayMistakes",{n:due.length}))}</span><span aria-hidden="true">→</span></a>`);
  if (cards.length) rows.push(`<a class="today-row" href="#/cards"><span>${esc(t("todayCards",{n:cards.length}))}</span><span aria-hidden="true">→</span></a>`);
  if (ns) rows.push(`<a class="today-row" href="#/u/${esc(cur.id)}/${ns}"><span>${esc(t("todayNext",{u:t("unitN",{n:unitNum(cur.id)}), s:t("s_"+ns)}))}</span><span aria-hidden="true">→</span></a>`);
  return `<div class="card stack g10" style="padding:16px">
      <h3 style="font-size:19px">${esc(t("todayTitle"))}</h3>
      ${rows.length ? `<div class="stack g4">${rows.join("")}</div>` : `<p class="small muted">${esc(t("todayNone"))}</p>`}
    </div>`;
}
function marginHome(){
  const weak = weakSpots();
  const due = dueList();
  const maxMiss = weak.length ? weak[0][1] : 1;
  let exams = "";
  for (const k of REVIEWS) {
    const r = DATA[k]; if (!r.date) continue;
    const days = Math.round((new Date(r.date+"T00:00:00") - startOfDay(Date.now())) / DAY); if (days < 0) continue;
    const name = tx(r.title) || t(k);
    exams += `<div class="stack g4"><h3 style="font-size:19px">${esc(days === 0 ? t("examToday",{name}) : t("examIn",{name, n:days}))}</h3>
      <p class="small muted">${esc(t("examScope",{units:(r.scope||[]).map(id => t("unitN",{n:unitNum(id)})).join("、")}))}</p>
      <a class="small" href="#/review/${k}">${esc(t("openReview",{name}))}</a></div>`;
    break;
  }
  const ans = UNITS.map(u => [u, ((u.classroom||{}).answers||[]).length]).filter(x => x[1]).slice(-1)[0];
  return `<aside class="aside ruled" aria-label="${esc(t("marginNotes"))}">
    <span class="label">${esc(t("marginNotes"))}</span>
    <div class="stack g10"><h3 style="font-size:19px">${esc(t("weak"))}</h3>
      <p class="small muted">${esc(weak.length ? t("weakSub") : t("weakNone"))}</p>
      ${weak.map(([c, n]) => `<div class="stack g4"><span class="between small"><span>${esc(c)}</span><span class="mono" style="font-size:12px;color:var(--orange)">${esc(t("misses",{n}))}</span></span><span class="bar"><i style="width:${Math.round(100*n/maxMiss)}%;background:var(--orange)"></i></span></div>`).join("")}
    </div>
    ${todayPanel(due)}
    ${exams}
    ${ans ? `<div class="stack g4"><h3 style="font-size:19px">${esc(t("fromClass"))}</h3><p class="small muted">${esc(t("fromClassSub",{n:unitNum(ans[0].id),a:ans[1]}))}</p><a class="small" href="#/u/${esc(ans[0].id)}/classroom">${esc(t("s_classroom"))} →</a></div>` : ""}
    <p class="small muted" style="margin-top:8px">${esc(t("localNote"))}</p>
  </aside>`;
}

function unitHeader(u, s, extra){
  return `<header class="stack g8">
    <span class="label r">${esc(t("stageN",{n:stageNum(s)}))} · ${esc(t(PHASE[s]))}${extra ? " · " + esc(extra) : ""}</span>
    <h1 class="big" style="font-size:42px;line-height:1.1">${esc(t("s_"+s))}</h1>
  </header>`;
}
function doneButton(u, s, label){
  return isDone(u, s)
    ? `<button type="button" class="btn" data-act="undone" data-u="${esc(u.id)}" data-s="${s}">${esc(t("markedDone"))}</button>`
    : `<button type="button" class="btn primary" data-act="done" data-u="${esc(u.id)}" data-s="${s}">${esc(label || t("markDone"))}</button>`;
}

function viewUnit(u, s){
  if (!stagesOf(u).includes(s)) s = "prestudy";
  const n = unitNum(u.id);
  const sub = t("unitN",{n}) + " · " + plain(u.title);
  let body = "";
  if (s === "prestudy") body = vPrestudy(u);
  else if (s === "prequiz") body = vQuizStage(u, "prequiz");
  else if (s === "premistakes") body = vMistakes(u, "prequiz", u.difficulties || []);
  else if (s === "classroom") body = vClassroom(u);
  else if (s === "review") body = vReview(u);
  else if (s === "postmistakes") body = vMistakes(u, "postquiz", u.postDifficulties || []);
  else if (s === "homework") body = vHomework(u);
  return topBar(sub) + stageBar(u, s) + body;
}

function vPrestudy(u){
  const p = u.prestudy || {};
  const objs = p.objectives || [];
  const checked = objs.filter((_, i) => S.obj[u.id+":"+i]).length;
  const KIND = {source:["source","r"], "builds-on":["buildsOn",""], watch:["watch",""], listen:["listen","b"]};
  const notes = (p.notes || []).map(nt => { const k = KIND[nt.kind] || ["note",""]; return `<div class="margin-note ${k[1]==="r"?"r":""}"><span class="label ${k[1]}">${esc(t(k[0]))}</span><div class="md">${md(nt.text)}</div></div>`; });
  const srcs = (p.sections || []).filter(x => x.source).map(x => esc(tx(x.source)));
  if (!(p.notes||[]).some(nt => nt.kind === "source") && srcs.length) notes.unshift(`<div class="margin-note r"><span class="label r">${esc(t("source"))}</span><span>${srcs.join(" · ")}</span></div>`);
  const listen = ((u.classroom||{}).listenFor||[]);
  if (listen.length && !(p.notes||[]).some(nt => nt.kind === "listen")) notes.push(`<div class="card stack g4" style="padding:14px"><span class="label b">${esc(t("listen"))}</span>${listen.map(x => `<div class="md small">${md(x)}</div>`).join("")}</div>`);
  return `<div class="read"><article class="col">
    <header class="stack g8">
      <span class="label r">${esc(t("stageN",{n:1}))} · ${esc(t("before"))}${p.minutes ? " · " + esc(t("minutes",{n:p.minutes})) : ""}</span>
      <h1 class="big" style="font-size:44px;line-height:1.08">${mdi(u.title)}</h1>
      ${u.summary ? `<p class="prose" style="font-style:italic;color:var(--ink2);font-size:20px">${mdi(u.summary)}</p>` : ""}
    </header>
    ${objs.length ? `<section class="card stack g10" style="padding:20px 24px"><h2 class="label">${esc(t("objectives"))}</h2>
      ${objs.map((o, i) => `<label class="row" style="gap:12px;align-items:flex-start;flex-wrap:nowrap;min-height:32px"><input type="checkbox" data-act="obj" data-k="${esc(u.id+":"+i)}" ${S.obj[u.id+":"+i]?"checked":""} style="width:18px;height:18px;margin-top:4px;accent-color:var(--blue);flex:none"><span>${mdi(o)}</span></label>`).join("")}</section>` : ""}
    <section class="prose stack g14">${(p.sections||[]).map((sec, i) => `<h2 style="font-size:28px;line-height:1.25;${i?"margin-top:14px":""}">${i+1}. ${mdi(sec.heading)}</h2><div>${md(sec.body)}</div>`).join("")}</section>
    ${(p.keyTerms||[]).length ? `<section class="stack g12"><h2 style="font-size:24px">${esc(t("keyTerms"))}</h2><dl style="margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
      ${p.keyTerms.map(k => `<div class="card" style="padding:14px 16px"><dt style="font-weight:600">${mdi(k.term)}</dt><dd class="small muted" style="margin:4px 0 0">${mdi(k.definition)}</dd></div>`).join("")}</dl></section>` : ""}
    <div class="between" style="padding-top:12px;border-top:1px solid var(--rule)">
      <span class="small muted">${objs.length ? esc(t("objChecked",{a:checked,b:objs.length})) : ""}</span>
      <button type="button" class="btn primary" style="min-height:48px" data-act="done-go" data-u="${esc(u.id)}" data-s="prestudy" data-go="#/u/${esc(u.id)}/prequiz">${esc(t("markRead"))}</button>
    </div>
  </article><aside class="mar" aria-label="${esc(t("marginNotes"))}">${notes.join("")}</aside></div>`;
}

/* ----- quiz ----- */
function qs(key){ return QS[key] || (QS[key] = {i:0, sel:null, conf:null, checked:false, revealed:false, results:[]}); }
function vQuizStage(u, field){
  const stage = field === "prequiz" ? "prequiz" : "review";
  const questions = u[field] || [];
  return `<div class="read"><main class="col">${quizBlock(u.id+":"+field, questions, "practice", {u, stage, after: field === "prequiz" ? "premistakes" : "postmistakes"})}</main>
  <aside class="mar" aria-label="${esc(t("marginNotes"))}">${quizMargin(u.id+":"+field, questions)}</aside></div>`;
}
function quizMargin(key, questions){
  const st = qs(key); const q = questions[st.i]; if (!q || st.finished) return "";
  return `<div class="margin-note r" style="margin-top:44px"><span class="label r">${esc(LANG==="en"?"Concept":"概念")}</span><span>${mdi(q.concept)}</span></div>
    ${q.source ? `<div class="margin-note"><span class="label">${esc(t("source"))}</span><span>${mdi(q.source)}</span></div>` : ""}
    <div class="margin-note"><span class="label">${esc(t("howSure"))}</span><span class="small muted">${esc(LANG==="en" ? "A right answer marked “guessing” still goes into your notebook — lucky guesses are the gaps that show up on exams." : LANG==="zh-Hans" ? "标为「猜一下」的答对题目，也会放进错题本 — 侥幸猜中的地方，往往就是考试失分的地方。" : "標為「估吓」的答對題目，也會放入錯題簿 — 僥倖估中的地方，往往就是考試失分的地方。")}</span></div>`;
}
function quizBlock(key, questions, mode, ctx){
  const st = qs(key);
  if (!questions.length) return `<div class="empty">—</div>`;
  if (st.finished) {
    const right = st.results.filter(r => r === "ok").length;
    const wrongs = st.results.length - right;
    return `<section class="card stack g16" style="padding:28px">
      <span class="label r">${esc(mode === "retest" ? t("retestTitle") : mode === "drill" ? t("drillTitle") : t("s_"+(ctx.stage==="review"?"review":"prequiz")))}</span>
      <h1 style="font-size:34px">${esc(t("quizDone"))}</h1>
      <p class="prose">${esc(t("quizScore",{a:right,n:st.results.length}))}</p>
      <div class="prog">${st.results.map(r => `<i class="${r}"></i>`).join("")}</div>
      <div class="row">${ctx.after && wrongs ? `<a class="btn primary" href="#/u/${esc(ctx.u.id)}/${ctx.after}">${esc(t("toMistakes"))}</a>` : ""}
      ${mode === "retest" ? `<a class="btn primary" href="#/notebook">${esc(t("notebook"))} →</a>` : ""}
      <button type="button" class="btn" data-act="q-redo" data-k="${esc(key)}">${esc(t("redo"))}</button></div></section>`;
  }
  const q = questions[st.i];
  const right = st.results.filter(r => r === "ok").length, wrong = st.results.filter(r => r === "no").length;
  const diff = q.difficulty ? " · " + t(["","easy","medium","hard"][q.difficulty] || "medium") : "";
  let opts = "";
  if (q.type === "single" || q.type === "multi" || q.type === "tf") {
    const list = q.type === "tf" ? [t("true"), t("false")] : q.options;
    opts = `<fieldset style="border:0;margin:0;padding:0" class="stack g10"><legend class="sr">${esc(t(q.type))}</legend>` + list.map((o, i) => {
      const val = q.type === "tf" ? (i === 0) : i;
      const picked = q.type === "multi" ? (st.sel||[]).includes(i) : st.sel === val;
      const isAns = q.type === "multi" ? q.answer.includes(i) : (q.type === "tf" ? q.answer === val : q.answer === i);
      let cls = "", mark = "";
      if (st.checked) { if (isAns) { cls = "right"; mark = t("correct"); } else if (picked) { cls = "wrong"; mark = t("yourAnswer"); } }
      else if (picked) cls = "sel";
      return `<button type="button" class="opt ${cls}" data-act="q-pick" data-k="${esc(key)}" data-v="${i}" aria-pressed="${picked}" ${st.checked?"disabled":""}><span class="k">${"ABCDEF"[i]}</span><span class="txt">${mdi(o)}</span><span class="m">${esc(mark)}</span></button>`;
    }).join("") + `</fieldset>`;
  } else {
    opts = `<label class="stack g8"><span class="sr">${esc(t("short"))}</span><textarea data-act="q-text" data-k="${esc(key)}" placeholder="${esc(t("writeAnswer"))}" ${st.revealed?"readonly":""}>${esc(st.text||"")}</textarea></label>`;
  }
  const hasSel = q.type === "multi" ? (st.sel||[]).length > 0 : st.sel != null;
  const confRow = `<div class="stack g8"><span class="small muted">${esc(t("howSure"))}</span><div class="row" style="gap:8px">${[0,1,2].map(c => `<button type="button" class="pill ${st.conf===c?"on":""}" data-act="q-conf" data-k="${esc(key)}" data-v="${c}" aria-pressed="${st.conf===c}" ${st.checked?"disabled":""}>${esc(t("conf"+c))}</button>`).join("")}</div></div>`;
  let fb = "";
  if (st.checked) {
    const ok = st.ok, lucky = ok && st.conf === 0;
    let why = "";
    if (!ok && q.optionFeedback && typeof st.sel === "number" && q.optionFeedback[st.sel]) why = `<p class="small"><strong>${esc(t("whyTempting",{k:"ABCDEF"[st.sel]}))}</strong> ${mdi(q.optionFeedback[st.sel])}</p>`;
    fb = `<div class="fb ${ok?"ok":"no"}" role="status"><span class="label ${ok?"b":"o"}">${esc(ok ? (lucky ? t("rightGuess") : t("right")) : t("notQuite"))}</span>
      ${q.type === "short" ? `<div class="stack g4"><span class="label">${esc(t("modelAnswer"))}</span><div class="md">${md(q.answer)}</div></div>` : ""}
      <div class="md prose" style="font-size:17.5px">${md(q.explanation)}</div>${why}
      ${(!ok || lucky) && mode !== "retest" ? `<p class="mono small" style="color:var(--orange)">${esc(t("addedNb"))}</p>` : ""}</div>`;
  }
  let actions;
  if (q.type === "short" && !st.checked) {
    actions = st.revealed
      ? `<div class="stack g12"><div class="fb ok"><span class="label b">${esc(t("modelAnswer"))}</span><div class="md">${md(q.answer)}</div></div>
         <div class="row"><button type="button" class="btn" data-act="q-self" data-k="${esc(key)}" data-v="1" style="border-color:var(--blue);color:var(--blue)">${esc(t("gotIt"))}</button><button type="button" class="btn" data-act="q-self" data-k="${esc(key)}" data-v="0" style="border-color:var(--orange);color:var(--orange)">${esc(t("missedIt"))}</button></div></div>`
      : `<div class="row" style="justify-content:flex-end"><button type="button" class="btn primary" data-act="q-reveal" data-k="${esc(key)}" ${st.conf==null?"disabled":""}>${esc(t("showModel"))}</button></div>`;
  } else if (!st.checked) {
    actions = `<div class="row" style="justify-content:flex-end"><button type="button" class="btn primary" style="min-height:48px" data-act="q-check" data-k="${esc(key)}" ${hasSel && st.conf!=null?"":"disabled"}>${esc(t("check"))}</button></div>`;
  } else {
    actions = `<div class="row" style="justify-content:flex-end"><button type="button" class="btn dark" style="min-height:48px" data-act="q-next" data-k="${esc(key)}">${esc(st.i === questions.length-1 ? t("finish") : t("nextQ"))}</button></div>`;
  }
  return `<div class="stack g10">
      <div class="between mono small muted" style="font-size:12px"><span>${esc(t("qOf",{i:st.i+1,n:questions.length}))}</span><span>${esc(t("rightWrong",{a:right,b:wrong}))}</span></div>
      <div class="prog" aria-hidden="true">${questions.map((_, i) => `<i class="${st.results[i] || (i===st.i?"cur":"")}"></i>`).join("")}</div>
    </div>
    <section class="card stack g20" style="padding:28px">
      <span class="label r">${esc(t(q.type))}${esc(diff)}</span>
      <div class="prose" style="font-size:24px;line-height:1.4">${md(q.stem)}</div>
      ${opts}${confRow}${fb}${actions}
    </section>`;
}
function quizQuestions(key){
  if (key === "retest" || key === "drill") return ((QS[key] && QS[key].list) || []).filter(id => QIDX[id]).map(id => QIDX[id].q);
  const [uid, field] = key.split(":"); const u = unitById(uid); return u ? (u[field] || []) : [];
}
function quizAct(act, key, v){
  const st = qs(key), questions = quizQuestions(key), q = questions[st.i];
  if (act === "q-pick") {
    const i = +v;
    if (q.type === "multi") { const s = new Set(st.sel || []); s.has(i) ? s.delete(i) : s.add(i); st.sel = [...s]; }
    else if (q.type === "tf") st.sel = (i === 0); else st.sel = i;
  } else if (act === "q-conf") st.conf = +v;
  else if (act === "q-reveal") st.revealed = true;
  else if (act === "q-self" || act === "q-check") {
    st.ok = act === "q-self" ? v === "1" : isRight(q, st.sel);
    st.checked = true;
    record(q, st.ok, st.conf, act === "q-self" ? st.ok : st.sel, key === "retest" ? "retest" : "practice");
    st.results[st.i] = st.ok ? "ok" : "no";
  } else if (act === "q-next") {
    if (st.i >= questions.length - 1) {
      st.finished = true;
      if (key.includes(":")) { const [uid, field] = key.split(":"); const u = unitById(uid); if (field === "prequiz") setDone(u, "prequiz", true); }
    } else Object.assign(st, {i: st.i+1, sel:null, conf:null, checked:false, revealed:false, text:"", ok:null});
  } else if (act === "q-redo") {
    const list = st.list; QS[key] = {i:0, sel:null, conf:null, checked:false, revealed:false, results:[], list};
  }
}

/* ----- mistakes & difficulties ----- */
function vMistakes(u, field, diffs){
  const qsList = u[field] || [];
  const ids = qsList.map(q => q.id);
  const mine = ids.filter(id => S.nb[id]);
  const attempted = ids.some(id => S.att[id]);
  const conceptsHit = new Set(mine.map(id => plain(QIDX[id].q.concept)));
  const quizName = t(field === "prequiz" ? "s_prequiz" : "reviewQuiz");
  const goTo = field === "prequiz" ? "prequiz" : "review";
  const wrongN = mine.filter(id => !S.nb[id].wasRight).length, luckyN = mine.length - wrongN;
  const stage = field === "prequiz" ? "premistakes" : "postmistakes";
  let left;
  if (!attempted) left = `<div class="empty"><span>${esc(t("doQuizFirst",{quiz:quizName}))}</span><a class="btn primary" href="#/u/${esc(u.id)}/${goTo}">${esc(t("goQuiz",{quiz:quizName}))}</a></div>`;
  else if (!mine.length) left = `<div class="empty">${esc(t("noMistakes"))}</div>`;
  else left = mine.map(id => mistakeCard(id)).join("");
  return `<div style="display:flex;flex-wrap:wrap;gap:32px 48px;padding:32px 28px 64px;max-width:1360px;margin:0 auto">
    <section class="stack g16" style="flex:1 1 460px;min-width:0" aria-labelledby="mine">
      <div class="stack g4"><span class="label o">${esc(t("fromQuiz"))}</span><h1 id="mine" style="font-size:34px;line-height:1.15">${esc(t("mineTitle"))}</h1>
      ${mine.length ? `<p class="muted">${esc(t("mineSub",{w:wrongN,g:luckyN}))}</p>` : ""}</div>
      ${left}
    </section>
    <section class="stack g16" style="flex:1 1 400px;min-width:0" aria-labelledby="hard">
      <div class="stack g4"><span class="label r">${esc(t("anticipated"))}</span><h2 id="hard" style="font-size:34px;line-height:1.15">${esc(t("hardTitle"))}</h2><p class="muted">${esc(t("hardSub"))}</p></div>
      ${diffs.map((d, i) => { const hit = d.concept && conceptsHit.has(plain(d.concept)); return `<details class="diff" ${hit || i===0 ? "open" : ""}>
        <summary><span>${mdi(d.title)}</span>${hit ? `<span class="tag o">${esc(t("linked"))}</span>` : ""}</summary>
        <div class="stack g12">${d.why ? `<div class="md"><strong>${esc(t("whyTrips"))}</strong> ${mdi(d.why)}</div>` : ""}
        <div class="md"><strong>${esc(t("theFix"))}</strong> ${md(d.explanation).replace(/^<p>/,"").replace(/<\/p>/,"</p>")}</div>
        ${d.example ? `<div class="example md">${md(d.example)}</div>` : ""}
        ${d.source ? `<span class="mono small muted" style="font-size:12px">${esc(t("source"))}: ${esc(plain(d.source))}</span>` : ""}</div></details>`; }).join("")}
      <div class="stack g10" style="padding:18px 20px;border-radius:14px;background:var(--rubric-soft)">
        <span class="label r">${esc(t("stuck"))}</span><p class="small">${esc(t("stuckSub"))}</p>
        <a class="btn primary" style="align-self:flex-start" href="#/u/${esc(u.id)}/classroom">${esc(t("addToClass"))}</a></div>
      <div>${doneButton(u, stage)}</div>
    </section></div>`;
}
function mistakeCard(id, withUnit){
  const e = S.nb[id], info = QIDX[id], q = info.q;
  // show the mistake as it was made, not the latest re-test
  const a = {ok: e.wasRight, conf: e.lastConf, choice: e.lastChoice};
  const status = a.ok ? `<span style="color:var(--blue)">${esc(t("luckyGuess"))}</span>` : `<span style="color:var(--orange)">${esc(t("wrongSure",{conf:t("conf"+(a.conf ?? 1)).toLowerCase()}))}</span>`;
  const unitLabel = withUnit ? (info.ui >= 0 ? t("unitN",{n:info.ui+1}) + " · " : tx(DATA[info.unit].title || t(info.unit)) + " · ") : "";
  return `<article class="card stack g14" style="${a.ok?"border-style:dashed":""}">
    <div class="between mono" style="font-size:12px"><span style="color:var(--rubric)">${esc(unitLabel)}${mdi(q.concept)}</span>${status}</div>
    <div class="prose" style="font-size:20px;line-height:1.4">${md(q.stem)}</div>
    ${q.type !== "short" ? `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;font-size:14px">
      <div style="padding:12px 14px;border-radius:10px;background:var(--orange-soft);border:1px solid var(--orange-rule)"><span class="label o" style="display:block">${esc(t("yourAnswer"))}</span>${answerText(q, a.choice)}</div>
      <div style="padding:12px 14px;border-radius:10px;background:var(--blue-soft);border:1px solid var(--blue-rule)"><span class="label b" style="display:block">${esc(t("correct"))}</span>${correctText(q)}</div></div>`
      : `<div style="padding:12px 14px;border-radius:10px;background:var(--blue-soft)"><span class="label b" style="display:block">${esc(t("modelAnswer"))}</span><div class="md">${md(q.answer)}</div></div>`}
    <div class="md prose" style="font-size:17.5px">${md(q.explanation)}</div>
    <div class="between" style="padding-top:12px;border-top:1px solid var(--sunk)">
      <span class="mono small muted" style="font-size:12px">${e.mastered ? esc(t("nbMastered")) + " ✓" : esc(t("retestOn",{d:fmtDay(e.due)}))}</span>
      ${e.mastered ? "" : `<button type="button" class="btn" data-act="retest-one" data-id="${esc(id)}">${esc(t("similar"))}</button>`}
    </div></article>`;
}

/* ----- classroom ----- */
function vClassroom(u){
  const list = S.cq[u.id] || [];
  const c = u.classroom || {};
  return `<div class="read"><main class="col">
    ${unitHeader(u, "classroom")}
    <p class="muted">${esc(t("cqSub"))}</p>
    <form class="card stack g12" data-act="cq-add" data-u="${esc(u.id)}">
      <label class="sr" for="cq-input">${esc(t("cqTitle"))}</label>
      <textarea id="cq-input" name="q" placeholder="${esc(t("cqPlaceholder"))}"></textarea>
      <div class="row" style="justify-content:flex-end"><button type="submit" class="btn primary">${esc(t("add"))}</button></div>
    </form>
    <section class="stack g10">${list.length ? list.map((x, i) => `<div class="card between" style="padding:14px 18px;flex-wrap:nowrap;align-items:flex-start">
      <div class="stack g4" style="min-width:0"><span class="mono small muted" style="font-size:12px">#${i+1} · ${esc(new Date(x.ts).toLocaleString(LANG==="en"?"en-GB":"zh-HK",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}))}</span><span style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(x.text)}</span></div>
      <button type="button" class="btn link" data-act="cq-del" data-u="${esc(u.id)}" data-i="${i}" aria-label="${esc(t("delete"))} #${i+1}">${esc(t("delete"))}</button></div>`).join("") : `<div class="empty">${esc(t("cqNone"))}</div>`}</section>
    ${list.length ? `<div class="row"><button type="button" class="btn dark" data-act="cq-export" data-u="${esc(u.id)}">${esc(t("export_q"))}</button></div><pre id="cq-out" hidden style="white-space:pre-wrap;padding:14px;border-radius:10px;background:var(--sunk);font-size:13px"></pre>` : ""}
    ${(c.answers||[]).length ? `<section class="stack g12"><h2 style="font-size:24px">${esc(t("answered"))}</h2>${c.answers.map(a => `<details class="diff"><summary><span>${mdi(a.q)}</span></summary><div class="md">${md(a.a)}</div>${a.source?`<p class="mono small muted" style="font-size:12px;margin-top:8px">${esc(t("source"))}: ${esc(plain(a.source))}</p>`:""}</details>`).join("")}</section>` : ""}
    <div>${doneButton(u, "classroom")}</div>
  </main><aside class="mar" aria-label="${esc(t("marginNotes"))}">
    ${(c.listenFor||[]).length ? `<div class="card stack g8" style="padding:16px;margin-top:84px"><span class="label b">${esc(t("listenFor"))}</span>${c.listenFor.map(x => `<div class="md small">${md(x)}</div>`).join("")}</div>` : ""}
  </aside></div>`;
}

/* ----- after-class review ----- */
function fcState(u){ return FC[u.id] || (FC[u.id] = {i:0, back:false}); }
function vReview(u){
  const r = u.review || {};
  const cards = r.flashcards || [];
  const f = fcState(u); if (f.i >= cards.length) f.i = 0;
  const known = cards.filter((_, i) => { const it = S.fc[u.id+":"+i]; return it && it.reps > 0; }).length;
  const card = cards[f.i];
  const quizKey = u.id + ":postquiz";
  return `<div class="read"><article class="col">
    ${unitHeader(u, "review")}
    <section class="stack g12"><h2 style="font-size:26px">${esc(t("recap"))}</h2><div class="prose">${md(r.recap)}</div></section>
    ${(r.keyPoints||[]).length ? `<section class="card stack g10"><h2 class="label">${esc(t("keyPoints"))}</h2><ol class="md" style="margin:0;padding-left:1.3em;display:flex;flex-direction:column;gap:6px">${r.keyPoints.map(k => `<li>${mdi(k)}</li>`).join("")}</ol></section>` : ""}
    ${card ? `<section class="stack g12" aria-labelledby="fc"><div class="between"><h2 id="fc" style="font-size:26px">${esc(t("flashcards"))}</h2><span class="mono small muted">${esc(t("cardOf",{i:f.i+1,n:cards.length}))} · ${esc(t("known",{k:known}))}</span></div>
      <button type="button" class="flash ${f.back?"back":""}" data-act="fc-flip" data-u="${esc(u.id)}" aria-label="${esc(t("flip"))}"><span class="md">${md(f.back ? card.back : card.front)}</span></button>
      <div class="between"><div class="row" style="gap:8px"><button type="button" class="btn" data-act="fc-prev" data-u="${esc(u.id)}" aria-label="prev">←</button><button type="button" class="btn" data-act="fc-flip" data-u="${esc(u.id)}">${esc(t("flip"))}</button><button type="button" class="btn" data-act="fc-next" data-u="${esc(u.id)}" aria-label="next">→</button></div>
      <div class="row" style="gap:8px"><button type="button" class="btn" style="color:var(--orange);border-color:var(--orange-rule)" data-act="fc-mark" data-u="${esc(u.id)}" data-v="again">${esc(t("again"))}</button><button type="button" class="btn" style="color:var(--blue);border-color:var(--blue-rule)" data-act="fc-mark" data-u="${esc(u.id)}" data-v="know">${esc(t("know"))}</button></div></div></section>` : ""}
    ${r.connections ? `<section class="stack g8"><h2 style="font-size:22px">${esc(t("connections"))}</h2><div class="md">${md(r.connections)}</div></section>` : ""}
    ${(u.postquiz||[]).length ? `<section class="stack g14"><h2 style="font-size:26px">${esc(t("reviewQuiz"))}</h2>${quizBlock(quizKey, u.postquiz, "practice", {u, stage:"review", after:"postmistakes"})}</section>` : ""}
    <div>${doneButton(u, "review")}</div>
  </article><aside class="mar" aria-label="${esc(t("marginNotes"))}">${(u.postquiz||[]).length ? quizMargin(quizKey, u.postquiz) : ""}</aside></div>`;
}

/* ----- homework ----- */
function vHomework(u){
  const list = u.homework || [];
  if (!list.length) return `<div class="read"><main class="col">${unitHeader(u,"homework")}<div class="empty">${esc(t("noHw"))}</div></main></div>`;
  return `<div class="read"><main class="col">${unitHeader(u, "homework")}
    ${list.map(h => {
      const v = HWV[h.id] || (HWV[h.id] = {hints: 0, sol: false});
      const hints = h.hints || [];
      const locked = h.revealMode === "hints-first" && v.hints < hints.length;
      return `<article class="card stack g14" id="hw-${esc(h.id)}">
        <div class="between"><span class="label r">${mdi(h.title || h.id)}${h.source ? " · " + esc(plain(h.source)) : ""}</span>${h.confidence === "low" ? `<span class="tag o">${esc(t("lowConf"))}</span>` : ""}</div>
        <div class="prose" style="font-size:19px">${md(h.problem)}</div>
        ${hints.slice(0, v.hints).map((x, i) => `<div class="margin-note r"><span class="label r">${esc(t("hint",{i:i+1}))}</span><div class="md">${md(x)}</div></div>`).join("")}
        ${!v.sol ? `<div class="row">${v.hints < hints.length ? `<button type="button" class="btn" data-act="hw-hint" data-id="${esc(h.id)}">${esc(t("showHint"))}</button>` : ""}
          <button type="button" class="btn primary" data-act="hw-sol" data-id="${esc(h.id)}" ${locked?"disabled":""}>${esc(t("showSolution"))}</button></div>
          ${locked ? `<p class="small muted">${esc(t("lockedSolution"))}</p>` : ""}` :
        `<section class="stack g10"><h3 class="label">${esc(t("steps"))}</h3><ol class="md" style="margin:0;padding-left:1.3em;display:flex;flex-direction:column;gap:10px">${(h.steps||[]).map(s => `<li>${md(s)}</li>`).join("")}</ol></section>
         <div class="fb ok"><span class="label b">${esc(t("answer"))}</span><div class="md prose" style="font-size:18px">${md(h.answer)}</div></div>
         ${(h.pitfalls||[]).length ? `<div class="fb no"><span class="label o">${esc(t("pitfalls"))}</span><ul class="md" style="margin:0">${h.pitfalls.map(p => `<li>${mdi(p)}</li>`).join("")}</ul></div>` : ""}`}
      </article>`; }).join("")}
    <div>${doneButton(u, "homework")}</div></main></div>`;
}

/* ----- notebook & retest ----- */
function viewNotebook(){
  const ids = Object.keys(S.nb).filter(id => QIDX[id]);
  const now = Date.now();
  const due = ids.filter(id => !S.nb[id].mastered && S.nb[id].due <= now);
  const later = ids.filter(id => !S.nb[id].mastered && S.nb[id].due > now).sort((a,b) => S.nb[a].due - S.nb[b].due);
  const mastered = ids.filter(id => S.nb[id].mastered);
  const sec = (title, list, cls) => list.length ? `<section class="stack g14"><div class="between"><h2 style="font-size:24px">${esc(title)}</h2><span class="tag ${cls}">${list.length}</span></div>${list.map(id => mistakeCard(id, true)).join("")}</section>` : "";
  return topBar() + `<div class="shell">${sideNav(null,"notebook")}<main class="main" style="max-width:860px">
    <header class="stack g8"><span class="label o">${esc(plain(COURSE.title))}</span><h1 class="big" style="font-size:42px">${esc(t("nbTitle"))}</h1><p class="muted">${esc(t("nbSub"))}</p>
    ${due.length ? `<div><a class="btn primary" href="#/retest">${esc(t("startRetest",{n:Math.min(due.length,10)}))}</a></div>` : ""}</header>
    ${ids.length ? sec(t("nbDue"), due, "o") + sec(t("nbLater"), later, "r") + sec(t("nbMastered"), mastered, "b") : `<div class="empty">${esc(t("nbEmpty"))}</div>`}
  </main>${marginHome()}</div>`;
}
function viewRetest(){
  if (!QS.retest || (!QS.retest.list || !QS.retest.list.length)) { QS.retest = {i:0, sel:null, conf:null, checked:false, revealed:false, results:[], list: dueList().slice(0,10)}; }
  const questions = quizQuestions("retest");
  if (!questions.length) { QS.retest = null; return topBar() + `<div class="read"><main class="col"><div class="empty">${esc(t("dueNone"))}<a class="btn" href="#/notebook">${esc(t("notebook"))}</a></div></main></div>`; }
  return topBar(t("retestTitle")) + `<div class="read"><main class="col">${quizBlock("retest", questions, "retest", {})}</main><aside class="mar">${quizMargin("retest", questions)}</aside></div>`;
}

/* ----- due flashcards across units ----- */
const CS = {list: null, i: 0, back: false};
function viewCards(){
  if (!CS.list) { CS.list = dueCards().slice(0, 30); CS.i = 0; CS.back = false; }
  if (CS.i >= CS.list.length) {
    const n = CS.list.length;
    return topBar(t("cardsTitle")) + `<div class="read"><main class="col"><div class="empty">${esc(n ? t("cardsDone",{n}) : t("cardsNone"))}<a class="btn" href="#/">${esc(t("dashboard"))}</a></div></main></div>`;
  }
  const key = CS.list[CS.i], [uid, i] = key.split(":"), u = unitById(uid), card = u.review.flashcards[+i];
  return topBar(t("cardsTitle")) + `<div class="read"><main class="col stack g14">
    <div class="between"><span class="label r">${esc(t("unitN",{n:unitNum(uid)}))} · ${esc(plain(u.title))}</span><span class="mono small muted">${esc(t("cardOf",{i:CS.i+1,n:CS.list.length}))}</span></div>
    <div class="prog" aria-hidden="true">${CS.list.map((_, j) => `<i class="${j < CS.i ? "ok" : j === CS.i ? "cur" : ""}"></i>`).join("")}</div>
    <button type="button" class="flash ${CS.back?"back":""}" data-act="cs-flip" aria-label="${esc(t("flip"))}"><span class="md">${md(CS.back ? card.back : card.front)}</span></button>
    <div class="between"><button type="button" class="btn" data-act="cs-flip">${esc(t("flip"))}</button>
    <div class="row" style="gap:8px"><button type="button" class="btn" style="color:var(--orange);border-color:var(--orange-rule)" data-act="cs-mark" data-v="2">${esc(t("again"))}</button><button type="button" class="btn" style="color:var(--blue);border-color:var(--blue-rule)" data-act="cs-mark" data-v="4">${esc(t("know"))}</button></div></div>
  </main></div>`;
}

/* ----- midterm / final ----- */
function viewReview(kind){
  const r = DATA[kind]; if (!r) { location.hash = "#/"; return ""; }
  const name = tx(r.title) || t(kind);
  const ex = S.exam[kind] || (S.exam[kind] = {attempts: []});
  if (ex.current) return viewExam(kind);
  const scope = (r.scope||[]).map(unitById).filter(Boolean);
  const rows = scope.map(u => { const p = readiness(u); return {u, p}; });
  const low = rows.filter(x => x.p != null && x.p < 65).map(x => t("unitN",{n:unitNum(x.u.id)}));
  const weak = weakSpots(r.scope);
  const days = r.date ? Math.round((new Date(r.date+"T00:00:00") - startOfDay(Date.now())) / DAY) : null;
  const n = (r.exam||[]).length, mins = r.timeLimitMin || Math.max(10, n * 3);
  const last = ex.attempts[ex.attempts.length-1], best = ex.attempts.reduce((m, a) => !m || a.score > m.score ? a : m, null);
  return topBar(name) + `<div class="shell">${sideNav(null, kind)}<div style="flex:999 1 700px;min-width:0">
    <div style="padding:28px 32px 8px;display:flex;flex-direction:column;gap:6px">
      ${days != null && days >= 0 ? `<span class="label r">${esc(days === 0 ? t("examToday",{name}) : t("examIn",{name, n:days}))}</span>` : ""}
      <h1 class="big" style="font-size:44px;line-height:1.08">${esc(name)}</h1>
      <div class="prose" style="font-style:italic;color:var(--ink2);max-width:64ch">${md(r.overview)}</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:28px 36px;padding:20px 32px 64px;align-items:flex-start">
      <div class="stack g20" style="flex:999 1 520px;min-width:0">
        <section class="card stack g14"><div class="between"><h2 style="font-size:24px">${esc(t("readiness"))}</h2><span class="mono small muted" style="font-size:12px">${esc(t("readinessSub"))}</span></div>
          <div class="readiness">${rows.map(({u, p}) => `<a href="#/u/${esc(u.id)}/review" style="color:var(--ink);text-decoration:none">${unitNum(u.id)} · ${esc(plain(u.title))}</a><span class="bar lg"><i style="width:${p??0}%;background:${p!=null&&p<65?"var(--orange)":"var(--blue)"}"></i></span><span class="mono" style="text-align:right;${p!=null&&p<65?"color:var(--orange)":""}">${p==null?"—":p+"%"}</span>`).join("")}</div>
          ${low.length ? `<p class="small muted">${esc(t("startWith",{u:low.join("、")}))}</p>` : ""}</section>
        ${(r.themes||[]).length ? `<section class="stack g12"><h2 style="font-size:24px">${esc(t("themes"))}</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
          ${r.themes.map(th => `<div class="card stack g8" style="padding:18px">${(th.units||[]).length ? `<span class="label r">${esc(th.units.map(id => t("unitN",{n:unitNum(id)})).join(" · "))}</span>` : ""}<span style="font-family:var(--serif);font-size:19px">${mdi(th.title)}</span><div class="md small muted">${md(th.body)}</div></div>`).join("")}</div></section>` : ""}
        ${r.formulaSheet ? `<section class="card stack g12"><h2 style="font-size:24px">${esc(t("formulaSheet"))}</h2><div class="md" style="font-size:16px">${md(r.formulaSheet)}</div></section>` : ""}
      </div>
      <aside class="stack g16" style="flex:1 1 300px;max-width:400px">
        ${n ? `<section class="dark-card"><span class="label dk">${esc(t("mock"))}</span><h2 style="font-size:28px;line-height:1.15">${esc(t("mockInfo",{n, m:mins}))}</h2>
          <p class="small muted">${esc(t("mockSub"))}</p>
          ${last ? `<div class="between mono small muted"><span>${esc(t("lastAttempt",{a:last.score,n:last.total}))}</span><span>${esc(t("best",{a:best.score,n:best.total}))}</span></div>` : ""}
          <button type="button" class="btn primary" style="min-height:52px" data-act="exam-start" data-k="${kind}">${esc(t("start"))}</button></section>` : ""}
        <section class="card stack g10" style="padding:18px"><h3 style="font-size:19px">${esc(t("drillTitle"))}</h3><p class="small muted">${esc(t("drillSub"))}</p>
          <button type="button" class="btn" data-act="drill" data-k="${kind}" data-v="random">${esc(t("drillRandom"))}</button>
          ${drillPool(kind, true).length ? `<button type="button" class="btn" data-act="drill" data-k="${kind}" data-v="weak">${esc(t("drillWeak",{n:Math.min(10, drillPool(kind, true).length)}))}</button>` : ""}</section>
        ${weak.length ? `<section class="stack g10"><h3 style="font-size:19px">${esc(t("weak"))}</h3>${weak.map(([c, m]) => `<span class="between small"><span>${esc(c)}</span><span class="mono" style="font-size:12px;color:var(--orange)">${esc(t("misses",{n:m}))}</span></span>`).join("")}</section>` : ""}
        ${r.strategy ? `<section class="margin-note r stack g8"><span class="label r">Scholia · ${esc(t("strategy"))}</span><div class="md">${md(r.strategy)}</div></section>` : ""}
      </aside>
    </div></div></div>`;
}
function shuffle(a){ a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function examOrder(r, cur){
  const all = r.exam || [], byId = Object.fromEntries(all.map(q => [q.id, q]));
  return cur && cur.order ? cur.order.map(id => byId[id]).filter(Boolean) : all;
}
function drillPool(kind, weakOnly){
  const scope = DATA[kind].scope || [];
  let pool = scope.map(unitById).filter(Boolean).flatMap(u => [...(u.prequiz||[]), ...(u.postquiz||[])]);
  if (weakOnly) {
    const missed = new Set(Object.keys(S.nb).filter(id => QIDX[id] && scope.includes(QIDX[id].unit)).map(id => plain(QIDX[id].q.concept)));
    pool = pool.filter(q => missed.has(plain(q.concept)));
  }
  return pool;
}
function viewDrill(){
  const questions = quizQuestions("drill");
  if (!questions.length) return topBar(t("drillTitle")) + `<div class="read"><main class="col"><div class="empty">${esc(t("drillNone"))}<a class="btn" href="#/">${esc(t("dashboard"))}</a></div></main></div>`;
  return topBar(t("drillTitle")) + `<div class="read"><main class="col">${quizBlock("drill", questions, "drill", {})}</main><aside class="mar">${quizMargin("drill", questions)}</aside></div>`;
}
function viewExam(kind){
  const r = DATA[kind], ex = S.exam[kind], cur = ex.current, qsList = examOrder(r, cur);
  const name = tx(r.title) || t(kind);
  if (cur.submitted) return examResult(kind);
  const answered = qsList.filter(q => cur.ans[q.id] != null && !(Array.isArray(cur.ans[q.id]) && !cur.ans[q.id].length)).length;
  const body = qsList.map((q, qi) => {
    const a = cur.ans[q.id];
    let ctl;
    if (q.type === "short") ctl = `<textarea data-act="ex-text" data-k="${kind}" data-id="${esc(q.id)}" placeholder="${esc(t("writeAnswer"))}">${esc(a || "")}</textarea>`;
    else { const list = q.type === "tf" ? [t("true"), t("false")] : q.options;
      ctl = `<div class="stack g8">${list.map((o, i) => { const val = q.type === "tf" ? (i===0) : i; const picked = q.type === "multi" ? (a||[]).includes(i) : a === val;
        return `<button type="button" class="opt ${picked?"sel":""}" data-act="ex-pick" data-k="${kind}" data-id="${esc(q.id)}" data-v="${i}" aria-pressed="${picked}"><span class="k">${"ABCDEF"[i]}</span><span class="txt">${mdi(o)}</span></button>`; }).join("")}</div>`; }
    return `<section class="card stack g14" id="q-${esc(q.id)}"><div class="between"><span class="label r">${qi+1} · ${esc(t(q.type))}</span>
      <button type="button" class="btn link" data-act="ex-flag" data-k="${kind}" data-id="${esc(q.id)}" style="${cur.flag[q.id]?"color:var(--orange)":""}">${esc(cur.flag[q.id] ? t("flagged") : t("flag"))}</button></div>
      <div class="prose" style="font-size:21px;line-height:1.45">${md(q.stem)}</div>${ctl}</section>`;
  }).join("");
  const map = qsList.map((q, i) => { const a = cur.ans[q.id]; const has = a != null && !(Array.isArray(a) && !a.length) && a !== ""; return `<a href="javascript:void 0" data-act="ex-jump" data-id="${esc(q.id)}" class="${cur.flag[q.id]?"f":has?"a":""}">${i+1}</a>`; }).join("");
  return topBar(name + " · " + t("mock")) + `<div style="display:flex;flex-wrap:wrap;gap:28px;padding:28px;max-width:1300px;margin:0 auto;align-items:flex-start">
    <main class="stack g16" style="flex:999 1 560px;min-width:0">${body}
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn primary" style="min-height:52px" data-act="exam-submit" data-k="${kind}">${esc(t("submit"))}</button></div></main>
    <aside class="dark-card" style="flex:1 1 280px;max-width:340px;position:sticky;top:84px">
      <span class="label dk">${esc(t("timeLeft"))}</span>
      <span id="timer" class="mono" style="font-size:40px;line-height:1">--:--</span>
      <span class="mono small muted">${answered}/${qsList.length}</span>
      <nav class="qmap" aria-label="questions">${map}</nav>
      <button type="button" class="btn primary" data-act="exam-submit" data-k="${kind}">${esc(t("submit"))}</button>
    </aside></div>`;
}
function conceptTable(list, judge){
  const m = {};
  for (const q of list) { const c = plain(q.concept) || "—"; const r = judge(q); m[c] = m[c] || {ok: 0, n: 0}; m[c].n++; if (r === true) m[c].ok++; }
  const rows = Object.entries(m).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n);
  return `<section class="card stack g12"><h2 style="font-size:22px">${esc(t("byConcept"))}</h2><div class="readiness">${rows.map(([c, v]) => {
    const p = Math.round(100 * v.ok / v.n), low = p < 65;
    return `<span>${esc(c)}</span><span class="bar lg"><i style="width:${p}%;background:${low ? "var(--orange)" : "var(--blue)"}"></i></span><span class="mono" style="text-align:right;${low ? "color:var(--orange)" : ""}">${v.ok}/${v.n}</span>`;
  }).join("")}</div></section>`;
}
function examResult(kind){
  const r = DATA[kind], ex = S.exam[kind], cur = ex.current, qsList = examOrder(r, cur);
  const name = tx(r.title) || t(kind);
  const total = qsList.length;
  const score = qsList.filter(q => q.type === "short" ? cur.self[q.id] === true : isRight(q, cur.ans[q.id])).length;
  const pendingShort = qsList.filter(q => q.type === "short" && cur.self[q.id] == null).length;
  return topBar(name + " · " + t("result")) + `<div class="read"><main class="col">
    <section class="dark-card"><span class="label dk">${esc(t("result"))}</span>
      <h1 style="font-size:40px">${esc(t("scored",{a:score,n:total,p:Math.round(100*score/Math.max(1,total))}))}</h1>
      <div class="row"><button type="button" class="btn primary" data-act="exam-close" data-k="${kind}" ${pendingShort?"disabled":""}>${esc(t("backToReview"))}</button></div>
      ${pendingShort ? `<p class="small muted">${esc(t("selfMark"))}: ${pendingShort}</p>` : ""}</section>
    ${conceptTable(qsList, q => q.type === "short" ? cur.self[q.id] : isRight(q, cur.ans[q.id]))}
    ${qsList.map((q, i) => {
      const a = cur.ans[q.id];
      const ok = q.type === "short" ? cur.self[q.id] : isRight(q, a);
      return `<section class="card stack g12" style="border-color:${ok===true?"var(--blue-rule)":ok===false?"var(--orange-rule)":"var(--rule)"}">
        <div class="between"><span class="label r">${i+1} · ${mdi(q.concept)}</span><span class="label ${ok?"b":"o"}">${ok===true?esc(t("right")):ok===false?esc(t("notQuite")):""}</span></div>
        <div class="prose" style="font-size:19px">${md(q.stem)}</div>
        ${q.type === "short" ? `<div class="stack g8"><span class="label">${esc(t("yourAnswer"))}</span><div style="white-space:pre-wrap">${esc(a || "—")}</div><span class="label b">${esc(t("modelAnswer"))}</span><div class="md">${md(q.answer)}</div>
          ${cur.self[q.id] == null ? `<div class="row"><button type="button" class="btn" style="color:var(--blue)" data-act="ex-self" data-k="${kind}" data-id="${esc(q.id)}" data-v="1">${esc(t("gotIt"))}</button><button type="button" class="btn" style="color:var(--orange)" data-act="ex-self" data-k="${kind}" data-id="${esc(q.id)}" data-v="0">${esc(t("missedIt"))}</button></div>` : ""}</div>`
        : `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;font-size:14px"><div style="padding:10px 12px;border-radius:10px;background:var(--sunk)"><span class="label" style="display:block">${esc(t("yourAnswer"))}</span>${answerText(q, a)}</div><div style="padding:10px 12px;border-radius:10px;background:var(--blue-soft)"><span class="label b" style="display:block">${esc(t("correct"))}</span>${correctText(q)}</div></div>`}
        <div class="md">${md(q.explanation)}</div></section>`; }).join("")}
  </main></div>`;
}
function startTimer(kind){
  clearInterval(examTimer);
  const r = DATA[kind], cur = S.exam[kind] && S.exam[kind].current; if (!cur || cur.submitted) return;
  const n = (r.exam||[]).length, end = cur.start + (r.timeLimitMin || Math.max(10, n*3)) * 60000;
  const tick = () => { const el = document.getElementById("timer"); const left = Math.max(0, end - Date.now());
    if (el) el.textContent = String(Math.floor(left/60000)).padStart(2,"0") + ":" + String(Math.floor(left/1000)%60).padStart(2,"0");
    if (!left) { clearInterval(examTimer); submitExam(kind); render(); } };
  tick(); examTimer = setInterval(tick, 1000);
}
function submitExam(kind){
  const r = DATA[kind], cur = S.exam[kind].current; cur.submitted = Date.now(); clearInterval(examTimer);
  for (const q of r.exam || []) {
    const a = cur.ans[q.id];
    if (q.type === "short" || a == null || (Array.isArray(a) && !a.length)) continue;   // unanswered isn't a mistake
    record(q, isRight(q, a), 1, a, "exam");
  }
  save();
}

/* ---------- export / import ---------- */
function progressSummary(){
  const lines = ["SCHOLIA-PROGRESS v1", "course: " + plain(COURSE.title), "lang: " + LANG, ""];
  UNITS.forEach((u, i) => { const p = readiness(u); lines.push(`Unit ${i+1} [${u.id}] ${plain(u.title)} — stages ${doneCount(u)}/${stagesOf(u).length}` + (p != null ? `, readiness ${p}%` : "")); });
  const w = weakSpots(); if (w.length) { lines.push("", "Weak concepts:"); w.forEach(([c, n]) => lines.push(`- ${c} (${n} misses)`)); }
  const open = Object.keys(S.nb).filter(id => QIDX[id] && !S.nb[id].mastered);
  if (open.length) { lines.push("", "Open mistakes:"); open.forEach(id => { const q = QIDX[id].q; lines.push(`- [${id}] ${plain(q.stem).slice(0,120)} — chose: ${plain(answerText(q, S.att[id] && S.att[id].choice)).slice(0,60)}`); }); }
  for (const k of REVIEWS) { const a = (S.exam[k]||{}).attempts || []; if (a.length) lines.push("", `${k} mock exams: ` + a.map(x => `${x.score}/${x.total}`).join(", ")); }
  return lines.join("\n");
}
/* Progress code: gzip + base64 text, so progress can be sent to another device through any chat app. */
function b64(bytes){ let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(str){ const s = atob(str); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; }
async function progressCode(){
  const json = new TextEncoder().encode(JSON.stringify({scholia: 1, state: S}));
  if (window.CompressionStream) {
    const gz = await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
    return "SCHZ1:" + b64(new Uint8Array(gz));
  }
  return "SCHJ1:" + b64(json);
}
async function readProgressCode(code){
  code = code.replace(/\s+/g, "");
  let bytes;
  if (code.startsWith("SCHZ1:")) bytes = new Uint8Array(await new Response(new Blob([unb64(code.slice(6))]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
  else if (code.startsWith("SCHJ1:")) bytes = unb64(code.slice(6));
  else throw new Error("not a Scholia code");
  const j = JSON.parse(new TextDecoder().decode(bytes));
  if (!j.state || j.state.v !== 1) throw new Error("bad state");
  return j.state;
}
function openExport(){
  const d = document.createElement("dialog");
  d.style.cssText = "border:1px solid var(--rule);border-radius:14px;padding:24px;max-width:520px;width:calc(100% - 32px);background:var(--surface);color:var(--ink)";
  d.innerHTML = `<div class="stack g14"><h2 style="font-size:24px">${esc(t("exportTitle"))}</h2><p class="small muted">${esc(t("exportSub"))}</p>
    <div class="stack g8"><button type="button" class="btn primary" data-x="dl">${esc(t("download"))}</button><button type="button" class="btn" data-x="sum">${esc(t("copySummary"))}</button>
    <label class="btn" style="cursor:pointer">${esc(t("import"))}<input type="file" accept="application/json,.json" data-x="imp" class="sr"></label></div>
    <div class="stack g8" style="padding-top:12px;border-top:1px solid var(--rule)"><h3 style="font-size:18px">${esc(t("codeTitle"))}</h3><p class="small muted">${esc(t("codeSub"))}</p>
    <button type="button" class="btn" data-x="code">${esc(t("codeCopy"))}</button>
    <label class="sr" for="code-in">${esc(t("codePaste"))}</label><textarea id="code-in" data-x="codein" placeholder="SCHZ1:…" style="min-height:72px;font-family:var(--mono);font-size:12px"></textarea>
    <button type="button" class="btn" data-x="apply">${esc(t("codeApply"))}</button></div>
    <pre data-x="out" hidden style="white-space:pre-wrap;max-height:200px;overflow:auto;padding:12px;border-radius:10px;background:var(--sunk);font-size:12px"></pre>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-x="close">${esc(t("close"))}</button></div></div>`;
  document.body.appendChild(d);
  d.addEventListener("click", async e => {
    const x = e.target.closest("[data-x]"); if (!x) { if (e.target === d) d.close(); return; }
    if (x.dataset.x === "close") d.close();
    if (x.dataset.x === "dl") { const blob = new Blob([JSON.stringify({scholia:1, course: plain(COURSE.title), state: S}, null, 1)], {type:"application/json"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "scholia-progress-" + new Date().toISOString().slice(0,10) + ".json"; document.body.appendChild(a); a.click(); a.remove(); }
    if (x.dataset.x === "code") { const c = await progressCode(); if (!(await copyText(c))) { const o = d.querySelector('[data-x="out"]'); o.textContent = c; o.hidden = false; } }
    if (x.dataset.x === "apply") {
      try { S = migrate(Object.assign(blank(), await readProgressCode(d.querySelector('[data-x="codein"]').value))); save(); toast(t("importDone")); d.close(); render(); }
      catch(err){ toast(t("codeFail")); }
    }
    if (x.dataset.x === "sum") { const s = progressSummary(); if (!(await copyText(s))) { const o = d.querySelector('[data-x="out"]'); o.textContent = s; o.hidden = false; } }
  });
  d.querySelector('[data-x="imp"]').addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (!j.state || j.state.v !== 1) throw 0; S = migrate(Object.assign(blank(), j.state)); save(); toast(t("importDone")); d.close(); render(); }
    catch(err){ toast(t("importFail")); }
  });
  d.addEventListener("close", () => d.remove());
  d.showModal();
}

/* ---------- render & events ---------- */
function render(){
  document.documentElement.lang = LANG;
  const app = document.getElementById("app");
  if (!DATA || !UNITS.length) { app.innerHTML = `<div class="read"><div class="col"><div class="empty">Scholia: no course data.</div></div></div>`; return; }
  const r = route(); let html = "";
  clearInterval(examTimer);
  if (r.view === "u" && unitById(r.a)) html = viewUnit(unitById(r.a), r.b || "prestudy");
  else if (r.view === "notebook") html = viewNotebook();
  else if (r.view === "retest") html = viewRetest();
  else if (r.view === "cards") html = viewCards();
  else if (r.view === "drill") html = viewDrill();
  else if (r.view === "review" && DATA[r.a]) html = viewReview(r.a);
  else html = viewHome();
  app.innerHTML = html;
  if (r.view === "review" && S.exam[r.a] && S.exam[r.a].current && !S.exam[r.a].current.submitted) startTimer(r.a);
  typeset(app);
}
function typeset(el){
  if (window.renderMathInElement) { try { window.renderMathInElement(el, {delimiters:[{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false},{left:"\\(",right:"\\)",display:false},{left:"\\[",right:"\\]",display:true}], throwOnError:false}); } catch(e){} }
}
function rerender(keepScroll){ const y = window.scrollY; render(); if (keepScroll) window.scrollTo(0, y); }

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (!el || el.tagName === "FORM" || el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && el.type !== "button")) return;
  const act = el.dataset.act, d = el.dataset;
  if (act === "lang") { LANG = d.v; S.lang = d.v; save(); rerender(true); return; }
  if (act === "export") { openExport(); return; }
  if (act.startsWith("q-")) { quizAct(act, d.k, d.v); rerender(true); return; }
  if (act === "done" || act === "undone") { setDone(unitById(d.u), d.s, act === "done"); rerender(true); return; }
  if (act === "done-go") { setDone(unitById(d.u), d.s, true); location.hash = d.go; window.scrollTo(0,0); return; }
  if (act === "retest-one") { QS.retest = {i:0, sel:null, conf:null, checked:false, revealed:false, results:[], list:[d.id]}; location.hash = "#/retest"; window.scrollTo(0,0); return; }
  if (act === "cq-del") { (S.cq[d.u] || []).splice(+d.i, 1); save(); rerender(true); return; }
  if (act === "cq-export") { const u = unitById(d.u); const list = S.cq[d.u] || [];
    const txt = ["SCHOLIA-QUESTIONS v1", "course: " + plain(COURSE.title), `unit: ${u.id} · ${plain(u.title)}`, "lang: " + LANG, ""].concat(list.map((x, i) => `${i+1}. ${x.text}`)).join("\n");
    copyText(txt).then(ok => { if (!ok) { const o = document.getElementById("cq-out"); if (o) { o.textContent = txt; o.hidden = false; } } }); return; }
  if (act === "cs-flip") { CS.back = !CS.back; rerender(true); return; }
  if (act === "cs-mark") { const k = CS.list[CS.i]; S.fc[k] = sched(S.fc[k] || {}, +d.v); save(); CS.i++; CS.back = false; rerender(true); return; }
  if (act.startsWith("fc-")) { const u = unitById(d.u), f = fcState(u), n = (u.review.flashcards||[]).length;
    if (act === "fc-flip") f.back = !f.back;
    if (act === "fc-next") { f.i = (f.i+1) % n; f.back = false; }
    if (act === "fc-prev") { f.i = (f.i-1+n) % n; f.back = false; }
    if (act === "fc-mark") { const k = u.id+":"+f.i; S.fc[k] = sched(S.fc[k] || {}, d.v === "know" ? 4 : 2); save(); f.i = (f.i+1) % n; f.back = false; }
    rerender(true); return; }
  if (act === "hw-hint") { HWV[d.id].hints++; rerender(true); return; }
  if (act === "hw-sol") { HWV[d.id].sol = true; rerender(true); return; }
  if (act === "drill") { const pool = drillPool(d.k, d.v === "weak"); QS.drill = {i:0, sel:null, conf:null, checked:false, revealed:false, results:[], list: shuffle(pool.map(q => q.id)).slice(0, 10)}; location.hash = "#/drill"; window.scrollTo(0,0); return; }
  if (act === "exam-start") { S.exam[d.k].current = {start: Date.now(), ans:{}, flag:{}, self:{}, order: shuffle((DATA[d.k].exam || []).map(q => q.id))}; save(); window.scrollTo(0,0); render(); return; }
  if (act === "ex-pick") { const q = QIDX[d.id].q, cur = S.exam[d.k].current, i = +d.v;
    if (q.type === "multi") { const s = new Set(cur.ans[d.id] || []); s.has(i) ? s.delete(i) : s.add(i); cur.ans[d.id] = [...s]; }
    else cur.ans[d.id] = q.type === "tf" ? (i === 0) : i;
    save(); rerender(true); return; }
  if (act === "ex-flag") { const cur = S.exam[d.k].current; cur.flag[d.id] = !cur.flag[d.id]; save(); rerender(true); return; }
  if (act === "ex-jump") { const t2 = document.getElementById("q-" + d.id); if (t2) t2.scrollIntoView({behavior:"smooth", block:"start"}); return; }
  if (act === "exam-submit") { const r = DATA[d.k], cur = S.exam[d.k].current;
    const left = (r.exam||[]).filter(q => cur.ans[q.id] == null || cur.ans[q.id] === "" || (Array.isArray(cur.ans[q.id]) && !cur.ans[q.id].length)).length;
    if (left && !confirm(t("submitConfirm",{n:left}))) return;
    submitExam(d.k); window.scrollTo(0,0); render(); return; }
  if (act === "ex-self") { const q = QIDX[d.id].q, cur = S.exam[d.k].current; cur.self[d.id] = d.v === "1"; record(q, d.v === "1", 1, d.v === "1", "exam"); save(); rerender(true); return; }
  if (act === "exam-close") { const r = DATA[d.k], ex = S.exam[d.k], cur = ex.current;
    const score = (r.exam||[]).filter(q => q.type === "short" ? cur.self[q.id] === true : isRight(q, cur.ans[q.id])).length;
    ex.attempts.push({score, total:(r.exam||[]).length, ts: Date.now()}); ex.current = null; save(); window.scrollTo(0,0); render(); return; }
});
document.addEventListener("change", e => {
  const el = e.target; if (el.dataset.act === "obj") { if (el.checked) S.obj[el.dataset.k] = true; else delete S.obj[el.dataset.k]; save(); rerender(true); }
});
document.addEventListener("input", e => {
  const el = e.target; const d = el.dataset;
  if (d.act === "q-text") qs(d.k).text = el.value;
  if (d.act === "ex-text") { S.exam[d.k].current.ans[d.id] = el.value; save(); }
});
document.addEventListener("submit", e => {
  const f = e.target; if (f.dataset.act !== "cq-add") return; e.preventDefault();
  const v = f.q.value.trim(); if (!v) return;
  (S.cq[f.dataset.u] = S.cq[f.dataset.u] || []).push({text: v, ts: Date.now()}); save(); rerender(true);
  const ta = document.getElementById("cq-input"); if (ta) ta.focus();
});
window.addEventListener("hashchange", () => { if (route().view === "retest" && QS.retest && QS.retest.finished) QS.retest = null; if (route().view === "cards") CS.list = null; render(); window.scrollTo(0,0); });
window.addEventListener("load", () => typeset(document.getElementById("app")));
render();
