import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../config/supabase.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let currentUser = null;
let currentOrgId = null;
let currentOrgName = "";
let isSuperAdmin = false;
let activeElectionId = "";
let activeElectionStatus = "";

function tick(){ $("clock").textContent = new Intl.DateTimeFormat("id-ID", {dateStyle:"medium",timeStyle:"medium"}).format(new Date()); }
tick(); setInterval(tick,1000); $("year").textContent = new Date().getFullYear();
const savedTheme = localStorage.getItem("evpro-theme-v2");
if (savedTheme === "light") document.body.classList.add("light");
$("themeBtn").onclick = () => {
  document.body.classList.toggle("light");
  localStorage.setItem("evpro-theme-v2", document.body.classList.contains("light") ? "light" : "dark");
};
// Kontras warna dan efek RGB otomatis, tanpa mengubah struktur halaman.
const visualStyle = document.createElement("style");
visualStyle.textContent = `
:root{--ev-text:#edf6ff;--ev-muted:#b8c9df;--ev-panel:#102238;--ev-field:#172d46;--ev-line:#2d4968;--ev-accent:#20d5e8}
body{color:var(--ev-text)!important}
body.light{--ev-text:#15263b;--ev-muted:#42556d;--ev-panel:#fff;--ev-field:#f3f7fc;--ev-line:#cbd8e6;--ev-accent:#087f95;color:var(--ev-text)!important}
#adminView,.org,.panel,.card{color:var(--ev-text)}
#adminView p,.org p,.muted,label{color:var(--ev-muted)!important}
#adminView input,#adminView select,#adminView textarea,.org input,.org select,.org textarea{background:var(--ev-field)!important;color:var(--ev-text)!important;border:1px solid var(--ev-line)!important;border-radius:10px;padding:11px;max-width:100%}
#adminView select option,.org select option{background:var(--ev-panel);color:var(--ev-text)}
#adminView h3,.org h3{color:var(--ev-accent)}
.rgb,.menu-card,.primary{animation:evRgbHue 9s linear infinite}
@keyframes evRgbHue{to{filter:hue-rotate(360deg)}}
.ev-rgb-border{border:1px solid transparent;background:linear-gradient(var(--ev-panel),var(--ev-panel)) padding-box,linear-gradient(120deg,#ff315c,#ffb52e,#36e68a,#22d3ee,#8b5cf6,#ff315c) border-box;background-size:100% 100%,300% 300%;animation:evRgbBorder 7s linear infinite}
@keyframes evRgbBorder{to{background-position:0 0,300% 0}}
.ev-candidate-row{display:flex;align-items:center;gap:12px;padding:12px;margin:10px 0;border:1px solid var(--ev-line);border-radius:13px;background:var(--ev-panel);color:var(--ev-text)}
.ev-candidate-row img,.ev-photo-placeholder{width:64px;height:76px;object-fit:cover;object-position:center;border-radius:9px;background:var(--ev-field);display:grid;place-items:center;flex-shrink:0}
.ev-candidate-row .ev-grow{flex:1;min-width:0}.ev-delete{background:#b42335;color:#fff}.ev-preview{width:100px;height:120px;object-fit:cover;border-radius:10px;display:block;margin-top:8px}
.ev-candidate-photo{width:100%;height:420px;max-height:420px;object-fit:contain;object-position:center;background:#081525;border-radius:12px;display:block}
.ev-candidate-card{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;padding:16px;margin:12px 0;border:1px solid var(--ev-line);border-radius:16px;background:var(--ev-panel);color:var(--ev-text)}
.ev-candidate-details{min-width:0}.ev-candidate-name{font-weight:900;color:var(--ev-accent);font-size:16px}
.ev-candidate-buttons{display:flex;gap:8px;flex-wrap:wrap}.ev-candidate-buttons button{padding:9px 14px;border-radius:10px}
.ev-photo-placeholder{width:100%;height:420px;max-height:420px;border-radius:12px}
.ev-token-stats{margin:14px 0}.ev-token-result{display:grid;gap:10px;margin-top:14px}
.ev-token-result textarea{width:100%;min-height:230px;box-sizing:border-box;font-family:ui-monospace,monospace}
.ev-token-result button{justify-self:start;padding:10px 14px;border-radius:10px}

.ev-election-dashboard{display:grid;gap:18px;color:var(--ev-text)}
.ev-election-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:8px 2px}
.ev-election-heading h2{margin:5px 0;font-size:clamp(22px,3vw,30px);letter-spacing:-.5px}
.ev-election-heading p{margin:0;color:var(--ev-muted)}
.ev-kicker{font-size:10px;letter-spacing:1.7px;font-weight:800;color:var(--ev-accent)}
.ev-live-clock,.ev-total-pill{border:1px solid var(--ev-line);border-radius:30px;padding:9px 13px;color:var(--ev-muted);font-size:12px}
.ev-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.ev-stat{padding:17px;border:1px solid #1d79bd;border-radius:16px;background:linear-gradient(135deg,#102e4c,var(--ev-panel));display:grid;gap:5px;box-shadow:0 8px 24px #00152a33}
.ev-stat span{font-size:12px;color:var(--ev-muted)}.ev-stat strong{font-size:30px;line-height:1.2}.ev-stat small{font-size:11px;color:var(--ev-muted)}
.ev-stat.active{border-color:#159d70}.ev-stat.draft{border-color:#d59b22}.ev-stat.done{border-color:#8b5cf6}
.ev-election-create,.ev-election-list-panel,.ev-status-guide{padding:18px;border:1px solid var(--ev-line);border-radius:18px;background:var(--ev-panel);box-shadow:0 10px 30px #00152a22}
.ev-election-create h3,.ev-list-heading h3{margin:0 0 14px;color:var(--ev-accent)}
.ev-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.ev-form-grid>div{min-width:0}.ev-form-grid .ev-span-2{grid-column:1/-1}
.ev-form-grid input,.ev-form-grid textarea{width:100%;box-sizing:border-box}
.ev-inline-message{display:inline-block;margin-left:12px;color:var(--ev-muted)}
.ev-list-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.ev-list-heading h3{font-size:20px;margin:3px 0 0}
.ev-election-card{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:15px 0;border-top:1px solid var(--ev-line)}
.ev-election-main{display:flex;align-items:center;gap:13px;min-width:0}
.ev-election-number{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:var(--ev-field);color:var(--ev-accent);font-weight:800}
.ev-election-info{min-width:0}.ev-election-title{font-weight:800;overflow-wrap:anywhere}.ev-election-meta{font-size:11px;color:var(--ev-muted);margin-top:4px}
.ev-election-counts{display:flex;gap:8px;flex-wrap:wrap;margin-top:7px}.ev-election-counts span{font-size:10px;padding:4px 8px;border-radius:20px;background:var(--ev-field);color:var(--ev-muted)}
.ev-status{display:inline-block;border-radius:30px;padding:6px 11px;font-size:11px;font-weight:800;white-space:nowrap}
.ev-status-draft,.ev-guide-draft{background:#f6c45322;color:#e6aa28;border:1px solid #d99a26}
.ev-status-active,.ev-guide-active{background:#13c78422;color:#18bd80;border:1px solid #13a66e}
.ev-status-done,.ev-guide-done{background:#8b5cf622;color:#ad8aff;border:1px solid #8b5cf6}
.ev-election-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.ev-election-actions button{border-radius:10px;padding:9px 13px;border:1px solid var(--ev-line);background:var(--ev-field);color:var(--ev-text);font-weight:700;cursor:pointer}
.ev-election-actions .ev-activate{background:linear-gradient(135deg,#0ca76d,#087b55);color:#fff;border-color:#16c784}
.ev-election-actions button:disabled{opacity:.55;cursor:wait}
.ev-empty{padding:24px;text-align:center;color:var(--ev-muted)}
.ev-status-guide b{display:block;margin-bottom:12px}.ev-status-guide>div{display:flex;align-items:center;gap:10px;flex-wrap:wrap;color:var(--ev-muted);font-size:11px}
.ev-status-guide i{font-style:normal;color:var(--ev-accent);font-size:20px;margin:0 6px}
.ev-guide-draft,.ev-guide-active,.ev-guide-done{border-radius:20px;padding:5px 9px;font-weight:800}
body.light .ev-stat{background:linear-gradient(135deg,#fff,#edf5fc);box-shadow:0 8px 24px #29415b12}
body.light .ev-election-create,body.light .ev-election-list-panel,body.light .ev-status-guide{background:#fff}
.ev-election-dashboard{position:relative}
.ev-election-heading:before{content:"◈";font-size:28px;color:var(--ev-accent);margin-right:8px}
.ev-stat{position:relative;overflow:hidden}
.ev-stat:after{content:"";position:absolute;left:-20%;right:-20%;bottom:0;height:2px;background:linear-gradient(90deg,transparent,#16d9ef,#8b5cf6,transparent);animation:evScan 4s linear infinite}
@keyframes evScan{0%{transform:translateX(-40%)}100%{transform:translateX(40%)}}
.ev-deactivate{background:linear-gradient(135deg,#6b4aa5,#422c70)!important;color:#fff!important;border-color:#9b72e8!important}
.ev-remove{background:linear-gradient(135deg,#9b2737,#651d2a)!important;color:#fff!important;border-color:#d14a5e!important}
.ev-report-panel{display:grid;gap:16px}
.ev-report-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.ev-report-summary>div{padding:18px;border:1px solid var(--ev-line);border-radius:14px;background:var(--ev-panel);display:grid;gap:6px}
.ev-report-summary span{color:var(--ev-muted);font-size:12px}.ev-report-summary strong{font-size:26px;color:var(--ev-accent)}
.ev-report-table-wrap{overflow:auto;border:1px solid var(--ev-line);border-radius:14px}
.ev-report-table{width:100%;border-collapse:collapse;min-width:540px;color:var(--ev-text)}
.ev-report-table th,.ev-report-table td{padding:12px;text-align:left;border-bottom:1px solid var(--ev-line)}
.ev-report-table th{background:var(--ev-field);color:var(--ev-accent)}
.ev-report-actions{display:flex;gap:10px;flex-wrap:wrap}
.ev-report-actions button{padding:10px 15px;border:1px solid var(--ev-line);border-radius:10px;background:var(--ev-field);color:var(--ev-text);font-weight:700}
.ev-election-actions .ev-portal-open{background:linear-gradient(120deg,#075985,#0e7490);color:#fff;border-color:#22d3ee}
.ev-election-actions .ev-portal-copy{background:linear-gradient(120deg,#334155,#1e293b);color:#fff}
.ev-election-actions .ev-portal-qr{background:linear-gradient(120deg,#6d28d9,#4338ca);color:#fff;border-color:#a78bfa}
.ev-portal-qr-panel{margin:14px 0 0;padding:18px;border:1px solid #5b78a0;border-radius:15px;background:linear-gradient(140deg,#102c49,#101a32);display:flex;align-items:center;justify-content:space-between;gap:18px}
.ev-portal-qr-panel>div{display:grid;gap:8px}.ev-portal-qr-panel p{margin:0;color:#a9bfd5;font-size:12px}
.ev-portal-qr-panel small{color:#8fb5d4;overflow-wrap:anywhere;max-width:520px}
.ev-qr-canvas{width:220px;height:220px;background:#fff;border-radius:12px;padding:10px;display:grid;place-items:center}
.ev-qr-canvas img,.ev-qr-canvas canvas{max-width:100%;height:auto!important}
.ev-qr-close{align-self:flex-start;padding:8px 12px;border-radius:9px;border:1px solid #52708e;background:#1b3550;color:#fff;cursor:pointer}
@media(max-width:650px){.ev-portal-qr-panel{align-items:flex-start;flex-direction:column}.ev-qr-canvas{width:190px;height:190px}}

@media print{body *{visibility:hidden!important}#adminView,#adminView *{visibility:visible!important}#adminView{position:absolute;inset:0;background:#fff!important;color:#111!important}.ev-report-actions{display:none!important}.ev-report-table{color:#111!important}.ev-report-table th{background:#eee!important;color:#111!important}}

@media(max-width:760px){.ev-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ev-election-heading{align-items:flex-start;flex-direction:column}.ev-election-card{align-items:flex-start;flex-direction:column}.ev-election-actions{width:100%;justify-content:flex-start}.ev-form-grid{grid-template-columns:1fr}.ev-form-grid .ev-span-2{grid-column:auto}}

`;

visualStyle.textContent += `
#adminPanel,#adminView,#adminViewMessage,#adminViewMessage *,
#adminView button,#adminView input,#adminView select,#adminView textarea,
#stage6Tools,#stage7Tools,#stage6Tools *,#stage7Tools *,
.v21-control-panel,.v21-control-panel *{pointer-events:auto!important}
#adminView{position:relative!important;z-index:30!important;isolation:isolate}
#adminViewMessage{position:relative!important;z-index:31!important}
#adminView button,#adminViewMessage button,#stage6Tools button,#stage7Tools button,.v21-control-panel button{
 position:relative!important;z-index:32!important;cursor:pointer!important
}
`;
document.head.appendChild(visualStyle);
$("loginBtn").onclick = () => $("loginModal").classList.remove("hidden");
$("closeLogin").onclick = () => $("loginModal").classList.add("hidden");
const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("YOUR_PROJECT_REF") && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
$("connectionState").textContent = configured ? "Menguji koneksi Supabase…" : "Mode pratinjau — konfigurasi Supabase belum tersedia";

async function loadPublicOrganizations(){
  const grid = $("orgGrid"); grid.textContent = "Memuat daftar lembaga…";
  try {
    const {data,error} = await supabase.rpc("list_active_organizations"); if(error) throw error;
    grid.replaceChildren();
    if(!data?.length){grid.textContent="Belum ada lembaga aktif.";return;}
    data.forEach(org=>{const card=document.createElement("article");card.className="org";card.innerHTML=`<span class="badge">LEMBAGA</span><h3>${esc(org.organization_name)}</h3><p>Kode: ${esc(org.organization_slug)}</p><strong>PORTAL PEMILIHAN</strong>`;grid.append(card);});
  }catch(e){grid.textContent="Gagal memuat lembaga: "+e.message;}
}
async function testConnection(){try{const {error}=await supabase.from("organizations").select("id").limit(1);if(error)throw error;$("connectionState").textContent="Supabase berhasil terhubung";}catch(e){$("connectionState").textContent="Supabase terhubung / menunggu hak akses";console.warn(e.message);}}
if(configured){loadPublicOrganizations();testConnection();}

async function loadOrganizations(){
  const list=$("organizationList"), dropdown=$("adminOrganization");
  try{const {data,error}=await supabase.rpc("list_organizations");if(error)throw error;
    if(list){list.replaceChildren();(data||[]).forEach(org=>{
      const el=document.createElement("article");el.className="org v21-org-card";
      const status=String(org.organization_status||"inactive").toLowerCase();
      el.innerHTML=`<h3>${esc(org.organization_name)}</h3><p>Kode: ${esc(org.organization_slug)}</p><strong class="v21-org-status">STATUS: ${esc(status.toUpperCase())}</strong><div class="v21-actions"><button type="button" class="ghost v21-toggle-org">${status==="active"?"Nonaktifkan":"Aktifkan"} Lembaga</button><button type="button" class="ghost v21-reset-org">Reset Lembaga</button><button type="button" class="v21-delete-org danger">Hapus Permanen</button></div><p class="v21-org-message" role="status"></p>`;
      const msg=el.querySelector(".v21-org-message");
      el.querySelector(".v21-toggle-org").addEventListener("click",async()=>{
        const next=status==="active"?"inactive":"active";
        if(!confirm(`Ubah status ${org.organization_name} menjadi ${next.toUpperCase()}?`))return;
        try{const {error}=await supabase.rpc("set_organization_status",{p_org_id:org.organization_id,p_status:next});if(error)throw error;msg.textContent=`Status lembaga berhasil diubah menjadi ${next}.`;await loadOrganizations();await loadPublicOrganizations();}
        catch(err){msg.textContent="Gagal mengubah status: "+err.message;}
      });
      el.querySelector(".v21-reset-org").addEventListener("click",async()=>{
        const answer=prompt(`RESET SELURUH DATA PEMILIHAN untuk ${org.organization_name}? Data lembaga, pengaturan, dan akun admin dipertahankan. Ketik: RESET LEMBAGA`);
        if(answer!=="RESET LEMBAGA")return;
        try{const {error}=await supabase.rpc("reset_organization_data",{p_org_id:org.organization_id,p_confirmation:answer});if(error)throw error;msg.textContent="Data pemilihan lembaga berhasil direset.";if(currentOrgId===org.organization_id){activeElectionId="";activeElectionStatus="";const staleSelect=$("v21ElectionSelect");if(staleSelect)staleSelect.replaceChildren(new Option("Belum ada pemilihan",""));}await loadOrganizations();await loadPublicOrganizations();}
        catch(err){msg.textContent="Reset gagal: "+err.message;}
      });
      el.querySelector(".v21-delete-org").addEventListener("click",async()=>{
        const answer=prompt(`PERINGATAN: Hapus permanen ${org.organization_name} beserta pemilihan, kandidat, token, dan keanggotaan admin. Akun autentikasi tidak dihapus. Ketik: HAPUS PERMANEN`);
        if(answer!=="HAPUS PERMANEN")return;
        try{const {error}=await supabase.rpc("delete_organization_safe",{p_org_id:org.organization_id,p_confirmation:answer});if(error)throw error;msg.textContent="Lembaga berhasil dihapus permanen.";await loadOrganizations();await loadPublicOrganizations();}
        catch(err){msg.textContent="Penghapusan gagal: "+err.message;}
      });
      list.append(el);
    });}
    if(dropdown){dropdown.innerHTML='<option value="">Pilih lembaga…</option>';(data||[]).forEach(org=>{const op=document.createElement("option");op.value=org.organization_id;op.textContent=org.organization_name;dropdown.append(op);});}
  }catch(e){if(list)list.textContent="Gagal memuat lembaga: "+e.message;}
}


async function renderInstitutionBranding(){
  let panel=$("institutionBranding");
  if(!panel){panel=document.createElement("section");panel.id="institutionBranding";panel.className="org";$("orgAdminWelcome").parentElement.insertAdjacentElement("afterend",panel);}
  panel.innerHTML=`<h3>Identitas Lembaga pada Portal Pemilihan</h3><p>Atur nama tampilan dan logo yang akan terlihat oleh pemilih.</p>
    <label for="institutionDisplayName">Nama lembaga</label><input id="institutionDisplayName" type="text" maxlength="120" placeholder="Nama lembaga">
    <label for="institutionLogoFile">Unggah logo lembaga (PNG/JPG/WebP, maks. 300 KB)</label><input id="institutionLogoFile" type="file" accept="image/png,image/jpeg,image/webp">
    <div id="institutionLogoPreview" style="margin:10px 0"></div><button id="saveInstitutionBranding" type="button" class="primary">Simpan Identitas Lembaga</button><p id="institutionBrandingMessage" role="status"></p>`;
  const nameInput=$("institutionDisplayName"),fileInput=$("institutionLogoFile"),preview=$("institutionLogoPreview"),msg=$("institutionBrandingMessage");let logoData="";
  try{const {data,error}=await supabase.from("organization_settings").select("unit_name,logo_url").eq("organization_id",currentOrgId).maybeSingle();if(error)throw error;nameInput.value=data?.unit_name||currentOrgName;logoData=data?.logo_url||"";preview.innerHTML=logoData?`<img src="${esc(logoData)}" alt="Logo lembaga" style="width:84px;height:84px;object-fit:contain;background:#fff;padding:6px;border-radius:12px">`:"<small>Belum ada logo yang diunggah.</small>";}
  catch(err){nameInput.value=currentOrgName;msg.textContent="Pengaturan belum dapat dimuat: "+err.message;}
  fileInput.onchange=async()=>{const file=fileInput.files?.[0];if(!file)return;if(!/^image\/(png|jpeg|webp)$/.test(file.type)){msg.textContent="Format logo harus PNG, JPG, atau WebP.";fileInput.value="";return;}if(file.size>300*1024){msg.textContent="Ukuran file maksimal 300 KB.";fileInput.value="";return;}try{const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});const img=new Image();img.src=dataUrl;await img.decode();const scale=Math.min(1,512/Math.max(img.width,img.height));const canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);logoData=canvas.toDataURL("image/webp",0.82);preview.innerHTML=`<img src="${logoData}" alt="Pratinjau logo" style="width:84px;height:84px;object-fit:contain;background:#fff;padding:6px;border-radius:12px">`;msg.textContent="Logo siap disimpan.";}catch(err){msg.textContent="Gagal membaca gambar logo.";}}
  $("saveInstitutionBranding").onclick=async()=>{const unit_name=nameInput.value.trim();if(!unit_name){msg.textContent="Nama lembaga wajib diisi.";return;}const button=$("saveInstitutionBranding");button.disabled=true;msg.textContent="Menyimpan identitas…";try{const {error}=await supabase.from("organization_settings").upsert({organization_id:currentOrgId,unit_name,logo_url:logoData||null,updated_at:new Date().toISOString()},{onConflict:"organization_id"});if(error)throw error;currentOrgName=unit_name;$("orgAdminWelcome").textContent="Selamat datang, Admin "+unit_name;msg.textContent="Identitas lembaga berhasil disimpan.";}catch(err){msg.textContent="Gagal menyimpan: "+err.message;}finally{button.disabled=false;}};
}

$("loginForm").onsubmit=async e=>{
  e.preventDefault();const form=e.currentTarget,button=form.querySelector("button.primary.full"),message=$("loginMessage");button.disabled=true;button.textContent="Memeriksa…";
  try{
    const {data,error}=await supabase.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error)throw error;currentUser=data.user;
    const {data:superRole,error:roleError}=await supabase.rpc("is_super_admin");if(roleError)throw roleError;isSuperAdmin=!!superRole;
    if(isSuperAdmin){$("superAdminTools").classList.remove("hidden");$("orgAdminTools").classList.add("hidden");$("organizationList").classList.remove("hidden");await loadOrganizations();message.textContent="Login Super Admin berhasil.";}
    else{
      const {data:membership,error:memberError}=await supabase.from("organization_members").select("organization_id,role,status").eq("user_id",data.user.id).eq("role","org_admin").eq("status","active").maybeSingle();if(memberError)throw memberError;if(!membership?.organization_id)throw new Error("Akun tidak memiliki akses Admin Lembaga aktif.");
      const {data:org,error:orgError}=await supabase.from("organizations").select("name").eq("id",membership.organization_id).single();if(orgError)throw orgError;
      currentOrgId=membership.organization_id;currentOrgName=org.name;$("superAdminTools").classList.add("hidden");$("orgAdminTools").classList.remove("hidden");$("organizationList").classList.add("hidden");$("orgAdminWelcome").textContent="Selamat datang, Admin "+org.name;message.textContent="Login Admin Lembaga berhasil.";await renderInstitutionBranding();
    }
    // Tahap 6: menu audit dan backup tampil sesuai akses login.
    const toolsPanel=isSuperAdmin?$("superAdminTools"):$("orgAdminTools");
    if(isSuperAdmin){
      const superPanel=$("superAdminTools");
      if(superPanel&&!$("stage7Tools")){
        const panel=document.createElement("section");panel.id="stage7Tools";panel.className="org ev-rgb-border";
        panel.innerHTML=`<h3>SUPER ADMIN COMMAND DECK</h3><p>Ringkasan seluruh lembaga dan pengelolaan admin terpusat.</p><div class="ev-stage6-actions"><button id="openSuperOverview">▦ Dashboard Global</button><button id="openInstitutionAdmin">♙ Admin & Lembaga</button></div>`;
        superPanel.append(panel);
        $("openSuperOverview").onclick=()=>window.openSuperOverview();
        $("openInstitutionAdmin").onclick=()=>window.openInstitutionAdmin();
      }
    }
    if(toolsPanel&&!$("stage6Tools")){
      const panel=document.createElement("section");panel.id="stage6Tools";panel.className="org ev-rgb-border";
      panel.className="ev-admin-utilities"; panel.innerHTML=`<span>Administrasi</span><div class="ev-stage6-actions"><button type="button" id="openAuditTrail">Audit Trail</button><button type="button" id="openBackupCenter">Backup & Arsip</button></div>`;
      toolsPanel.append(panel);
      $("openAuditTrail").onclick=()=>openAuditTrail();
      $("openBackupCenter").onclick=()=>openBackupCenter();
    }
    $("loginModal").classList.add("hidden");
    await renderV21Controls();
  }catch(err){message.textContent="Login gagal: "+err.message;}finally{button.disabled=false;button.textContent="Masuk";}
};

$("createOrgForm").onsubmit=async e=>{e.preventDefault();const message=$("createOrgMessage"),button=e.currentTarget.querySelector("button[type='submit']");button.disabled=true;try{const {error}=await supabase.rpc("create_organization",{p_name:$("newOrgName").value.trim(),p_slug:$("newOrgSlug").value.trim().toLowerCase().replace(/\s+/g,"-")});if(error)throw error;message.textContent="Lembaga berhasil ditambahkan.";e.currentTarget.reset();await loadOrganizations();await loadPublicOrganizations();}catch(err){message.textContent="Gagal: "+err.message;}finally{button.disabled=false;}};
$("createAdminForm").onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,button=form.querySelector("button[type='submit']"),message=$("createAdminMessage");button.disabled=true;try{const {data,error}=await supabase.functions.invoke("admin-create-user",{body:{full_name:$("adminName").value.trim(),email:$("adminEmail").value.trim().toLowerCase(),password:$("adminPassword").value,organization_id:$("adminOrganization").value}});if(error)throw error;if(!data?.success)throw new Error(data?.error||"Gagal membuat akun admin.");message.textContent="Akun admin berhasil dibuat.";form.reset();}catch(err){message.textContent="Gagal: "+err.message;}finally{button.disabled=false;}};

const view=$("adminView"),viewTitle=$("adminViewTitle"),viewMessage=$("adminViewMessage");
function showView(title,html){viewTitle.textContent=title;viewMessage.innerHTML=html;view.classList.remove("hidden");view.scrollIntoView({behavior:"smooth",block:"start"});}
function requireOrg(){if(!currentUser)throw new Error("Silakan login terlebih dahulu.");if(!currentOrgId&&isSuperAdmin)throw new Error("Untuk mengelola data, masuk sebagai Admin Lembaga yang dipilih. Super Admin mengelola lembaga dan akun admin.");if(!currentOrgId)throw new Error("Lembaga belum terpilih.");}
function electionSelect(elections){
  const rows=Array.isArray(elections)?elections:[];
  const selectedExists=rows.some(x=>x.id===activeElectionId);
  if(!selectedExists)activeElectionId="";
  const options=rows.length
    ? rows.map(x=>`<option value="${esc(x.id)}" ${x.id===activeElectionId?"selected":""}>${esc(x.title||x.name||x.id)} — ${esc(x.status||"")}</option>`).join("")
    : `<option value="">Belum ada pemilihan</option>`;
  return `<label>Pilih Pemilihan</label><select id="moduleElection"><option value="">${rows.length?"Pilih pemilihan…":"Belum ada pemilihan"}</option>${options}</select>`;
}
async function getElections(){
  requireOrg();
  const orgId=currentOrgId;
  const {data,error}=await supabase.from("elections")
    .select("id,title,academic_period,status,token_quota,starts_at,ends_at,created_at")
    .eq("organization_id",orgId)
    .order("created_at",{ascending:false});
  if(error)throw error;
  const rows=Array.isArray(data)?data:[];
  // Jangan biarkan ID pemilihan lama bertahan setelah reset atau pergantian lembaga.
  if(!rows.some(row=>row.id===activeElectionId))activeElectionId="";
  return rows;
}
async function openElections(){
  try{
    const rows=await getElections();
    if(rows.length===0){
      activeElectionId="";
      activeElectionStatus="";
    }else if(!rows.some(row=>row.id===activeElectionId)){
      activeElectionId="";
      activeElectionStatus="";
    }
    const counts = await Promise.all(rows.map(async x=>{
      const [{count:candidatesCount,error:ce},{count:tokensCount,error:te}] = await Promise.all([
        supabase.from("candidates").select("id",{count:"exact",head:true}).eq("election_id",x.id),
        supabase.from("voter_tokens").select("id",{count:"exact",head:true}).eq("election_id",x.id)
      ]);
      return {id:x.id,candidates:ce?null:(candidatesCount||0),tokens:te?null:(tokensCount||0)};
    }));
    const countById=Object.fromEntries(counts.map(x=>[x.id,x]));
    const total=rows.length, active=rows.filter(x=>x.status==="active").length,
      draft=rows.filter(x=>x.status==="draft").length,
      completed=rows.filter(x=>["closed","completed","finished"].includes(String(x.status).toLowerCase())).length;
    const fmtDate=v=>v?new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v)):"Belum diatur";
    const statusBadge=s=>{
      const key=String(s||"").toLowerCase();
      const cls=key==="active"?"ev-status-active":key==="draft"?"ev-status-draft":"ev-status-done";
      const label=key==="active"?"Aktif":key==="draft"?"Draft":key==="closed"?"Selesai":esc(s||"Tidak diketahui");
      return `<span class="ev-status ${cls}">${label}</span>`;
    };
    const electionCards=rows.length?rows.map((x,i)=>{
      const stats=countById[x.id]||{};
      const canActivate=x.status==="draft";
      return `<article class="ev-election-card">
        <div class="ev-election-main">
          <div class="ev-election-number">${String(i+1).padStart(2,"0")}</div>
          <div class="ev-election-info">
            <div class="ev-election-title">${esc(x.title)}</div>
            <div class="ev-election-meta">${esc(x.academic_period||"Periode belum diatur")} · Kuota ${Number(x.token_quota||0).toLocaleString("id-ID")}</div>
            <div class="ev-election-meta">${fmtDate(x.starts_at)} — ${fmtDate(x.ends_at)}</div>
            <div class="ev-election-counts"><span>Kandidat: ${stats.candidates===null?"—":stats.candidates}</span><span>Token: ${stats.tokens===null?"—":stats.tokens}</span></div>
          </div>
          <div class="ev-election-status">${statusBadge(x.status)}</div>
        </div>
        <div class="ev-election-actions">
          <button type="button" class="select-election" data-id="${esc(x.id)}">Kelola</button>
          ${canActivate?`<button type="button" class="ev-activate" data-activate="${esc(x.id)}">▶ Aktifkan</button>`:""}
          ${x.status==="active"?`<button type="button" class="ev-deactivate" data-deactivate="${esc(x.id)}">Ⅱ Nonaktifkan</button>
            <button type="button" class="ev-portal-open" data-portal-open="${esc(x.id)}">↗ Buka Portal</button>
            <button type="button" class="ev-portal-copy" data-portal-copy="${esc(x.id)}">⧉ Salin Link</button>
            <button type="button" class="ev-portal-qr" data-portal-qr="${esc(x.id)}">▦ QR Code</button>`:""}
          <button type="button" class="ev-remove" data-remove="${esc(x.id)}">Hapus</button>
        </div>
      </article>`;
    }).join(""):`<div class="ev-empty">Belum ada pemilihan. Buat pemilihan pertama untuk memulai.</div>`;
    showView("Data Pemilihan",`
      <div class="ev-election-dashboard">
        <div class="ev-election-heading"><div><span class="ev-kicker">PANEL ADMINISTRASI</span><h2>Kelola Pemilihan</h2><p>Atur jadwal, kandidat, token, dan status pemungutan suara.</p></div><div class="ev-live-clock">● SISTEM TERHUBUNG</div></div>
        <div class="ev-stat-grid">
          <div class="ev-stat"><span>Total Pemilihan</span><strong>${total}</strong><small>Seluruh periode</small></div>
          <div class="ev-stat active"><span>Aktif</span><strong>${active}</strong><small>Sedang berjalan / terjadwal</small></div>
          <div class="ev-stat draft"><span>Draft</span><strong>${draft}</strong><small>Menunggu persiapan</small></div>
          <div class="ev-stat done"><span>Selesai</span><strong>${completed}</strong><small>Sudah ditutup</small></div>
        </div>
        <div class="ev-election-create org ev-rgb-border"><h3>＋ Buat Pemilihan Baru</h3>
          <form id="newElectionForm" class="ev-form-grid">
            <div><label>Nama pemilihan</label><input id="eTitle" required placeholder="Contoh: Pemilihan Ketua OSIS"></div>
            <div><label>Jenis pemilihan</label><input id="eType" required placeholder="Contoh: Pemilihan Ketua OSIS"></div>
            <div class="ev-span-2"><label>Deskripsi pemilihan</label><textarea id="eDescription" rows="2" placeholder="Keterangan pemilihan (opsional)"></textarea></div>
            <div><label>Tahun pelajaran / periode</label><input id="ePeriod" placeholder="2026/2027"></div>
            <div><label>Kuota token</label><input id="eQuota" type="number" min="1" value="100" required></div>
            <div><label>Mulai pemilihan</label><input id="eStart" type="datetime-local" required></div>
            <div><label>Akhir pemilihan</label><input id="eEnd" type="datetime-local" required></div>
            <div class="ev-span-2"><button class="primary" type="submit">Simpan sebagai Draft</button><p id="eMsg" class="ev-inline-message"></p></div>
          </form>
        </div>
        <div class="ev-election-list-panel">
          <div class="ev-list-heading"><div><span class="ev-kicker">DAFTAR KEGIATAN</span><h3>Daftar Pemilihan</h3></div><span class="ev-total-pill">${total} pemilihan</span></div>
          <div id="electionRows">${electionCards}</div>
        </div>
        <div class="ev-status-guide"><b>Alur status</b><div><span class="ev-guide-draft">Draft</span><span>Persiapan data dan kandidat</span><i>→</i><span class="ev-guide-active">Aktif</span><span>Pemungutan suara dibuka sesuai jadwal</span><i>→</i><span class="ev-guide-done">Selesai</span><span>Pemungutan ditutup</span></div></div>
      </div>`);
    $("newElectionForm").onsubmit=async e=>{
      e.preventDefault();const b=e.currentTarget.querySelector("button"),m=$("eMsg");b.disabled=true;m.textContent="Menyimpan…";
      try{
        const start=$("eStart").value,end=$("eEnd").value;
        if(!start||!end||new Date(end)<=new Date(start))throw new Error("Jadwal akhir harus setelah jadwal mulai.");
        const {error}=await supabase.rpc("create_election",{
          p_organization_id:currentOrgId,p_title:$("eTitle").value.trim(),
          p_description:$("eDescription").value.trim()||null,p_election_type:$("eType").value.trim(),
          p_academic_period:$("ePeriod").value.trim(),p_starts_at:new Date(start).toISOString(),
          p_ends_at:new Date(end).toISOString(),p_token_quota:Number($("eQuota").value)
        });
        if(error)throw error;
        await openElections();
      }catch(err){m.textContent="Gagal menyimpan: "+err.message;}finally{b.disabled=false;}
    };
    view.querySelectorAll(".select-election").forEach(b=>b.onclick=()=>{
      activeElectionId=b.dataset.id;
      const x=rows.find(r=>r.id===activeElectionId);
      showView("Pemilihan Dipilih",`<div class="org"><h3>${esc(x?.title||"Pemilihan")}</h3><p>Status: ${esc(x?.status||"-")}</p><p>ID pemilihan: ${esc(activeElectionId)}</p><button id="goCandidates" class="primary">Kelola Kandidat</button><button id="goTokens" type="button">Kelola Token</button><button id="goResults" type="button">Lihat Hasil</button></div>`);
      $("goCandidates").onclick=openCandidates;$("goTokens").onclick=openTokens;$("goResults").onclick=openResults;
    });
    view.querySelectorAll("[data-activate]").forEach(b=>b.onclick=async()=>{
      const id=b.dataset.activate,stats=countById[id]||{};
      if(stats.candidates===null||stats.tokens===null){alert("Tidak dapat memeriksa jumlah kandidat/token. Periksa hak akses tabel.");return;}
      if(stats.candidates<2){alert("Pemilihan belum dapat diaktifkan. Tambahkan minimal 2 kandidat terlebih dahulu.");return;}
      if(stats.tokens<1){alert("Pemilihan belum dapat diaktifkan. Buat token pemilih terlebih dahulu.");return;}
      if(!confirm("Aktifkan pemilihan ini? Pastikan kandidat, token, dan jadwal sudah benar."))return;
      b.disabled=true;b.textContent="Mengaktifkan…";
      try{
        const {data,error}=await supabase.rpc("activate_election",{p_election_id:id});
        if(error)throw error;
        if(data===false)throw new Error("Database tidak mengonfirmasi aktivasi.");
        await openElections();
        alert("Pemilihan berhasil diaktifkan. Sistem tetap mengikuti jadwal mulai dan akhir yang sudah ditetapkan.");
      }catch(err){alert("Aktivasi gagal: "+err.message);b.disabled=false;b.textContent="▶ Aktifkan";}
    });
    view.querySelectorAll("[data-deactivate]").forEach(b=>b.onclick=async()=>{
      const id=b.dataset.deactivate;
      if(!confirm("Nonaktifkan pemilihan ini? Pemungutan suara akan dihentikan dan hasil dikunci."))return;
      b.disabled=true;b.textContent="Memproses…";
      try{
        const {error}=await supabase.rpc("deactivate_election",{p_election_id:id});
        if(error)throw error;
        await openElections();
        alert("Pemilihan berhasil dinonaktifkan. Hasil tetap tersimpan dan terkunci.");
      }catch(err){alert("Gagal menonaktifkan: "+err.message);b.disabled=false;b.textContent="Ⅱ Nonaktifkan";}
    });
    view.querySelectorAll("[data-remove]").forEach(b=>b.onclick=async()=>{
      const id=b.dataset.remove, election=rows.find(x=>x.id===id);
      if(!confirm(`Hapus pemilihan "${election?.title||""}"? Penghapusan hanya diizinkan jika belum ada suara. Data kandidat dan token terkait juga akan terhapus.`))return;
      b.disabled=true;b.textContent="Menghapus…";
      try{
        const {error}=await supabase.rpc("delete_election_safe",{p_election_id:id});
        if(error)throw error;
        await openElections();
        alert("Pemilihan berhasil dihapus.");
      }catch(err){alert("Tidak dapat menghapus pemilihan: "+err.message);b.disabled=false;b.textContent="Hapus";}
    });
    const portalUrl=id=>`${window.location.origin}${window.location.pathname}?vote=${encodeURIComponent(id)}`;
    view.querySelectorAll("[data-portal-open]").forEach(b=>b.onclick=()=>{
      window.open(portalUrl(b.dataset.portalOpen),"_blank","noopener,noreferrer");
    });
    view.querySelectorAll("[data-portal-copy]").forEach(b=>b.onclick=async()=>{
      const link=portalUrl(b.dataset.portalCopy);
      try{
        if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(link);
        else{
          const temp=document.createElement("textarea");temp.value=link;temp.style.position="fixed";temp.style.opacity="0";
          document.body.appendChild(temp);temp.select();const ok=document.execCommand("copy");temp.remove();
          if(!ok)throw new Error("Browser tidak mengizinkan penyalinan otomatis.");
        }
        const old=b.textContent;b.textContent="✓ Tersalin";setTimeout(()=>b.textContent=old,1800);
      }catch(err){prompt("Salin tautan portal pemilih berikut:",link);}
    });
    view.querySelectorAll("[data-portal-qr]").forEach(b=>b.onclick=async()=>{
      const id=b.dataset.portalQr,link=portalUrl(id);
      let panel=view.querySelector(`#portalQr_${CSS.escape(id)}`);
      if(panel){panel.remove();return;}
      panel=document.createElement("div");panel.id=`portalQr_${id}`;panel.className="ev-portal-qr-panel";
      panel.innerHTML=`<div><b>QR CODE PORTAL PEMILIH</b><p>Pindai menggunakan kamera HP untuk membuka portal pemilihan.</p><div class="ev-qr-canvas"></div><small></small></div><button type="button" class="ev-qr-close">Tutup</button>`;
      b.closest(".ev-election-card").appendChild(panel);
      panel.querySelector("small").textContent=link;
      panel.querySelector(".ev-qr-close").onclick=()=>panel.remove();
      try{
        if(!window.QRCode){
          await new Promise((resolve,reject)=>{
            const script=document.createElement("script");script.src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js";
            script.onload=resolve;script.onerror=()=>reject(new Error("Library QR Code gagal dimuat. Periksa koneksi internet."));
            document.head.appendChild(script);
          });
        }
        new window.QRCode(panel.querySelector(".ev-qr-canvas"),{text:link,width:220,height:220,colorDark:"#071426",colorLight:"#ffffff",correctLevel:window.QRCode.CorrectLevel.M});
      }catch(err){panel.querySelector(".ev-qr-canvas").textContent=err.message;}
    });
  }catch(e){showView("Data Pemilihan",`<p>Gagal memuat: ${esc(e.message)}</p>`);}
}
async function loadElectionOptions(){const rows=await getElections();return rows;}
async function openCandidates(){
  try{
    requireOrg();
    const rows=await loadElectionOptions();
    showView("Data Kandidat",`
      <div class="ev-candidate-page">
        <div class="ev-election-heading"><div><span class="ev-kicker">TAHAP 2 · PROFIL PESERTA</span><h2>Manajemen Kandidat</h2><p>Kelola identitas, foto, visi, dan misi kandidat.</p></div></div>
        ${electionSelect(rows)}
        <div class="org ev-rgb-border">
          <form id="candidateForm">
            <h3 id="candidateFormTitle">＋ Tambah Kandidat</h3><input id="candidateId" type="hidden">
            <div class="ev-form-grid">
              <div><label>Nomor urut</label><input id="cNumber" type="number" min="1" required></div>
              <div><label>Nama kandidat</label><input id="cName" required maxlength="120"></div>
              <div class="ev-span-2"><label>Profil singkat</label><textarea id="cBio" rows="2" maxlength="1000"></textarea></div>
              <div><label>Visi</label><textarea id="cVision" rows="4" maxlength="2000" placeholder="Tuliskan visi kandidat"></textarea></div>
              <div><label>Misi</label><textarea id="cMission" rows="4" maxlength="3000" placeholder="Tuliskan misi kandidat"></textarea></div>
              <div class="ev-span-2"><label>Foto kandidat (JPG/PNG, maksimal 2 MB)</label><input id="cPhoto" type="file" accept="image/jpeg,image/png"><img id="cPhotoPreview" class="ev-preview" hidden alt="Pratinjau foto kandidat"></div>
              <div class="ev-span-2"><button class="primary" type="submit" id="candidateSubmit">Simpan Kandidat</button> <button type="button" id="candidateCancel" hidden>Batalkan Edit</button><p id="cMsg" class="ev-inline-message"></p></div>
            </div>
          </form>
        </div>
        <div class="ev-election-list-panel"><div class="ev-list-heading"><div><span class="ev-kicker">DAFTAR PESERTA</span><h3>Kandidat Pemilihan</h3></div><span class="ev-total-pill" id="candidateCount">0 kandidat</span></div><div id="candidateRows"></div></div>
      </div>`);
    const sel=$("moduleElection");if(activeElectionId)sel.value=activeElectionId;
    sel.onchange=()=>{activeElectionId=sel.value;resetCandidateForm();refreshCandidates().catch(e=>$("candidateRows").textContent="Gagal: "+e.message);};
    function resetCandidateForm(){
      $("candidateForm").reset();$("candidateId").value="";$("candidateFormTitle").textContent="＋ Tambah Kandidat";
      $("candidateSubmit").textContent="Simpan Kandidat";$("candidateCancel").hidden=true;
      $("cPhotoPreview").hidden=true;$("cPhotoPreview").removeAttribute("src");
    }
    $("candidateCancel").onclick=resetCandidateForm;
    $("cPhoto").onchange=()=>{
      const f=$("cPhoto").files?.[0],img=$("cPhotoPreview");if(!f){img.hidden=true;return;}
      if(!["image/jpeg","image/png"].includes(f.type)||f.size>2*1024*1024){alert("Foto harus JPG/PNG maksimal 2 MB.");$("cPhoto").value="";img.hidden=true;return;}
      img.src=URL.createObjectURL(f);img.hidden=false;
    };
    async function uploadCandidatePhoto(file){
      if(!file)return null;
      if(!["image/jpeg","image/png"].includes(file.type)||file.size>2*1024*1024)throw new Error("Foto harus JPG/PNG maksimal 2 MB.");
      const path=`${activeElectionId}/${crypto.randomUUID()}.${file.type==="image/png"?"png":"jpg"}`;
      const {error}=await supabase.storage.from("candidate-photos").upload(path,file,{contentType:file.type,upsert:false});
      if(error)throw new Error("Gagal mengunggah foto: "+error.message);
      return supabase.storage.from("candidate-photos").getPublicUrl(path).data.publicUrl;
    }
    async function refreshCandidates(){
      const box=$("candidateRows");if(!activeElectionId){box.textContent="Pilih pemilihan terlebih dahulu.";return;}
      const {data,error}=await supabase.from("candidates").select("id,number,name,photo_url,bio,vision,mission").eq("election_id",activeElectionId).order("number");
      if(error)throw error;
      const candidates=data||[];$("candidateCount").textContent=`${candidates.length} kandidat`;
      box.innerHTML=candidates.map(c=>`<article class="ev-candidate-card">
        ${c.photo_url?`<img class="ev-candidate-photo" src="${esc(c.photo_url)}" alt="Foto ${esc(c.name)}">`:`<div class="ev-candidate-photo ev-photo-placeholder">FOTO<br>${esc(c.number)}</div>`}
        <div class="ev-candidate-details"><div class="ev-candidate-name">Nomor ${esc(c.number)} · ${esc(c.name)}</div><p>${esc(c.bio||"Belum ada profil singkat.")}</p>
        <details><summary>Lihat visi dan misi</summary><b>Visi</b><p>${esc(c.vision||"Belum diisi.")}</p><b>Misi</b><p>${esc(c.mission||"Belum diisi.")}</p></details></div>
        <div class="ev-candidate-buttons"><button type="button" data-edit-candidate="${esc(c.id)}">Edit</button><button type="button" class="ev-remove" data-delete-candidate="${esc(c.id)}">Hapus</button></div></article>`).join("")||`<div class="ev-empty">Belum ada kandidat untuk pemilihan ini.</div>`;
      box.querySelectorAll("[data-edit-candidate]").forEach(btn=>btn.onclick=()=>{
        const c=candidates.find(x=>x.id===btn.dataset.editCandidate);if(!c)return;
        $("candidateId").value=c.id;$("cNumber").value=c.number;$("cName").value=c.name;$("cBio").value=c.bio||"";
        $("cVision").value=c.vision||"";$("cMission").value=c.mission||"";
        $("candidateFormTitle").textContent="✎ Edit Kandidat";$("candidateSubmit").textContent="Simpan Perubahan";$("candidateCancel").hidden=false;
        if(c.photo_url){$("cPhotoPreview").src=c.photo_url;$("cPhotoPreview").hidden=false;}
        $("candidateForm").scrollIntoView({behavior:"smooth",block:"start"});
      });
      box.querySelectorAll("[data-delete-candidate]").forEach(btn=>btn.onclick=async()=>{
        const c=candidates.find(x=>x.id===btn.dataset.deleteCandidate);
        if(!confirm(`Hapus kandidat ${c?.name||""}? Jika sudah memiliki suara, database dapat menolak penghapusan.`))return;
        btn.disabled=true;try{const {error}=await supabase.from("candidates").delete().eq("id",btn.dataset.deleteCandidate).eq("election_id",activeElectionId);if(error)throw error;await refreshCandidates();}
        catch(err){alert("Gagal menghapus kandidat: "+err.message);btn.disabled=false;}
      });
    }
    await refreshCandidates();
    $("candidateForm").onsubmit=async e=>{
      e.preventDefault();const button=$("candidateSubmit"),message=$("cMsg");button.disabled=true;message.textContent="Menyimpan kandidat…";
      try{
        if(!activeElectionId)throw new Error("Pilih pemilihan terlebih dahulu.");
        const id=$("candidateId").value,number=Number($("cNumber").value),name=$("cName").value.trim();
        const bio=$("cBio").value.trim(),vision=$("cVision").value.trim(),mission=$("cMission").value.trim();
        if(!Number.isInteger(number)||number<1)throw new Error("Nomor urut harus bilangan bulat positif.");
        if(!name)throw new Error("Nama kandidat wajib diisi.");
        const photoUrl=await uploadCandidatePhoto($("cPhoto").files?.[0]);
        if(id){
          const changes={number:String(number),name,bio:bio||null,vision:vision||null,mission:mission||null};
          if(photoUrl)changes.photo_url=photoUrl;
          const {error}=await supabase.from("candidates").update(changes).eq("id",id).eq("election_id",activeElectionId);if(error)throw error;
        }else{
          const {error}=await supabase.rpc("add_candidate",{p_election_id:activeElectionId,p_number:number,p_name:name});if(error)throw error;
          const {data:match,error:findError}=await supabase.from("candidates").select("id").eq("election_id",activeElectionId).eq("number",String(number)).eq("name",name).order("created_at",{ascending:false}).limit(1).maybeSingle();
          if(findError)throw findError;if(!match)throw new Error("Kandidat dibuat tetapi tidak ditemukan untuk menyimpan profil.");
          const changes={bio:bio||null,vision:vision||null,mission:mission||null};if(photoUrl)changes.photo_url=photoUrl;
          const {error:updateError}=await supabase.from("candidates").update(changes).eq("id",match.id);if(updateError)throw updateError;
        }
        resetCandidateForm();message.textContent="Kandidat berhasil disimpan.";await refreshCandidates();
      }catch(err){message.textContent="Gagal: "+err.message;}finally{button.disabled=false;}
    };
  }catch(e){showView("Data Kandidat",`<p>${esc(e.message)}</p>`);}
}
async function openTokens(){
  try{
    requireOrg();
    const rows=await loadElectionOptions();
    showView("Token Pemilih",`
      <div class="ev-election-dashboard">
        <div class="ev-election-heading"><div><span class="ev-kicker">AKSES PEMILIH</span><h2>Manajemen Token</h2><p>Generate token baru dan pantau kuota yang masih tersedia.</p></div></div>
        ${electionSelect(rows)}
        <div class="org ev-rgb-border">
          <h3>Generate Token</h3>
          <div class="ev-stat-grid ev-token-stats">
            <div class="ev-stat"><span>Kuota Pemilihan</span><strong id="tokenQuota">—</strong><small>Batas token keseluruhan</small></div>
            <div class="ev-stat"><span>Token Dibuat</span><strong id="tokenCreated">—</strong><small>Termasuk token yang sudah digunakan</small></div>
            <div class="ev-stat active"><span>Sisa Kuota</span><strong id="tokenRemaining">—</strong><small>Token yang masih bisa dibuat</small></div>
          </div>
          <label>Jumlah token yang akan dibuat</label>
          <input id="tokenQty" type="number" min="1" max="5000" value="10">
          <label>Jatah penggunaan per token</label>
          <input id="tokenLimit" type="number" min="1" value="1">
          <button id="generateTokens" class="primary">Buat Token</button>
          <p id="tokenMsg">Token rahasia hanya ditampilkan satu kali. Unduh dan simpan setelah dibuat.</p>
          <div id="tokenOutput"></div>
        </div>
      </div>`);
    const sel=$("moduleElection");
    if(activeElectionId)sel.value=activeElectionId;
    else if(rows.length){activeElectionId=rows[0].id;sel.value=activeElectionId;}
    let currentQuota=0,currentCreated=0,currentRemaining=0;
    async function refreshTokenQuota(){
      const election=rows.find(x=>x.id===activeElectionId);
      if(!election)throw new Error("Pilih pemilihan terlebih dahulu.");
      currentQuota=Number(election.token_quota||0);
      const {count,error}=await supabase.from("voter_tokens").select("id",{count:"exact",head:true}).eq("election_id",activeElectionId);
      if(error)throw error;
      currentCreated=count||0;currentRemaining=Math.max(0,currentQuota-currentCreated);
      $("tokenQuota").textContent=currentQuota.toLocaleString("id-ID");
      $("tokenCreated").textContent=currentCreated.toLocaleString("id-ID");
      $("tokenRemaining").textContent=currentRemaining.toLocaleString("id-ID");
      $("tokenQty").max=Math.min(5000,currentRemaining);
      $("tokenQty").value=currentRemaining?Math.min(10,currentRemaining):0;
      $("tokenQty").disabled=currentRemaining===0;
      $("generateTokens").disabled=currentRemaining===0;
      $("generateTokens").textContent=currentRemaining===0?"Kuota Habis":"Buat Token";
      $("tokenMsg").textContent=currentRemaining===0
        ?"Kuota token pemilihan sudah habis. Token lama tidak dapat ditampilkan kembali karena yang tersimpan di database adalah hash."
        :`Masih tersedia ${currentRemaining.toLocaleString("id-ID")} token. Token yang sudah dibuat tidak dapat ditampilkan kembali.`;
    }
    sel.onchange=async()=>{
      activeElectionId=sel.value;$("tokenOutput").innerHTML="";
      try{await refreshTokenQuota();}catch(err){$("tokenMsg").textContent="Gagal membaca kuota: "+err.message;}
    };
    await refreshTokenQuota();
    $("generateTokens").onclick=async()=>{
      const b=$("generateTokens"),m=$("tokenMsg"),qty=Number($("tokenQty").value);
      b.disabled=true;
      try{
        if(!activeElectionId)throw new Error("Pilih pemilihan terlebih dahulu.");
        if(!Number.isInteger(qty)||qty<1||qty>5000)throw new Error("Jumlah token per proses harus 1 sampai 5.000. Untuk jumlah lebih besar, lakukan beberapa batch.");
        await refreshTokenQuota();
        if(qty>currentRemaining)throw new Error(`Jumlah token melebihi sisa kuota. Kuota tersisa ${currentRemaining}.`);
        const {data,error}=await supabase.rpc("generate_voter_tokens",{
          p_election_id:activeElectionId,p_quantity:qty,p_vote_limit:Number($("tokenLimit").value)
        });
        if(error)throw error;
        const tokens=(data||[]).map(x=>x.token||x.plain_token||x);
        if(!tokens.length)throw new Error("Server tidak mengembalikan token. Periksa hasil RPC.");
        $("tokenOutput").innerHTML=`<div class="ev-token-result"><p><b>Token baru — simpan sekarang:</b></p><textarea id="tokenText" rows="12" readonly></textarea><button id="downloadTokens" type="button">Unduh TXT</button><button id="copyTokens" type="button">Salin Semua Token</button></div>`;
        $("tokenText").value=tokens.join("\n");
        $("downloadTokens").onclick=()=>{
          const blob=new Blob([tokens.join("\r\n")],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");
          link.href=url;link.download=`token-${activeElectionId}.txt`;link.click();URL.revokeObjectURL(url);
        };
        $("copyTokens").onclick=async()=>{try{await navigator.clipboard.writeText(tokens.join("\n"));$("copyTokens").textContent="✓ Tersalin";}catch{prompt("Salin token berikut:",tokens.join("\n"));}};
        m.textContent=`Berhasil membuat ${tokens.length} token. Simpan atau unduh sekarang; token tidak dapat dilihat kembali setelah halaman ditutup.`;
        await refreshTokenQuota();
      }catch(err){m.textContent="Gagal: "+err.message;}
      finally{b.disabled=currentRemaining===0;}
    };
  }catch(e){showView("Token Pemilih",`<p>${esc(e.message)}</p>`);}
}
async function openResults(){
  try{
    requireOrg();
    const rows=await loadElectionOptions();
    showView("Hasil & Laporan",`
      <div class="ev-report-panel ev-analytics-page">
        <div class="ev-election-heading"><div><span class="ev-kicker">ROBOTIC ANALYTICS · TAHAP 5</span><h2>Pengesahan & Arsip Pemilihan</h2><p>Periksa hasil, kunci hasil resmi, dan siapkan berita acara.</p></div></div>
        ${electionSelect(rows)}
        <div class="ev-report-toolbar"><button id="loadResults" class="primary">↻ Perbarui Hasil</button><span id="resultUpdated" class="ev-muted">Belum diperbarui</span></div>
        <div id="resultOutput"><div class="ev-empty">Pilih pemilihan lalu tekan Perbarui Hasil.</div></div>
      </div>`);
    const sel=$("moduleElection");if(activeElectionId)sel.value=activeElectionId;
    sel.onchange=()=>{activeElectionId=sel.value;$("resultOutput").innerHTML=`<div class="ev-empty">Pemilihan berubah. Tekan Perbarui Hasil.</div>`;};
    let latestRecords=[],latestTotal=0,latestElection=null,latestLocked=false;
    async function refreshResults(){
      const out=$("resultOutput");out.innerHTML=`<div class="ev-empty">Mengambil hasil pemilihan…</div>`;
      if(!activeElectionId)throw new Error("Pilih pemilihan terlebih dahulu.");
      const {data:election,error:electionError}=await supabase.from("elections")
        .select("id,title,academic_period,status,results_locked,starts_at,ends_at")
        .eq("id",activeElectionId).maybeSingle();
      if(electionError)throw electionError;
      if(!election)throw new Error("Data pemilihan tidak ditemukan atau tidak dapat diakses.");
      latestElection=election;latestLocked=Boolean(election.results_locked);
      let result,error;
      ({data:result,error}=await supabase.rpc("get_election_results",{p_election_id:activeElectionId}));
      if(error)({data:result,error}=await supabase.rpc("get_vote_results",{p_election_id:activeElectionId}));
      if(error)throw error;
      const normalized=Array.isArray(result)?result:(result?.results||result?.data||[]);
      if(!Array.isArray(normalized))throw new Error("Format hasil dari RPC tidak dikenali.");
      const records=normalized.map(r=>({
        nomor:r.candidate_number??r.number??"",
        kandidat:r.candidate_name??r.name??"",
        suara:Number(r.total_votes??r.vote_count??r.votes??0)
      })).sort((a,b)=>b.suara-a.suara||String(a.kandidat).localeCompare(String(b.kandidat),"id"));
      const total=records.reduce((n,r)=>n+r.suara,0);
      latestRecords=records;latestTotal=total;
      const ranked=records.map((r,i)=>({...r,rank:i+1,pct:total?r.suara/total*100:0}));
      const max=Math.max(1,...ranked.map(r=>r.suara)),winner=ranked.length&&total?ranked[0]:null;
      const dateText=new Date().toLocaleString("id-ID",{dateStyle:"long",timeStyle:"short"});
      const statusBadge=latestLocked?`<span class="ev-lock-badge">🔒 HASIL TERKUNCI</span>`:`<span class="ev-unlock-badge">HASIL BELUM DIKUNCI</span>`;
      out.innerHTML=`
        <div class="ev-lock-panel"><div><b>Status pengesahan</b><p>${statusBadge}</p><small>${latestLocked?"Hasil telah dikunci melalui Supabase.":"Kunci hasil setelah panitia menyelesaikan pemeriksaan."}</small></div>
          <div class="ev-lock-actions">${latestLocked?`<button id="unlockResults" type="button">Buka Kunci (Super Admin)</button>`:`<button id="lockResults" class="primary" type="button">🔒 Kunci Hasil Resmi</button>`}</div>
        </div>
        <section class="ev-report-summary ev-report-summary-v2">
          <div><span>Total suara masuk</span><strong>${total.toLocaleString("id-ID")}</strong></div>
          <div><span>Jumlah kandidat</span><strong>${records.length.toLocaleString("id-ID")}</strong></div>
          <div><span>Kandidat teratas</span><strong class="ev-summary-winner">${winner?esc(winner.kandidat):"—"}</strong></div>
        </section>
        ${winner?`<section class="ev-winner-panel"><span class="ev-kicker">PEROLEHAN TERTINGGI</span><h3>${esc(winner.kandidat)}</h3><p>Nomor urut ${esc(winner.nomor)} · ${winner.suara.toLocaleString("id-ID")} suara · ${winner.pct.toFixed(2)}%</p></section>`:""}
        <section class="ev-chart-panel"><div class="ev-list-heading"><div><span class="ev-kicker">ROBOTIC ANALYTICS</span><h3>Grafik Perolehan Suara</h3></div><span class="ev-total-pill">${total.toLocaleString("id-ID")} suara</span></div>
        ${ranked.map(r=>`<div class="ev-chart-row"><div class="ev-chart-label"><b>${r.rank}. ${esc(r.kandidat)}</b><span>${r.suara.toLocaleString("id-ID")} suara · ${r.pct.toFixed(2)}%</span></div><div class="ev-chart-track"><div class="ev-chart-bar" style="width:${Math.max(0,Math.min(100,r.suara/max*100))}%"></div></div></div>`).join("")||`<div class="ev-empty">Belum ada suara masuk.</div>`}</section>
        <section class="ev-report-table-wrap"><div class="ev-list-heading"><div><span class="ev-kicker">REKAP HASIL</span><h3>Rincian Perolehan Suara</h3></div></div><table class="ev-report-table"><thead><tr><th>Peringkat</th><th>No.</th><th>Nama Kandidat</th><th>Suara</th><th>Persentase</th></tr></thead><tbody>${ranked.map(r=>`<tr><td>${r.rank}</td><td>${esc(r.nomor)}</td><td>${esc(r.kandidat)}</td><td>${r.suara.toLocaleString("id-ID")}</td><td>${r.pct.toFixed(2)}%</td></tr>`).join("")||`<tr><td colspan="5">Belum ada data suara.</td></tr>`}</tbody></table></section>
        <section class="ev-minutes-panel"><span class="ev-kicker">DOKUMEN RESMI</span><h3>Berita Acara Pemungutan dan Penghitungan Suara</h3>
          <div class="ev-minutes-grid">
            <label>Tempat pelaksanaan<input id="minutesPlace" placeholder="Contoh: Aula MA Darul Falah Bongas"></label>
            <label>Tanggal berita acara<input id="minutesDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
            <label>Ketua panitia<input id="minutesChair" placeholder="Nama ketua panitia"></label>
            <label>Sekretaris<input id="minutesSecretary" placeholder="Nama sekretaris"></label>
            <label>Saksi 1<input id="minutesWitness1" placeholder="Nama saksi pertama"></label>
            <label>Saksi 2<input id="minutesWitness2" placeholder="Nama saksi kedua"></label>
          </div>
          <button id="printMinutes" type="button" class="primary">Cetak Berita Acara / Simpan PDF</button>
          <button id="downloadArchive" type="button">Unduh Arsip Hasil (CSV)</button>
        </section>
        <div class="ev-report-meta">Pemilihan: <b>${esc(election.title)}</b> · Periode: ${esc(election.academic_period||"-")} · Status: ${esc(election.status)}<br>Data diperbarui: ${esc(dateText)}</div>
        <div class="ev-report-actions"><button id="downloadCsv" class="ev-activate" type="button">⬇ Unduh Laporan CSV / Excel</button><button id="printReport" type="button">Cetak Rekap Hasil</button></div>`;
      $("resultUpdated").textContent="Diperbarui: "+dateText;
      const lockBtn=$("lockResults");
      if(lockBtn)lockBtn.onclick=async()=>{
        if(!confirm("Kunci hasil pemilihan ini? Pastikan pemungutan suara telah selesai. Setelah dikunci, suara baru akan ditolak oleh sistem."))return;
        lockBtn.disabled=true;lockBtn.textContent="Mengunci…";
        const electionId=activeElectionId;
        try{
          const {error}=await supabase.rpc("lock_election_results",{p_election_id:electionId});
          if(error)throw error;
          const {data,error:verifyError}=await supabase.from("elections").select("results_locked").eq("id",electionId).single();
          if(verifyError)throw verifyError;
          if(data?.results_locked!==true)throw new Error("Database belum mengunci hasil. Periksa fungsi SQL lock_election_results.");
          alert("Berhasil! Hasil pemilihan telah terkunci.");
          await refreshResults();
        }catch(err){alert("Gagal mengunci hasil: "+err.message);lockBtn.disabled=false;lockBtn.textContent="🔒 Kunci Hasil Resmi";}
      };
      const unlockBtn=$("unlockResults");
      if(unlockBtn)unlockBtn.onclick=async()=>{
        if(!confirm("Buka kunci hasil? Tindakan ini hanya untuk Super Admin dan dapat membuka kembali penerimaan suara jika pemilihan masih aktif."))return;
        unlockBtn.disabled=true;
        const electionId=activeElectionId;
        try{
          const {error}=await supabase.rpc("unlock_election_results",{p_election_id:electionId});
          if(error)throw error;
          const {data,error:verifyError}=await supabase.from("elections").select("results_locked").eq("id",electionId).single();
          if(verifyError)throw verifyError;
          if(data?.results_locked!==false)throw new Error("Database belum membuka kunci hasil.");
          alert("Kunci hasil berhasil dibuka.");
          await refreshResults();
        }catch(err){alert("Gagal membuka kunci: "+err.message);unlockBtn.disabled=false;}
      };
      function csvContent(){
        return [["LAPORAN HASIL PEMILIHAN"],["Nama Pemilihan",election.title],["Periode",election.academic_period||""],["Status Penguncian",latestLocked?"Terkunci":"Belum dikunci"],["Waktu Unduh",dateText],[],["Peringkat","Nomor","Nama Kandidat","Perolehan Suara","Persentase"],...ranked.map(r=>[r.rank,r.nomor,r.kandidat,r.suara,r.pct.toFixed(2)+"%"]),[],["Total Suara",total]]
          .map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";")).join("\r\n");
      }
      function downloadCsv(filename){const blob=new Blob(["\ufeff"+csvContent()],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
      $("downloadCsv").onclick=()=>downloadCsv(`laporan-hasil-${activeElectionId}.csv`);
      $("downloadArchive").onclick=()=>downloadCsv(`arsip-pemilihan-${activeElectionId}.csv`);
      $("printReport").onclick=()=>{window.focus();setTimeout(()=>window.print(),100);};
      $("printMinutes").onclick=()=>{
        const val=id=>$(id).value.trim();
        const required=[["Tempat pelaksanaan","minutesPlace"],["Ketua panitia","minutesChair"],["Sekretaris","minutesSecretary"]];
        const missing=required.filter(x=>!val(x[1])).map(x=>x[0]);
        if(missing.length){alert("Lengkapi terlebih dahulu: "+missing.join(", "));return;}
        const w=window.open("","_blank");if(!w){alert("Izinkan pop-up browser untuk mencetak berita acara.");return;}
        const rowsHtml=ranked.map(r=>`<tr><td>${r.rank}</td><td>${esc(r.nomor)}</td><td>${esc(r.kandidat)}</td><td>${r.suara}</td><td>${r.pct.toFixed(2)}%</td></tr>`).join("");
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Berita Acara Pemilihan</title><style>body{font:14px Arial,sans-serif;color:#111;margin:35px}h1{text-align:center;font-size:19px}p{line-height:1.6}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #555;padding:8px;text-align:left}.sign{display:grid;grid-template-columns:1fr 1fr;gap:45px;margin-top:50px;text-align:center}.sign div{min-height:110px}</style></head><body><h1>BERITA ACARA PEMUNGUTAN DAN PENGHITUNGAN SUARA</h1><p>Pada tanggal ${esc(val("minutesDate"))}, bertempat di ${esc(val("minutesPlace"))}, telah dilaksanakan pemungutan dan penghitungan suara untuk ${esc(election.title)} periode ${esc(election.academic_period||"-")}.</p><p>Hasil penghitungan suara adalah sebagai berikut:</p><table><thead><tr><th>Peringkat</th><th>Nomor</th><th>Nama Kandidat</th><th>Suara</th><th>Persentase</th></tr></thead><tbody>${rowsHtml}</tbody></table><p>Total suara masuk: <b>${total}</b>. Status hasil: <b>${latestLocked?"Terkunci":"Belum dikunci"}</b>.</p><p>Demikian berita acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</p><div class="sign"><div>Ketua Panitia<br><br><br><b>${esc(val("minutesChair"))}</b></div><div>Sekretaris<br><br><br><b>${esc(val("minutesSecretary"))}</b></div><div>Saksi 1<br><br><br><b>${esc(val("minutesWitness1")||"(........................)")}</b></div><div>Saksi 2<br><br><br><b>${esc(val("minutesWitness2")||"(........................)")}</b></div></div><script>window.onload=()=>window.print()<\/script></body></html>`);
        w.document.close();
      };
    }
    $("loadResults").onclick=async()=>{const b=$("loadResults");b.disabled=true;b.textContent="Memperbarui…";try{await refreshResults();}catch(err){$("resultOutput").textContent="Hasil belum dapat dimuat: "+err.message;}finally{b.disabled=false;b.textContent="↻ Perbarui Hasil";}};
  }catch(e){showView("Hasil & Laporan",`<p>${esc(e.message)}</p>`);}
}

const actions={elections:openElections,candidates:openCandidates,tokens:openTokens,results:openResults};document.querySelectorAll(".menu-card").forEach(card=>card.addEventListener("click",()=>actions[card.dataset.view]?.()));$("backToDashboard").onclick=()=>view.classList.add("hidden");


// PORTAL PEMILIH PUBLIK — aktif hanya pada URL ?vote=<election_id>
const voterElectionId = new URLSearchParams(location.search).get("vote");
if (voterElectionId) {
  const portalStyle=document.createElement("style");
  portalStyle.textContent=`
  body.voter-mode{margin:0;background:radial-gradient(circle at 15% 0%,#12345a,#061323 58%,#030a13);color:#eef7ff;font-family:Inter,system-ui,sans-serif;min-height:100vh}
  body.voter-mode>*:not(#voterPortal){display:none!important}
  #voterPortal{min-height:100vh;padding:28px 16px;box-sizing:border-box}
  .vp-shell{max-width:980px;margin:auto}
  .vp-head{display:flex;justify-content:space-between;align-items:center;gap:14px;border-bottom:1px solid #294969;padding-bottom:18px;margin-bottom:22px}
  .vp-brand{font-weight:900;letter-spacing:.5px}.vp-brand span{display:block;color:#22d3ee;font-size:12px;letter-spacing:2px}
  .vp-card{background:linear-gradient(145deg,#10243a,#0b1b2d);border:1px solid #294969;border-radius:20px;padding:22px;margin:14px 0;box-shadow:0 16px 42px #0005}
  .vp-kicker{color:#22d3ee;font-size:11px;letter-spacing:2px;font-weight:800}
  .vp-title{font-size:clamp(23px,4vw,34px);margin:8px 0}.vp-muted{color:#b7c8db}
  .vp-input{width:100%;box-sizing:border-box;background:#172f49;color:#fff;border:1px solid #355776;border-radius:12px;padding:14px;font-size:16px}
  .vp-btn{border:0;border-radius:12px;padding:13px 18px;background:linear-gradient(110deg,#11b8d3,#27e0cf);color:#042033;font-weight:900;cursor:pointer}
  .vp-btn:disabled{opacity:.5;cursor:wait}
  .vp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:16px}
  .vp-candidate{border:1px solid #2d4e6c;border-radius:16px;overflow:hidden;background:#0d2034;cursor:pointer;transition:.2s}
  .vp-candidate.selected{border:2px solid #22d3ee;box-shadow:0 0 0 3px #22d3ee22,0 0 25px #22d3ee33}
  .vp-photo{width:100%;height:420px;max-height:420px;object-fit:contain;object-position:center;background:#081525;display:block}
  .vp-photo-empty{height:420px;max-height:420px;display:grid;place-items:center;background:linear-gradient(135deg,#173655,#0b1929);color:#4dd9eb;font-size:28px;font-weight:900}
  .vp-candidate-body{padding:15px}.vp-candidate-body h3{margin:5px 0}.vp-candidate-body p{color:#c2d0df;font-size:13px;line-height:1.55}
  .vp-radio{display:flex;align-items:center;gap:8px;color:#42d9ec;font-weight:800;margin-top:12px}
  .vp-msg{padding:12px;border-radius:10px;background:#102b43;color:#d8e9f8;margin-top:12px;white-space:pre-wrap}
  .vp-foot{text-align:center;color:#8098b2;font-size:12px;margin:26px 0}
  @keyframes vpRgbBorder{0%{border-color:#22d3ee;box-shadow:0 0 0 1px #22d3ee22,0 12px 34px #22d3ee12}25%{border-color:#8b5cf6;box-shadow:0 0 0 1px #8b5cf622,0 12px 34px #8b5cf612}50%{border-color:#ec4899;box-shadow:0 0 0 1px #ec489922,0 12px 34px #ec489912}75%{border-color:#22c55e;box-shadow:0 0 0 1px #22c55e22,0 12px 34px #22c55e12}100%{border-color:#22d3ee;box-shadow:0 0 0 1px #22d3ee22,0 12px 34px #22d3ee12}}
  @keyframes vpRgbText{0%{color:#22d3ee}25%{color:#a78bfa}50%{color:#f472b6}75%{color:#4ade80}100%{color:#22d3ee}}
  .vp-card{animation:vpRgbBorder 12s linear infinite}
  .vp-brand span,.vp-kicker{animation:vpRgbText 10s linear infinite}
  .vp-head{border-image:linear-gradient(90deg,#22d3ee,#8b5cf6,#ec4899,#22c55e,#22d3ee) 1;animation:vpRgbText 10s linear infinite}
  .vp-org-brand{display:flex;align-items:center;gap:12px;min-width:0}
  .vp-org-logo{width:54px;height:54px;object-fit:contain;border-radius:12px;background:#fff;padding:4px;flex:none}
  .vp-org-name{font-size:14px;font-weight:800;line-height:1.35;max-width:320px}
  @media(prefers-reduced-motion:reduce){.vp-card,.vp-brand span,.vp-kicker,.vp-head{animation:none!important}}
  @media(max-width:600px){#voterPortal{padding:16px 10px}.vp-card{padding:16px}.vp-photo,.vp-photo-empty{height:420px;max-height:420px}}
  `;
  document.head.appendChild(portalStyle);
  document.body.classList.add("voter-mode");
  const portalRoot=document.createElement("main");portalRoot.id="voterPortal";
  document.body.appendChild(portalRoot);
  let voterCandidates=[],selectedCandidateId="";
  const voterEsc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const portalRender=(html)=>{portalRoot.innerHTML=`<div class="vp-shell">${html}</div>`;};
  async function openSuperOverview(){
  try{
    if(!isSuperAdmin)throw new Error("Menu ini hanya untuk Super Admin.");
    showView("Dashboard Global",`<div class="ev-super-page"><span class="ev-kicker">ROBOTIC GLOBAL COMMAND</span><h2>Dashboard Super Admin</h2><p>Pemantauan seluruh lembaga dalam satu pusat kendali.</p><button id="refreshGlobal" class="primary">↻ Perbarui Statistik</button><div id="globalStats" class="ev-global-stats">Memuat statistik…</div><div id="globalOrgList"></div></div>`);
    $("refreshGlobal").onclick=loadGlobalStats;
    await loadGlobalStats();
  }catch(err){showView("Dashboard Global",`<p>${esc(err.message)}</p>`);}
}
async function loadGlobalStats(){
  const stats=$("globalStats"),list=$("globalOrgList");stats.textContent="Mengambil data…";list.textContent="";
  try{
    const {data:orgs,error:oe}=await supabase.rpc("list_organizations");if(oe)throw oe;
    const organizations=orgs||[];
    const [{count:electionCount,error:ee},{count:adminCount,error:ae}] = await Promise.all([
      supabase.from("elections").select("id",{count:"exact",head:true}),
      supabase.from("organization_members").select("user_id",{count:"exact",head:true}).eq("role","org_admin")
    ]);
    const {count:activeElections,error:activeErr}=await supabase.from("elections").select("id",{count:"exact",head:true}).eq("status","active");
    const activeOrgs=organizations.filter(o=>String(o.organization_status).toLowerCase()==="active").length;
    stats.innerHTML=`
      <div class="ev-global-stat"><span>Total Lembaga</span><strong>${organizations.length}</strong></div>
      <div class="ev-global-stat"><span>Lembaga Aktif</span><strong>${activeOrgs}</strong></div>
      <div class="ev-global-stat"><span>Admin Lembaga</span><strong>${ae? "—":(adminCount||0)}</strong></div>
      <div class="ev-global-stat"><span>Total Pemilihan</span><strong>${ee? "—":(electionCount||0)}</strong></div>
      <div class="ev-global-stat"><span>Pemilihan Aktif</span><strong>${activeErr?"—":(activeElections||0)}</strong></div>`;
    list.innerHTML=`<section class="ev-global-list"><h3>Daftar Lembaga</h3>${organizations.map(o=>`<article><div><b>${esc(o.organization_name)}</b><small>Kode: ${esc(o.organization_slug||"-")}</small></div><span class="${String(o.organization_status).toLowerCase()==="active"?"ev-status-active":"ev-status-off"}">${esc(o.organization_status||"Tidak diketahui")}</span></article>`).join("")||"<p>Belum ada lembaga.</p>"}</section>`;
  }catch(err){stats.textContent="Gagal memuat statistik: "+err.message;}
}
async function openInstitutionAdmin(){
  try{
    if(!isSuperAdmin)throw new Error("Menu ini hanya untuk Super Admin.");
    const {data:orgs,error}=await supabase.rpc("list_organizations");if(error)throw error;
    showView("Admin & Lembaga",`<div class="ev-super-page"><span class="ev-kicker">INSTITUTION ACCESS CONTROL</span><h2>Pengelolaan Admin & Lembaga</h2><p>Kelola status lembaga dan keanggotaan admin. Perubahan status mengikuti kebijakan akses Supabase.</p>
      <label>Pilih lembaga</label><select id="manageOrg"><option value="">Pilih lembaga…</option>${(orgs||[]).map(o=>`<option value="${esc(o.organization_id)}">${esc(o.organization_name)} — ${esc(o.organization_status)}</option>`).join("")}</select>
      <div class="ev-stage6-actions"><button id="loadOrgMembers" class="primary">Tampilkan Admin</button><button id="toggleOrgStatus">Aktifkan / Nonaktifkan Lembaga</button></div>
      <div id="orgManageMessage"></div><div id="orgMembersOutput"></div></div>`);
    $("loadOrgMembers").onclick=loadOrgMembers;
    $("toggleOrgStatus").onclick=async()=>{
      const id=$("manageOrg").value;if(!id){$("orgManageMessage").textContent="Pilih lembaga terlebih dahulu.";return;}
      const org=(orgs||[]).find(o=>o.organization_id===id);const old=String(org?.organization_status||"").toLowerCase();
      const next=old==="active"?"inactive":"active";
      if(!confirm(`Ubah status ${org?.organization_name||"lembaga"} menjadi ${next.toUpperCase()}?`))return;
      try{
        const {error:updateError}=await supabase.from("organizations").update({status:next}).eq("id",id);
        if(updateError)throw updateError;
        $("orgManageMessage").textContent="Status lembaga berhasil diperbarui.";
        await openInstitutionAdmin();
      }catch(err){$("orgManageMessage").textContent="Tidak dapat mengubah status: "+err.message+" Pastikan kolom status dan kebijakan RLS mengizinkan Super Admin.";}
    };
    async function loadOrgMembers(){
      const id=$("manageOrg").value,out=$("orgMembersOutput");if(!id){out.textContent="Pilih lembaga terlebih dahulu.";return;}
      out.textContent="Memuat akun admin…";
      try{
        const {data,error}=await supabase.from("organization_members").select("user_id,organization_id,role,status").eq("organization_id",id).eq("role","org_admin").order("status",{ascending:true});
        if(error)throw error;
        out.innerHTML=`<h3>Akun Admin Lembaga</h3><p>Daftar identitas akun. Email tidak ditampilkan karena tabel autentikasi tidak dibuka ke browser.</p>${(data||[]).map(m=>`<article class="ev-member-row"><div><b>Admin Lembaga</b><small>UID: ${esc(m.user_id)}</small><span>Status: ${esc(m.status)}</span></div><button type="button" data-member="${esc(m.user_id)}" data-member-status="${esc(m.status)}">${String(m.status).toLowerCase()==="active"?"Nonaktifkan":"Aktifkan"}</button></article>`).join("")||"<p>Belum ada admin lembaga terdaftar.</p>"}`;
        out.querySelectorAll("[data-member]").forEach(btn=>btn.onclick=async()=>{
          const uid=btn.dataset.member,next=String(btn.dataset.memberStatus).toLowerCase()==="active"?"inactive":"active";
          if(!confirm(`Ubah status akun admin menjadi ${next}?`))return;
          btn.disabled=true;
          try{const {error:upErr}=await supabase.from("organization_members").update({status:next}).eq("user_id",uid).eq("organization_id",id).eq("role","org_admin");if(upErr)throw upErr;await loadOrgMembers();}
          catch(err){alert("Gagal mengubah status admin: "+err.message);btn.disabled=false;}
        });
      }catch(err){out.textContent="Gagal memuat admin: "+err.message;}
    }
  }catch(err){showView("Admin & Lembaga",`<p>${esc(err.message)}</p>`);}
}
async function openAuditTrail(){
  try{
    if(!currentUser)throw new Error("Silakan login terlebih dahulu.");
    let orgId=currentOrgId;
    if(isSuperAdmin){
      const {data,error}=await supabase.rpc("list_organizations");if(error)throw error;
      const orgs=data||[];
      showView("Audit Trail",`<div class="ev-audit-page"><span class="ev-kicker">ROBOTIC SECURITY CENTER</span><h2>Audit Trail Seluruh Lembaga</h2><label>Pilih lembaga</label><select id="auditOrg"><option value="">Pilih lembaga…</option>${orgs.map(o=>`<option value="${esc(o.organization_id)}">${esc(o.organization_name)}</option>`).join("")}</select><button id="loadAudit" class="primary">Tampilkan Aktivitas</button><div id="auditOutput"></div></div>`);
      $("loadAudit").onclick=async()=>{const id=$("auditOrg").value;if(!id){$("auditOutput").textContent="Pilih lembaga terlebih dahulu.";return;}await renderAuditRows(id);};
      return;
    }
    if(!orgId)throw new Error("Akun ini tidak memiliki lembaga aktif.");
    showView("Audit Trail",`<div class="ev-audit-page"><span class="ev-kicker">ROBOTIC SECURITY CENTER</span><h2>Riwayat Aktivitas</h2><p>Aktivitas administratif pada lembaga ${esc(currentOrgName||"")}</p><button id="loadAudit" class="primary">↻ Perbarui Riwayat</button><div id="auditOutput"></div></div>`);
    $("loadAudit").onclick=()=>renderAuditRows(orgId);
    await renderAuditRows(orgId);
  }catch(err){showView("Audit Trail",`<p>Gagal membuka audit trail: ${esc(err.message)}</p>`);}
}
async function renderAuditRows(orgId){
  const out=$("auditOutput");out.textContent="Memuat riwayat aktivitas…";
  try{
    const {data,error}=await supabase.from("audit_logs").select("*").eq("organization_id",orgId).order("created_at",{ascending:false}).limit(200);
    if(error)throw error;
    const rows=data||[];
    const safe=rows.map(row=>{
      const clean={...row};
      for(const key of Object.keys(clean))if(/token|hash|password|secret|credential/i.test(key))clean[key]="[DISEMBUNYIKAN]";
      return clean;
    });
    out.innerHTML=`<div class="ev-audit-summary">Menampilkan ${rows.length} aktivitas terbaru (maksimal 200).</div><div class="ev-audit-table-wrap"><table class="ev-report-table"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>${safe.map(r=>`<tr><td>${esc(r.created_at||"-")}</td><td>${esc(r.user_id||r.actor_id||"-")}</td><td>${esc(r.action||r.action_type||r.event_type||"-")}</td><td>${esc(JSON.stringify(r.details||r.metadata||r.description||{}))}</td></tr>`).join("")||`<tr><td colspan="4">Belum ada catatan audit atau akses dibatasi.</td></tr>`}</tbody></table></div>`;
  }catch(err){out.textContent="Tidak dapat memuat audit trail: "+err.message;}
}
async function openBackupCenter(){
  try{
    requireOrg();
    showView("Backup & Arsip",`<div class="ev-audit-page"><span class="ev-kicker">DATA PROTECTION CENTER</span><h2>Backup Data Lembaga</h2><p>Unduh salinan data administratif lembaga ini. Data suara pemilih dan hash token tidak disertakan.</p><div class="ev-backup-warning">Simpan file backup di tempat aman. File ini dapat memuat data kandidat dan data operasional pemilihan.</div><button id="runBackup" class="primary">⬇ Buat Backup JSON</button><div id="backupStatus"></div></div>`);
    $("runBackup").onclick=async()=>{
      const b=$("runBackup"),status=$("backupStatus");b.disabled=true;b.textContent="Menyiapkan backup…";
      try{
        const tables=[
          ["organizations",`id,name,slug,status,created_at`,"id"],
          ["organization_settings","*","organization_id"],
          ["elections","id,organization_id,title,description,election_type,academic_period,status,token_quota,starts_at,ends_at,results_locked,created_at","created_at"],
          ["candidates","id,election_id,number,name,short_bio,vision,mission,photo_url,created_at","number"],
          ["voter_tokens","id,election_id,vote_limit,used_count,created_at","created_at"],
          ["audit_logs","*","created_at"]
        ];
        const backup={application:"E-VOTING ROBOTIC PRO",version:2,created_at:new Date().toISOString(),organization_id:currentOrgId,organization_name:currentOrgName,tables:{}};
        for(const [table,columns,order] of tables){
          let query=supabase.from(table).select(columns);
          if(table==="organizations")query=query.eq("id",currentOrgId);
          else if(table==="organization_settings")query=query.eq("organization_id",currentOrgId);
          else if(table==="elections")query=query.eq("organization_id",currentOrgId);
          else if(table==="candidates"||table==="voter_tokens"){
            const {data:es,error:ee}=await supabase.from("elections").select("id").eq("organization_id",currentOrgId);if(ee)throw ee;
            const ids=(es||[]).map(x=>x.id);
            if(!ids.length){backup.tables[table]=[];continue;}
            query=query.in("election_id",ids);
          }else if(table==="audit_logs")query=query.eq("organization_id",currentOrgId);
          const {data,error}=await query.order(order,{ascending:true}).limit(10000);
          if(error)throw new Error(`Backup ${table}: ${error.message}`);
          backup.tables[table]=(data||[]).map(row=>{
            const clean={...row};for(const key of Object.keys(clean))if(/token_hash|token_value|password|secret|credential/i.test(key))delete clean[key];return clean;
          });
        }
        const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
        a.href=url;a.download=`backup-evoting-${String(currentOrgName||"lembaga").toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
        status.textContent="Backup berhasil dibuat. Simpan file di tempat aman.";
      }catch(err){status.textContent="Backup gagal: "+err.message;}
      finally{b.disabled=false;b.textContent="⬇ Buat Backup JSON";}
    };
  }catch(err){showView("Backup & Arsip",`<p>Gagal membuka backup: ${esc(err.message)}</p>`);}
}
async function loadVoterPortal(){
    portalRender(`<div class="vp-head"><div class="vp-brand">E-VOTING</div><span class="vp-muted">PORTAL PEMILIH</span></div><div class="vp-card">Memuat informasi pemilihan…</div>`);
    try{
      const {data,error}=await supabase.rpc("get_public_election",{p_election_id:voterElectionId});
      if(error)throw error;
      const info=Array.isArray(data)?data[0]:data;
      if(!info||!info.id)throw new Error("Pemilihan tidak ditemukan, belum aktif, atau belum dapat diakses.");
      voterCandidates=Array.isArray(info.candidates)?info.candidates:[];
      if(!voterCandidates.length)throw new Error("Belum ada kandidat pada pemilihan ini.");
      let orgBrand={organization_name:"",unit_name:"",logo_url:""};
      if(info.organization_id){
        try{const {data:brandData,error:brandError}=await supabase.rpc("get_public_organization_branding",{p_org_id:info.organization_id});if(!brandError&&brandData)orgBrand=Array.isArray(brandData)?(brandData[0]||orgBrand):brandData;}catch(brandErr){console.warn("Brand lembaga belum tersedia:",brandErr.message);}
      }
      const displayOrgName=orgBrand.unit_name||orgBrand.organization_name||"";
      portalRender(`
        <div class="vp-head"><div class="vp-org-brand">${orgBrand.logo_url?`<img class="vp-org-logo" src="${voterEsc(orgBrand.logo_url)}" alt="Logo lembaga">`:""}<div><div class="vp-org-name">${voterEsc(displayOrgName||"E-VOTING")}</div><div class="vp-brand-sub">PEMILIHAN DIGITAL</div></div></div><span class="vp-muted">PEMILIHAN ONLINE</span></div>
        <section class="vp-card"><div class="vp-kicker">PEMILIHAN RESMI</div><h1 class="vp-title">${voterEsc(info.title)}</h1><p class="vp-muted">${voterEsc(info.description||"Silakan masukkan token dan pilih satu kandidat.")}</p><div class="vp-muted">Status: AKTIF · Periode: ${voterEsc(info.academic_period||"-")}</div></section>
        <section class="vp-card"><div class="vp-kicker">LANGKAH 1</div><h2>Masukkan Token Pemilih</h2><p class="vp-muted">Gunakan token yang diberikan panitia. Jangan bagikan token kepada orang lain.</p><input class="vp-input" id="voterToken" autocomplete="one-time-code" autocapitalize="characters" maxlength="32" placeholder="MASUKKAN TOKEN"><p class="vp-muted">Token bersifat rahasia dan hanya dapat digunakan sesuai jatah yang ditetapkan panitia.</p></section>
        <section class="vp-card"><div class="vp-kicker">LANGKAH 2</div><h2>Pilih Kandidat</h2><p class="vp-muted">Periksa foto, profil, visi, dan misi sebelum menentukan pilihan.</p><div class="vp-grid" id="voterCandidates">${voterCandidates.map((c,i)=>`<article class="vp-candidate" data-candidate="${voterEsc(c.id)}">
          ${c.photo_url?`<img class="vp-photo" src="${voterEsc(c.photo_url)}" alt="Foto kandidat">`:`<div class="vp-photo-empty">NO. ${voterEsc(c.number)}</div>`}
          <div class="vp-candidate-body"><div class="vp-kicker">NOMOR URUT ${voterEsc(c.number)}</div><h3>${voterEsc(c.name)}</h3><p>${voterEsc(c.bio||"")}</p><details><summary>Visi dan misi</summary><p><b>Visi</b><br>${voterEsc(c.vision||"Belum diisi.")}</p><p><b>Misi</b><br>${voterEsc(c.mission||"Belum diisi.")}</p></details><label class="vp-radio"><input type="radio" name="candidateChoice" value="${voterEsc(c.id)}"> PILIH KANDIDAT INI</label></div>
        </article>`).join("")}</div></section>
        <section class="vp-card"><div class="vp-kicker">LANGKAH 3</div><h2>Konfirmasi Suara</h2><p class="vp-muted">Pastikan token dan pilihan kandidat sudah benar. Suara yang sudah dikirim tidak dapat diubah.</p><button id="submitVote" class="vp-btn" disabled>KIRIM SUARA</button><div id="voteMessage" class="vp-msg" hidden></div></section>
        <div class="vp-foot">© ${new Date().getFullYear()} E-VOTING · @Mr.Mey</div>`);
      const cards=portalRoot.querySelectorAll("[data-candidate]");
      cards.forEach(card=>card.onclick=e=>{
        if(e.target.closest("details"))return;
        selectedCandidateId=card.dataset.candidate;
        cards.forEach(c=>c.classList.toggle("selected",c===card));
        const radio=card.querySelector('input[name="candidateChoice"]');if(radio)radio.checked=true;
        portalRoot.querySelector("#submitVote").disabled=false;
      });
      portalRoot.querySelectorAll('input[name="candidateChoice"]').forEach(r=>r.onchange=()=>{
        selectedCandidateId=r.value;cards.forEach(c=>c.classList.toggle("selected",c.dataset.candidate===selectedCandidateId));portalRoot.querySelector("#submitVote").disabled=false;
      });
      portalRoot.querySelector("#submitVote").onclick=async()=>{
        const btn=portalRoot.querySelector("#submitVote"),msg=portalRoot.querySelector("#voteMessage");
        const token=portalRoot.querySelector("#voterToken").value.trim().toUpperCase();
        if(!token){msg.hidden=false;msg.textContent="Masukkan token pemilih terlebih dahulu.";return;}
        if(!selectedCandidateId){msg.hidden=false;msg.textContent="Pilih salah satu kandidat terlebih dahulu.";return;}
        if(!confirm("Kirim suara untuk kandidat yang dipilih? Suara tidak dapat diubah setelah dikirim."))return;
        btn.disabled=true;btn.textContent="MENGIRIM SUARA…";
        try{
          const {data,error}=await supabase.rpc("cast_vote",{p_token:token,p_election_id:voterElectionId,p_candidate_id:selectedCandidateId});
          if(error)throw error;
          if(data!==true)throw new Error("Server belum mengonfirmasi suara diterima.");
          portalRender(`<div class="vp-head"><div class="vp-brand">E-VOTING</div></div><section class="vp-card" style="text-align:center;padding:42px 22px"><div style="font-size:58px;color:#23d89b">✓</div><div class="vp-kicker">SUARA TERCATAT</div><h1 class="vp-title">Terima kasih telah menggunakan hak pilih.</h1><p class="vp-muted">Suara Anda telah diterima oleh sistem. Identitas pemilih tidak ditampilkan pada hasil suara.</p><button type="button" class="vp-btn" id="nextVoterBtn" style="margin-top:18px">PEMILIH BERIKUTNYA</button><p class="vp-muted" style="font-size:12px;margin-top:10px">Gunakan token baru untuk pemilih berikutnya pada perangkat ini.</p><div class="vp-foot">© ${new Date().getFullYear()} E-VOTING · @Mr.Mey</div></section>`);
          const nextVoterBtn=document.getElementById("nextVoterBtn");
          if(nextVoterBtn) nextVoterBtn.addEventListener("click",()=>window.location.reload());
        }catch(err){msg.hidden=false;msg.textContent="Suara belum berhasil dikirim: "+err.message;btn.disabled=false;btn.textContent="COBA KEMBALI";}
      };
    }catch(err){
      portalRender(`<div class="vp-head"><div class="vp-brand">E-VOTING</div></div><section class="vp-card"><h2>Portal pemilih belum tersedia</h2><p class="vp-muted">${voterEsc(err.message)}</p></section>`);
    }
  }
  loadVoterPortal();
}

// Tahap 4 — styling analitik hasil pemilihan
{
 const s=document.createElement("style");
 s.textContent=`
 .ev-report-toolbar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:14px 0}
 .ev-report-summary-v2{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}
 .ev-report-summary-v2>div,.ev-winner-panel,.ev-chart-panel{border:1px solid var(--ev-line);border-radius:16px;padding:18px;background:var(--ev-panel);color:var(--ev-text)}
 .ev-report-summary-v2 span{display:block;color:var(--ev-muted);font-size:12px;margin-bottom:8px}
 .ev-report-summary-v2 strong{font-size:25px;overflow-wrap:anywhere}
 .ev-report-summary-v2 .ev-summary-winner{font-size:17px}
 .ev-winner-panel{margin:14px 0;background:linear-gradient(120deg,#0c3c48,#142b45)}
 .ev-winner-panel h3{margin:8px 0;color:#67e8f9;font-size:23px}.ev-winner-panel p{margin:0;color:#d5e9f5}
 .ev-chart-panel{margin:14px 0}.ev-chart-row{margin:18px 0}
 .ev-chart-label{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px;color:var(--ev-text);font-size:13px}
 .ev-chart-label span{color:var(--ev-muted)}
 .ev-chart-track{height:15px;background:var(--ev-field);border-radius:20px;overflow:hidden;border:1px solid var(--ev-line)}
 .ev-chart-bar{height:100%;min-width:0;border-radius:20px;background:linear-gradient(90deg,#0891b2,#22d3ee,#a3e635);transition:width .5s ease}
 .ev-report-meta{margin:14px 0;color:var(--ev-muted);font-size:12px;line-height:1.8}
 @media print{body *{visibility:hidden!important}#adminView,#adminView *{visibility:visible!important}#adminView{position:absolute;left:0;top:0;width:100%;background:#fff!important;color:#111!important}.ev-report-panel,.ev-report-panel *{color:#111!important;background:#fff!important;box-shadow:none!important}.ev-report-actions,.ev-report-toolbar{display:none!important}.ev-chart-track{border:1px solid #888!important}.ev-chart-bar{background:#777!important}}
 `;
 document.head.appendChild(s);
}

// Tahap 5 — styling pengesahan dan berita acara
{
 const s=document.createElement("style");
 s.textContent=`
 .ev-lock-panel,.ev-minutes-panel{border:1px solid var(--ev-line);border-radius:16px;padding:18px;margin:14px 0;background:var(--ev-panel);color:var(--ev-text)}
 .ev-lock-panel{display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap}
 .ev-lock-panel p{margin:8px 0}.ev-lock-panel small{color:var(--ev-muted)}
 .ev-lock-badge{display:inline-block;padding:7px 12px;border-radius:30px;background:#064e3b;color:#a7f3d0;font-weight:900}
 .ev-unlock-badge{display:inline-block;padding:7px 12px;border-radius:30px;background:#713f12;color:#fde68a;font-weight:900}
 .ev-lock-actions button,.ev-minutes-panel button{padding:11px 15px;border-radius:10px;margin:5px 6px 5px 0}
 .ev-minutes-panel h3{margin:8px 0 16px;color:var(--ev-accent)}
 .ev-minutes-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:14px 0}
 .ev-minutes-grid label{display:grid;gap:6px;color:var(--ev-muted);font-size:13px}
 .ev-minutes-grid input{width:100%;box-sizing:border-box;padding:11px;border:1px solid var(--ev-line);border-radius:9px;background:var(--ev-field);color:var(--ev-text)}
 @media(max-width:650px){.ev-minutes-grid{grid-template-columns:1fr}}
 @media print{.ev-lock-panel,.ev-minutes-panel,.ev-report-toolbar{display:none!important}}
 `;
 document.head.appendChild(s);
}

// Tahap 6 — gaya pusat kontrol dan audit
{
 const s=document.createElement("style");
 s.textContent=`
 #stage6Tools{margin-top:18px;padding:18px;border-radius:16px}
 .ev-stage6-actions{display:flex;gap:10px;flex-wrap:wrap}
 .ev-stage6-actions button,.ev-audit-page button{padding:11px 16px;border-radius:10px;border:1px solid var(--ev-line);background:linear-gradient(120deg,#075985,#0e7490);color:#fff;font-weight:800;cursor:pointer}
 .ev-audit-page{padding:18px;border:1px solid var(--ev-line);border-radius:16px;background:var(--ev-panel);color:var(--ev-text)}
 .ev-audit-page h2{color:var(--ev-accent)}.ev-audit-page select{display:block;width:100%;max-width:500px;padding:11px;margin:12px 0;background:var(--ev-field);color:var(--ev-text);border:1px solid var(--ev-line);border-radius:10px}
 .ev-audit-summary,.ev-backup-warning{padding:12px;margin:12px 0;border-radius:10px;background:var(--ev-field);color:var(--ev-muted)}
 .ev-audit-table-wrap{overflow:auto;margin-top:14px}
 `;
 document.head.appendChild(s);
}

{
 const s=document.createElement("style");
 s.textContent=`
 #stage7Tools{margin-top:18px;padding:18px;border-radius:16px}
 .ev-super-page{padding:18px;border:1px solid var(--ev-line);border-radius:16px;background:var(--ev-panel);color:var(--ev-text)}
 .ev-super-page h2{color:var(--ev-accent)}.ev-super-page select{width:100%;max-width:560px;padding:12px;margin:12px 0;background:var(--ev-field);color:var(--ev-text);border:1px solid var(--ev-line);border-radius:10px}
 .ev-global-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:18px 0}
 .ev-global-stat{padding:17px;border:1px solid var(--ev-line);border-radius:14px;background:var(--ev-panel)}
 .ev-global-stat span{display:block;color:var(--ev-muted);font-size:12px}.ev-global-stat strong{display:block;margin-top:9px;font-size:26px;color:var(--ev-accent)}
 .ev-global-list{margin-top:16px;padding:16px;border:1px solid var(--ev-line);border-radius:14px}
 .ev-global-list article,.ev-member-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--ev-line)}
 .ev-global-list article div,.ev-member-row div{display:grid;gap:5px}.ev-global-list small,.ev-member-row small,.ev-member-row span{display:block;color:var(--ev-muted);font-size:12px;overflow-wrap:anywhere}
 .ev-status-active{color:#34d399;font-weight:800}.ev-status-off{color:#fbbf24;font-weight:800}
 .ev-member-row button{padding:9px 12px;border-radius:9px;border:1px solid var(--ev-line);background:var(--ev-field);color:var(--ev-text);cursor:pointer}
 `;
 document.head.appendChild(s);
}

// FIX TAHAP 7–8: expose handlers globally so dashboard buttons can invoke them.
window.openSuperOverview = async function(){
  try{
    if(!isSuperAdmin)throw new Error("Menu ini hanya untuk Super Admin.");
    showView("Dashboard Global",`<div class="ev-super-page"><span class="ev-kicker">ROBOTIC GLOBAL COMMAND</span><h2>Dashboard Super Admin</h2><p>Pemantauan seluruh lembaga dalam satu pusat kendali.</p><button id="refreshGlobal" class="primary">↻ Perbarui Statistik</button><div id="globalStats" class="ev-global-stats">Memuat statistik…</div><div id="globalOrgList"></div></div>`);
    $("refreshGlobal").onclick=window.loadGlobalStats;
    await window.loadGlobalStats();
  }catch(err){showView("Dashboard Global",`<p>${esc(err.message)}</p>`);}
};
window.loadGlobalStats = async function(){
  const stats=$("globalStats"),list=$("globalOrgList");stats.textContent="Mengambil data…";list.textContent="";
  try{
    const {data:orgs,error:oe}=await supabase.rpc("list_organizations");if(oe)throw oe;
    const organizations=orgs||[];
    const [elections,admins,active] = await Promise.all([
      supabase.from("elections").select("id",{count:"exact",head:true}),
      supabase.from("organization_members").select("user_id",{count:"exact",head:true}).eq("role","org_admin"),
      supabase.from("elections").select("id",{count:"exact",head:true}).eq("status","active")
    ]);
    const activeOrgs=organizations.filter(o=>String(o.organization_status||o.status||"").toLowerCase()==="active").length;
    stats.innerHTML=`<div class="ev-global-stat"><span>Total Lembaga</span><strong>${organizations.length}</strong></div>
      <div class="ev-global-stat"><span>Lembaga Aktif</span><strong>${activeOrgs}</strong></div>
      <div class="ev-global-stat"><span>Admin Lembaga</span><strong>${admins.error?"—":admins.count||0}</strong></div>
      <div class="ev-global-stat"><span>Total Pemilihan</span><strong>${elections.error?"—":elections.count||0}</strong></div>
      <div class="ev-global-stat"><span>Pemilihan Aktif</span><strong>${active.error?"—":active.count||0}</strong></div>`;
    list.innerHTML=`<section class="ev-global-list"><h3>Daftar Lembaga</h3>${organizations.map(o=>`<article><div><b>${esc(o.organization_name||o.name||"Lembaga")}</b><small>${esc(o.organization_slug||o.slug||"-")}</small></div><span>${esc(o.organization_status||o.status||"-")}</span></article>`).join("")||"<p>Belum ada lembaga.</p>"}</section>`;
    $("refreshGlobal").onclick=window.loadGlobalStats;
  }catch(err){stats.textContent="Gagal memuat statistik: "+err.message;}
};
window.openInstitutionAdmin = async function(){
  try{
    if(!isSuperAdmin)throw new Error("Menu ini hanya untuk Super Admin.");
    const {data:orgs,error}=await supabase.rpc("list_organizations");if(error)throw error;
    showView("Admin & Lembaga",`<div class="ev-super-page"><span class="ev-kicker">INSTITUTION ACCESS CONTROL</span><h2>Pengelolaan Admin & Lembaga</h2><p>Pilih lembaga untuk memeriksa dan mengelola status admin.</p>
      <label>Pilih lembaga</label><select id="manageOrg"><option value="">Pilih lembaga…</option>${(orgs||[]).map(o=>`<option value="${esc(o.organization_id)}">${esc(o.organization_name||o.name)} — ${esc(o.organization_status||o.status)}</option>`).join("")}</select>
      <div class="ev-stage6-actions"><button id="loadOrgMembers" class="primary">Tampilkan Admin</button><button id="toggleOrgStatus">Aktifkan / Nonaktifkan Lembaga</button></div><div id="orgManageMessage"></div><div id="orgMembersOutput"></div></div>`);
    $("loadOrgMembers").onclick=async()=>{
      const id=$("manageOrg").value,out=$("orgMembersOutput");if(!id){out.textContent="Pilih lembaga terlebih dahulu.";return;}
      out.textContent="Memuat admin…";
      const {data,error}=await supabase.from("organization_members").select("user_id,organization_id,role,status").eq("organization_id",id).eq("role","org_admin");
      if(error){out.textContent="Gagal memuat admin: "+error.message;return;}
      out.innerHTML=`<h3>Akun Admin Lembaga</h3>${(data||[]).map(m=>`<article class="ev-member-row"><div><b>Admin Lembaga</b><small>UID: ${esc(m.user_id)}</small><span>Status: ${esc(m.status)}</span></div><button data-uid="${esc(m.user_id)}" data-status="${esc(m.status)}">${String(m.status).toLowerCase()==="active"?"Nonaktifkan":"Aktifkan"}</button></article>`).join("")||"<p>Belum ada admin.</p>"}`;
      out.querySelectorAll("[data-uid]").forEach(btn=>btn.onclick=async()=>{
        const next=btn.dataset.status==="active"?"inactive":"active";
        if(!confirm("Ubah status admin menjadi "+next+"?"))return;
        const {error:up}=await supabase.from("organization_members").update({status:next}).eq("user_id",btn.dataset.uid).eq("organization_id",id).eq("role","org_admin");
        if(up){alert(up.message);return;} $("loadOrgMembers").click();
      });
    };
    $("toggleOrgStatus").onclick=async()=>{
      const id=$("manageOrg").value;if(!id){$("orgManageMessage").textContent="Pilih lembaga dahulu.";return;}
      const org=(orgs||[]).find(o=>o.organization_id===id);const old=String(org?.organization_status||org?.status||"").toLowerCase();const next=old==="active"?"inactive":"active";
      if(!confirm(`Ubah status lembaga menjadi ${next}?`))return;
      const {error:up}=await supabase.from("organizations").update({status:next}).eq("id",id);
      $("orgManageMessage").textContent=up?"Gagal mengubah status: "+up.message:"Status lembaga diperbarui.";
    };
  }catch(err){showView("Admin & Lembaga",`<p>${esc(err.message)}</p>`);}
};

// HOTFIX: delegated capture handlers. Menjamin tombol panel kontrol tetap responsif
// walaupun panel dibuat dinamis setelah proses login.
window.openAuditTrail = async function(){
  try{
    if(!currentUser)throw new Error("Silakan login terlebih dahulu.");
    if(isSuperAdmin){
      const {data:orgs,error}=await supabase.rpc("list_organizations");if(error)throw error;
      showView("Audit Trail",`<div class="ev-audit-page"><h2>Audit Trail Seluruh Lembaga</h2><label>Pilih lembaga</label><select id="auditOrg"><option value="">Pilih lembaga…</option>${(orgs||[]).map(o=>`<option value="${esc(o.organization_id)}">${esc(o.organization_name)}</option>`).join("")}</select><button id="loadAudit" type="button">Tampilkan Aktivitas</button><div id="auditOutput"></div></div>`);
      $("loadAudit").onclick=()=>window.loadAuditRows($("auditOrg").value);
    }else{
      showView("Audit Trail",`<div class="ev-audit-page"><h2>Riwayat Aktivitas</h2><button id="loadAudit" type="button">Perbarui Riwayat</button><div id="auditOutput"></div></div>`);
      $("loadAudit").onclick=()=>window.loadAuditRows(currentOrgId);
      await window.loadAuditRows(currentOrgId);
    }
  }catch(e){showView("Audit Trail",`<p>Gagal membuka audit: ${esc(e.message)}</p>`);}
};
window.loadAuditRows=async function(orgId){
  const out=$("auditOutput");if(!orgId){out.textContent="Pilih lembaga terlebih dahulu.";return;}
  out.textContent="Memuat aktivitas…";
  try{
    const {data,error}=await supabase.from("audit_logs").select("*").eq("organization_id",orgId).order("created_at",{ascending:false}).limit(200);
    if(error)throw error;
    out.innerHTML=`<p>${(data||[]).length} aktivitas terbaru</p><div style="overflow:auto"><table class="ev-report-table"><thead><tr><th>Waktu</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>${(data||[]).map(r=>`<tr><td>${esc(r.created_at||"-")}</td><td>${esc(r.action||r.action_type||"-")}</td><td>${esc(JSON.stringify(r.details||r.metadata||{}))}</td></tr>`).join("")||"<tr><td colspan='3'>Belum ada aktivitas.</td></tr>"}</tbody></table></div>`;
  }catch(e){out.textContent="Tidak dapat memuat audit trail: "+e.message;}
};
window.openBackupCenter=async function(){
  try{
    if(!currentUser)throw new Error("Silakan login terlebih dahulu.");
    let orgId=currentOrgId;
    if(isSuperAdmin){
      const {data:orgs,error}=await supabase.rpc("list_organizations");if(error)throw error;
      showView("Backup & Arsip",`<div class="ev-audit-page"><h2>Backup & Arsip</h2><label>Pilih lembaga</label><select id="backupOrg"><option value="">Pilih lembaga…</option>${(orgs||[]).map(o=>`<option value="${esc(o.organization_id)}">${esc(o.organization_name)}</option>`).join("")}</select><button id="runOrgBackup" type="button">Buat Backup JSON</button><div id="backupStatus"></div></div>`);
      $("runOrgBackup").onclick=()=>window.createOrgBackup($("backupOrg").value);
    }else{
      showView("Backup & Arsip",`<div class="ev-audit-page"><h2>Backup Data Lembaga</h2><p>Ekspor data administratif lembaga. Data suara dan hash token tidak disertakan.</p><button id="runOrgBackup" type="button">Buat Backup JSON</button><div id="backupStatus"></div></div>`);
      $("runOrgBackup").onclick=()=>window.createOrgBackup(orgId);
    }
  }catch(e){showView("Backup & Arsip",`<p>Gagal membuka backup: ${esc(e.message)}</p>`);}
};
window.createOrgBackup=async function(orgId){
  const status=$("backupStatus");if(!orgId){status.textContent="Pilih lembaga terlebih dahulu.";return;}
  status.textContent="Menyiapkan backup…";
  try{
    const backup={application:"E-VOTING ROBOTIC PRO",version:2,created_at:new Date().toISOString(),organization_id:orgId,tables:{}};
    const {data:org,error:oe}=await supabase.from("organizations").select("*").eq("id",orgId).maybeSingle();if(oe)throw oe;
    backup.tables.organizations=org?[org]:[];
    const {data:settings,error:se}=await supabase.from("organization_settings").select("*").eq("organization_id",orgId);if(se)throw se;
    backup.tables.organization_settings=settings||[];
    const {data:elections,error:ee}=await supabase.from("elections").select("*").eq("organization_id",orgId);if(ee)throw ee;
    backup.tables.elections=elections||[];
    const ids=(elections||[]).map(e=>e.id);
    for(const table of ["candidates","voter_tokens"]){
      if(!ids.length){backup.tables[table]=[];continue;}
      const {data,error}=await supabase.from(table).select("*").in("election_id",ids);if(error)throw error;
      backup.tables[table]=(data||[]).map(row=>{const r={...row};for(const k of Object.keys(r))if(/hash|token_value|secret|password/i.test(k))delete r[k];return r;});
    }
    const {data:logs,error:le}=await supabase.from("audit_logs").select("*").eq("organization_id",orgId).order("created_at",{ascending:false}).limit(10000);if(le)throw le;
    backup.tables.audit_logs=logs||[];
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=`backup-evoting-${orgId}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
    status.textContent="Backup berhasil dibuat.";
  }catch(e){status.textContent="Backup gagal: "+e.message;}
};
document.addEventListener("click",function(event){
  const button=event.target.closest("#openSuperOverview,#openInstitutionAdmin,#openAuditTrail,#openBackupCenter");
  if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  const actions={
    openSuperOverview:()=>window.openSuperOverview(),
    openInstitutionAdmin:()=>window.openInstitutionAdmin(),
    openAuditTrail:()=>window.openAuditTrail(),
    openBackupCenter:()=>window.openBackupCenter()
  };
  const run=actions[button.id];if(run)run().catch(err=>alert("Gagal membuka menu: "+err.message));
},true);
{
 const style=document.createElement("style");
 style.textContent=`#stage6Tools,#stage7Tools{position:relative;z-index:5;pointer-events:auto}#stage6Tools button,#stage7Tools button{position:relative;z-index:6;pointer-events:auto;cursor:pointer}`;
 document.head.appendChild(style);
}

/* E-VOTING ROBOTIC PRO v2 — Tahap 9–11 (patch tambahan) */
window.loadGlobalStats = async function(){
  const stats=document.getElementById('globalStats');
  const list=document.getElementById('globalOrgList');
  if(!stats||!list)return;
  stats.textContent='Mengambil statistik yang diizinkan oleh kebijakan akses…';
  list.textContent='';
  try{
    if(!isSuperAdmin)throw new Error('Hanya Super Admin yang dapat melihat dashboard global.');
    const {data:orgs,error:orgError}=await supabase.rpc('list_organizations');
    if(orgError)throw orgError;
    const organizations=orgs||[];
    const countOne=async(query)=>{
      try{const result=await query;return result.error?{count:null,error:result.error.message}:{count:result.count??0,error:null};}
      catch(e){return {count:null,error:e.message||String(e)};}
    };
    const [admins,elections,active]=await Promise.all([
      countOne(supabase.from('organization_members').select('user_id',{count:'exact',head:true}).eq('role','org_admin')),
      countOne(supabase.from('elections').select('id',{count:'exact',head:true})),
      countOne(supabase.from('elections').select('id',{count:'exact',head:true}).eq('status','active'))
    ]);
    const activeOrgs=organizations.filter(o=>String(o.organization_status||o.status||'').toLowerCase()==='active').length;
    const metric=(label,item)=>`<div class="ev-global-stat"><span>${label}</span><strong>${item.count===null?'—':item.count}</strong>${item.error?`<small title="${esc(item.error)}">Data dibatasi kebijakan akses</small>`:''}</div>`;
    stats.innerHTML=`<div class="ev-global-stat"><span>Total Lembaga</span><strong>${organizations.length}</strong></div><div class="ev-global-stat"><span>Lembaga Aktif</span><strong>${activeOrgs}</strong></div>${metric('Admin Lembaga',admins)}${metric('Total Pemilihan',elections)}${metric('Pemilihan Aktif',active)}`;
    list.innerHTML=`<section class="ev-global-list"><h3>Daftar Lembaga</h3>${organizations.map(o=>{
      const name=o.organization_name||o.name||'Lembaga';
      const status=o.organization_status||o.status||'Tidak diketahui';
      return `<article><div><b>${esc(name)}</b><small>Kode: ${esc(o.organization_slug||o.slug||'-')}</small></div><span class="${String(status).toLowerCase()==='active'?'ev-status-active':'ev-status-off'}">${esc(status)}</span></article>`;
    }).join('')||'<p>Belum ada lembaga.</p>'}</section><p class="ev-stage-note">Angka bertanda “—” tidak dapat dibaca oleh kebijakan akses saat ini; data tidak direkayasa atau dianggap nol.</p>`;
  }catch(e){stats.textContent='Gagal memuat dashboard: '+(e.message||e);}
};

/* Backup administratif per lembaga. Tidak mengekspor tabel votes atau rahasia token. */
window.openBackupCenter = async function(){
  try{
    if(!currentUser)throw new Error('Silakan login terlebih dahulu.');
    if(isSuperAdmin){
      const {data:orgs,error}=await supabase.rpc('list_organizations');if(error)throw error;
      showView('Backup & Arsip',`<div class="ev-audit-page"><span class="ev-kicker">ROBOTIC DATA RECOVERY</span><h2>Backup & Arsip Lembaga</h2><p>Super Admin dapat mengekspor data administratif per lembaga.</p><label for="backupOrg">Pilih lembaga</label><select id="backupOrg"><option value="">Pilih lembaga…</option>${(orgs||[]).map(o=>`<option value="${esc(o.organization_id)}">${esc(o.organization_name||o.name||'Lembaga')}</option>`).join('')}</select><button id="runOrgBackup" type="button" class="primary">Buat Backup JSON</button><div id="backupStatus" role="status"></div><small>Ekspor ini bukan salinan penuh database dan tidak mencakup data suara, hash token, maupun kredensial.</small></div>`);
      document.getElementById('runOrgBackup').onclick=()=>window.createOrgBackup(document.getElementById('backupOrg').value);
    }else{
      if(!currentOrgId)throw new Error('Akun ini tidak memiliki lembaga aktif.');
      showView('Backup & Arsip',`<div class="ev-audit-page"><span class="ev-kicker">ROBOTIC DATA RECOVERY</span><h2>Backup Data Lembaga</h2><p>Ekspor data administratif ${esc(currentOrgName||'lembaga ini')}.</p><button id="runOrgBackup" type="button" class="primary">Buat Backup JSON</button><div id="backupStatus" role="status"></div><small>Data suara, hash token, dan kredensial tidak disertakan. File ini bukan backup penuh dan belum memiliki fitur restore otomatis.</small></div>`);
      document.getElementById('runOrgBackup').onclick=()=>window.createOrgBackup(currentOrgId);
    }
  }catch(e){showView('Backup & Arsip',`<p>Gagal membuka backup: ${esc(e.message||e)}</p>`);}
};
window.createOrgBackup = async function(orgId){
  const status=document.getElementById('backupStatus');
  if(!status)return;
  if(!orgId){status.textContent='Pilih lembaga terlebih dahulu.';return;}
  status.textContent='Menyiapkan ekspor data administratif…';
  try{
    const backup={application:'E-VOTING ROBOTIC PRO',version:2,backup_type:'administrative_export_not_full_database_backup',created_at:new Date().toISOString(),organization_id:orgId,tables:{}};
    const fetchRows=async(table,select,apply)=>{
      let q=supabase.from(table).select(select);
      if(apply)q=apply(q);
      const {data,error}=await q;
      if(error)throw new Error(`${table}: ${error.message}`);
      return data||[];
    };
    backup.tables.organizations=await fetchRows('organizations','id,name,slug,status,created_at',q=>q.eq('id',orgId));
    backup.tables.organization_settings=await fetchRows('organization_settings','*',q=>q.eq('organization_id',orgId));
    backup.tables.elections=await fetchRows('elections','*',q=>q.eq('organization_id',orgId));
    const electionIds=backup.tables.elections.map(e=>e.id);
    for(const table of ['candidates','voter_tokens']){
      backup.tables[table]=electionIds.length?await fetchRows(table,'*',q=>q.in('election_id',electionIds)):[];
      backup.tables[table]=backup.tables[table].map(row=>{
        const clean={...row};
        for(const key of Object.keys(clean))if(/token|hash|secret|password|credential/i.test(key))delete clean[key];
        return clean;
      });
    }
    backup.tables.audit_logs=await fetchRows('audit_logs','*',q=>q.eq('organization_id',orgId).order('created_at',{ascending:false}).limit(10000));
    backup.tables.audit_logs=backup.tables.audit_logs.map(row=>{
      const clean={...row};
      for(const key of Object.keys(clean))if(/token|hash|secret|password|credential/i.test(key))delete clean[key];
      return clean;
    });
    backup.excluded_tables=['votes'];
    backup.notice='Ekspor administratif. Bukan backup penuh database dan tidak dapat dipulihkan otomatis melalui aplikasi.';
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`evoting-arsip-${orgId}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='Ekspor JSON berhasil dibuat. Simpan file di tempat aman.';
  }catch(e){status.textContent='Ekspor gagal: '+(e.message||e);}
};

/* Tahap 12: Restore administratif non-destruktif (Super Admin saja).
   Hanya menyisipkan record yang belum ada; tidak mengubah record yang sudah ada.
   Votes, token, pengaturan, dan audit log sengaja tidak dipulihkan. */
window.openBackupCenter = async function(){
  try{
    if(!currentUser) throw new Error('Silakan login terlebih dahulu.');
    if(!isSuperAdmin) throw new Error('Restore hanya tersedia untuk Super Admin.');
    const {data:orgs,error}=await supabase.rpc('list_organizations');
    if(error) throw error;
    showView('Backup & Arsip', `<div class="ev-audit-page">
      <span class="ev-kicker">ROBOTIC DATA RECOVERY</span><h2>Backup & Arsip Lembaga</h2>
      <p>Buat backup administratif atau gabungkan data yang belum ada dari file backup.</p>
      <label for="backupOrg">Pilih lembaga</label>
      <select id="backupOrg"><option value="">Pilih lembaga…</option>${(orgs||[]).map(o=>`<option value="${esc(o.organization_id)}">${esc(o.organization_name||o.name||'Lembaga')}</option>`).join('')}</select>
      <button id="runOrgBackup" type="button" class="primary">Buat Backup JSON</button><div id="backupStatus" role="status"></div>
      <hr><h3>Pemulihan dari File JSON</h3><p>Pemulihan bersifat gabungan: hanya record baru yang ditambahkan. Data lama tidak ditimpa.</p>
      <label for="restoreFile">Pilih file backup JSON</label><input id="restoreFile" type="file" accept="application/json,.json">
      <button id="previewRestore" type="button">Periksa File Backup</button><div id="restorePreview" role="status"></div>
      <button id="runRestore" type="button" class="primary" disabled>Mulai Pemulihan Data</button>
      <small>Restore hanya mencakup data lembaga, pemilihan, dan kandidat. Suara, token, pengaturan, serta audit log tidak dipulihkan. Buat backup terbaru sebelum melanjutkan.</small>
    </div>`);
    const $el=id=>document.getElementById(id);
    $el('runOrgBackup').onclick=()=>window.createOrgBackup($el('backupOrg').value);
    let prepared=null;
    $el('previewRestore').onclick=async()=>{
      const preview=$el('restorePreview'),file=$el('restoreFile').files?.[0],orgId=$el('backupOrg').value;
      $el('runRestore').disabled=true;prepared=null;
      try{
        if(!orgId) throw new Error('Pilih lembaga tujuan terlebih dahulu.');
        if(!file) throw new Error('Pilih file JSON terlebih dahulu.');
        if(file.size>10*1024*1024) throw new Error('Ukuran file maksimal 10 MB.');
        const data=JSON.parse(await file.text());
        if(data.application!=='E-VOTING ROBOTIC PRO'||data.version!==2) throw new Error('Format atau versi backup tidak dikenali.');
        if(data.organization_id!==orgId) throw new Error('ID lembaga dalam file tidak cocok dengan lembaga tujuan. Pilih lembaga yang sesuai.');
        const t=data.tables||{};
        for(const key of ['organizations','elections','candidates']) if(!Array.isArray(t[key])) throw new Error(`Data ${key} tidak valid atau tidak tersedia.`);
        if(t.organizations.some(r=>r.id!==orgId)) throw new Error('File memuat identitas lembaga yang tidak sesuai.');
        if(t.elections.some(r=>r.organization_id!==orgId)) throw new Error('Ditemukan pemilihan dari lembaga lain. Pemulihan dibatalkan.');
        const electionIds=new Set(t.elections.map(r=>r.id));
        if(t.candidates.some(r=>!electionIds.has(r.election_id))) throw new Error('Ditemukan kandidat yang tidak cocok dengan daftar pemilihan di file.');
        prepared={data,orgId};
        preview.innerHTML=`<b>File valid untuk ditinjau.</b><ul><li>Lembaga: ${esc(t.organizations[0]?.name||orgId)}</li><li>Pemilihan: ${t.elections.length}</li><li>Kandidat: ${t.candidates.length}</li></ul><p>Record yang sudah ada akan dilewati, bukan ditimpa. Proses dapat berhenti jika izin RLS menolak penulisan.</p>`;
        $el('runRestore').disabled=false;
      }catch(e){preview.textContent='File tidak dapat digunakan: '+(e.message||e);}
    };
    $el('runRestore').onclick=async()=>{
      if(!prepared)return;
      const btn=$el('runRestore'),preview=$el('restorePreview');
      if(!confirm('Lanjutkan pemulihan gabungan? Record baru akan ditambahkan dan record yang sudah ada dilewati.'))return;
      btn.disabled=true;preview.textContent='Memproses pemulihan…';
      try{
        const t=prepared.data.tables;
        const insertMissing=async(table,rows)=>{
          if(!rows.length)return 0;
          const {data,error}=await supabase.from(table).upsert(rows,{onConflict:'id',ignoreDuplicates:true}).select('id');
          if(error)throw new Error(`${table}: ${error.message}`);
          return (data||[]).length;
        };
        // Urutan menjaga relasi foreign key.
        await insertMissing('organizations',t.organizations);
        const electionCount=await insertMissing('elections',t.elections);
        const candidateCount=await insertMissing('candidates',t.candidates);
        preview.innerHTML=`<b>Pemulihan selesai.</b><ul><li>Pemilihan baru ditambahkan: ${electionCount}</li><li>Kandidat baru ditambahkan: ${candidateCount}</li></ul><p>Record duplikat dilewati. Pengaturan, token, suara, dan audit log tidak dipulihkan.</p>`;
      }catch(e){preview.textContent='Pemulihan berhenti: '+(e.message||e)+'. Sebagian record sebelumnya mungkin sudah berhasil ditambahkan; periksa data sebelum mengulang.';}
    };
  }catch(e){showView('Backup & Arsip',`<p>Gagal membuka Backup & Arsip: ${esc(e.message||e)}</p>`);}
};


/* Panel checklist internal Tahap 13–15 dihapus dari antarmuka aplikasi.
   Catatan pengujian tetap berada di dokumentasi proyek, bukan dashboard pengguna. */


// Penyederhanaan tampilan dashboard admin: ringkas, konsisten, dan responsif.
{
 const s=document.createElement("style");
 s.textContent=`
 :root{--ev-admin-bg:#0b1726;--ev-admin-surface:#112238;--ev-admin-surface-2:#162b43;--ev-admin-border:#29425e;--ev-admin-accent:#26bfd0}
 body{background:var(--ev-admin-bg)!important}
 body.light{--ev-admin-bg:#f3f6fa;--ev-admin-surface:#fff;--ev-admin-surface-2:#f7f9fc;--ev-admin-border:#dce4ed;--ev-admin-accent:#087f95;background:var(--ev-admin-bg)!important}
 #orgAdminTools{max-width:1100px;margin:20px auto 0;display:grid;gap:14px}
 #orgAdminTools>.org:first-child{padding:20px 24px!important;border-radius:16px!important;background:var(--ev-admin-surface)!important;border:1px solid var(--ev-admin-border)!important}
 #orgAdminTools>.org:first-child h3{font-size:20px!important;margin:0 0 5px!important;color:var(--ev-text)!important}
 #orgAdminTools>.org:first-child p{margin:0!important;font-size:13px!important}
 #orgAdminTools>.grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px!important;margin:0!important}
 #orgAdminTools button.menu-card{min-height:112px!important;padding:18px!important;border-radius:14px!important;border:1px solid var(--ev-admin-border)!important;background:var(--ev-admin-surface)!important;box-shadow:none!important;animation:evMenuGlow 12s linear infinite!important;transition:background .18s,border-color .18s,transform .18s!important}
 #orgAdminTools button.menu-card:hover{background:var(--ev-admin-surface-2)!important;border-color:var(--ev-admin-accent)!important;transform:translateY(-2px)}
 #orgAdminTools button.menu-card h3{font-size:15px!important;line-height:1.3!important;margin:0 0 7px!important;color:var(--ev-admin-accent)!important}
 #orgAdminTools button.menu-card p{font-size:12px!important;line-height:1.45!important;margin:0!important;color:var(--ev-muted)!important}
 #stage6Tools.ev-admin-utilities{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0!important;padding:12px 16px!important;border:1px solid var(--ev-admin-border)!important;border-radius:14px!important;background:transparent!important;box-shadow:none!important}
 .ev-admin-utilities>span{font-size:12px;font-weight:700;color:var(--ev-muted)}
 .ev-admin-utilities .ev-stage6-actions{display:flex;gap:8px;flex-wrap:wrap}
 .ev-admin-utilities .ev-stage6-actions button{padding:8px 12px!important;border-radius:9px!important;border:1px solid var(--ev-admin-border)!important;background:var(--ev-admin-surface)!important;color:var(--ev-text)!important;font-size:12px!important;font-weight:650!important;animation:none!important}
 .ev-admin-utilities .ev-stage6-actions button:hover{border-color:var(--ev-admin-accent)!important;color:var(--ev-admin-accent)!important}
 #adminView{margin:4px auto 0!important;padding:20px!important;border-radius:16px!important;border:1px solid var(--ev-admin-border)!important;background:var(--ev-admin-surface)!important;box-shadow:none!important}
 #backToDashboard{margin-bottom:8px}
 .ev-rgb-border{animation:evRgbBorder 10s linear infinite!important;background:linear-gradient(var(--ev-admin-surface),var(--ev-admin-surface)) padding-box,linear-gradient(120deg,#ff5577,#ffbd4a,#48d7a0,#29c8e8,#9a72f5,#ff5577) border-box!important;border:1px solid transparent!important}

 /* RGB otomatis yang halus: aksen dan garis tepi berganti warna, bukan seluruh halaman. */
 @keyframes evMenuGlow{0%{border-color:#26bfd0;box-shadow:0 0 0 0 rgba(38,191,208,.05)}25%{border-color:#8b72f5;box-shadow:0 0 12px rgba(139,114,245,.10)}50%{border-color:#ed7a9b;box-shadow:0 0 12px rgba(237,122,155,.10)}75%{border-color:#45c99b;box-shadow:0 0 12px rgba(69,201,155,.10)}100%{border-color:#26bfd0;box-shadow:0 0 0 0 rgba(38,191,208,.05)}}
 @keyframes evAccentCycle{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
 .mark{animation:evAccentCycle 16s linear infinite;box-shadow:0 0 18px rgba(38,191,208,.16)}
 .hero,.panel,.org:not(#orgAdminTools>.org:first-child),.modalbox{background-image:linear-gradient(var(--ev-admin-surface),var(--ev-admin-surface)),linear-gradient(120deg,#ff5577,#ffbd4a,#48d7a0,#29c8e8,#9a72f5,#ff5577)!important;background-origin:border-box!important;background-clip:padding-box,border-box!important;border:1px solid transparent!important;animation:evRgbBorder 14s linear infinite}
 .hero .eyebrow,h1 em,.heading .eyebrow,.org h3,#adminView h3{animation:evAccentCycle 18s linear infinite}
 button.primary{animation:evAccentCycle 18s linear infinite;box-shadow:0 4px 18px rgba(38,191,208,.10)}
 #orgAdminTools button.menu-card{animation:evMenuGlow 12s linear infinite!important}
 .ev-admin-utilities .ev-stage6-actions button{animation:evMenuGlow 16s linear infinite!important}
 @media(prefers-reduced-motion:reduce){.mark,.hero,.panel,.org,.modalbox,h1 em,.org h3,#adminView h3,button.primary,#orgAdminTools button.menu-card,.ev-admin-utilities .ev-stage6-actions button{animation:none!important}}
 @media(max-width:850px){#orgAdminTools>.grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
 @media(max-width:520px){#orgAdminTools>.grid{grid-template-columns:1fr!important}#orgAdminTools button.menu-card{min-height:86px!important}#stage6Tools.ev-admin-utilities{align-items:flex-start;flex-direction:column}}
 `;
 document.head.appendChild(s);
}


// ============================================================
// E-VOTING PRO V2.1 UI CONTROLS
// ============================================================
async function renderV21Controls(){
  if(!currentUser)return;
  if(isSuperAdmin){
    const host=$("superAdminTools");
    if(host && !$("v21SuperInfo")){
      const panel=document.createElement("section");
      panel.id="v21SuperInfo";panel.className="org v21-control-panel";
      panel.innerHTML=`<h3>Kontrol Multi-Lembaga V2.1</h3><p>Reset lembaga, hapus lembaga permanen, dan ubah status tersedia pada setiap kartu lembaga di bawah ini.</p><p class="v21-note">Reset lembaga menghapus pemilihan, kandidat, token, dan suara. Identitas lembaga, pengaturan, serta akun admin dipertahankan.</p>`;
      host.append(panel);
    }
  }else if(currentOrgId){
    const host=$("orgAdminTools");
    if(!host)return;
    let panel=$("v21AdminReset");
    if(!panel){
      panel=document.createElement("section");
      panel.id="v21AdminReset";panel.className="org v21-control-panel";
      panel.innerHTML=`<h3>Reset Pemilihan</h3><p>Reset menghapus suara pada satu pemilihan dan mengembalikan penggunaan token ke nol. Kandidat dan token tetap dipertahankan.</p><label for="v21ElectionSelect">Pilih pemilihan</label><select id="v21ElectionSelect"><option value="">Memuat pemilihan…</option></select><button type="button" class="primary" id="v21ResetElection">Reset Suara & Token</button><p id="v21AdminResetMessage" role="status"></p>`;
      host.append(panel);
    }
    const select=$("v21ElectionSelect"),msg=$("v21AdminResetMessage"),btn=$("v21ResetElection");
    try{
      const {data,error}=await supabase.from("elections").select("id,title,status,created_at").eq("organization_id",currentOrgId).order("created_at",{ascending:false});
      if(error)throw error;
      const electionRows=Array.isArray(data)?data:[];
      select.replaceChildren();
      const placeholder=document.createElement("option");
      placeholder.value="";
      placeholder.textContent=electionRows.length?"Pilih pemilihan…":"Belum ada pemilihan";
      select.append(placeholder);
      if(!electionRows.some(row=>row.id===activeElectionId))activeElectionId="";
      electionRows.forEach(row=>{
        const op=document.createElement("option");
        op.value=row.id;
        op.textContent=`${row.title||"Pemilihan"} — ${row.status||"status tidak diketahui"}`;
        select.append(op);
      });
      select.value="";
    }catch(err){select.innerHTML='<option value="">Gagal memuat pemilihan</option>';msg.textContent=err.message;}
    btn.onclick=async()=>{
      const electionId=select.value;
      if(!electionId){msg.textContent="Pilih pemilihan terlebih dahulu.";return;}
      const answer=prompt("Reset suara dan penggunaan token untuk pemilihan ini? Kandidat dan token tetap dipertahankan. Ketik: RESET");
      if(answer!=="RESET")return;
      btn.disabled=true;msg.textContent="Memproses reset…";
      try{const {error}=await supabase.rpc("reset_election_data",{p_election_id:electionId,p_confirmation:answer});if(error)throw error;msg.textContent="Reset berhasil. Suara dihapus dan penggunaan token dikembalikan ke nol.";}
      catch(err){msg.textContent="Reset gagal: "+err.message;}
      finally{btn.disabled=false;}
    };
  }
}

// Motif batik pias: ornamen geometris sangat lembut, tidak mengganggu keterbacaan.
(function addSoftBatikBackdrop(){
  if(document.getElementById("v21BatikStyle"))return;
  const style=document.createElement("style");style.id="v21BatikStyle";
  style.textContent=`
    body{position:relative;isolation:isolate}
    body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.055;
      background-image:
        radial-gradient(circle at 50% 0%,transparent 17px,rgba(34,211,238,.9) 18px,transparent 19px),
        radial-gradient(circle at 0% 50%,transparent 17px,rgba(180,140,80,.8) 18px,transparent 19px),
        repeating-linear-gradient(45deg,transparent 0 21px,rgba(34,211,238,.5) 22px,transparent 23px 42px);
      background-size:72px 72px,72px 72px,84px 84px;
      background-position:0 0,36px 36px,0 0}
    .v21-control-panel{margin:16px 0!important;border:1px solid var(--line,#263c58)!important}
    .v21-control-panel h3{color:var(--a,#20d5e8)}
    .v21-control-panel p,.v21-note{font-size:13px;color:var(--muted,#9aadc5)}
    .v21-control-panel select{width:100%;margin:8px 0 12px;padding:12px;border-radius:10px}
    .v21-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
    .v21-actions button{font-size:12px}
    .v21-org-card{margin:12px 0}
    .v21-org-status{display:block;margin:10px 0}
    .v21-delete-org{background:#7f1d1d!important;color:#fff!important}
    .v21-org-message{min-height:18px;font-size:12px}
    @media(max-width:650px){.v21-actions{display:grid;grid-template-columns:1fr}.v21-actions button{width:100%}}
  `;
  document.head.append(style);
})();
