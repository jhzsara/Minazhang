const {createClient}=window.supabase;
const client=createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
const modal=document.getElementById('modal'),content=document.getElementById('modal-content'),mobileMenu=document.getElementById('mobileMenu');
const formTemplates={
join:()=>`<span class="eyebrow">JOIN MINAZHANG</span><h3>Create your account</h3><p>1 month free, then €4.99/month. Adults 18+ only.</p><form id="joinForm"><label>Display name<input name="display_name" autocomplete="nickname" required placeholder="Your name"></label><label>Email<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><label>Password<input name="password" type="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters"></label><label class="checkbox"><input name="age" type="checkbox" required> I confirm I am 18 or older and accept the <a href="terms.html" target="_blank">Terms</a> and <a href="privacy.html" target="_blank">Privacy Notice</a>.</label><div id="formError" class="form-error" hidden></div><button class="btn" type="submit">Create account</button></form><p class="modal-note">Payment credentials are handled by the payment provider, not stored by this website.</p><div class="modal-switch">Already have an account? <button type="button" data-switch="login">Log in</button></div>`,
login:()=>`<span class="eyebrow">WELCOME BACK</span><h3>Log in</h3><p>Access your private conversation.</p><form id="loginForm"><label>Email<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><label>Password<input name="password" type="password" autocomplete="current-password" required placeholder="Your password"></label><div id="formError" class="form-error" hidden></div><button class="btn" type="submit">Log in</button></form><div class="modal-switch">New here? <button type="button" data-switch="join">Create an account</button></div>`
};
function openModal(type){content.innerHTML=formTemplates[type]();modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');wireForms();content.querySelector('input')?.focus();}
function closeModal(){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');}
async function wireForms(){
content.querySelectorAll('form').forEach(form=>form.addEventListener('submit',async e=>{
e.preventDefault();const err=form.querySelector('.form-error');err.hidden=false;err.textContent='Working…';
const fd=new FormData(form);const email=fd.get('email'),password=fd.get('password');
if(form.id==='joinForm'){
const display_name=String(fd.get('display_name')||'').trim();
const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name}}});
if(error){err.textContent=error.message;return;}
if(data.session){location.href='dashboard.html';return;}
err.textContent='Account created. Check your email to confirm your account, then log in.';
}else{
const {data,error}=await client.auth.signInWithPassword({email,password});
if(error){err.textContent=error.message;return;}location.href='dashboard.html';
}}));
content.querySelectorAll('[data-switch]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.switch)));
}
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.open)));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
mobileMenu?.addEventListener('click',()=>{let n=document.querySelector('.mobile-nav');if(!n){n=document.createElement('div');n.className='mobile-nav';n.innerHTML='<a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><button data-open="login">Log in</button><button data-open="join">Join</button>';document.querySelector('.site-header').appendChild(n);n.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{n.classList.remove('open');openModal(b.dataset.open)}));n.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>n.classList.remove('open')));}n.classList.toggle('open');});
