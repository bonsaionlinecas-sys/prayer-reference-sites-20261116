import {Coordinates,CalculationMethod,PrayerTimes,Madhab} from './adhan.mjs';
export const prayerNames={fajr:'الفجر',sunrise:'الشروق',dhuhr:'الظهر',asr:'العصر',maghrib:'المغرب',isha:'العشاء'};
export const prayerKeys=Object.keys(prayerNames);
export const obligatoryKeys=prayerKeys.filter(k=>k!=='sunrise');
export const zone='Asia/Riyadh';
export function saudiDate(date=new Date()){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).map(p=>[p.type,p.value]));
 return `${p.year}-${p.month}-${p.day}`;
}
export function parseDate(iso){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))throw Error('اختر تاريخاً صحيحاً.');
 const[y,m,d]=iso.split('-').map(Number),date=new Date(y,m-1,d,12);
 if(y<2020||y>2035||date.getFullYear()!==y||date.getMonth()!==m-1||date.getDate()!==d)throw Error('التاريخ المتاح بين ٢٠٢٠ و٢٠٣٥.');
 return date;
}
export function isRamadan(iso){
 const p=new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura',{timeZone:zone,month:'numeric'}).formatToParts(new Date(iso+'T12:00:00Z'));
 return Number(p.find(p=>p.type==='month')?.value)===9;
}
export function times(city,iso,asr='shafi',ramadan='auto'){
 if(!city||!Number.isFinite(city.lat)||!Number.isFinite(city.lon))throw Error('اختر مدينة من القائمة.');
 const date=parseDate(iso),params=CalculationMethod.UmmAlQura();
 params.madhab=asr==='hanafi'?Madhab.Hanafi:Madhab.Shafi;
 const summerRule=ramadan==='on'||ramadan==='auto'&&isRamadan(iso);
 params.ishaInterval=summerRule?120:90;
 const result=new PrayerTimes(new Coordinates(city.lat,city.lon),date,params);
 if(prayerKeys.some(k=>!Number.isFinite(result[k].valueOf())))throw Error('تعذّر حساب الأوقات لهذه المدخلات.');
 return result;
}
export function timeLabel(date){return new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hour12:false}).format(date);}
export function dateLabel(iso){return new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{timeZone:zone,day:'numeric',month:'long',year:'numeric'}).format(new Date(iso+'T12:00:00Z'));}
export function monthRows(city,iso,asr='shafi',ramadan='auto'){
 const date=parseDate(iso),year=date.getFullYear(),month=date.getMonth(),count=new Date(year,month+1,0).getDate();
 return Array.from({length:count},(_,i)=>{
 const id=`${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
 const raw=times(city,id,asr,ramadan);
 return{date:id,day:i+1,values:prayerKeys.map(k=>timeLabel(raw[k]))};
 });
}
export function tomorrow(iso){const d=parseDate(iso);d.setDate(d.getDate()+1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function upcoming(city,now=new Date(),asr='shafi',ramadan='auto'){
 const iso=saudiDate(now),today=times(city,iso,asr,ramadan);
 for(const key of obligatoryKeys)if(today[key]>now)return{key,at:today[key],date:iso};
 const next=tomorrow(iso);return{key:'fajr',at:times(city,next,asr,ramadan).fajr,date:next};
}
export function daylightMinutes(t){return Math.round((t.maghrib-t.sunrise)/60000);}
