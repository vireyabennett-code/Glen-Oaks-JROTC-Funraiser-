const KEY='jrotc_lsu_tracker_v1';
let data=JSON.parse(localStorage.getItem(KEY)||'null')||{games:[],cadets:[]};

const $=s=>document.querySelector(s);
const save=()=>{localStorage.setItem(KEY,JSON.stringify(data));render()};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function id(){return crypto.randomUUID?crypto.randomUUID():Date.now()+Math.random()}

function render(){
 $('#gameCount').textContent=data.games.length;
 $('#cadetCount').textContent=data.cadets.length;
 $('#attendanceCount').textContent=data.games.reduce((n,g)=>n+(g.attendance||[]).filter(x=>x.present).length,0);
 $('#gamesList').innerHTML=data.games.length?data.games.map(g=>`
  <div class="game"><div><strong>${esc(g.name)}</strong><div class="small">${esc(g.date)} · ${g.attendance.filter(x=>x.present).length}/${g.attendance.length} present</div></div>
  <div class="actions"><button onclick="attendance('${g.id}')">Attendance</button><button class="secondary" onclick="deleteGame('${g.id}')">Delete</button></div></div>`).join(''):'<p class="muted">No games yet. Add your first LSU game.</p>';
 $('#cadetsList').innerHTML=data.cadets.length?data.cadets.map(c=>`
  <div class="cadet"><div><strong>${esc(c.name)}</strong><div class="small">${esc(c.grade||'')}</div></div>
  <div class="actions"><button class="secondary" onclick="deleteCadet('${c.id}')">Delete</button></div></div>`).join(''):'<p class="muted">No cadets yet.</p>';
 const rows=data.cadets.map(c=>{let a=data.games.reduce((n,g)=>n+(g.attendance||[]).some(x=>x.cadetId===c.id&&x.present)?1:0,0);return `<div class="report"><strong>${esc(c.name)}</strong><span>${a} of ${data.games.length} games attended</span></div>`}).join('');
 $('#reportList').innerHTML=rows||'<p class="muted">Add cadets and games to see a report.</p>';
}

function modal(title,html,handler){
 $('#modalTitle').textContent=title;$('#modalForm').innerHTML=html;$('#modal').classList.remove('hidden');
 $('#modalForm').onsubmit=e=>{e.preventDefault();handler(new FormData(e.target));$('#modal').classList.add('hidden')};
}
$('#closeModal').onclick=()=>$('#modal').classList.add('hidden');

$('#addCadetBtn').onclick=()=>modal('Add Cadet',`
<div class="field"><label>Name</label><input name="name" required></div>
<div class="field"><label>Grade (optional)</label><input name="grade"></div>
<button>Add Cadet</button>`,f=>{data.cadets.push({id:id(),name:f.get('name').trim(),grade:f.get('grade').trim()});save()});

$('#addGameBtn').onclick=()=>modal('Add LSU Game',`
<div class="field"><label>Game / Event</label><input name="name" placeholder="LSU vs. Opponent" required></div>
<div class="field"><label>Date</label><input name="date" type="date" required></div>
<button>Add Game</button>`,f=>{
 const g={id:id(),name:f.get('name').trim(),date:f.get('date'),attendance:data.cadets.map(c=>({cadetId:c.id,present:false}))};
 data.games.push(g);save();
});

window.deleteCadet=i=>{if(confirm('Delete this cadet?')){data.cadets=data.cadets.filter(c=>c.id!==i);data.games.forEach(g=>g.attendance=g.attendance.filter(a=>a.cadetId!==i));save()}};
window.deleteGame=i=>{if(confirm('Delete this game?')){data.games=data.games.filter(g=>g.id!==i);save()}};

window.attendance=i=>{
 const g=data.games.find(x=>x.id===i);
 if(!g)return;
 g.attendance=data.cadets.map(c=>g.attendance.find(a=>a.cadetId===c.id)||({cadetId:c.id,present:false}));
 modal('Attendance — '+g.name,`
 <div>${data.cadets.length?data.cadets.map(c=>{let a=g.attendance.find(x=>x.cadetId===c.id);return `<div class="attendee"><span>${esc(c.name)}</span><button type="button" class="${a.present?'yes':'no'}" onclick="toggleAttendance('${g.id}','${c.id}',this)">${a.present?'Present':'Absent'}</button></div>`}).join(''):'<p class="muted">Add cadets first.</p>'}</div>
 <button type="submit">Save & Close</button>`,()=>save());
};
window.toggleAttendance=(gid,cid,btn)=>{let g=data.games.find(x=>x.id===gid),a=g.attendance.find(x=>x.cadetId===cid);a.present=!a.present;btn.textContent=a.present?'Present':'Absent';btn.className=a.present?'yes':'no'};

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active')});

$('#exportBtn').onclick=()=>{
 let lines=[['Date','Game','Cadet','Attended'].join(',')];
 data.games.forEach(g=>g.attendance.forEach(a=>{let c=data.cadets.find(x=>x.id===a.cadetId);if(c)lines.push([g.date,g.name,c.name,a.present?'Yes':'No'].map(v=>`"${String(v).replaceAll('"','""')}"`).join(','))}));
 let blob=new Blob([lines.join('\n')],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='jrotc-lsu-attendance.csv';a.click();URL.revokeObjectURL(url);
};
render();
