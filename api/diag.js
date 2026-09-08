// 同期状況の確認  /?api=diag
const SUPA_URL='https://tehcaufdztgpbrknpshk.supabase.co';
const SUPA_KEY='sb_publishable_CnOCyO9QU69K47vbbLRkYg__cEv53CJ';
async function kv(key){const r=await fetch(SUPA_URL+'/rest/v1/kv?key=eq.'+key+'&select=value',{headers:{apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY}});if(!r.ok)return null;const j=await r.json();if(!j.length)return null;let v=j[0].value;for(let i=0;i<4;i++){if(typeof v==='string'){try{v=JSON.parse(v);continue}catch(e){break}}if(Array.isArray(v)){v=v[0];continue}break}return v}
module.exports=async(req,res)=>{
  try{
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
