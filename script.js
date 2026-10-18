(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const modal = $('#gameModal'), content = $('#gameContent'), modalTitle = $('#modalTitle');
  const modalRecord = $('#modalRecord'), modalStatus = $('#modalStatus'), toast = $('#toast');
  const STORAGE_KEY = 'zonaGamerRecordsV1';
  let records = loadRecords(), activeGame = '', cleanup = () => {}, toastTimer;

  function loadRecords(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {score:0,played:0,games:{}}; } catch { return {score:0,played:0,games:{}}; } }
  function saveRecords(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); renderRecords(); }
  function renderRecords(){
    $('#totalScore').textContent = records.score || 0; $('#gamesPlayed').textContent = records.played || 0;
    const names = {reflejos:'Prueba de reflejos',memoria:'Memoria neón',numero:'Adivina el número',duelo:'Duelo relámpago'};
    const entries = Object.entries(records.games || {}).sort((a,b)=>b[1].best-a[1].best);
    $('#recordList').innerHTML = entries.length ? entries.map(([id,r])=>'<div class="record-row"><span>'+names[id]+'</span><span>🏆 '+r.best+' pts</span><span>'+r.plays+' partida(s)</span></div>').join('') : '<div class="empty-record">🎯 Juega tu primera partida y aquí aparecerán tus récords.</div>';
  }
  function finishGame(id, score){
    score = Math.max(0, Math.round(score));
    records.score = (records.score || 0) + score; records.played = (records.played || 0) + 1;
    records.games[id] ||= {best:0,plays:0}; records.games[id].best = Math.max(records.games[id].best,score); records.games[id].plays++;
    saveRecords(); modalRecord.textContent = records.games[id].best; modalStatus.textContent = '+'+score+' puntos en esta partida';
    showToast('¡Partida registrada! +'+score+' puntos');
  }
  function showToast(message){ toast.textContent=message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),2400); }
  function openModal(id){
    cleanup(); cleanup=()=>{}; activeGame=id; modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
    const names={reflejos:'PRUEBA DE REFLEJOS',memoria:'MEMORIA NEÓN',numero:'ADIVINA EL NÚMERO',duelo:'DUELO RELÁMPAGO'};
    modalTitle.textContent=names[id]; modalRecord.textContent=records.games?.[id]?.best||0; modalStatus.textContent='¡Buena suerte!';
    ({reflejos:renderReflex,memoria:renderMemory,numero:renderNumber,duelo:renderDuel}[id] || renderReflex)();
  }
  function closeModal(){ cleanup(); cleanup=()=>{}; modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); }
  $('#modalClose').addEventListener('click',closeModal);
  modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeModal();});
  $$('[data-game]').forEach(btn=>btn.addEventListener('click',()=>openModal(btn.dataset.game)));
  $('#menuToggle').addEventListener('click',()=>{const nav=$('#nav');const open=nav.classList.toggle('open');$('#menuToggle').setAttribute('aria-expanded',String(open));});
  $$('#nav a').forEach(a=>a.addEventListener('click',()=>{$('#nav').classList.remove('open');$('#menuToggle').setAttribute('aria-expanded','false');}));
  let selectedFilter='todos';
  function filterGames(){const term=$('#gameSearch').value.trim().toLowerCase();let visible=0;$$('.game-card').forEach(card=>{const matchCategory=selectedFilter==='todos'||card.dataset.category===selectedFilter;const matchText=(card.dataset.name+' '+card.innerText).toLowerCase().includes(term);const show=matchCategory&&matchText;card.hidden=!show;if(show)visible++;});$('#noResults').hidden=visible!==0;}
  $$('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{selectedFilter=btn.dataset.filter;$$('.filter-btn').forEach(b=>b.classList.toggle('selected',b===btn));filterGames();}));
  $('#gameSearch').addEventListener('input',filterGames);
  $$('[data-category-filter]').forEach(btn=>btn.addEventListener('click',()=>{selectedFilter=btn.dataset.categoryFilter;$$('.filter-btn').forEach(b=>b.classList.toggle('selected',b.dataset.filter===selectedFilter));filterGames();$('#juegos').scrollIntoView({behavior:'smooth'});}));
  $('#resetRecords').addEventListener('click',()=>{if(confirm('¿Quieres borrar todos los récords guardados en este navegador?')){records={score:0,played:0,games:{}};saveRecords();showToast('Récords reiniciados');}});

  function renderReflex(){
    content.innerHTML='<p class="game-instructions">Pulsa <b>COMENZAR</b>. Espera a que el cuadro se ponga verde y toca lo más rápido posible. ¡No pulses antes!</p><button class="game-action" id="reflexStart">COMENZAR DESAFÍO</button><button class="reaction-pad" id="reactionPad" disabled>PREPARADO...</button><p class="game-message" id="reflexMessage" aria-live="polite">Tienes una oportunidad por ronda.</p>';
    const start=$('#reflexStart'),pad=$('#reactionPad'),message=$('#reflexMessage');let timeout,started=0,state='idle',done=false;
    start.addEventListener('click',()=>{clearTimeout(timeout);state='wait';done=false;pad.disabled=false;pad.className='reaction-pad waiting';pad.textContent='ESPERA AL VERDE...';message.textContent='¡Concéntrate!';start.disabled=true;timeout=setTimeout(()=>{if(state!=='wait')return;state='go';started=performance.now();pad.className='reaction-pad go';pad.textContent='¡AHORA!';},1200+Math.random()*2500);});
    pad.addEventListener('click',()=>{if(done)return;if(state==='wait'){clearTimeout(timeout);done=true;state='idle';pad.disabled=true;pad.className='reaction-pad';pad.textContent='¡MUY PRONTO!';message.textContent='Espera a que se ponga verde y vuelve a intentarlo.';start.disabled=false;return;}if(state==='go'){done=true;state='idle';const ms=Math.round(performance.now()-started);const score=Math.max(10,Math.round(1000-ms));pad.disabled=true;pad.className='reaction-pad';pad.textContent=ms+' ms';message.textContent=ms<250?'¡REFLEJOS BRUTALES!':ms<400?'¡Muy buen tiempo!':'¡Puedes hacerlo más rápido!';finishGame('reflejos',score);start.disabled=false;}});
    cleanup=()=>clearTimeout(timeout);
  }
  function renderMemory(){
    const symbols=['⚡','👾','🎮','🚀','💎','🔥','🛸','👑'];let cards=[...symbols,...symbols].sort(()=>Math.random()-.5),first=null,lock=false,matches=0,moves=0,ended=false;
    content.innerHTML='<p class="game-instructions">Encuentra las 8 parejas. ¡Intenta hacerlo con la menor cantidad de movimientos!</p><div class="memory-board" id="memoryBoard"></div><div class="game-controls"><button class="game-action" id="memoryRestart">REINICIAR</button><span class="game-message" id="memoryMoves">Movimientos: 0</span></div>';
    const board=$('#memoryBoard'),moveText=$('#memoryMoves');
    function draw(){board.innerHTML='';cards.forEach((symbol,i)=>{const b=document.createElement('button');b.className='memory-card';b.textContent='?';b.setAttribute('aria-label','Carta oculta');b.addEventListener('click',()=>flip(i,b));board.appendChild(b);});}
    function flip(i,button){if(lock||ended||button.classList.contains('matched')||button.classList.contains('revealed'))return;button.classList.add('revealed');button.textContent=cards[i];button.setAttribute('aria-label',cards[i]);if(first===null){first={i,button};return;}moves++;moveText.textContent='Movimientos: '+moves;if(cards[first.i]===cards[i]){first.button.classList.add('matched');button.classList.add('matched');first=null;matches++;if(matches===symbols.length){ended=true;const score=Math.max(100,900-(moves-8)*35);moveText.textContent='¡Completado en '+moves+' movimientos!';finishGame('memoria',score);}}else{lock=true;const prev=first;first=null;setTimeout(()=>{prev.button.classList.remove('revealed');prev.button.textContent='?';prev.button.setAttribute('aria-label','Carta oculta');button.classList.remove('revealed');button.textContent='?';button.setAttribute('aria-label','Carta oculta');lock=false;},650);}}
    function restart(){cards=[...symbols,...symbols].sort(()=>Math.random()-.5);first=null;lock=false;matches=0;moves=0;ended=false;moveText.textContent='Movimientos: 0';draw();}
    $('#memoryRestart').addEventListener('click',restart);draw();
  }
  function renderNumber(){
    let secret=Math.floor(Math.random()*100)+1,attempts=0,done=false;
    content.innerHTML='<p class="game-instructions">El número secreto está entre <b>1 y 100</b>. Tienes 7 intentos. Lee las pistas y encuentra la respuesta.</p><div class="number-form"><input id="numberGuess" type="number" min="1" max="100" placeholder="Número del 1 al 100" aria-label="Tu número"><button class="game-action" id="guessButton">PROBAR</button></div><p class="game-message" id="numberMessage" aria-live="polite">¡Haz tu primera jugada!</p><div class="game-controls"><button class="game-action" id="numberRestart">NUEVA PARTIDA</button></div>';
    const input=$('#numberGuess'),msg=$('#numberMessage'),button=$('#guessButton');
    function guess(){if(done)return;const n=Number(input.value);if(!Number.isInteger(n)||n<1||n>100){msg.textContent='Escribe un número entero entre 1 y 100.';return;}attempts++;if(n===secret){done=true;msg.textContent='¡Correcto! Lo lograste en '+attempts+' intento(s).';finishGame('numero',Math.max(100,800-(attempts-1)*100));button.disabled=true;}else if(attempts>=7){done=true;msg.textContent='Se acabaron los intentos. El número era '+secret+'.';finishGame('numero',50);button.disabled=true;}else{msg.textContent=(n<secret?'⬆ Prueba con uno MAYOR.':'⬇ Prueba con uno MENOR.')+' Intentos restantes: '+(7-attempts);input.value='';input.focus();}}
    button.addEventListener('click',guess);input.addEventListener('keydown',e=>{if(e.key==='Enter')guess();});$('#numberRestart').addEventListener('click',renderNumber);input.focus();
  }
  function renderDuel(){
    let player=0,computer=0,rounds=0,finished=false;
    content.innerHTML='<p class="game-instructions">Juega 5 rondas contra la máquina. Elige tu movimiento y demuestra quién manda en la arena.</p><div class="duel-choices"><button class="duel-choice" data-choice="piedra" aria-label="Piedra">✊</button><button class="duel-choice" data-choice="papel" aria-label="Papel">✋</button><button class="duel-choice" data-choice="tijera" aria-label="Tijera">✌️</button></div><p class="duel-result" id="duelResult" aria-live="polite">Elige tu jugada.</p><p class="game-message" id="duelScore">Tú 0 — 0 Máquina · Ronda 0/5</p><button class="game-action" id="duelRestart">NUEVO DUELO</button>';
    const options=['piedra','papel','tijera'],emojis={piedra:'✊',papel:'✋',tijera:'✌️'},result=$('#duelResult'),score=$('#duelScore');
    function play(choice){if(finished)return;const cpu=options[Math.floor(Math.random()*3)];rounds++;let outcome;if(choice===cpu)outcome='¡Empate!';else if((choice==='piedra'&&cpu==='tijera')||(choice==='papel'&&cpu==='piedra')||(choice==='tijera'&&cpu==='papel')){player++;outcome='¡Punto para ti!';}else{computer++;outcome='Punto para la máquina.';}result.textContent=emojis[choice]+' Tú vs '+emojis[cpu]+' Máquina — '+outcome;score.textContent='Tú '+player+' — '+computer+' Máquina · Ronda '+rounds+'/5';if(rounds===5){finished=true;const points=player>computer?500+player*50:player===computer?250:100;result.textContent+=(player>computer?' ¡GANASTE EL DUELO!':player===computer?' ¡EMPATE FINAL!':' ¡A ENTRENAR PARA LA PRÓXIMA!');finishGame('duelo',points);$$('.duel-choice').forEach(b=>b.disabled=true);}}
    $$('.duel-choice').forEach(b=>b.addEventListener('click',()=>play(b.dataset.choice)));
    $('#duelRestart').addEventListener('click',renderDuel);
  }
  renderRecords();
})();