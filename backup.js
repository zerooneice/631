(()=>{'use strict';
const subjects=['school','training','physiology'];
const suffixes=['','-settings','-newbank','-notes','-rounds-v5','-view-v5','-links-v6'];
const status=document.getElementById('backupStatus');
const key=(sub,suffix)=>'qz-2027-'+sub+suffix;
function download(name,contents){const blob=new Blob([JSON.stringify(contents,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
document.getElementById('backupAll').addEventListener('click',async()=>{try{const data={type:'2027-exam-three-subject-backup',version:6,exportedAt:new Date().toISOString(),subjects:{}};
for(const sub of subjects){data.subjects[sub]={};for(const suffix of suffixes){const raw=localStorage.getItem(key(sub,suffix));if(raw!==null){data.subjects[sub][suffix||'progress']=JSON.parse(raw);}}}
data.media=await QuizMedia.exportAll();download('2027考研三科完整备份-'+new Date().toISOString().slice(0,10)+'.json',data);status.textContent='包含 '+data.media.length+' 张图片的三科备份已生成。请到 iPhone「文件」里确认备份已保存。';}catch(e){status.textContent='导出失败：'+e.message;}});
document.getElementById('importAll').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.type!=='2027-exam-three-subject-backup'||!data.subjects||!subjects.every(s=>data.subjects[s]&&typeof data.subjects[s]==='object'))throw Error('不是本程序的三科完整备份');
if(!confirm('导入会覆盖这台设备的三科学习记录。建议先导出当前备份。确认恢复？'))return;const restoredImages=await QuizMedia.importAll(data.media||[]);
let n=0;for(const sub of subjects){for(const suffix of suffixes){const value=data.subjects[sub][suffix||'progress'];if(value!==undefined){localStorage.setItem(key(sub,suffix),JSON.stringify(value));n++;}}}
status.textContent='三科记录已恢复（'+n+' 个数据项，'+restoredImages+' 张图片）。请进入科目检查附件与笔记。';}catch(err){status.textContent='导入未完成：'+err.message;}finally{e.target.value='';}});
})();