const {createClient}=window.supabase;
const client=createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
const modal=document.getElementById('modal'),content=document.getElementById('modal-content'),mobileMenu=document.getElementById('mobileMenu');
const redirectUrl=()=>new URL('dashboard.html',window.location.href).href;
const formTemplates={
join:()=>`<span class="eyebrow">JOIN MINAZHANG</span><h3>Create your account</h3><p>1 month free. Adults 18+ only.</p><form id="joinForm"><label>Display name<input name="display_name" autocomplete="nickname" required placeholder="Your name"></label><label>Email<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><label>Password<input name="password" type="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters"></label><label class="checkbox"><input name="age" type="checkbox" required> <span>I confirm I am 18 or older and accept the <a href="terms.html" target="_blank">Terms</a> and <a href="privacy.html" target="_blank">Privacy Notice</a>.</span></label><div id="formError" class="form-error" hidden></div><button class="btn" type="submit">Create account</button></form><p class="modal-note">Payment credentials are handled by the payment provider. MinaZhang may only receive limited billing details the provider shares.</p><div class="modal-switch">Already have an account? <button type="button" data-switch="login">Log in</button></div>`,
login:()=>`<span class="eyebrow">WELCOME BACK</span><h3>Log in</h3><p>Access your private conversation.</p><form id="loginForm"><label>Email<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><label>Password<input name="password" type="password" autocomplete="current-password" required placeholder="Your password"></label><div id="formError" class="form-error" hidden></div><button class="btn" type="submit">Log in</button></form><div class="modal-switch">New here? <button type="button" data-switch="join">Create an account</button></div>`
};
function openModal(type){content.innerHTML=formTemplates[type]();modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');wireForms();content.querySelector('input')?.focus();}
function closeModal(){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');}
function showConfirmation(email,err){err.textContent='Account created. You can log in now.';}
async function wireForms(){
content.querySelectorAll('form').forEach(form=>form.addEventListener('submit',async e=>{
e.preventDefault();const err=form.querySelector('.form-error');err.hidden=false;err.textContent='Working…';
const fd=new FormData(form),email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||'');
if(form.id==='joinForm'){
const display_name=String(fd.get('display_name')||'').trim();
const response=await fetch(window.SUPABASE_URL+'/functions/v1/instant-signup',{method:'POST',headers:{'Content-Type':'application/json',apikey:window.SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify({email,password,display_name,age_confirmed:!!fd.get('age')})});const data=await response.json().catch(()=>({}));const error=!response.ok?{message:data.error||'Could not create account right now.'}:null;
if(error){err.textContent=error.message;return;}
if(data.session){location.href='dashboard.html';return;}
showConfirmation(email,err);
}else{
const {error}=await client.auth.signInWithPassword({email,password});
if(error){err.textContent=error.message;return;}location.href='dashboard.html';
}}));
content.querySelectorAll('[data-switch]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.switch)));
}
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.open)));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
mobileMenu?.addEventListener('click',()=>{let n=document.querySelector('.mobile-nav');if(!n){n=document.createElement('div');n.className='mobile-nav';n.innerHTML='<a href="#inside">Inside</a><a href="#vibe">Your vibe</a><a href="#membership">Membership</a><a href="#faq">FAQ</a><button data-open="login">Log in</button><button data-open="join">Join free</button>';document.querySelector('.site-header').appendChild(n);n.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{n.classList.remove('open');openModal(b.dataset.open)}));n.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>n.classList.remove('open')));}n.classList.toggle('open');});
(async()=>{const {data:{session}}=await client.auth.getSession();if(session&&location.hash.includes('access_token'))location.href='dashboard.html';})();
