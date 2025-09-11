// ===== Utility =====
const rnd = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const clamp = (n,min,max)=>Math.min(Math.max(n,min),max);

// ===== Game Setup =====
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const SIZE = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cells')) || 21; // cells per side
let CELL = 24; 
const SPEED_BASE = 120; 

let cat, dir, pendingDir, apple, appleKind, applesEaten, score, tickMs, playing, badTriggered;
let blackout = false;
let isMobile = false;

function reset() {
  cat = [{x:Math.floor(SIZE/2), y:Math.floor(SIZE/2)}];
  dir = {x:1,y:0}; pendingDir = null; applesEaten = 0; score = 0; tickMs = SPEED_BASE; playing = false; badTriggered = false;
  spawnApple(); draw(); updateHud();
}

function updateHud() {
  document.getElementById('score').textContent = score;
  document.getElementById('apples').textContent = applesEaten;
  const leftSafe = clamp(8 - applesEaten, 0, 8);
  const s = document.getElementById('status');
  if(leftSafe>0){ s.textContent = leftSafe + ' sichere Äpfel'; s.style.color = '#065f46'; s.style.borderColor = '#a7f3d0'; s.style.background = '#ecfdf5'; }
  else { s.textContent = '42% Risiko'; s.style.color = '#92400e'; s.style.borderColor = '#fed7aa'; s.style.background = '#fff7ed'; }
}

function cellsEqual(a,b) { 
  return a.x===b.x && a.y===b.y 
}

function cellInCat(c) { 
  return cat.some(seg=>cellsEqual(seg,c)) 
}

function spawnApple() {
  let kind = 'good';
  if(applesEaten >= 10){ kind = Math.random() < 0.32 ? 'bad' : 'good'; } //APFELS
  let pos; do{ pos = {x:rnd(0,SIZE-1), y:rnd(0,SIZE-1)}; } while(cellInCat(pos));
  apple = pos; appleKind = kind;
}

function setDir(nx,ny) { 
  if(cat.length>1 && (nx===-dir.x && ny===-dir.y)) return; 
  pendingDir = {x:nx,y:ny}; 
}

document.addEventListener('keydown', e=>{
  if(e.key==='ArrowLeft' || e.key.toLowerCase()==='a') setDir(-1,0);
  if(e.key==='ArrowRight'|| e.key.toLowerCase()==='d') setDir(1,0);
  if(e.key==='ArrowUp'   || e.key.toLowerCase()==='w') setDir(0,-1);
  if(e.key==='ArrowDown' || e.key.toLowerCase()==='s') setDir(0,1);
  if(e.key.toLowerCase()==='r') { hideVideo(); hideOverlay(); reset(); playing=true; loop(); }
});

const btnUp = document.getElementById('btn-up');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnDown = document.getElementById('btn-down');

function addMultiEventListener(element, events, handler) {
  events.forEach(event => {
    element.addEventListener(event, handler, { passive: true });
  });
}

addMultiEventListener(btnUp, ['touchstart', 'mousedown'], () => setDir(0, -1));
addMultiEventListener(btnLeft, ['touchstart', 'mousedown'], () => setDir(-1, 0));
addMultiEventListener(btnRight, ['touchstart', 'mousedown'], () => setDir(1, 0));
addMultiEventListener(btnDown, ['touchstart', 'mousedown'], () => setDir(0, 1));

document.addEventListener('touchmove', function(e) {
  if (e.target.classList.contains('d-btn')) {
    e.preventDefault();
  }
}, { passive: false });

document.getElementById('startBtn').onclick = ()=>{ hideOverlay(); playing=true; loop(); };
document.getElementById('resetBtn').onclick = ()=>{ hideVideo(); hideOverlay(); reset(); playing=true; loop(); };

function hideOverlay(){ 
  document.getElementById('startOverlay').style.display='none'; 
}

function drawBoard(){
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#eceff1';
  for(let i=1;i<SIZE;i++){
    const x = Math.round(i*CELL)+.5;
    ctx.fillRect(x,0,1,canvas.height);
    const y = Math.round(i*CELL)+.5;
    ctx.fillRect(0,y,canvas.width,1);
  }
  ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1; ctx.strokeRect(.5,.5, canvas.width-1, canvas.height-1);
}

function drawApple(){
  const {x,y} = apple; const px = x*CELL, py = y*CELL; const cx = px+CELL/2, cy=py+CELL/2;
  ctx.save();
  if(appleKind==='good'){
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--good').trim() || '#e53935';
    ctx.beginPath(); ctx.ellipse(cx,cy, CELL*0.32, CELL*0.28, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.ellipse(cx+CELL*0.12, cy-CELL*0.28, CELL*0.12, CELL*0.07, Math.PI/6, 0, Math.PI*2); ctx.fill();
  }else{
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bad').trim() || '#00ff00';
    ctx.beginPath(); ctx.ellipse(cx,cy, CELL*0.32, CELL*0.28, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.ellipse(cx+CELL*0.12, cy-CELL*0.28, CELL*0.12, CELL*0.07, Math.PI/6, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawCat(){
  for(let i=0;i<cat.length;i++){
    const seg = cat[i]; const px=seg.x*CELL, py=seg.y*CELL; const isHead = i===cat.length-1;
    if(isHead){ drawCatHead(px,py,dir); } else { drawCatBody(px,py,i); }
  }
}

function drawCatBody(px,py,index){
  ctx.fillStyle = '#0b0b0b'; ctx.fillRect(px+2,py+2,CELL-4,CELL-4);
  if(index%3===0){ ctx.fillStyle='#f6f7f8'; ctx.fillRect(px+CELL*0.3,py+CELL*0.2,CELL*0.4,CELL*0.6); }
}

function drawCatHead(px,py,dir){
  ctx.fillStyle = '#0b0b0b'; ctx.fillRect(px+1,py+1,CELL-2,CELL-2);
  ctx.fillStyle = '#0b0b0b';
  ctx.beginPath(); ctx.moveTo(px+CELL*0.25,py+CELL*0.25); ctx.lineTo(px+CELL*0.4,py+CELL*0.05); ctx.lineTo(px+CELL*0.45,py+CELL*0.35); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(px+CELL*0.75,py+CELL*0.25); ctx.lineTo(px+CELL*0.6,py+CELL*0.05); ctx.lineTo(px+CELL*0.55,py+CELL*0.35); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f6f7f8'; ctx.fillRect(px+CELL*0.3, py+CELL*0.5, CELL*0.4, CELL*0.26);
  ctx.fillStyle = '#2dd4bf';
  ctx.fillRect(px+CELL*0.35, py+CELL*0.38, Math.max(2, CELL*0.08), Math.max(2, CELL*0.08));
  ctx.fillRect(px+CELL*0.57, py+CELL*0.38, Math.max(2, CELL*0.08), Math.max(2, CELL*0.08));
  ctx.fillStyle = '#ff9aa2'; ctx.fillRect(px+CELL*0.49, py+CELL*0.56, Math.max(2, CELL*0.06), Math.max(2, CELL*0.06));
  ctx.strokeStyle = '#f6f7f8'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px+CELL*0.28, py+CELL*0.6); ctx.lineTo(px+CELL*0.1, py+CELL*0.58);
  ctx.moveTo(px+CELL*0.28, py+CELL*0.64); ctx.lineTo(px+CELL*0.08, py+CELL*0.66);
  ctx.moveTo(px+CELL*0.72, py+CELL*0.6); ctx.lineTo(px+CELL*0.9, py+CELL*0.58);
  ctx.moveTo(px+CELL*0.72, py+CELL*0.64); ctx.lineTo(px+CELL*0.92, py+CELL*0.66); ctx.stroke();
}

function draw(){ 
  if (blackout) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  drawBoard(); drawApple(); drawCat(); 
}

let raf, lastTick=0;
function loop(ts=0){ if(!playing) return; if(!lastTick) lastTick = ts; if(ts - lastTick >= tickMs){ step(); lastTick = ts; } draw(); raf = requestAnimationFrame(loop); }
function step(){
  if(pendingDir){ dir = pendingDir; pendingDir = null; }
  const head = {x:cat[cat.length-1].x + dir.x, y:cat[cat.length-1].y + dir.y};
  head.x = (head.x + SIZE) % SIZE; head.y = (head.y + SIZE) % SIZE;
  if(cat.some(seg=>cellsEqual(seg,head))){ return gameOver('bwomp'); }
  cat.push(head);
  if(cellsEqual(head, apple)){
    if(appleKind==='bad'){ applesEaten++; updateHud(); return triggerBadApple(); }
    score += 10; applesEaten++; updateHud(); spawnApple(); tickMs = Math.max(75, SPEED_BASE - Math.floor(applesEaten * 1.5));
  } else { cat.shift(); }
}
function gameOver(msg){ 
  playing = false; cancelAnimationFrame(raf); 
}

// IF IT HAS A SCREEN ...
const badVideo = document.getElementById('badVideo');
const shatterFx = document.getElementById('shatterFx');

badVideo.src = 'bad-apple.mp4';
shatterFx.src = 'glass-shatter.mp3';

function triggerBadApple(){
  if(badTriggered) return; 
  const stage = document.getElementById('stage');
  const wrap = document.getElementById('videoWrap');
  badTriggered = true;
  playing = false;
  cancelAnimationFrame(raf);

  document.body.classList.add("dark");
  blackout = true;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (isMobile) {
    stage.classList.add('mobile-fullscreen-video');
    wrap.classList.add('mobile-fullscreen-video');

    document.querySelector('.mobile-controls').style.display = 'none';

    if (screen.orientation && screen.orientation.lock) {
      try {
        screen.orientation.lock('landscape');
      } catch (e) {
        console.log('Could not lock orientation', e);
      }
    }
  } else {
    stage.style.width = (stage.offsetWidth + 450) + "px";
  }

  try {
    shatterFx.playbackRate = 1.35;
    shatterFx.currentTime = 0;
    shatterFx.volume = 1.0;
    shatterFx.play();
  } catch(e) {}

  wrap.classList.add('show');
  wrap.style.opacity = 0;
  try { 
    badVideo.currentTime = 0; 

    if (isMobile && badVideo.requestFullscreen) {
      badVideo.play().then(() => {
        try {
          badVideo.requestFullscreen();
        } catch(e) {}
      });
    } else {
      badVideo.play();
    }
  } catch(e){}

  setTimeout(()=>{
    wrap.style.opacity = 1; 
    blackout = false;
  }, 5000);
}

function hideVideo(){ 
  const stage = document.getElementById('stage');
  const wrap = document.getElementById('videoWrap');
  
  wrap.classList.remove('show');
  wrap.style.opacity='';
  
  try { 
    badVideo.pause(); 
    
    if (isMobile) {
      stage.classList.remove('mobile-fullscreen-video');
      wrap.classList.remove('mobile-fullscreen-video');
      document.querySelector('.mobile-controls').style.display = '';
      
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    } else {
      stage.style.width = ""; 
    }
  } catch(e){}
  
  document.body.classList.remove('dark');
  blackout = false;
  draw();
}

reset();

const stage = document.getElementById('stage');
function resize(){
    const rect = stage.getBoundingClientRect();
    const cssSize = Math.min(rect.width, rect.height);
    const dpr = window.devicePixelRatio || 1;
    const desiredCell = Math.floor(cssSize / SIZE);
    const trueCss = desiredCell * SIZE;
    canvas.style.width = trueCss + 'px';
    canvas.style.height = trueCss + 'px';
    canvas.width = Math.floor(trueCss * dpr);
    canvas.height = Math.floor(trueCss * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    CELL = desiredCell;
    draw();
} new ResizeObserver(resize).observe(stage);

function detectMobile() {
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
             (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
             (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
             
  return isMobile;
}

function tryForceLandscape() {
  if (!isMobile) return;
  
  if (screen.orientation && screen.orientation.lock) {
    try {
      screen.orientation.lock('landscape').catch(e => {
        console.log('Could not lock orientation', e);
      });
    } catch(e) {
      console.log('Orientation lock failed', e);
    }
  }
}

function checkOrientation() {
  if (!isMobile) return;
  
  const isPortrait = window.matchMedia("(orientation: portrait)").matches;
  const notice = document.querySelector('.landscape-notice');
  
  if (isPortrait) {
    notice.style.display = 'flex';
  } else {
    notice.style.display = 'none';
  }
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function positionDpad() {
  if (!isMobile) return;
  
  const mobileControls = document.querySelector('.mobile-controls');
  
  if (window.innerWidth > window.innerHeight) {
    mobileControls.style.right = '30px';
    mobileControls.style.left = 'auto';
    mobileControls.style.bottom = '30px';
    mobileControls.style.transform = 'none';
  } else {
    mobileControls.style.display = 'none';
  }
  
  // iOS specific adjustments
  if (isiOS()) {
  }
}

window.addEventListener('load', () => {
  detectMobile();
  
  if (isMobile) {
    checkOrientation();
    positionDpad();
    tryForceLandscape();
    
    badVideo.setAttribute('playsinline', '');
    badVideo.setAttribute('webkit-playsinline', '');
    badVideo.controls = false;
  }
});

window.addEventListener('resize', () => {
  checkOrientation();
  positionDpad();
});

window.addEventListener('orientationchange', () => {
  checkOrientation();
  positionDpad();
  
  setTimeout(() => {
    resize();
  }, 300);
});