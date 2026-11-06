/* 2027 Exam Quiz v5 — compatible with qz-2027-* legacy keys */
(()=>{'use strict';
const KEY='qz-2027-'+SUBJECT;
const $=id=>document.getElementById(id);
const idset=new Set(QUESTIONS.map(q=>String(q.id)));
const byId=new Map(QUESTIONS.map(q=>[String(q.id),q]));
const read=(suffix,fallback)=>{try{let v=JSON.parse(localStorage.getItem(KEY+suffix));return v&&typeof v==='object'&&!Array.isArray(v)?v:fallback;}catch(_){return fallback;}};
let progress=read('',{}),notes=read('-notes',{}),newBank=read('-newbank',{}),links=read('-links-v6',{});
let settings=Object.assign({noReplace:true},read('-settings',{}));
let sessions=read('-rounds-v5',{}), view=Object.assign({mode:'all',chapter:'',kind:'',exam:'',only:false},read('-view-v5',{}));
if(!['all','fuzzy','new'].includes(view.mode))view.mode='all';
let current=null,activeKey='', saveWarning=false;
function store(name,val){try{localStorage.setItem(KEY+name,JSON.stringify(val));return true;}catch(e){saveWarning=true;showToast('本机存储失败，请导出备份并检查空间');return false;}}
function saveData(){store('',progress);store('-notes',notes);store('-newbank',newBank);store('-links-v6',links);store('-settings',settings);}
function saveRound(){store('-rounds-v5',sessions);store('-view-v5',view);}
function status(q){return progress[q.id]||'unseen';}
function isFuzzy(q){return status(q)==='review'&&!newBank[q.id];}
function bankCount(mode){return QUESTIONS.filter(q=>mode==='fuzzy'?isFuzzy(q):!!newBank[q.id]).length;}
function pool(){return QUESTIONS.filter(q=>(!view.chapter||q.chapter===view.chapter)&&(!view.kind||q.kind===view.kind)&&(!view.exam||(view.exam==='yes'?!!q.year:!q.year))&&(!view.only||status(q)!=='mastered')&&(view.mode==='all'||(view.mode==='fuzzy'?isFuzzy(q):!!newBank[q.id])));}
// Filter signature is based on UI filters, NOT on current pool: state changes must never restart the round.
function signature(){return [view.mode,view.chapter,view.kind,view.exam,view.only?'1':'0'].join('|');}
function shuffle(ids){for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}return ids;}
function getSession(){const k=signature();activeKey=k;let s=sessions[k];if(!s||!Array.isArray(s.remaining)||!Array.isArray(s.allIds)||!Array.isArray(s.drawn)){s={allIds:[],remaining:[],drawn:[],currentId:null,started:false};sessions[k]=s;}return s;}
function cleanSession(s){const eligible=new Set(pool().map(q=>q.id));s.remaining=s.remaining.filter(id=>eligible.has(id));s.currentId=s.currentId&&idset.has(s.currentId)?s.currentId:null;return s;}
function sessionStats(){const s=getSession(),p=pool();cleanSession(s);return {s,p,remaining:s.started?s.remaining.length:p.length,done:s.started?s.drawn.filter(id=>s.allIds.includes(id)).length:0};}
function paintStats(){const {s,p,remaining,done}=sessionStats();const mastered=p.filter(q=>status(q)==='mastered').length,review=p.filter(q=>status(q)==='review').length,seen=p.filter(q=>status(q)!=='unseen').length;
$('total').textContent=p.length;$('seen').textContent=seen;$('mastered').textContent=mastered;$('review').textContent=review;
$('bar').style.width=p.length?(mastered/p.length*100)+'%':'0%';
$('poolHint').textContent='当前范围 '+p.length+' 题 · 本轮已抽 '+done+' 题 · 剩余 '+(settings.noReplace?remaining:'不限')+' 题 · '+(settings.noReplace?'不放回':'放回')+'模式';
$('roundDone').textContent='本轮已抽 '+done+' / '+(s.started?s.allIds.length:p.length)+' 道';
$('roundLeft').textContent='剩余 '+(settings.noReplace?remaining:'不限')+' 道';
$('draw').disabled=p.length===0||(settings.noReplace&&s.started&&remaining===0);
$('next').disabled=$('draw').disabled;
$('newCount').textContent=bankCount('new');$('fuzzyCount').textContent=bankCount('fuzzy');
$('modeAll').setAttribute('aria-pressed',view.mode==='all');$('modeNew').setAttribute('aria-pressed',view.mode==='new');$('modeFuzzy').setAttribute('aria-pressed',view.mode==='fuzzy');
$('newHint').textContent=bankCount('new')+' 道';$('fuzzyHint').textContent=bankCount('fuzzy')+' 道';}
function syncSessionView(){const {s,p}=sessionStats();current=s.currentId?byId.get(s.currentId):null;
if(current){render();}else{ $('active').hidden=true;$('empty').hidden=false;$('empty').textContent=p.length?'点击「随机抽一题」开始，退出后本轮进度仍会保留。':'当前题库没有符合条件的题目。'; }
paintStats();paintLists();saveRound();}
function setMode(mode){view.mode=mode;syncSessionView();}
function draw(){const {s,p}=sessionStats();if(!p.length){showToast('当前筛选范围没有题目');return;}
if(settings.noReplace){if(!s.started){s.allIds=p.map(q=>q.id);s.remaining=shuffle([...s.allIds]);s.drawn=[];s.started=true;}
cleanSession(s);if(!s.remaining.length){showToast('本轮已抽完，点击重置本轮再抽');paintStats();return;}
const id=s.remaining.pop();s.drawn.push(id);s.currentId=id;current=byId.get(id);
}else{let q=p[Math.floor(Math.random()*p.length)];if(p.length>1&&q.id===s.currentId){q=p.find(x=>x.id!==s.currentId)||q;}s.currentId=q.id;current=q;s.started=true;s.drawn.push(q.id);if(!s.allIds.includes(q.id))s.allIds.push(q.id);}
render();animateCard();paintStats();saveRound();}
function resetRound(){if(!confirm('只重置当前筛选范围的抽题轮次？已掌握、模糊、生题与笔记不会清除。'))return;
const s=getSession();s.allIds=[];s.remaining=[];s.drawn=[];s.currentId=null;s.started=false;current=null;syncSessionView();showToast('本轮已重置，学习笔记与标记仍保留');}
function render(){if(!current)return;
$('empty').hidden=true;$('active').hidden=false;
$('question').textContent=current.question;
$('chapterTag').textContent=[current.chapter,current.section].filter(Boolean).join(' · ')||'未分类';
$('kindTag').textContent=current.kind||'一般考点';
$('examTag').hidden=!current.year;$('examTag').textContent=(current.year||'')+' '+(current.examType||'真题');
$('extra').textContent=[current.page?'页码：'+current.page:'',current.notes?'备注：'+current.notes:''].filter(Boolean).join(' · ');
$('state').textContent=newBank[current.id]?'生题库 · 待攻克':status(current)==='mastered'?'已掌握 ✓':status(current)==='review'?'模糊 · 记不全':'尚未标记';
$('markGood').textContent=status(current)==='mastered'?'✓ 已掌握':'✓ 我已掌握';
$('markReview').textContent=isFuzzy(current)?'◐ 已加入模糊题库':'◐ 有印象 · 记不全';
$('markNew').textContent=newBank[current.id]?'✓ 移出生题库':'＋ 加入生题库';
renderAttachments(current.id);$('answerNote').value=notes[current.id]||'';$('noteSaved').textContent=notes[current.id]?'已保存笔记':'按题目独立保存';
const {s,remaining}=sessionStats();$('remain').textContent='本轮已抽 '+s.drawn.length+' 道 · 剩余 '+(settings.noReplace?remaining:'不限')+' 道';}
function mark(kind){if(!current)return;
const id=current.id;
if(kind==='mastered'){progress[id]='mastered';delete newBank[id];}
if(kind==='review'){progress[id]='review';delete newBank[id];}
if(kind==='new'){if(newBank[id])delete newBank[id];else {newBank[id]=true;progress[id]='review';}}
saveData();render();paintStats();paintLists();saveRound();showToast(kind==='mastered'?'已掌握 · 已从专项题库移出':kind==='review'?'已加入模糊题库':newBank[id]?'已加入生题库':'已移出生题库');}
function paintList(mode,id){const list=$(id);list.replaceChildren();const entries=QUESTIONS.filter(q=>mode==='new'?!!newBank[q.id]:isFuzzy(q));if(!entries.length){const d=document.createElement('div');d.className='foot';d.textContent=mode==='new'?'暂无生题。':'暂无模糊题，点击「有印象 · 记不全」加入。';list.append(d);return;}
for(const q of entries){const b=document.createElement('button');b.type='button';b.className='newItem';const span=document.createElement('span');span.textContent=q.question;const small=document.createElement('small');small.textContent=q.chapter||'查看';b.append(span,small);b.addEventListener('click',()=>{const s=getSession();s.currentId=q.id;current=q;render();saveRound();document.querySelector('.question-area').scrollIntoView({behavior:'smooth',block:'center'});});list.append(b);}}
function paintLists(){paintList('new','newList');paintList('fuzzy','fuzzyList');}
function showToast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove('show'),1800);}
function animateCard(){const el=$('active');el.classList.remove('v5-in');void el.offsetWidth;el.classList.add('v5-in');}
async function exportOne(){try{const images=await QuizMedia.all(SUBJECT);const media=[];for(const r of images)media.push({key:r.key,subject:r.subject,qid:r.qid,name:r.name,createdAt:r.createdAt,data:await fileToDataURL(r.blob)});const data={subject:SUBJECT,progress,settings,newBank,notes,links,media,rounds:sessions,view,version:6,exportedAt:new Date().toISOString()};downloadJson(SUBJECT+'-背诵备份.json',data);showToast('完整备份已生成，请确认文件已保存');}catch(e){alert('导出图片备份失败：'+e.message);}}
function downloadJson(filename,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function restoreOne(data){if(data.subject!==SUBJECT||!data.progress||typeof data.progress!=='object')throw Error('文件与当前科目不匹配');
progress=Object.fromEntries(Object.entries(data.progress).filter(([id,v])=>idset.has(id)&&['mastered','review','unseen'].includes(v)));
notes=data.notes&&typeof data.notes==='object'?Object.fromEntries(Object.entries(data.notes).filter(([id,v])=>idset.has(id)&&typeof v==='string')):notes;
newBank=data.newBank&&typeof data.newBank==='object'?Object.fromEntries(Object.entries(data.newBank).filter(([id,v])=>idset.has(id)&&v===true)):newBank;
settings=Object.assign(settings,data.settings||{});
if(data.links&&typeof data.links==='object')links=data.links;
if(data.rounds&&typeof data.rounds==='object')sessions=data.rounds;
if(data.view&&typeof data.view==='object')view=Object.assign(view,data.view);
$('noReplace').checked=!!settings.noReplace;
$('chapter').value=view.chapter||'';$('kind').value=view.kind||'';$('exam').value=view.exam||'';$('only').checked=!!view.only;
saveData();syncSessionView();}
for(const [field,k] of [['chapter','chapter'],['kind','kind']])for(const v of [...new Set(QUESTIONS.map(q=>q[k]).filter(Boolean))])$(field).add(new Option(v,v));
$('chapter').value=view.chapter;$('kind').value=view.kind;$('exam').value=view.exam;$('only').checked=!!view.only;$('noReplace').checked=!!settings.noReplace;
for(const field of ['chapter','kind','exam'])$(field).addEventListener('change',()=>{view[field]=$(field).value;syncSessionView();});
$('only').addEventListener('change',()=>{view.only=$('only').checked;syncSessionView();});
$('noReplace').addEventListener('change',()=>{settings.noReplace=$('noReplace').checked;saveData();syncSessionView();});
$('draw').addEventListener('click',draw);$('next').addEventListener('click',draw);
$('markGood').addEventListener('click',()=>mark('mastered'));$('markReview').addEventListener('click',()=>mark('review'));$('markNew').addEventListener('click',()=>mark('new'));
$('modeAll').addEventListener('click',()=>setMode('all'));$('modeFuzzy').addEventListener('click',()=>setMode('fuzzy'));$('modeNew').addEventListener('click',()=>setMode('new'));$('resetRound').addEventListener('click',resetRound);
$('answerNote').addEventListener('input',()=>{if(!current)return;const v=$('answerNote').value;if(v.trim())notes[current.id]=v;else delete notes[current.id];store('-notes',notes);$('noteSaved').textContent='✓ 已自动保存';});
$('export').addEventListener('click',exportOne);
$('import').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!confirm('导入会覆盖当前科目的学习记录。建议先导出备份。是否继续？'))return;if(data.media&&Array.isArray(data.media))await QuizMedia.importAll(data.media);restoreOne(data);renderAttachments(current?.id);showToast('该科目已恢复');}catch(err){alert('导入失败：'+err.message);}finally{e.target.value='';}});
$('reset').addEventListener('click',()=>{if(!confirm('确认清空本科学习状态、笔记、生题库、模糊题库及本轮记录？不可撤销。'))return;progress={};notes={};newBank={};links={};sessions={};saveData();QuizMedia.clearSubject(SUBJECT).catch(()=>showToast('图片清除失败，请检查空间')); syncSessionView();showToast('已清空本科学习记录');});
document.addEventListener('keydown',e=>{if(['SELECT','INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)||e.repeat)return;if(e.code==='Space'){e.preventDefault();draw();}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveRound();});window.addEventListener('pagehide',saveRound);

/* V6 media notes: render photos lazily only when a question is on screen. */
let mediaRenderToken=0,previewUrls=[];
function fileToDataURL(blob){return new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>reject(fr.error);fr.readAsDataURL(blob);});}
function attachmentHint(msg){$('attachmentStatus').textContent=msg;}
function safeLink(value){try{const parsed=new URL(value.trim());if(!['https:','http:'].includes(parsed.protocol))return null;return parsed.href;}catch(_){return null;}}
function paintLinks(qid){const target=$('linkList');target.replaceChildren();for(const [i,item] of (links[qid]||[]).entries()){const row=document.createElement('div');row.className='v6-link-item';const a=document.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='🔗 '+(item.title||item.url);const del=document.createElement('button');del.type='button';del.textContent='删除';del.addEventListener('click',()=>{if(!confirm('删除这条参考链接？'))return;links[qid].splice(i,1);store('-links-v6',links);paintLinks(qid);});row.append(a,del);target.append(row);}}
async function renderAttachments(qid){const token=++mediaRenderToken;for(const url of previewUrls)URL.revokeObjectURL(url);previewUrls=[];$('imageList').replaceChildren();if(!qid)return;paintLinks(qid);attachmentHint('正在读取题目附件…');try{const images=await QuizMedia.all(SUBJECT,qid);if(token!==mediaRenderToken)return;
 for(const item of images){const card=document.createElement('div');card.className='v6-img-item';const img=document.createElement('img');const u=URL.createObjectURL(item.blob);previewUrls.push(u);img.src=u;img.alt=item.name||'答案图片';img.loading='lazy';img.addEventListener('click',()=>{const full=document.createElement('div');full.className='v6-fullphoto';const large=document.createElement('img');large.src=u;const close=document.createElement('button');close.textContent='关闭 ×';close.onclick=()=>full.remove();full.onclick=e=>{if(e.target===full)full.remove();};full.append(large,close);document.body.append(full);});const label=document.createElement('small');label.textContent=item.name;const del=document.createElement('button');del.type='button';del.textContent='移除图片';del.addEventListener('click',async()=>{if(!confirm('删除这张题目图片？'))return;try{await QuizMedia.remove(item.key);renderAttachments(qid);}catch(e){attachmentHint('删除失败：'+e.message);}});card.append(img,label,del);$('imageList').append(card);}
 attachmentHint('已保存 '+images.length+' 张图片 · '+(links[qid]||[]).length+' 条链接 · 单题最多 4 张图片');
 }catch(e){attachmentHint('图片读取失败：'+e.message);}}
$('imageUpload').addEventListener('change',async e=>{const qid=current?.id,files=[...(e.target.files||[])];e.target.value='';if(!qid||!files.length)return;try{let existing=(await QuizMedia.all(SUBJECT,qid)).length;if(existing+files.length>4)throw Error('每题最多 4 张图片，请先删除旧图片');for(const file of files){attachmentHint('正在压缩并保存 '+file.name+'…');const blob=await QuizMedia.compress(file);const key=SUBJECT+':'+qid+':'+Date.now()+':'+Math.random().toString(36).slice(2);await QuizMedia.put({key,subject:SUBJECT,qid,name:file.name.slice(0,100),createdAt:new Date().toISOString(),blob});existing++;}showToast('图片已保存到当前手机');if(current?.id===qid)renderAttachments(qid);}catch(err){attachmentHint('添加失败：'+err.message);showToast('图片未全部保存，请检查');}});
$('addLink').addEventListener('click',()=>{$('linkEditor').hidden=false;$('linkURL').focus();});
$('cancelLink').addEventListener('click',()=>{$('linkEditor').hidden=true;});
$('saveLink').addEventListener('click',()=>{if(!current)return;const url=safeLink($('linkURL').value);if(!url){attachmentHint('请输入完整的 http:// 或 https:// 链接');return;}const id=current.id;const arr=links[id]||(links[id]=[]);if(arr.length>=15){attachmentHint('每道题最多保存 15 条链接');return;}arr.push({url,title:$('linkName').value.trim().slice(0,90)});if(!store('-links-v6',links)){arr.pop();return;}$('linkName').value='';$('linkURL').value='';$('linkEditor').hidden=true;paintLinks(id);showToast('参考链接已保存');});

syncSessionView();
})();