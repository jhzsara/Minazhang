const {createClient}=window.supabase;
const client=createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
const login=document.getElementById('devLogin'),codeForm=document.getElementById('devCode'),statusEl=document.getElementById('devStatus');
async function refresh(){
 const {data:{session}}=await client.auth.getSession();
 if(!session){login.hidden=false;codeForm.hidden=true;return;}
 const {data:profile}=await client.from('profiles').select('role').eq('id',session.user.id).maybeSingle();
 if(profile?.role==='admin'){location.href='admin.html';return;}
 login.hidden=true;codeForm.hidden=false;statusEl.textContent='Signed in. Enter your developer code.';
}
login.addEventListener('submit',async e=>{e.preventDefault();const email=devEmail.value.trim().toLowerCase();if(email!=='jhzsara7@gmail.com'){statusEl.textContent='That account is not a developer account.';return;}statusEl.textContent='Signing in…';const {error}=await client.auth.signInWithPassword({email,password:devPassword.value});if(error){statusEl.textContent=error.message;return;}await refresh();});
codeForm.addEventListener('submit',async e=>{e.preventDefault();statusEl.textContent='Checking code…';const {data,error}=await client.rpc('claim_admin',{access_code:accessCode.value.trim()});if(error){statusEl.textContent=error.message;return;}if(!data){statusEl.textContent='That developer code is not correct.';return;}location.href='admin.html';});
refresh();