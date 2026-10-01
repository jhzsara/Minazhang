const modal=document.getElementById('modal'), content=document.getElementById('modal-content');
const forms={
 join:`<span class="eyebrow">JOIN MINAZHANG</span><h3>Create your account</h3><p>1 month free, then €4.99/month. Adults 18+ only.</p><label>Display name<input placeholder="Your name"></label><label>Email<input type="email" placeholder="you@example.com"></label><label>Password<input type="password" placeholder="Create a password"></label><button class="btn">Continue</button>`,
 login:`<span class="eyebrow">WELCOME BACK</span><h3>Log in</h3><p>Access your private conversation.</p><label>Email<input type="email" placeholder="you@example.com"></label><label>Password<input type="password" placeholder="Your password"></label><button class="btn">Log in</button>`
};
function openModal(type){content.innerHTML=forms[type]||'';modal.classList.remove('hidden')}
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.open)));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>modal.classList.add('hidden')));
modal.addEventListener('click',e=>{if(e.target.dataset.close!==undefined)modal.classList.add('hidden')});
