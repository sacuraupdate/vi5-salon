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
module.exports=async(req,res)=>{
  try{
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
