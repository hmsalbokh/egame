// ===== SpeechHelper (Web Speech API, offline, zero deps) =====
// Provides English pronunciation for words/sentences using browser's built-in speechSynthesis.
// Graceful fallback: if unsupported or no voice available, calls are no-ops.
(function(){
  const SpeechHelper = {
    supported: ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window),
    voice: null,
    muted: false,
    init(){
      try { const s = localStorage.getItem('efun_speech_muted'); if(s==='muted') this.muted=true; } catch(e){}
      if(!this.supported) return;
      const pick = () => {
        const voices = window.speechSynthesis.getVoices();
        // prefer en-US, then en-GB, then any en
        this.voice = voices.find(v=>/^en-US/i.test(v.lang)) ||
                    voices.find(v=>/^en-GB/i.test(v.lang)) ||
                    voices.find(v=>/^en/i.test(v.lang)) || null;
      };
      pick();
      if(window.speechSynthesis.onvoiceschanged !== undefined){
        window.speechSynthesis.onvoiceschanged = pick;
      }
      // Chrome requires a user gesture; voices may load async
      setTimeout(pick, 500);
    },
    setMuted(m){ this.muted = !!m; try{ localStorage.setItem('efun_speech_muted', this.muted?'muted':'on'); }catch(e){} },
    isMuted(){ return this.muted; },
    toggle(){ this.setMuted(!this.muted); return this.muted; },
    speak(text, opts){
      if(!this.supported || this.muted || !text) return;
      try{
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text));
        u.lang = 'en-US';
        if(this.voice) u.voice = this.voice;
        u.rate = (opts && opts.rate) || 0.9;
        u.pitch = (opts && opts.pitch) || 1.0;
        u.volume = (opts && opts.volume) || 1.0;
        window.speechSynthesis.speak(u);
      }catch(e){}
    },
    stop(){ if(this.supported){ try{ window.speechSynthesis.cancel(); }catch(e){} } }
  };
  SpeechHelper.init();
  window.SpeechHelper = SpeechHelper;
})();
