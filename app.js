const API="https://api.themoviedb.org/3";
const IMG="https://image.tmdb.org/t/p/";
const TOKEN_KEY="minaflix_tmdb_token";
const REGION_KEY="minaflix_region";
const LIST_KEY="minaflix_watchlist";
let token=localStorage.getItem(TOKEN_KEY)||"";
let region=localStorage.getItem(REGION_KEY)||"NL";
let currentView="home",cataloguePage=1,catalogueType="movie",searchTimer=null,activeItem=null,toastTimer=null;
const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const titleOf=item=>item.title||item.name||"Untitled";
const yearOf=item=>(item.release_date||item.first_air_date||"").slice(0,4);
const typeOf=item=>item.media_type||item._type||(item.title?"movie":"tv");
const listGet=()=>{try{return JSON.parse(localStorage.getItem(LIST_KEY)||"[]")}catch{return []}};
function listSet(items){localStorage.setItem(LIST_KEY,JSON.stringify(items));updateListCount()}
function updateListCount(){$("listCount").textContent=listGet().length}
function isSaved(item){return listGet().some(x=>x.id===item.id&&typeOf(x)===typeOf(item))}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2500)}
function poster(path,size="w342"){return path?IMG+size+path:""}
function imageOrPlaceholder(path,label){return path?'<img loading="lazy" src="'+poster(path)+'" alt="'+escapeHTML(label)+'">':'<div class="poster-placeholder">MF</div>'}
function setToken(value){token=value.trim();if(token)localStorage.setItem(TOKEN_KEY,token);else localStorage.removeItem(TOKEN_KEY)}
async function api(path,params={},auth=token){
 if(!auth)throw new Error("Connect your TMDB token in settings first.");
 const url=new URL(API+path);
 Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=="")url.searchParams.set(k,v)});
 const headers={"Accept":"application/json"};
 if(auth.length>50)headers.Authorization="Bearer "+auth;else url.searchParams.set("api_key",auth);
 const response=await fetch(url,{headers});
 if(!response.ok){let msg="TMDB request failed ("+response.status+").";try{const data=await response.json();msg=data.status_message||msg}catch{}throw new Error(msg)}
 return response.json();
}
function setHero(item){
 if(!item)return;
 const title=titleOf(item),backdrop=item.backdrop_path;
 if(backdrop)$("heroArt").style.backgroundImage='url("'+IMG+"w1280"+backdrop+'")';
 $("heroKicker").textContent=(typeOf(item)==="tv"?"SERIES":"FEATURED FILM")+" · "+(yearOf(item)||"DISCOVER");
 $("heroTitle").innerHTML=escapeHTML(title).replace(/\s+/, " ")+"<br><em>Worth staying in for.</em>";
 $("heroCopy").textContent=item.overview||"Explore the story, cast, trailer and legal viewing options.";
 $("heroExplore").onclick=()=>openDetail(item);
}
function cardHTML(item){
 const type=typeOf(item),saved=isSaved(item),rating=Number(item.vote_average||0).toFixed(1);
 return '<article class="movie-card" data-id="'+item.id+'" data-type="'+type+'"><div class="poster-wrap">'+imageOrPlaceholder(item.poster_path,titleOf(item))+'<span class="rating">★ '+rating+'</span><button class="save-btn '+(saved?"saved":"")+'" data-save="'+item.id+'" data-type="'+type+'" aria-label="'+(saved?"Remove from":"Add to")+' list">'+(saved?"✓":"+ ")+'</button><div class="poster-overlay"><span>VIEW DETAILS ↗</span></div></div><div class="card-title">'+escapeHTML(titleOf(item))+'</div><div class="card-meta">'+(yearOf(item)||"Release date TBA")+' · '+(type==="tv"?"SERIES":"MOVIE")+'</div></article>';
}
function renderCards(container,items){$(container).innerHTML=items?.length?items.map(cardHTML).join(""):'<p class="empty-state">No titles to show yet.</p>'}
function showConnect(){ $("connectPanel").classList.toggle("hidden",!!token); }
function showView(view){
 currentView=view;
 ["homeView","catalogueView","watchlistView"].forEach(id=>$(id).classList.add("hidden"));
 $("searchSection").classList.add("hidden");
 if(view==="home")$("homeView").classList.remove("hidden");
 if(view==="watchlist"){ $("watchlistView").classList.remove("hidden");renderWatchlist(); }
 if(view==="movies"||view==="tv"){ $("catalogueView").classList.remove("hidden");catalogueType=view==="tv"?"tv":"movie";cataloguePage=1;loadCatalogue(true); }
 document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 window.scrollTo({top:view==="home"?0:440,behavior:"smooth"});
}
async function loadHome(){
 if(!token){showConnect();return}
 showConnect();
 try{
  const [trend,popular,series]=await Promise.all([api("/trending/all/week",{language:"en-US"}),api("/movie/popular",{language:"en-US",region}),api("/tv/popular",{language:"en-US",region})]);
  const valid=(trend.results||[]).filter(x=>x.poster_path);
  renderCards("trendingRow",valid.slice(0,16));renderCards("popularRow",(popular.results||[]).slice(0,16).map(x=>({...x,media_type:"movie"})));renderCards("seriesRow",(series.results||[]).slice(0,16).map(x=>({...x,media_type:"tv"})));
  if(valid[0])setHero(valid[0]);
 }catch(error){toast(error.message)}
}
async function loadCatalogue(reset=false){
 if(!token){$("catalogueGrid").innerHTML='<p class="empty-state">Connect your TMDB token in settings to browse titles.</p>';return}
 const sort=$("sortSelect").value;
 const endpoint=sort==="rating"?"/"+catalogueType+"/top_rated":sort==="recent"?(catalogueType==="movie"?"/movie/now_playing":"/tv/on_the_air"):"/"+catalogueType+"/popular";
 try{
  $("loadMore").textContent="Loading…";$("loadMore").classList.remove("hidden");
  const data=await api(endpoint,{language:"en-US",region,page:cataloguePage});
  const items=(data.results||[]).map(x=>({...x,media_type:catalogueType}));
  if(reset)$("catalogueGrid").innerHTML="";
  $("catalogueGrid").insertAdjacentHTML("beforeend",items.map(cardHTML).join(""));
  $("catalogueEyebrow").textContent=catalogueType==="tv"?"THE SERIES COLLECTION":"THE MOVIE COLLECTION";
  $("catalogueTitle").textContent=catalogueType==="tv"?"Series":"Movies";
  $("catalogueDescription").textContent=sort==="rating"?"The highest-rated titles.":sort==="recent"?"Recently released and currently airing.":"Popular with viewers right now.";
  $("loadMore").classList.toggle("hidden",cataloguePage>=Math.min(data.total_pages||1,500));
  $("loadMore").textContent="Load more titles";
 }catch(error){$("loadMore").classList.add("hidden");toast(error.message)}
}
function renderWatchlist(){
 const items=listGet();renderCards("watchlistGrid",items);$("emptyList").classList.toggle("hidden",items.length>0);
}
function toggleSave(item){
 const items=listGet(),type=typeOf(item),exists=items.some(x=>x.id===item.id&&typeOf(x)===type);
 const next=exists?items.filter(x=>!(x.id===item.id&&typeOf(x)===type)):[{...item,media_type:type},...items];
 listSet(next);toast(exists?"Removed from your list":"Added to your list");
 if(currentView==="watchlist")renderWatchlist();
 if(activeItem&&activeItem.id===item.id)renderDetailButtons();
 document.querySelectorAll('.save-btn[data-id="'+item.id+'"][data-type="'+type+'"]').forEach(b=>{b.classList.toggle("saved",!exists);b.textContent=exists?"+":"✓"});
}
function renderDetailButtons(){
 const saved=activeItem&&isSaved(activeItem);
 const button=$("detailSave");if(button){button.classList.toggle("saved",!!saved);button.textContent=saved?"✓ Added to my list":"+ Add to my list"}
}
async function openDetail(item){
 activeItem={...item,media_type:typeOf(item)};
 $("detailContent").innerHTML='<div class="detail-body"><p class="empty-state">Loading title details…</p></div>';
 $("detailModal").classList.remove("hidden");
 try{
  const type=typeOf(item),[details,watchData]=await Promise.all([api("/"+type+"/"+item.id,{language:"en-US",append_to_response:"videos,credits"}),api("/"+type+"/"+item.id+"/watch/providers")]);details["watch/providers"]=watchData;
  activeItem={...details,media_type:type};
  const providers=details["watch/providers"]?.results?.[region]||{};
  const cast=(details.credits?.cast||[]).slice(0,8);
  const trailer=(details.videos?.results||[]).find(v=>v.site==="YouTube"&&v.type==="Trailer"&&v.official)|| (details.videos?.results||[]).find(v=>v.site==="YouTube"&&v.type==="Trailer");
  const providerTypes=[["flatrate","STREAM"],["free","FREE"],["ads","WITH ADS"],["rent","RENT"],["buy","BUY"]];
  const groups=providerTypes.map(([key,label])=>({key,label,items:providers[key]||[]})).filter(g=>g.items.length);
  const providersHTML=groups.length?'<div class="provider-groups">'+groups.map(g=>'<div class="provider-group"><h4>'+g.label+'</h4><div class="providers">'+g.items.map(p=>'<div class="provider">'+(p.logo_path?'<img src="'+IMG+'w92'+p.logo_path+'" alt="">':'')+'<span>'+escapeHTML(p.provider_name)+'</span></div>').join("")+'</div></div>').join("")+'</div>':'<p class="provider-note">No provider listing was returned for '+escapeHTML(region)+'. Check another region or search the title on your preferred licensed service.</p>';
  $("detailContent").innerHTML='<div class="detail-hero" style="background-image:url('+(details.backdrop_path?'"'+IMG+'w1280'+details.backdrop_path+'"':'none')+')"><div class="detail-hero-content"><span class="eyebrow">'+(type==="tv"?"SERIES":"MOVIE")+' · '+escapeHTML(yearOf(details)||"")+'</span><h2 id="detailTitle">'+escapeHTML(titleOf(details))+'</h2><div class="detail-tags"><span class="tag">★ '+Number(details.vote_average||0).toFixed(1)+'/10</span>'+(details.genres||[]).slice(0,4).map(g=>'<span class="tag">'+escapeHTML(g.name)+'</span>').join("")+'</div></div></div><div class="detail-body"><p class="detail-overview">'+escapeHTML(details.overview||"No synopsis is available.")+'</p><div class="detail-actions"><button class="primary-btn" id="detailSave">+ Add to my list</button>'+(trailer?'<button class="secondary-btn" id="trailerBtn">▶ Watch trailer</button>':'')+(providers.link?'<button class="secondary-btn" id="providerLink">Where to watch ↗</button>':'')+'</div><h3 class="detail-subhead">WHERE TO WATCH IN '+escapeHTML(region)+'</h3>'+providersHTML+(cast.length?'<h3 class="detail-subhead">CAST</h3><div class="cast-row">'+cast.map(person=>'<div class="cast-person">'+(person.profile_path?'<img loading="lazy" src="'+IMG+'w185'+person.profile_path+'" alt="'+escapeHTML(person.name)+'">':'<div class="poster-placeholder" style="height:115px">MF</div>')+'<strong>'+escapeHTML(person.name)+'</strong><small>'+escapeHTML(person.character||"")+'</small></div>').join("")+'</div>':'')+'<p class="provider-note">Availability is provided by TMDB and may change. Confirm the offer and region on the provider website. MINAFLIX does not host or play the film.</p></div>';
  renderDetailButtons();
  $("detailSave").onclick=()=>toggleSave(activeItem);
  if(trailer)$("trailerBtn").onclick=()=>window.open("https://www.youtube.com/watch?v="+encodeURIComponent(trailer.key),"_blank","noopener");
  if(providers.link)$("providerLink").onclick=()=>window.open(providers.link,"_blank","noopener");
 }catch(error){$("detailContent").innerHTML='<div class="detail-body"><p class="empty-state">'+escapeHTML(error.message)+'</p></div>'}
}
async function runSearch(query){
 if(!token){showSettings();return}
 if(!query.trim())return;
 $("homeView").classList.add("hidden");$("catalogueView").classList.add("hidden");$("watchlistView").classList.add("hidden");$("searchSection").classList.remove("hidden");
 $("searchHeading").textContent='Results for "'+query+'"';$("searchResults").innerHTML='<p class="empty-state">Searching…</p>';
 try{const data=await api("/search/multi",{query,include_adult:"false",language:"en-US",region,page:1});renderCards("searchResults",(data.results||[]).filter(x=>["movie","tv"].includes(x.media_type)&&x.poster_path))}
 catch(error){$("searchResults").innerHTML='<p class="empty-state">'+escapeHTML(error.message)+'</p>'}
}
function showSettings(){
 $("tokenInput").value=token;$("regionSelect").value=region;$("settingsModal").classList.remove("hidden");
}
function closeModals(){document.querySelectorAll(".modal-backdrop").forEach(x=>x.classList.add("hidden"))}
async function saveSettings(){
 const newToken=$("tokenInput").value.trim(),newRegion=$("regionSelect").value;
 if(!newToken){toast("Paste your TMDB token first.");return}
 const button=$("saveSettings");button.disabled=true;button.textContent="Checking…";
 try{
  await api("/configuration",{},newToken);
  setToken(newToken);region=newRegion;localStorage.setItem(REGION_KEY,region);closeModals();showConnect();toast("Catalogue connected.");loadHome();
 }catch(error){toast(error.message)}
 finally{button.disabled=false;button.textContent="Save settings"}
}
document.addEventListener("click",event=>{
 const viewButton=event.target.closest("[data-view]");if(viewButton){showView(viewButton.dataset.view);return}
 const saveButton=event.target.closest("[data-save]");if(saveButton){event.stopPropagation();const item=[...document.querySelectorAll('.movie-card[data-id="'+saveButton.dataset.save+'"][data-type="'+saveButton.dataset.type+'"]')].map(card=>({id:Number(card.dataset.id),media_type:card.dataset.type}))[0];const known=[...document.querySelectorAll(".movie-card")].map(card=>({id:Number(card.dataset.id),media_type:card.dataset.type}));const stored=listGet();const match=stored.find(x=>x.id===Number(saveButton.dataset.save)&&typeOf(x)===saveButton.dataset.type);if(match){toggleSave(match);return}const all=[...window.__catalogueItems||[]];const found=all.find(x=>x.id===Number(saveButton.dataset.save)&&typeOf(x)===saveButton.dataset.type);if(found)toggleSave(found);else{const sourceCard=saveButton.closest(".movie-card");const cardTitle=sourceCard?.querySelector(".card-title")?.textContent||"Saved title";const img=sourceCard?.querySelector("img");const posterPath=img?.src?.split("/w342").pop()||null;const fallback={id:Number(saveButton.dataset.save),media_type:saveButton.dataset.type,title:cardTitle,name:cardTitle,poster_path:posterPath};toggleSave(found||fallback)}return}
 const card=event.target.closest(".movie-card");if(card){const id=Number(card.dataset.id),type=card.dataset.type;const item=(window.__catalogueItems||[]).find(x=>x.id===id&&typeOf(x)===type)||listGet().find(x=>x.id===id&&typeOf(x)===type)||{id,media_type:type};openDetail(item)}
 const close=event.target.closest("[data-close]");if(close)closeModals();
});
$("settingsBtn").addEventListener("click",showSettings);$("heroSettings").addEventListener("click",showSettings);$("connectBtn").addEventListener("click",showSettings);
$("heroExplore").addEventListener("click",()=>showView("movies"));
$("saveSettings").addEventListener("click",saveSettings);
$("removeToken").addEventListener("click",()=>{setToken("");$("tokenInput").value="";showConnect();closeModals();toast("Catalogue disconnected.");});
$("sortSelect").addEventListener("change",()=>{cataloguePage=1;loadCatalogue(true)});
$("loadMore").addEventListener("click",()=>{cataloguePage++;loadCatalogue(false)});
$("searchInput").addEventListener("input",event=>{clearTimeout(searchTimer);const q=event.target.value.trim();if(!q){$("searchSection").classList.add("hidden");if(currentView==="home")$("homeView").classList.remove("hidden");return}searchTimer=setTimeout(()=>runSearch(q),400)});
$("clearSearch").addEventListener("click",()=>{$("searchInput").value="";$("searchSection").classList.add("hidden");if(currentView==="home")$("homeView").classList.remove("hidden")});
$("searchInput").addEventListener("keydown",e=>{if(e.key==="Enter"){clearTimeout(searchTimer);runSearch(e.target.value.trim())}});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModals();if(e.key==="/"&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();$("searchInput").focus()}});
document.querySelectorAll(".modal-backdrop").forEach(backdrop=>backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeModals()}));
const originalRenderCards=renderCards;
renderCards=function(container,items){window.__catalogueItems=[...(window.__catalogueItems||[]),...(items||[])];originalRenderCards(container,items)};
updateListCount();showConnect();if(token)loadHome();
