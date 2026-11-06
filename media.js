/* V6: photos in IndexedDB, links in existing localStorage namespace. */
window.QuizMedia=(()=>{'use strict';
const DB='2027-exam-media-v6', STORE='images';let promise;
function db(){if(!('indexedDB' in window))return Promise.reject(Error('当前浏览器不支持图片存储'));
 if(!promise)promise=new Promise((resolve,reject)=>{let r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const store=r.result.createObjectStore(STORE,{keyPath:'key'});store.createIndex('subject','subject',{unique:false});store.createIndex('qid','qid',{unique:false});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('数据库打开失败'));});return promise;}
async function transaction(mode,fn){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(STORE,mode);let result;try{result=fn(tx.objectStore(STORE));}catch(e){reject(e);return;}tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||Error('保存失败'));tx.onabort=()=>reject(tx.error||Error('保存中断'));});}
function all(sub,qid){return db().then(d=>new Promise((resolve,reject)=>{const t=d.transaction(STORE,'readonly');const req=t.objectStore(STORE).index('subject').getAll(sub);req.onsuccess=()=>resolve(req.result.filter(x=>qid===undefined||String(x.qid)===String(qid)));req.onerror=()=>reject(req.error);}));}
async function put(item){await transaction('readwrite',s=>{s.put(item);});return item;}
async function remove(key){await transaction('readwrite',s=>{s.delete(key);});}
function toDataUrl(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});}
async function fromDataUrl(url){const m=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(url||'');if(!m)throw Error('不支持的图片格式');const binary=atob(m[2]);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type:m[1]});}
async function compress(file){if(!file.type.startsWith('image/'))throw Error('请选择图片文件');if(file.size>15*1024*1024)throw Error('图片超过 15MB，请先缩小');
const bitmap=typeof createImageBitmap==='function'?await createImageBitmap(file).catch(()=>null):null;let img=bitmap;
if(!img){img=await new Promise((resolve,reject)=>{const o=new Image(),url=URL.createObjectURL(file);o.onload=()=>{URL.revokeObjectURL(url);resolve(o);};o.onerror=()=>{URL.revokeObjectURL(url);reject(Error('无法读取图片'));};o.src=url;});}
const ratio=Math.min(1,1280/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*ratio));canvas.height=Math.max(1,Math.round(img.height*ratio));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);if(bitmap)bitmap.close();
let blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.75));if(!blob)throw Error('图片压缩失败');if(blob.size>650*1024){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.5));}if(blob.size>750*1024)throw Error('压缩后图片过大，请裁剪后上传');return blob;}
async function exportAll(){const rows=await all('school');const other=await Promise.all([all('training'),all('physiology')]);const out=[];for(const item of [...rows,...other.flat()])out.push({key:item.key,subject:item.subject,qid:String(item.qid),name:item.name,createdAt:item.createdAt,data:await toDataUrl(item.blob)});return out;}
async function importAll(items){if(!Array.isArray(items))return 0;let count=0;for(const r of items){if(!['school','training','physiology'].includes(r.subject)||!/^\d+$/.test(String(r.qid))||!r.data)continue;const blob=await fromDataUrl(r.data);if(blob.size>750*1024)throw Error('备份中有图片超过容量限制');await put({key:r.key||`${r.subject}:${r.qid}:${Date.now()}:${count}`,subject:r.subject,qid:String(r.qid),name:String(r.name||'图片').slice(0,100),createdAt:r.createdAt||new Date().toISOString(),blob});count++;}return count;}
async function clearSubject(sub){for(const r of await all(sub))await remove(r.key);}
return{all,put,remove,compress,exportAll,importAll,clearSubject};
})();
