import{dateLabel,prayerNames,prayerError}from'./locale-runtime.en.mjs';
import{times,timeLabel,monthRows,upcoming,saudiDate,daylightMinutes,prayerKeys}from'./prayer-model.mjs';
import{cities}from'./data.en.mjs';
const form=document.querySelector('#prayer-form'),error=document.querySelector('#form-error');
let lastRows=[],selected=null;
const num=n=>new Intl.NumberFormat('en-GB').format(n);
function state(){
 const f=new FormData(form),city=cities.find(c=>c.id===f.get('city'));
 return{city,date:String(f.get('date')),asr:String(f.get('asr')),ramadan:String(f.get('ramadan'))};
}
function updateNext(){
 if(!selected)return;
 const out=document.querySelector('#next-prayer'),rem=document.querySelector('#next-countdown');
 if(selected.date!==saudiDate()){
  out.textContent='Choose today’s date for the countdown';rem.textContent='The timetable is for a different date';return;
 }
 const n=upcoming(selected.city,new Date(),selected.asr,selected.ramadan),seconds=Math.max(0,Math.ceil((n.at-Date.now())/1000));
 out.textContent=prayerNames[n.key]+' · '+timeLabel(n.at);
 rem.textContent=[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
}
function updateComparison(s){
 const field=document.querySelector('#compare-city');if(!field)return;
 const city=cities.find(c=>c.id===field.value),a=times(s.city,s.date,s.asr,s.ramadan),b=times(city,s.date,s.asr,s.ramadan);
 document.querySelectorAll('[data-comparison]').forEach(row=>{
  const k=row.dataset.comparison,diff=Math.round((b[k]-a[k])/60000);
  row.querySelector('[data-city-a]').textContent=timeLabel(a[k]);
  row.querySelector('[data-city-b]').textContent=timeLabel(b[k]);
  row.querySelector('[data-difference]').textContent=diff===0?'Same time':num(Math.abs(diff))+' min '+(diff>0?'later':'earlier');
 });
 document.querySelector('#comparison-label').textContent=s.city.name+' ← '+city.name+' · '+dateLabel(s.date);
}
function updateIqamah(s){
 const out=document.querySelector('#iqamah-result');if(!out)return;
 const key=document.querySelector('#iqamah-prayer').value,delay=Number(document.querySelector('#iqamah-delay').value);
 if(!Number.isFinite(delay)||delay<0||delay>90||!Number.isInteger(delay)){out.textContent='Enter a whole interval from 0 to 90 minutes.';return;}
 const t=times(s.city,s.date,s.asr,s.ramadan)[key];
 out.textContent=timeLabel(new Date(t.valueOf()+delay*60000))+' · Personal plan, not a mosque iqamah';
}
function refresh(){
 try{
  const s=state(),t=times(s.city,s.date,s.asr,s.ramadan);selected=s;
  document.querySelector('#schedule-title').textContent=s.city.name+' · '+dateLabel(s.date);
  document.querySelectorAll('[data-prayer]').forEach(e=>e.textContent=timeLabel(t[e.dataset.prayer]));
  const day=daylightMinutes(t),duration=document.querySelector('#daylight-result');
  if(duration)duration.textContent=num(Math.floor(day/60))+' h '+num(day%60)+' min';
  const coords=document.querySelector('#coordinates');if(coords)coords.textContent=s.city.lat.toFixed(4)+'°, '+s.city.lon.toFixed(4)+'°';
  const rows=monthRows(s.city,s.date,s.asr,s.ramadan);lastRows=rows;
  const body=document.querySelector('#month-body');
  if(body)body.replaceChildren(...rows.map(r=>{const tr=document.createElement('tr');[num(r.day),...r.values].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);});return tr;}));
  const monthTitle=document.querySelector('#month-caption');if(monthTitle)monthTitle.textContent='Monthly timetable · '+s.city.name+' · '+dateLabel(s.date).replace(/^\S+\s/,'');
  updateNext();updateComparison(s);updateIqamah(s);
  error.textContent='';document.querySelector('#result-status').textContent='Calculated · Riyadh time UTC+3';
 }catch(e){error.textContent=prayerError(e.message);document.querySelector('#result-status').textContent='Check the inputs; the previous timetable has not changed';}
}
form.addEventListener('submit',e=>{e.preventDefault();refresh();});
document.querySelector('#compare-city')?.addEventListener('change',()=>selected&&updateComparison(selected));
for(const id of ['iqamah-prayer','iqamah-delay'])document.querySelector('#'+id)?.addEventListener('input',()=>selected&&updateIqamah(selected));
document.querySelector('#today-button')?.addEventListener('click',()=>{form.elements.date.value=saudiDate();refresh();});
document.querySelectorAll('[data-city-pick]').forEach(b=>b.addEventListener('click',()=>{form.elements.city.value=b.dataset.cityPick;refresh();document.querySelector('#schedule-title').scrollIntoView({behavior:'smooth',block:'center'});}));
document.querySelector('#download-calendar')?.addEventListener('click',()=>{
 if(!lastRows.length)return;
 const header=['Date',...prayerKeys.map(k=>prayerNames[k])];
 const csv='\uFEFF'+[header,...lastRows.map(r=>[r.date,...r.values])].map(r=>r.join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='prayer-times-'+selected.city.id+'-'+selected.date.slice(0,7)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
document.querySelector('#print-page')?.addEventListener('click',()=>window.print());
form.elements.date.value=saudiDate();refresh();form.querySelector('button[type=submit]').disabled=false;setInterval(updateNext,1000);

document.documentElement.dataset.appReady='true';
