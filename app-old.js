const socket = io();
let state = null, role = null, code = null, myId = null;
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove("hidden");
const hide = id => $(id).classList.add("hidden");

socket.on("connect", () => { $("conn").textContent = "接続中"; $("connDot").classList.remove("off"); });
socket.on("disconnect", () => { $("conn").textContent = "切断"; $("connDot").classList.add("off"); toast("サーバーとの接続が切れました"); });
socket.on("errorMessage", m => { toast(m); alert(m); });
socket.on("joined", x => { myId = x.playerId; });

function toast(msg){ const t=$("toast"); t.textContent=msg; t.classList.remove("hidden"); clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.classList.add("hidden"),2200); }
function beep(freq=700, ms=100, type="sine"){
  try{const C=window.AudioContext||window.webkitAudioContext,ctx=new C(),o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=freq;o.type=type;g.gain.setValueAtTime(.13,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+ms/1000);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+ms/1000)}catch(e){}
}
function speak(text){
  if(!("speechSynthesis" in window)) return alert("このブラウザは音声合成に対応していません。");
  speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang="ja-JP"; u.rate=.95; u.pitch=1; speechSynthesis.speak(u);
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

$("createBtn").onclick=async()=>{const r=await fetch("/api/rooms",{method:"POST"});const d=await r.json();code=d.code;role="host";socket.emit("host:join",{code});$("hostCode").textContent=code;hide("home");show("host");toast("部屋を作成しました！");};
$("joinCode").oninput=e=>e.target.value=e.target.value.replace(/[^a-z0-9]/gi,"").toUpperCase();
$("joinBtn").onclick=()=>{code=$("joinCode").value.trim().toUpperCase();const name=$("joinName").value.trim();if(!code||!name)return alert("部屋コードと名前を入力してください。");role="player";$("playerCode").textContent=code;$("playerName").textContent=name;socket.emit("player:join",{code,name});hide("home");show("player");};
$("importBtn").onclick=async()=>{const f=$("fileInput").files[0];if(!f)return alert("ファイルを選択してください。");const fd=new FormData();fd.append("file",f);const r=await fetch("/api/import",{method:"POST",body:fd});const d=await r.json();if(!r.ok)return alert(d.error);socket.emit("host:questions",{questions:d.questions});$("fileMsg").textContent=`${d.questions.length}問を読み込みました。`;toast(`${d.questions.length}問を読み込みました`);};
$("saveRules").onclick=()=>{socket.emit("host:rules",{rules:{correctPoints:+$("correctPoints").value,wrongPoints:+$("wrongPoints").value,agariScore:+$("agariScore").value,tobiWrongLimit:+$("tobiWrongLimit").value,tobiPenaltyQuestions:+$("tobiPenaltyQuestions").value}});toast("ルールを保存しました");};
$("startBtn").onclick=()=>socket.emit("host:start");
$("nextBtn").onclick=()=>socket.emit("host:next");
$("openBtn").onclick=()=>socket.emit("host:open");
$("resetBuzzBtn").onclick=()=>socket.emit("host:resetBuzz");
$("resetScoresBtn").onclick=()=>{if(confirm("全員の得点・誤答数をリセットしますか？"))socket.emit("host:resetScores");};
$("copyCodeBtn").onclick=async()=>{try{await navigator.clipboard.writeText(code);toast("部屋コードをコピーしました");}catch(e){toast(`部屋コード：${code}`)}};
$("speakBtn").onclick=()=>{if(!state||state.qIndex<0)return;const q=state.questions[state.qIndex];speak(`第${state.qIndex+1}問。${q.question}`);};
$("correctBtn").onclick=()=>{socket.emit("host:judge",{correct:true});beep(900,180,"triangle");};
$("wrongBtn").onclick=()=>{socket.emit("host:judge",{correct:false});beep(180,220,"sawtooth");};
$("buzzBtn").onclick=()=>buzz();
window.addEventListener("keydown",e=>{if(role==="player"&&e.code==="Space"&&!e.repeat){e.preventDefault();buzz();}});
function buzz(){if($("buzzBtn").disabled)return;socket.emit("player:buzz");}

socket.on("buzz",b=>{beep(620,140,"square");if(role==="host")toast(`🔔 ${b.order}番：${b.name}`);if(role==="player"&&b.playerId===myId){$("playerStatus").textContent="🔔 押しました！あなたが回答者です";}});
socket.on("state",s=>{state=s;render();});

function render(){
 if(!state)return;
 if(role==="host"){
  const q=state.questions[state.qIndex];
  $("hostQTitle").textContent=state.qIndex>=0?`第${state.qIndex+1}問 / ${state.questions.length}問`:"問題未開始";
  $("hostQuestion").textContent=q?q.question:"問題を読み込んでください";
  $("hostCategory").textContent=q?.category||"ジャンルなし";
  $("hostPoints").textContent=q?`${Number(q.points||state.rules.correctPoints)} pt`:"— pt";
  $("questionCountBadge").textContent=`${state.questions.length}問`;
  $("questionsPreview").innerHTML=state.questions.length?`<b>読み込み済み</b><br>先頭：${esc(state.questions[0].question.slice(0,80))}`:"問題ファイルを読み込んでください";
  $("progressFill").style.width=state.questions.length&&state.qIndex>=0?`${((state.qIndex+1)/state.questions.length)*100}%`:"0%";
  $("buzzState").textContent=state.questionOpen?"受付中":"受付停止";$("buzzState").classList.toggle("open",state.questionOpen);
  $("buzzList").innerHTML=state.buzzes.length?state.buzzes.map((b,i)=>`<li><strong>${i+1}.</strong> ${esc(b.name)}</li>`).join(""):"<li class='empty'>まだ誰も押していません</li>";
  if(state.currentAnswering){show("judge");const p=state.players.find(x=>x.id===state.currentAnswering);$("answeringName").textContent=p?p.name:"参加者";}else hide("judge");
  if(q?.answer){show("hostAnswer");$("hostAnswerText").textContent=q.answer;}else hide("hostAnswer");
  $("hostPlayerCount").textContent=`${state.players.length}人`;$("hostScores").innerHTML=scoreHTML(state.players);
 }else{
  const me=state.players.find(p=>p.id===myId);$("playerScores").innerHTML=scoreHTML(state.players);$("playerCount").textContent=`${state.players.length}人`;
  const rank=state.players.findIndex(p=>p.id===myId);$("playerRank").textContent=rank>=0?`#${rank+1}`:"#—";
  const q=state.questions[state.qIndex];$("playerQTitle").textContent=state.qIndex>=0?`第${state.qIndex+1}問 / ${state.questions.length}問`:"待機中";$("playerQuestion").textContent=q?q.question:"出題者の開始を待っています";$("playerCategory").textContent=q?.category||"—";
  if(!me)return;
  const disabled=state.state!=="question"||!state.questionOpen||me.agari||me.tobi||me.disabledUntilQ>=state.qIndex;$("buzzBtn").disabled=disabled;
  if(me.agari)$("playerStatus").textContent="🎉 上がり！";else if(me.tobi)$("playerStatus").textContent="🚫 飛び";else if(me.disabledUntilQ>=state.qIndex)$("playerStatus").textContent="⏳ この問題は休み";else if(state.currentAnswering===myId)$("playerStatus").textContent="🔔 あなたが回答中";else if(state.questionOpen)$("playerStatus").textContent="🔥 早押し受付中！";else $("playerStatus").textContent="回答者を判定中…";
 }
}
function scoreHTML(players){return players.length?players.map((p,i)=>`<div class="scoreRow"><span class="rank">${i+1}</span><span class="scoreName">${esc(p.name)}</span><span class="scoreValue">${p.score}点</span>${p.agari?'<span class="badge agari">上がり</span>':''}${p.tobi?'<span class="badge tobi">飛び</span>':''}<span class="badge">誤答 ${p.wrong}</span></div>`).join(""):"<div class='muted'>参加者を待っています…</div>";}
