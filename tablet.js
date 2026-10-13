// Expand the work area without hiding the return button or requiring browser fullscreen.
const focusButton=document.getElementById('focusCanvas');
focusButton.addEventListener('click',()=>{
 const enabled=document.body.classList.toggle('canvas-focus');
 focusButton.textContent=enabled?'↙ 기본 화면':'⛶ 작업판 크게';
 focusButton.setAttribute('aria-pressed',String(enabled));
 if(enabled)window.scrollTo({top:0,behavior:'instant'});
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&document.body.classList.contains('canvas-focus')){
  document.body.classList.remove('canvas-focus');focusButton.textContent='⛶ 작업판 크게';focusButton.setAttribute('aria-pressed','false');
 }
});
