
const SHIFT = {D:'值班', W:'白班', N:'下夜', R:'休息'};
const DEFAULT_OLDS = ['杨梨云','鲜双双','赵婷'];
const DEFAULT_NEWS = ['吴美泽','李龙'];
let state = {month:'', days:[], holidays:new Set(), dutyDates:new Set(), olds:[...DEFAULT_OLDS], news:[...DEFAULT_NEWS], firstDuty:'', firstDay:{}, result:null};

const $ = id => document.getElementById(id);
function pad(n){return String(n).padStart(2,'0')}
function keyDate(y,m,d){return `${y}-${pad(m)}-${pad(d)}`}
function fmtDate(ds){const d=new Date(ds+'T00:00:00'); return `${d.getMonth()+1}/${d.getDate()} 周${['日','一','二','三','四','五','六'][d.getDay()]}`}
function daysInMonth(y,m){return new Date(y,m,0).getDate()}
function weekday(ds){return new Date(ds+'T00:00:00').getDay()}
function allPeople(){return [...state.olds,...state.news]}
function isOld(name){return state.olds.includes(name)}
function showStep(n){for(let i=1;i<=5;i++){$(`step${i}`).classList.toggle('hidden',i!==n);document.querySelector(`.step[data-step="${i}"]`).classList.toggle('active',i===n);document.querySelector(`.step[data-step="${i}"]`).classList.toggle('done',i<n)}}

function initMonth(){
  const now=new Date(); const y=now.getFullYear(),m=now.getMonth()+1; $('monthInput').value=`${y}-${pad(m)}`;
}
function buildDays(){
  const [y,m]=state.month.split('-').map(Number); const n=daysInMonth(y,m); state.days=[];
  for(let d=1;d<=n;d++) state.days.push(keyDate(y,m,d));
}
function initHolidays(){state.holidays=new Set(state.days.filter(ds=>[0,6].includes(weekday(ds))));}
function initDutyDates(){state.dutyDates=new Set(state.days.filter(ds=>[1,2,3,5,6].includes(weekday(ds))));}
function renderHolidayCalendar(){
  const c=$('holidayCalendar'); c.innerHTML=''; const [y,m]=state.month.split('-').map(Number); const first=new Date(y,m-1,1).getDay();
  ['日','一','二','三','四','五','六'].forEach(x=>{const e=document.createElement('div');e.className='dow';e.textContent=x;c.appendChild(e)});
  for(let i=0;i<first;i++){const e=document.createElement('div');e.className='day blank';c.appendChild(e)}
  state.days.forEach(ds=>{const d=new Date(ds+'T00:00:00').getDate();const e=document.createElement('div');e.className='day'+(state.holidays.has(ds)?' holiday':'');e.innerHTML=`<div class="num">${d}</div><small>${state.holidays.has(ds)?'法定休息':'工作日'}</small>`;e.onclick=()=>{if(state.holidays.has(ds))state.holidays.delete(ds);else state.holidays.add(ds);renderHolidayCalendar()};c.appendChild(e)});
  $('holidayCount').textContent=`共 ${state.holidays.size} 天法定休息日`;
}
function renderDutyCalendar(){
  const c=$('dutyCalendar'); c.innerHTML='';
  const [y,m]=state.month.split('-').map(Number); const first=new Date(y,m-1,1).getDay();
  ['日','一','二','三','四','五','六'].forEach(x=>{const e=document.createElement('div');e.className='dow';e.textContent=x;c.appendChild(e)});
  for(let i=0;i<first;i++){const e=document.createElement('div');e.className='day blank';c.appendChild(e)}
  state.days.forEach(ds=>{
    const d=new Date(ds+'T00:00:00').getDate();
    const duty=state.dutyDates.has(ds), holiday=state.holidays.has(ds);
    const e=document.createElement('div');
    e.className='day'+(holiday?' holiday':'')+(duty?' duty-date':'');
    e.innerHTML=`<div class="num">${d}</div><small>${duty?'值班日':'非值班日'}${holiday?' · 法定休息':''}</small>`;
    e.onclick=()=>{if(state.dutyDates.has(ds))state.dutyDates.delete(ds);else state.dutyDates.add(ds);renderDutyCalendar()};
    c.appendChild(e);
  });
  $('dutyDateCount').textContent=`共 ${state.dutyDates.size} 个值班日`;
}

function renderPeople(){
  renderPeopleGroup('oldList','olds'); renderPeopleGroup('newList','news');
  const names=allPeople(); if(!names.includes(state.firstDuty)) state.firstDuty=names[0]||'';
  $('firstDuty').innerHTML=names.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join(''); $('firstDuty').value=state.firstDuty; $('firstDuty').onchange=e=>{state.firstDuty=e.target.value;updatePrecheck()};
  renderFirstDay();
}
function renderPeopleGroup(container,key){const c=$(container);c.innerHTML=''; state[key].forEach((name,i)=>{const row=document.createElement('div');row.className='person-row';row.innerHTML=`<span class="tag">${i+1}.</span><input type="text" value="${esc(name)}"><button class="btn danger">删除</button>`;const inp=row.querySelector('input');inp.onchange=()=>{state[key][i]=inp.value.trim()||`未命名${i+1}`;renderPeople();};row.querySelector('button').onclick=()=>{state[key].splice(i,1);renderPeople();};c.appendChild(row)})}
function esc(s){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function addPerson(key){state[key].push(key==='olds'?`老鸟${state[key].length+1}`:`新人${state[key].length+1}`);renderPeople()}
function renderFirstDay(){
  const body=$('firstDayBody');body.innerHTML=''; allPeople().forEach(n=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${esc(n)}</td><td><select data-name="${esc(n)}"><option value="">请选择</option><option value="D">值班</option><option value="W">白班</option><option value="N">下夜</option><option value="R">休息</option></select></td>`;const s=tr.querySelector('select');s.value=state.firstDay[n]||'';s.onchange=()=>{state.firstDay[n]=s.value;updatePrecheck()};body.appendChild(tr)})
}
function syncFirstDay(){renderFirstDay();const s=$('firstDuty');if(s) s.value=state.firstDuty;}
function updatePrecheck(){
  const names=allPeople();const msgs=[]; if(names.length===0)msgs.push(['error','至少需要1名人员。']);
  if(!state.firstDuty || !names.includes(state.firstDuty))msgs.push(['error','请先选择当月第一个值班日的值班人员。']);
  names.forEach(n=>{if(!state.firstDay[n])msgs.push(['warn',`请填写${n}的1号班次。`])});
  if(state.firstDuty && state.firstDay[state.firstDuty] && state.firstDay[state.firstDuty]!=='D')msgs.push(['error',`1号第一个值班人员“${state.firstDuty}”的1号班次必须是“值班”。`]);
  // uniqueness
  if(Object.values(state.firstDay).filter(x=>x==='D').length>1)msgs.push(['error','1号只能有1名值班人员。']);
  if(Object.keys(state.firstDay).length===names.length && names.length && !Object.values(state.firstDay).includes('D'))msgs.push(['error','1号必须有1名值班人员。']);
  $('precheck').innerHTML=msgs.length?msgs.map(x=>`<div class="alert ${x[0]}">${x[1]}</div>`).join(''):'<div class="alert info">配置检查通过后即可生成。</div>';
  return !msgs.some(x=>x[0]==='error');
}

function buildDutySequence(){
  const old=state.olds, nw=state.news;
  if(!old.length && !nw.length) return [];
  const rounds=[]; const target=state.days.filter(d=>state.dutyDates.has(d)).length;
  if(!target)return [];
  // Canonical pattern: all oldbirds once, then one newcomer; newcomer rotates by round.
  let maxRounds=Math.max(2,target+2); for(let r=0;r<maxRounds;r++){old.forEach(x=>rounds.push(x));if(nw.length)rounds.push(nw[r%nw.length])}
  const names=allPeople(); let start=rounds.indexOf(state.firstDuty); if(start<0) start=0;
  const seq=[]; for(let i=0;i<target;i++) seq.push(rounds[(start+i)%rounds.length]); return seq;
}
function fixedByDuty(){
  const dutyDays=[...state.days].filter(d=>state.dutyDates.has(d)); const seq=buildDutySequence(); const fixed={};
  state.days.forEach(ds=>fixed[ds]={});
  dutyDays.forEach((ds,i)=>{const p=seq[i]; if(!p)return; fixed[ds][p]='D'; const idx=state.days.indexOf(ds); if(idx+1<state.days.length && !fixed[state.days[idx+1]][p]) fixed[state.days[idx+1]][p]='N'; if(idx+2<state.days.length && !fixed[state.days[idx+2]][p]) fixed[state.days[idx+2]][p]='R';});
  // Day 1 is fully manual and may carry over an unknown duty from the previous month.
  const first=state.days[0]; allPeople().forEach(p=>{if(state.firstDay[p]) fixed[first][p]=state.firstDay[p]});
  // Carry forward the known consequence of the manual day-1 status.
  allPeople().forEach(p=>{
    const x=state.firstDay[p];
    if(x==='D'){
      if(state.days[1] && !fixed[state.days[1]][p]) fixed[state.days[1]][p]='N';
      if(state.days[2] && !fixed[state.days[2]][p]) fixed[state.days[2]][p]='R';
    }else if(x==='N'){
      if(state.days[1] && !fixed[state.days[1]][p]) fixed[state.days[1]][p]='R';
    }
  });
  return fixed;
}
function validateStatic(fixed){
  const issues=[]; const names=allPeople(); const first=state.days[0];
  // A person cannot be duty in the two following days by another scheduled duty.
  state.days.forEach((ds,idx)=>{const p=Object.entries(fixed[ds]).find(([,v])=>v==='D')?.[0]; if(p){for(const j of [idx+1,idx+2]) if(j<state.days.length && fixed[state.days[j]][p]==='D') issues.push(`${fmtDate(ds)} ${p}后两天内又被排值班`);}})
  // Manual first day cannot contradict automatically deduced day 1 duty unless it is itself the only manual override.
  const duty1=Object.entries(fixed[first]).find(([,v])=>v==='D')?.[0]; if(state.dutyDates.has(first) && duty1 && duty1!==state.firstDuty)issues.push(`1号值班人员与“当月第一个值班日的值班人员”不一致`); if(state.dutyDates.has(first) && !duty1)issues.push('1号是值班日，但没有有效的值班人员');
  names.forEach(p=>{let r=0;state.days.forEach(ds=>{if(fixed[ds][p]==='R')r++});if(r>state.holidays.size)issues.push(`${p}的固定“休息”已有${r}天，超过当月法定休息日${state.holidays.size}天`)});
  return issues;
}

// Dynamic programming over days and each person's exact rest count.
// State = rest counts packed in mixed radix. Score is lexicographic by using large weights:
// 1) maximize rest on statutory holidays; 2) maximize white shifts on Mon/Tue/Fri; 3) maximize white shifts on Wed/Thu.
function solve(){
  const names=allPeople(); const P=names.length, H=state.holidays.size; if(P===0)throw new Error('没有人员');
  const fixed=fixedByDuty(); const staticIssues=validateStatic(fixed); if(staticIssues.length)throw new Error(staticIssues.join('；'));
  const rad=Array(P).fill(H+1); const mult=Array(P).fill(1); for(let i=1;i<P;i++) mult[i]=mult[i-1]*rad[i-1];
  const totalStates=mult[P-1]*rad[P-1]; if(totalStates>3000000)throw new Error('人员数量过多或法定休息日过多，当前浏览器不建议计算。');
  const zero=0; let cur=new Map([[zero,{score:0,path:null,mask:null}]]); const layers=[];
  const dutyDays=state.days.filter(d=>state.dutyDates.has(d));
  const fixedType=(ds,p)=>fixed[ds]&&fixed[ds][p];
  for(let di=0;di<state.days.length;di++){
    const ds=state.days[di], wd=weekday(ds), holiday=state.holidays.has(ds); const minWhite = holiday ? ( (fixed[ds] && Object.entries(fixed[ds]).find(([,v])=>v==='D') && isOld(Object.entries(fixed[ds]).find(([,v])=>v==='D')[0])) ? 0 : 1) : ([1,2,5].includes(wd)?2:([3,4].includes(wd)?1:0));
    const opts=[]; function rec(i,adds,white,oldWhite){
      if(i===P){
        if(white<minWhite) return;
        const dutyName=Object.entries(fixed[ds]).find(([,v])=>v==='D')?.[0]; if(holiday && dutyName && !isOld(dutyName) && oldWhite<1)return;
        opts.push({adds:adds.slice(),white});return;
      }
      const fx=fixedType(ds,names[i]); if(fx){if(fx==='R')adds[i]=1;else adds[i]=0; rec(i+1,adds,white+(fx==='W'?1:0),oldWhite+(fx==='W'&&isOld(names[i])?1:0));return}
      adds[i]=0; rec(i+1,adds,white+1,oldWhite+(isOld(names[i])?1:0));
      adds[i]=1; rec(i+1,adds,white,oldWhite);
    }
    rec(0,Array(P).fill(0),0,0);
    const next=new Map();
    for(const [code,entry] of cur){
      for(const o of opts){
        let nc=code,ok=true;
        for(let i=0;i<P;i++){
          const c=Math.floor(nc/mult[i])%(H+1); const n=c+o.adds[i];
          if(n>H){ok=false;break}
          if(o.adds[i])nc+=mult[i];
        }
        if(!ok)continue;
        // Score: holiday rest overwhelmingly preferred, then target weekday white, then Wed/Thu white.
        let hrest=0,tw=0,mw=0;
        for(let i=0;i<P;i++) if(o.adds[i]===1){if(holiday)hrest++} else {if([1,2,5].includes(wd))tw++; if([3,4].includes(wd))mw++}
        const score=entry.score + hrest*100000 + tw*100 + mw;
        const old=next.get(nc); if(!old||score>old.score)next.set(nc,{score,path:entry,mask:o.adds.slice()});
      }
    }
    if(!next.size) throw new Error(`${fmtDate(ds)}附近无法同时满足“白班下限 + 固定下夜/休息 + 每人休息天数=${H}天”。请检查节假日、值班日或1号班次配置。`);
    layers.push(next);cur=next;
  }
  const targetCode=H*mult.reduce((a,_,i)=>a+0,0); let code=0;for(let i=0;i<P;i++)code+=H*mult[i]; const end=cur.get(code);if(!end)throw new Error(`找不到满足每人恰好${H}天休息的完整排班。可能是固定下夜/休息与休息日数量冲突。`);
  const byDay=Array(state.days.length); let node=end; for(let di=state.days.length-1;di>=0;di--){byDay[di]=node.mask;node=node.path}
  const result={};state.days.forEach((ds,di)=>{result[ds]={};for(let i=0;i<P;i++){const fx=fixed[ds][names[i]];result[ds][names[i]]=fx|| (byDay[di][i]===1?'R':'W')}});
  return result;
}

function generate(){
  if(!updatePrecheck())return;
  // Re-check name uniqueness.
  const names=allPeople();const dup=names.filter((n,i)=>names.indexOf(n)!==i); if(dup.length){$('precheck').innerHTML=`<div class="alert error">人员姓名不能重复：${esc([...new Set(dup)].join('、'))}</div>`;return}
  try{state.result=solve();renderResult();showStep(5)}catch(e){$('precheck').innerHTML=`<div class="alert error">${esc(e.message)}</div>`}
}
function renderResult(){
  const names=allPeople(); const res=state.result; $('resultHint').textContent=`${state.month} · ${state.days.length}天 · 法定休息日${state.holidays.size}天 · 值班日${state.dutyDates.size}天`;
  $('resultAlert').innerHTML='<div class="alert ok">排班生成成功。结果只存在于当前页面，点击“下载CSV”可将完整排班表保存到手机本地，用 Excel/WPS 等工具打开。</div>';
  const sm=$('summary');sm.innerHTML='';names.forEach(p=>{let r=0,d=0,n=0,w=0;state.days.forEach(ds=>{const x=res[ds][p];if(x==='R')r++;if(x==='D')d++;if(x==='N')n++;if(x==='W')w++});const e=document.createElement('div');e.className='stat';e.innerHTML=`<b>${p}</b><span>值班 ${d} · 白班 ${w} · 下夜 ${n} · 休息 ${r}</span>`;sm.appendChild(e)})
  const t=$('resultTable');
  let h='<thead><tr><th>人员</th>';
  state.days.forEach(ds=>h+=`<th>${fmtDate(ds)}</th>`);
  h+='</tr></thead><tbody>';
  names.forEach(p=>{
    h+=`<tr><td><b>${esc(p)}</b></td>`;
    state.days.forEach(ds=>{
      const x=res[ds][p];
      h+=`<td class="${x==='D'?'cell-duty':x==='N'?'cell-night':x==='R'?'cell-rest':'cell-white'}">${SHIFT[x]}</td>`;
    });
    h+='</tr>';
  });
  h+='</tbody>';
  t.innerHTML=h;
}
function resultCSV(){const names=allPeople();let lines=[['日期',...names].join(',')];state.days.forEach(ds=>lines.push([fmtDate(ds),...names.map(p=>SHIFT[state.result[ds][p]])].map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')));return '\ufeff'+lines.join('\n')}

$('startBtn').onclick=()=>{const v=$('monthInput').value;if(!v){alert('请选择月份');return}state.month=v;buildDays();initHolidays();initDutyDates();state.firstDay={};state.result=null;renderHolidayCalendar();showStep(2)};
$('back1').onclick=()=>showStep(1);$('back2').onclick=()=>{renderHolidayCalendar();showStep(2)};$('back3').onclick=()=>{renderDutyCalendar();showStep(3)};$('next2').onclick=()=>{renderDutyCalendar();showStep(3)};$('next3').onclick=()=>{renderPeople();showStep(4);updatePrecheck()};$('addOld').onclick=()=>addPerson('olds');$('addNew').onclick=()=>addPerson('news');$('generateBtn').onclick=generate;
function xmlEsc(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}

const ZIP_CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0}return t})();
function crc32(bytes){let c=0xFFFFFFFF;for(let i=0;i<bytes.length;i++)c=ZIP_CRC_TABLE[(c^bytes[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function u16(v){return new Uint8Array([v&255,(v>>>8)&255])}
function u32(v){return new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255])}
function concatBytes(...arrs){let n=arrs.reduce((s,a)=>s+a.length,0),out=new Uint8Array(n),p=0;for(const a of arrs){out.set(a,p);p+=a.length}return out}
function zipStore(files){const enc=new TextEncoder(),parts=[],central=[];let offset=0;for(const f of files){const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);const local=concatBytes(new Uint8Array([0x50,0x4b,0x03,0x04]),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data);parts.push(local);const cent=concatBytes(new Uint8Array([0x50,0x4b,0x01,0x02]),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name);central.push(cent);offset+=local.length}const centralBytes=concatBytes(...central),end=concatBytes(new Uint8Array([0x50,0x4b,0x05,0x06]),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralBytes.length),u32(offset),u16(0));return concatBytes(...parts,centralBytes,end)}

function colName(n){let s='';n++;while(n){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26)}return s}
function xlsxCell(ref,value,style=0){return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${xmlEsc(value)}</t></is></c>`}
function buildXlsx(){
  const names=allPeople(), days=state.days, res=state.result;
  const sheetRows=[];
  const headers=['人员',...days.map(fmtDate)];
  sheetRows.push(`<row r="1" ht="26" customHeight="1">${headers.map((v,i)=>xlsxCell(`${colName(i)}1`,v, i===0?1:1)).join('')}</row>`);
  names.forEach((p,ri)=>{const cells=[xlsxCell(`A${ri+2}`,p,2)];days.forEach((ds,di)=>{const x=res[ds][p],style=x==='D'?3:x==='W'?4:x==='N'?5:6;cells.push(xlsxCell(`${colName(di+1)}${ri+2}`,SHIFT[x],style))});sheetRows.push(`<row r="${ri+2}" ht="24" customHeight="1">${cells.join('')}</row>`)});
  const lastRef=`${colName(days.length)}${names.length+1}`;
  const sheetXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane xSplit="1" ySplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="20"/><cols><col min="1" max="1" width="18" customWidth="1"/> <col min="2" max="${days.length+1}" width="12" customWidth="1"/></cols><sheetData>${sheetRows.join('')}</sheetData><autoFilter ref="A1:${lastRef}"/><pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`;
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="0"/><fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Microsoft YaHei"/><family val="2"/></font></fonts><fills count="7"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF3F4F6"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE0E7FF"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCFCE7"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD1D5DB"/></left><right style="thin"><color rgb="FFD1D5DB"/></right><top style="thin"><color rgb="FFD1D5DB"/></top><bottom style="thin"><color rgb="FFD1D5DB"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="5" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="6" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="排班表" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const rootRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const contentTypes=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
  return new Blob([zipStore([{name:'[Content_Types].xml',data:contentTypes},{name:'_rels/.rels',data:rootRels},{name:'xl/workbook.xml',data:workbook},{name:'xl/_rels/workbook.xml.rels',data:rels},{name:'xl/worksheets/sheet1.xml',data:sheetXml},{name:'xl/styles.xml',data:styles}])],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
$('downloadBtn').onclick=()=>downloadBlob(buildXlsx(),`排班表_${state.month}.xlsx`);
$('downloadCsvBtn').onclick=()=>downloadBlob(new Blob([resultCSV()],{type:'text/csv;charset=utf-8;'}),`排班表_${state.month}.csv`);
$('copyBtn').onclick=async()=>{try{await navigator.clipboard.writeText(resultCSV());alert('已复制CSV排班结果。')}catch(e){const ta=document.createElement('textarea');ta.value=resultCSV();document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();alert('已复制。')}};
$('restartBtn').onclick=$('againBtn').onclick=()=>{state={month:'',days:[],holidays:new Set(),dutyDates:new Set(),olds:[...DEFAULT_OLDS],news:[...DEFAULT_NEWS],firstDuty:'',firstDay:{},result:null};initMonth();showStep(1)};
initMonth();
