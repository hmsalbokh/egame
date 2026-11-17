// ===== English Fun Gamification (shared) =====
(function(){
  const STATE_KEY = 'efun_state';
  const DEFAULT_STATE = {score:0,streak:0,badges:0,level:1,xp:0,
    unlockedThemes:['default-dark'], activeTheme:'default-dark',
    streakFreeze:0, lastPlayDate:null, hints:0,
    playerName:null, bestRecords:{}, unlockedTitles:[], activeTitle:null,
    soundMuted:false, difficulty:'medium',
    powerups:{hint:3, fifty:2, time:2, skip:1},
    dailyChallenge:{lastDate:null, streak:0, completed:false}};

  function loadState(){
    let s = {}; try{ s = JSON.parse(localStorage.getItem(STATE_KEY)||'{}'); }catch(e){ s={}; }
    const st = Object.assign({}, DEFAULT_STATE, s);
    // backward compat: ensure arrays/objects
    if(!Array.isArray(st.unlockedThemes)) st.unlockedThemes=['default-dark'];
    if(!st.activeTheme) st.activeTheme='default-dark';
    if(!st.bestRecords || typeof st.bestRecords!=='object') st.bestRecords={};
    if(!Array.isArray(st.unlockedTitles)) st.unlockedTitles=[];
    return st;
  }
  function saveState(st){ try{ localStorage.setItem(STATE_KEY, JSON.stringify(st)); }catch(e){} }

  let state = loadState();

  // ===== SoundFX (Web Audio) =====
  const SoundFX = (function(){
    let ctx = null; let muted = !!state.soundMuted;
    function getCtx(){ if(!ctx){ try{ ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ ctx=null; } } if(ctx && ctx.state==='suspended') ctx.resume(); return ctx; }
    function tone(freq, dur, type, gain, delay){
      const c = getCtx(); if(!c || muted) return;
      const o = c.createOscillator(); const g = c.createGain();
      o.type = type||'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, c.currentTime+delay);
      g.gain.linearRampToValueAtTime(gain||0.12, c.currentTime+delay+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+delay+dur);
      o.connect(g); g.connect(c.destination);
      o.start(c.currentTime+delay); o.stop(c.currentTime+delay+dur+0.05);
    }
    return {
      isMuted(){ return muted; },
      toggle(){ muted = !muted; state.soundMuted = muted; saveState(state); return muted; },
      click(){ tone(660,0.06,'square',0.08,0); },
      correct(combo){ const base=523.25; const mult = 1 + (combo||0)*0.08; tone(base*mult,0.12,'sine',0.14,0); tone(base*mult*1.25,0.12,'sine',0.12,0.08); tone(base*mult*1.5,0.15,'sine',0.1,0.16); },
      wrong(){ tone(180,0.18,'sawtooth',0.12,0); tone(120,0.22,'sawtooth',0.1,0.12); },
      levelup(){ [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,0.18,'sine',0.12,i*0.1)); },
      fanfare(){ [392,523.25,659.25,783.99].forEach((f,i)=>tone(f,0.22,'triangle',0.13,i*0.12)); },
      hint(){ tone(880,0.1,'sine',0.1,0); tone(1100,0.1,'sine',0.1,0.08); },
      unlock(){ const c = getCtx(); if(c && c.state==='suspended') c.resume(); return c; }
    };
  })();

  // Mobile AudioContext unlock (one-time user gesture)
  (function(){
    function unlock(){ try{ if(window.SoundFX && typeof window.SoundFX.unlock==='function') window.SoundFX.unlock(); }catch(e){} }
    ['touchstart','click','keydown'].forEach(ev=> document.addEventListener(ev, unlock, {once:true, passive:true}));
  })();

  // ===== Theme shop data =====
  const THEMES = [
    {id:'default-dark', name:'داكن كلاسيكي', price:0, title:null},
    {id:'cyber-neon', name:'نيون سايبر', price:200, title:null},
    {id:'emerald-forest', name:'غابة زمردية', price:350, title:null},
    {id:'royal-gold', name:'ذهب ملكي', price:500, title:null}
  ];
  const TITLES = [
    {id:'word-hunter', name:'صائد الكلمات', price:150},
    {id:'speed-legend', name:'أسطورة السرعة', price:300},
    {id:'memory-master', name:'سيد الذاكرة', price:250},
    {id:'quiz-champion', name:'بطل الاختبار', price:400}
  ];

  function applyTheme(id){
    document.body.classList.remove('theme-cyber-neon','theme-emerald-forest','theme-royal-gold');
    if(id && id!=='default-dark') document.body.classList.add('theme-'+id);
    state.activeTheme = id; saveState(state);
  }

  // ===== Combo =====
  const Combo = (function(){
    let count = 0; let badgeEl = null;
    function ensureBadge(){
      if(badgeEl) return badgeEl;
      badgeEl = document.createElement('div'); badgeEl.className='combo-badge'; badgeEl.id='comboBadge';
      document.body.appendChild(badgeEl); return badgeEl;
    }
    function multiplier(){ if(count>=10) return 5; if(count>=6) return 3; if(count>=3) return 2; return 1; }
    function label(){ const m=multiplier(); if(m>=5) return 'x5 🔥'; if(m>=3) return 'x'+m+' 🔥'; if(m>=2) return 'x'+m; return 'x1'; }
    function tick(){
      count++;
      const b = ensureBadge();
      b.textContent = label() + (count>=3? '  COMBO '+count:'');
      b.classList.add('show');
      b.classList.toggle('fire', multiplier()>=3);
      clearTimeout(b._t); b._t = setTimeout(()=>{ b.classList.remove('show'); }, 1800);
    }
    function reset(){ count=0; if(badgeEl){ badgeEl.classList.remove('show','fire'); } }
    function get(){ return count; }
    function mult(){ return multiplier(); }
    return {tick, reset, get, mult, label};
  })();

  // ===== Mistake pool (revenge) =====
  const MistakePool = (function(){
    let pool = [];
    return {
      add(item){ if(item && !pool.find(x=>x.en===item.en && x.kind===item.kind)) pool.push(item); },
      get(){ return pool.slice(); },
      clear(){ pool=[]; },
      has(){ return pool.length>0; }
    };
  })();

  // ===== Personal best records (per stage) =====
  function stageKey(game){ return game + '_' + (window.ACTIVE_STAGE_ID || 'default'); }
  function checkRecord(game, value, lowerIsBetter){
    state.bestRecords = state.bestRecords || {};
    const key = stageKey(game);
    const prev = state.bestRecords[key];
    let beaten = false;
    if(prev===undefined){ beaten=true; }
    else if(lowerIsBetter){ if(value < prev) beaten=true; }
    else { if(value > prev) beaten=true; }
    if(beaten){ state.bestRecords[key]=value; saveState(state); }
    return {beaten, prev};
  }

  // ===== Challenge (URL params) =====
  function parseChallenge(){
    const p = new URLSearchParams(location.search);
    const challenger = p.get('challenger'); const score = p.get('score'); const game = p.get('game'); const stage = p.get('stage');
    if(challenger && score){ return {challenger, score:parseInt(score,10)||0, game, stage}; }
    return null;
  }
  function getPlayerName(){
    if(state.playerName) return state.playerName;
    return null;
  }
  function ensurePlayerName(){
    if(state.playerName) return state.playerName;
    // prompt
    return new Promise(resolve=>{
      const box = document.createElement('div'); box.className='name-prompt';
      box.innerHTML = '<div class="name-box"><div style="font-size:34px">👤</div><h3>ما اسمك؟</h3><p style="color:var(--muted);font-size:13px">لتحدي الأصدقاء ولوحة المتصدرين</p><input id="pn" placeholder="اسمك" /><button class="btn" style="width:100%" id="pnBtn">حفظ</button></div>';
      document.body.appendChild(box);
      const inp = box.querySelector('#pn'); inp.focus();
      const save = ()=>{ const v=inp.value.trim(); if(!v) return; state.playerName=v; saveState(state); box.remove(); resolve(v); };
      box.querySelector('#pnBtn').onclick = save;
      inp.addEventListener('keydown',e=>{if(e.key==='Enter')save();});
    });
  }
  function challengeUrl(game, score){
    const name = state.playerName || 'لاعب';
    const stage = window.ACTIVE_STAGE_ID || '';
    const url = location.origin + location.pathname + '?challenger=' + encodeURIComponent(name) + '&score=' + score + '&game=' + encodeURIComponent(game) + (stage?'&stage='+encodeURIComponent(stage):'');
    return url;
  }
  async function shareChallenge(game, score){
    const name = await ensurePlayerName();
    const url = challengeUrl(game, score);
    try{ await navigator.clipboard.writeText(url); }catch(e){}
    // show copied feedback
    const t = document.createElement('div'); t.style.cssText='position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:var(--good);color:#fff;padding:10px 16px;border-radius:10px;font-weight:700;z-index:4000';
    t.textContent='📋 تم نسخ رابط التحدي!'; document.body.appendChild(t);
    setTimeout(()=>t.remove(),2200);
    return url;
  }
  function showChallengeBanner(container){
    const ch = parseChallenge();
    if(!ch) return null;
    // only show if same stage (or no stage specified)
    if(ch.stage && window.ACTIVE_STAGE_ID && ch.stage !== window.ACTIVE_STAGE_ID) return null;
    const b = document.createElement('div'); b.className='challenge-banner';
    b.textContent = '🔥 ' + ch.challenger + ' يتحداك أن تكسر رقمه (' + ch.score + ' نقطة) في هذه الجولة!';
    container.insertBefore(b, container.firstChild);
    return ch;
  }

  // ===== Mystery Chest =====
  function showChest(onReward){
    return new Promise(resolve=>{
      const overlay = document.createElement('div'); overlay.className='chest-overlay';
      overlay.innerHTML = '<div class="chest-box"><div class="chest-title">🎁 صندوق الكنز!</div><div class="chest-sub">اختر صندوقاً للكشف عن مكافأتك</div><div class="chests"><div class="chest" data-i="0">📦</div><div class="chest" data-i="1">📦</div><div class="chest" data-i="2">📦</div></div><div class="chest-reward" id="chestReward"></div></div>';
      document.body.appendChild(overlay);
      const rewards = [
        {text:'+50 XP مكافأة', apply:()=>{ state.xp = (state.xp||0)+50; if(state.xp>=100){state.level++;state.xp-=100;} }},
        {text:'+1 رمز تلميح 🧠', apply:()=>{ state.hints = (state.hints||0)+1; }},
        {text:'+100 نقطة مكافأة', apply:()=>{ state.score = (state.score||0)+100; }}
      ];
      const reward = rewards[Math.floor(Math.random()*rewards.length)];
      overlay.querySelectorAll('.chest').forEach(c=>{
        c.onclick = ()=>{
          SoundFX.fanfare();
          c.textContent = '✨';
          overlay.querySelectorAll('.chest').forEach(x=>x.classList.add('opened'));
          reward.apply(); saveState(state);
          const r = overlay.querySelector('#chestReward'); r.textContent = reward.text;
          if(onReward) onReward(reward);
          setTimeout(()=>{ overlay.remove(); resolve(reward); }, 1700);
        };
      });
    });
  }

  // ===== Daily streak =====
  function updateDailyStreak(){
    const today = new Date().toISOString().slice(0,10);
    if(state.lastPlayDate === today) return {status:'same'};
    const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
    if(state.lastPlayDate === yesterday){
      // continue streak (handled by game streak? separate daily counter)
      state.lastPlayDate = today; saveState(state); return {status:'continued'};
    }
    if(state.lastPlayDate && state.lastPlayDate !== yesterday){
      // missed a day
      if((state.streakFreeze||0)>0){ state.streakFreeze--; state.lastPlayDate=today; saveState(state); return {status:'frozen'}; }
      state.lastPlayDate = today; saveState(state); return {status:'reset'};
    }
    state.lastPlayDate = today; saveState(state); return {status:'first'};
  }

  // ===== Shop =====
  function openShop(){
    const overlay = document.createElement('div'); overlay.className='shop-overlay';
    overlay.innerHTML = '<div class="shop-box"><h2>🏪 متجر English Fun</h2><div class="shop-tabs"><button class="shop-tab active" data-tab="themes">ثيمات</button><button class="shop-tab" data-tab="titles">ألقاب</button><button class="shop-tab" data-tab="items">عناصر</button></div><div id="shopContent"></div><div style="text-align:center;margin-top:12px"><button class="btn ghost sm" id="shopClose">إغلاق</button></div></div>';
    document.body.appendChild(overlay);
    const content = overlay.querySelector('#shopContent');
    function renderTab(tab){
      overlay.querySelectorAll('.shop-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
      if(tab==='themes'){
        content.innerHTML = THEMES.map(th=>{
          const owned = state.unlockedThemes.includes(th.id);
          const active = state.activeTheme===th.id;
          return '<div class="shop-item '+(owned?'owned':'')+'"><div><div class="name">'+th.name+'</div><div class="desc">'+(active?'مُفعّل':(owned?'مملوك':'ثيم'))+'</div></div><div style="display:flex;align-items:center;gap:8px"><div class="price">'+(th.price===0?'مجاني':th.price+' نقطة')+'</div>'+(owned? (active?'<button disabled>مُفعّل</button>':'<button data-buy="theme" data-id="'+th.id+'">تفعيل</button>') : '<button data-buy="theme" data-id="'+th.id+'" data-price="'+th.price+'">شراء</button>')+'</div></div>';
        }).join('');
      } else if(tab==='titles'){
        content.innerHTML = TITLES.map(tl=>{
          const owned = (state.unlockedTitles||[]).includes(tl.id);
          const active = state.activeTitle===tl.id;
          return '<div class="shop-item '+(owned?'owned':'')+'"><div><div class="name">'+tl.name+'</div><div class="desc">'+(active?'مُفعّل':(owned?'مملوك':'لقب'))+'</div></div><div style="display:flex;align-items:center;gap:8px"><div class="price">'+tl.price+' نقطة</div>'+(owned? (active?'<button disabled>مُفعّل</button>':'<button data-buy="title" data-id="'+tl.id+'">تفعيل</button>') : '<button data-buy="title" data-id="'+tl.id+'" data-price="'+tl.price+'">شراء</button>')+'</div></div>';
        }).join('');
      } else {
        content.innerHTML = '<div class="shop-item"><div><div class="name">رمز تلميح (Hint)</div><div class="desc">يكشف حرفاً في hangman/scramble</div></div><div style="display:flex;align-items:center;gap:8px"><div class="price">60 نقطة</div><button data-buy="hint">شراء</button></div></div>' +
          '<div class="shop-item"><div><div class="name">درع Streak Freeze</div><div class="desc">يحمي تتابعك عند تفويت يوم</div></div><div style="display:flex;align-items:center;gap:8px"><div class="price">120 نقطة</div><button data-buy="freeze">شراء</button></div></div>';
      }
      // wire buttons
      content.querySelectorAll('button[data-buy]').forEach(btn=>{
        btn.onclick = ()=>{
          const kind = btn.dataset.buy;
          if(kind==='theme'){
            const id = btn.dataset.id; const price = parseInt(btn.dataset.price||'0',10);
            const th = THEMES.find(t=>t.id===id);
            if(isNaN(price) || price===0 || price===undefined){
              // owned -> equip
              applyTheme(id); SoundFX.click(); renderTab('themes');
            } else {
              if((state.score||0) < price){ alert('نقاط غير كافية'); return; }
              state.score -= price; state.unlockedThemes.push(id); saveState(state);
              applyTheme(id); SoundFX.fanfare(); renderTab('themes');
            }
          } else if(kind==='title'){
            const id = btn.dataset.id; const price = parseInt(btn.dataset.price||'0',10);
            if(btn.textContent==='تفعيل'){
              state.activeTitle = id; saveState(state); SoundFX.click(); renderTab('titles');
            } else {
              if((state.score||0) < price){ alert('نقاط غير كافية'); return; }
              state.score -= price; state.unlockedTitles.push(id); state.activeTitle=id; saveState(state);
              SoundFX.fanfare(); renderTab('titles');
            }
          } else if(kind==='hint'){
            if((state.score||0) < 60){ alert('نقاط غير كافية'); return; }
            state.score -= 60; state.hints = (state.hints||0)+1; saveState(state); SoundFX.click(); renderTab('items');
          } else if(kind==='freeze'){
            if((state.score||0) < 120){ alert('نقاط غير كافية'); return; }
            state.score -= 120; state.streakFreeze = (state.streakFreeze||0)+1; saveState(state); SoundFX.click(); renderTab('items');
          }
        };
      });
    }
    renderTab('themes');
    overlay.querySelectorAll('.shop-tab').forEach(t=>t.onclick=()=>renderTab(t.dataset.tab));
    overlay.querySelector('#shopClose').onclick = ()=>overlay.remove();
  }

  // ===== Leaderboard widget (from GAME_DATA.leaderboard) =====
  function renderLeaderboard(container){
    const data = (window.GAME_DATA && Array.isArray(window.GAME_DATA.leaderboard)) ? window.GAME_DATA.leaderboard : [];
    if(!data.length) return;
    const w = document.createElement('div'); w.className='lb-widget';
    w.innerHTML = '<h3>🏆 لوحة أبطال الأسبوع</h3>' + data.slice(0,10).map((r,i)=>
      '<div class="lb-row"><div class="rank">#'+(i+1)+'</div><div class="name">'+(r.Name||r.name||'لاعب')+'</div><div class="pts">'+(r.Points||r.points||0)+' نقطة</div></div>'
    ).join('');
    container.appendChild(w);
  }

  // ===== Hint usage =====
  function useHint(onReveal){
    if((state.hints||0)<=0){ return false; }
    state.hints--; saveState(state); SoundFX.hint();
    if(onReveal) onReveal();
    return true;
  }

  // ===== Power-ups =====
  const POWERUPS = {
    hint:  {name:'تلميح', icon:'🧠', cost:0,  stock:()=>state.hints||0, use:(cb)=>{ if((state.hints||0)<=0) return false; state.hints--; saveState(state); SoundFX.hint(); if(cb) cb(); return true; } },
    fifty: {name:'50/50', icon:'✂️', cost:40, stock:()=>state.powerups.fifty||0, use:(cb)=>{ if((state.powerups.fifty||0)<=0){ if((state.score||0)<40) return false; state.score-=40; } else { state.powerups.fifty--; } saveState(state); SoundFX.click(); if(cb) cb(); return true; } },
    time:  {name:'+وقت', icon:'⏱️', cost:50, stock:()=>state.powerups.time||0, use:(cb)=>{ if((state.powerups.time||0)<=0){ if((state.score||0)<50) return false; state.score-=50; } else { state.powerups.time--; } saveState(state); SoundFX.click(); if(cb) cb(); return true; } },
    skip:  {name:'تخطي', icon:'⏭️', cost:60, stock:()=>state.powerups.skip||0, use:(cb)=>{ if((state.powerups.skip||0)<=0){ if((state.score||0)<60) return false; state.score-=60; } else { state.powerups.skip--; } saveState(state); SoundFX.click(); if(cb) cb(); return true; } }
  };

  // ===== Particle burst =====
  function burst(x, y, color, count){
    count = count||12;
    color = color||'#22d3ee';
    for(let i=0;i<count;i++){
      const p = document.createElement('div');
      p.style.cssText = 'position:fixed;left:'+x+'px;top:'+y+'px;width:8px;height:8px;border-radius:50%;background:'+color+';pointer-events:none;z-index:9999;transition:transform .7s ease-out,opacity .7s';
      document.body.appendChild(p);
      const ang = (i/count)*Math.PI*2;
      const dist = 40 + Math.random()*40;
      requestAnimationFrame(()=>{ p.style.transform='translate('+Math.cos(ang)*dist+'px,'+Math.sin(ang)*dist+'px)'; p.style.opacity='0'; });
      setTimeout(()=>p.remove(),750);
    }
  }
  function burstAtElement(el, color, count){ if(!el) return; const r=el.getBoundingClientRect(); burst(r.left+r.width/2, r.top+r.height/2, color, count); }

  // ===== Screen shake =====
  function shakeScreen(){ document.body.style.animation='shakeScreen .4s'; setTimeout(()=>document.body.style.animation='',400); }

  // ===== Difficulty =====
  const DIFFICULTIES = {
    easy:   {label:'سهل', timeMul:1.5, options:3, wordLenMax:6},
    medium: {label:'متوسط', timeMul:1.0, options:4, wordLenMax:99},
    hard:   {label:'صعب', timeMul:0.6, options:5, wordLenMax:99}
  };
  function setDifficulty(d){ if(!DIFFICULTIES[d]) return; state.difficulty=d; saveState(state); }
  function getDifficulty(){ return state.difficulty||'medium'; }
  function diff(){ return DIFFICULTIES[getDifficulty()] || DIFFICULTIES.medium; }

  // ===== Daily challenge =====
  function todayStr(){ return new Date().toISOString().slice(0,10); }
  function dailyChallengeAvailable(){
    const dc = state.dailyChallenge||{};
    return dc.lastDate !== todayStr();
  }
  function completeDailyChallenge(){
    const dc = state.dailyChallenge || {lastDate:null, streak:0, completed:false};
    const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
    if(dc.lastDate === yesterday) dc.streak = (dc.streak||0)+1;
    else if(dc.lastDate !== todayStr()) dc.streak = 1;
    dc.lastDate = todayStr(); dc.completed = true;
    state.dailyChallenge = dc;
    // bonus
    addScoreInternal(25 + (dc.streak||1)*5);
    saveState(state);
    return dc;
  }
  function addScoreInternal(n){ state.score=(state.score||0)+n; state.xp=(state.xp||0)+n; if(state.xp>=100){state.level=(state.level||1)+1;state.xp=0;} }

  // ===== Sound toggle button =====
  function mountSoundToggle(){
    if(document.getElementById('soundToggle')) return;
    const btn = document.createElement('button'); btn.id='soundToggle'; btn.className='sound-toggle';
    btn.textContent = state.soundMuted ? '🔇' : '🔊';
    btn.onclick = ()=>{ const m = SoundFX.toggle(); btn.textContent = m?'🔇':'🔊'; };
    document.body.appendChild(btn);
  }

  // ===== Init on DOM ready =====
  function initGamification(){
    applyTheme(state.activeTheme);
    mountSoundToggle();
    updateDailyStreak();
    // challenge banner in #gameArea if exists
    const ga = document.getElementById('gameArea');
    if(ga) showChallengeBanner(ga);
  }

  // ===== Copy Progress Report =====
  async function copyProgressReport(){
    await ensurePlayerName();
    const st = state;
    const title = st.activeTitle ? (TITLES.find(t=>t.id===st.activeTitle)||{}).name || st.activeTitle : 'بدون لقب';
    const text = '🏆 تقرير بطل الألعاب: ' + (st.playerName||'لاعب') +
      ' | المستوى: ' + (st.level||1) +
      ' | النقاط: ' + (st.score||0) +
      ' | السلسلة: ' + (st.streak||0) + ' يوم' +
      ' | الأوسمة: ' + (st.badges||0) +
      ' | اللقب: ' + title;
    let ok = false;
    try{ await navigator.clipboard.writeText(text); ok=true; }catch(e){ ok=false; }
    if(!ok){
      // fallback textarea
      const ta = document.createElement('textarea'); ta.value = text;
      ta.style.cssText='position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); ok=true; }catch(e){ ok=false; }
      document.body.removeChild(ta);
    }
    showToast(ok ? 'تم نسخ تقريرك! أرسله لمعلمك الآن ✅' : 'تعذر النسخ، انسخ يدوياً');
    return text;
  }
  function showToast(msg){
    const t = document.createElement('div');
    t.style.cssText='position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:var(--good);color:#fff;padding:10px 16px;border-radius:10px;font-weight:700;z-index:4000;box-shadow:0 4px 14px rgba(0,0,0,.3);max-width:90vw;text-align:center';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),2600);
  }

  // Expose globals
  window.SoundFX = SoundFX;
  window.Combo = Combo;
  window.MistakePool = MistakePool;
  window.showChest = showChest;
  window.checkRecord = checkRecord;
  window.showChallengeBanner = showChallengeBanner;
  window.parseChallenge = parseChallenge;
  window.shareChallenge = shareChallenge;
  window.ensurePlayerName = ensurePlayerName;
  window.copyProgressReport = copyProgressReport;
  window.openShop = openShop;
  window.useHint = useHint;
  window.POWERUPS = POWERUPS;
  window.burst = burst;
  window.burstAtElement = burstAtElement;
  window.shakeScreen = shakeScreen;
  window.DIFFICULTIES = DIFFICULTIES;
  window.setDifficulty = setDifficulty;
  window.getDifficulty = getDifficulty;
  window.diff = diff;
  window.dailyChallengeAvailable = dailyChallengeAvailable;
  window.completeDailyChallenge = completeDailyChallenge;
  window.renderLeaderboard = renderLeaderboard;
  window.applyTheme = applyTheme;
  window.updateDailyStreak = updateDailyStreak;
  window.efunLoadState = function(){ state = loadState(); return state; };
  window.efunSaveState = function(){ saveState(state); };
  window.loadState = window.efunLoadState;
  window.saveState = window.efunSaveState;
  window.getState = function(){ return state; };
  window.setState = function(s){ state = Object.assign(state, s); saveState(state); };
  window.THEMES = THEMES;
  window.TITLES = TITLES;

  // state object access (mutable reference for games)
  window.EFUN = { state: state, save(){ saveState(state); }, reload(){ state = loadState(); } };

  // auto-init
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initGamification);
  } else {
    initGamification();
  }
})();
