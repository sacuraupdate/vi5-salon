// 同期状況の確認  /?api=diag
const SUPA_URL=process.env.SUPABASE_URL||'https://tehcaufdztgpbrknpshk.supabase.co';
const SUPA_KEY=process.env.SUPABASE_KEY||'sb_publishable_CnOCyO9QU69K47vbbLRkYg__cEv53CJ';
async function kv(key){const r=await fetch(SUPA_URL+'/rest/v1/kv?key=eq.'+key+'&select=value',{headers:{apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY}});if(!r.ok)return null;const j=await r.json();if(!j.length)return null;let v=j[0].value;for(let i=0;i<4;i++){if(typeof v==='string'){try{v=JSON.parse(v);continue}catch(e){break}}if(Array.isArray(v)){v=v[0];continue}break}return v}

/* データの重さの内訳（私＝開発側が原因を特定するため）。個人情報は一切返さない：件数とサイズのみ */
function sz(o){try{return JSON.stringify(o===undefined?null:o).length;}catch(e){return 0;}}
function imgStat(o){const acc={n:0,bytes:0};const seen=new Set();
  (function go(x,d){if(!x||d>9||typeof x!=='object'||seen.has(x))return;seen.add(x);
    const vals=Array.isArray(x)?x:Object.keys(x).map(k=>x[k]);
    vals.forEach(v=>{if(typeof v==='string'){if(v.indexOf('data:image')===0){acc.n++;acc.bytes+=v.length;}}else go(v,d+1);});})(o,0);
  return acc;}

/* 速度と地域の確認（表示のみ・データは一切変更しない）  /api/diag?mode=speed */
async function speedCheck(){
  const out={};
  out.server_region = process.env.VERCEL_REGION || '（不明）';
  out.db_url = SUPA_URL.replace('https://','');
  const times=[];
  for(let i=0;i<3;i++){
    const t0=Date.now();
    try{ await fetch(SUPA_URL+'/rest/v1/kv?key=eq.salon:data&select=key', {headers:{apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY}}); }catch(e){}
    times.push(Date.now()-t0);
  }
  times.sort((a,b)=>a-b);
  out.db_roundtrip_ms = times[1];
  out.db_roundtrip_all = times;
  out.judge = times[1] <= 40 ? '近い（おそらく東京）'
            : times[1] <= 120 ? 'やや遠い（アジア圏か回線の影響）'
            : '遠い（海外の可能性が高い）';
  return out;
}

/* シフトの提出状況を確認する（表示のみ）  /api/diag?mode=shift */
async function shiftCheck(){
  const d=await kv('salon:data')||{};
  const ov=(d.shiftOverrides)||{};
  const names={s1:'SAKURA',s2:'TOMOMI',s3:'HARUKA'};
  const out={updatedAt:d.updatedAt?new Date(d.updatedAt).toLocaleString('ja-JP'):'不明',staff:{}};
  Object.keys(names).forEach(function(sid){
    const days=Object.keys(ov[sid]||{}).sort();
    const byMonth={};
    days.forEach(function(ds){
      const m=ds.slice(0,7);byMonth[m]=byMonth[m]||{出勤:0,休み:0,例:[]};
      const v=ov[sid][ds]||{};
      if(v.off)byMonth[m]['休み']++;
      else{byMonth[m]['出勤']++;
        if(byMonth[m]['例'].length<3){
          const rs=(v.ranges?v.ranges:[{start:v.start,end:v.end}]).filter(function(r){return r&&r.start!=null;})
            .map(function(r){return r.start+':00-'+r.end+':00';}).join(',');
          byMonth[m]['例'].push(ds+' '+rs);}}
    });
    out.staff[names[sid]]={登録日数:days.length,月別:byMonth};
  });
  return out;
}

/* TOMOMIの10月以降の誤ったシフトだけを削除する（1回だけ・他のデータには触れない）
   /api/diag?mode=fixtomomi&confirm=yes */
async function fixTomomi(){
  const r=await fetch(SUPA_URL+'/rest/v1/kv?key=eq.salon:data&select=value',{headers:{apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY}});
  if(!r.ok)return{error:'読み込めませんでした'};
  const j=await r.json();
  if(!Array.isArray(j)||!j.length)return{error:'データがありません'};
  let v=j[0].value;
  for(let i=0;i<4;i++){if(typeof v==='string'){try{v=JSON.parse(v);continue}catch(e){break}}if(Array.isArray(v)){v=v[0];continue}break}
  if(!v||typeof v!=='object')return{error:'形式が違います'};
  const ov=(v.shiftOverrides&&v.shiftOverrides.s2)||{};
  const removed=[];
  Object.keys(ov).forEach(function(ds){ if(ds>='2026-10-01'){ removed.push(ds+' '+JSON.stringify(ov[ds])); delete ov[ds]; } });
  if(!removed.length)return{removed:[],message:'10月以降のシフトはありませんでした'};
  const body=JSON.stringify({key:'salon:data',value:JSON.stringify(v)});
  const w=await fetch(SUPA_URL+'/rest/v1/kv?on_conflict=key',{method:'POST',headers:{apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:body});
  if(!w.ok)return{error:'保存できませんでした('+w.status+')',removed:removed};
  return{removed:removed,message:'TOMOMIの10月以降のシフトを削除しました',
    残り:{TOMOMI:Object.keys(ov).length, SAKURA:Object.keys((v.shiftOverrides&&v.shiftOverrides.s1)||{}).length}};
}

/* Googleカレンダーへの送信状況を確認する（表示のみ）  /api/diag?mode=gcal */
async function gcalStatus(){
  const q=await kv('salon:gcalq')||[];
  const lg=await kv('salon:gcallog')||[];
  const d=await kv('salon:data')||{};
  const queue=Array.isArray(q)?q:[];
  const log=Array.isArray(lg)?lg:[];
  const recent=log.slice(0,10).map(function(x){
    return {日時:x.at?new Date(x.at).toLocaleString('ja-JP'):'', 操作:x.action||x.op||'', 結果:x.ok===false?'失敗':'成功', 内容:x.title||x.id||''};
  });
  /* 直近の予約が何件あるか */
  const today=new Date().toISOString().slice(0,10);
  const future=(d.bookings||[]).filter(function(b){return b.date>=today&&b.status!=='cancelled';});
  return {
    送信待ち件数: queue.length,
    送信待ちの中身: queue.slice(0,5).map(function(x){return (x.action||'')+' '+(x.date||'')+' '+(x.time||'');}),
    直近の送信記録: recent,
    今後の予約件数: future.length,
    判定: queue.length===0 ? 'Googleカレンダーへの送信は滞っていません'
        : ('⚠ '+queue.length+'件が送信できずに溜まっています')
  };
}
module.exports=async(req,res)=>{
  try{
    if((req.query&&req.query.mode)==='fixtomomi'&&(req.query.confirm)==='yes'){
      const r=await fixTomomi();
      res.setHeader('Cache-Control','no-store');
      res.status(200).json(r);return;
    }
    if((req.query&&req.query.mode)==='gcal'){
      const r=await gcalStatus();
      res.setHeader('Cache-Control','no-store');
      res.status(200).json(r);return;
    }
    if((req.query&&req.query.mode)==='shift'){
      const r=await shiftCheck();
      res.setHeader('Cache-Control','no-store');
      res.status(200).json(r);return;
    }
    if((req.query&&req.query.mode)==='speed'){
      const r=await speedCheck();
      res.setHeader('Cache-Control','no-store');
      res.status(200).json(r);return;
    }
    if((req.query&&req.query.mode)==='size'){
      const W=(await kv('salon:work'))||{}; const D=(await kv('salon:data'))||{};
      const chats=W.chats||{}; let chatMsgs=0; Object.keys(chats).forEach(k=>chatMsgs+=(chats[k]||[]).length);
      const out={
        work_total_bytes:sz(W), data_total_bytes:sz(D),
        work_breakdown:{
          chats:{bytes:sz(W.chats),messages:chatMsgs,images:imgStat(W.chats)},
          reports:{bytes:sz(W.reports),count:(W.reports||[]).length,images:imgStat(W.reports)},
          karte:{bytes:sz(W.karte),images:imgStat(W.karte)},
          tasks:{bytes:sz(W.tasks),count:(W.tasks||[]).length,images:imgStat(W.tasks)},
          clock:{bytes:sz(W.clock),count:(W.clock||[]).length},
          orders:{bytes:sz(W.orders),count:(W.orders||[]).length},
          shopItems:{bytes:sz(W.shopItems),images:imgStat(W.shopItems)},
          ownerAlerts:{bytes:sz(W.ownerAlerts),count:(W.ownerAlerts||[]).length}
        },
        data_breakdown:{
          services:{bytes:sz(D.services),count:(D.services||[]).length,images:imgStat(D.services)},
          staff:{bytes:sz(D.staff),count:(D.staff||[]).length,images:imgStat(D.staff)},
          customers:{bytes:sz(D.customers),count:Object.keys(D.customers||{}).length,images:imgStat(D.customers)},
          bookings:{bytes:sz(D.bookings),count:(D.bookings||[]).length},
          settings:{bytes:sz(D.settings),images:imgStat(D.settings)},
          activity:{bytes:sz(D.activity),count:(D.activity||[]).length}
        }};
      res.setHeader('Cache-Control','no-store');
      res.status(200).json(out);return;
    }
    const diag=await kv('salon:diag');
    const d=await kv('salon:data');
    const ps=(d&&d.eshop&&d.eshop.products)||[];
    const cats={};ps.forEach(p=>{const c=p.pw?'サロン限定':(p.cat||'?');cats[c]=(cats[c]||0)+1;});
    const bk=(d&&d.bookings)||[];const cust=(d&&d.customers)||{};const delC=(d&&d.deletedCust)||{};
    const byStatus={};bk.forEach(b=>{byStatus[b.status||'?']=(byStatus[b.status||'?']||0)+1;});
    const autoCancelled=bk.filter(b=>b.autoCancelled).length;
    const orphan=bk.filter(b=>{const k=String(b.phone||'').replace(/[^0-9]/g,'');return !cust[k];});
    const dupKeys={};bk.filter(b=>b.status!=='cancelled').forEach(b=>{const k=String(b.phone||'').replace(/[^0-9]/g,'')+'|'+b.date+'|'+b.time;dupKeys[k]=(dupKeys[k]||0)+1;});
    res.status(200).json({bookings:bk.length,byStatus:byStatus,autoCancelled:autoCancelled,
      orphanBookings:orphan.length,orphanSample:orphan.slice(0,8).map(b=>({id:b.id,date:b.date,time:b.time,phone:b.phone,name:b.name,status:b.status})),
      deletedCustCount:Object.keys(delC).length,customers:Object.keys(cust).length,
      dupNow:Object.entries(dupKeys).filter(([k,n])=>n>1).slice(0,8),
      lastSync:diag,productCount:ps.length,cats:cats,
      noName:ps.filter(p=>!p.name).length,noCat:ps.filter(p=>!p.cat).length,noPrice:ps.filter(p=>!p.price).length,
      sample:ps.slice(0,8).map(p=>(p.name||'?')+'/'+p.price+'/'+(p.cat||'?')+(p.pw?'/🔒':''))});
  }catch(e){res.status(500).json({error:String(e&&e.message)});}
};
