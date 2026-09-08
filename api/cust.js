// お客様向け操作（サーバー側で実行。他のお客様の情報はブラウザに一切出さない） POST /api/cust
const SUPA_URL='https://tehcaufdztgpbrknpshk.supabase.co';
const SUPA_KEY='sb_publishable_CnOCyO9QU69K47vbbLRkYg__cEv53CJ';
const H={apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY};
const norm=p=>String(p||'').replace(/[^0-9]/g,'');
async function kvGet(key){const r=await fetch(SUPA_URL+'/rest/v1/kv?key=eq.'+key+'&select=value',{headers:H});if(!r.ok)throw new Error('load-'+r.status);const j=await r.json();if(!Array.isArray(j)||!j.length)return null;let v=j[0].value;for(let i=0;i<4;i++){if(typeof v==='string'){try{v=JSON.parse(v);continue}catch(e){break}}if(Array.isArray(v)){v=v[0];continue}break}return (v&&typeof v==='object')?v:null;}
async function applyData(mutate){/* 直前に再読込→変更適用→保存（他端末の保存を消さない） */
  for(let i=0;i<3;i++){const d=await kvGet('salon:data');if(!d)throw new Error('load');mutate(d);await kvSet('salon:data',d);return d;}
}
async function kvSet(key,val){const r=await fetch(SUPA_URL+'/rest/v1/kv?on_conflict=key',{method:'POST',headers:Object.assign({},H,{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({key,value:JSON.stringify(val)})});if(!r.ok)throw new Error('save-'+r.status);}
function today(){return new Date(Date.now()+9*3600000).toISOString().slice(0,10);}
// 公開用データ: 個人情報を含まない
function publicView(d){
  const staff=(d.staff||[]).map(s=>({id:s.id,name:s.name,role:s.role,intro:s.intro,quals:s.quals,photo:s.thumb||s.photo,thumb:s.thumb,services:s.services,prices:s.prices,hidden:s.hidden,color:s.color}));
  const settings=Object.assign({},d.settings||{});delete settings.staffPw;delete settings.ownerPin;delete settings.gcalHook;
  const bookings=(d.bookings||[]).filter(b=>b&&b.status!=='cancelled').map(b=>({id:b.id,date:b.date,time:b.time,staffId:b.staffId,status:b.status,items:(b.items||[]).map(i=>({min:i.min||0})),pairId:b.pairId}));
  return {services:d.services||[],staff,settings,posts:d.posts||[],boards:d.boards||[],eshop:d.eshop||{products:[]},shifts:d.shifts||{},shiftOverrides:d.shiftOverrides||{},blocks:d.blocks||[],bookings,activity:[],customers:{}};
}
function ownView(d,P){const c=d.customers&&d.customers[P];if(!c)return null;const bookings=(d.bookings||[]).filter(b=>norm(b.phone)===P);return {customer:c,bookings};}
module.exports=async(req,res)=>{
  if(req.method!=='POST'){res.status(405).json({error:'POST only'});return;}
  try{
    let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b);}catch(e){b={};}}
    if(!b||typeof b!=='object'){b=await new Promise(r=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>{try{r(JSON.parse(s));}catch(e){r({});}});});}
    const op=b.op;const d=await kvGet('salon:data');if(!d){res.status(503).json({ok:false,error:'data'});return;}
    if(op==='public'){res.status(200).json({ok:true,data:publicView(d)});return;}
    if(op==='login'){const P=norm(b.phone);const c=d.customers&&d.customers[P];if(!c){res.status(404).json({ok:false,error:'nocust'});return;}
      if(String(c.password==null?'':c.password)!==String(b.pw||'')){res.status(401).json({ok:false,error:'badpw'});return;}
      const pv=publicView(d);pv.customers={};pv.customers[P]=c;const own=(d.bookings||[]).filter(x=>norm(x.phone)===P);const ids=new Set(own.map(x=>x.id));pv.bookings=pv.bookings.filter(x=>!ids.has(x.id)).concat(own);res.status(200).json({ok:true,data:pv});return;}
    if(op==='register'){const cust=b.customer||{};const P=norm(cust.phone);if(!P||!cust.name){res.status(400).json({ok:false,error:'bad'});return;}
      d.customers=d.customers||{};if(d.customers[P]){res.status(409).json({ok:false,error:'exists'});return;}
      cust.name=String(cust.name).slice(0,60);cust.phone=P;cust.joined=cust.joined||today();cust.notices=cust.notices||[];if(cust.password!=null)cust.password=String(cust.password).slice(0,40);
      const rp=norm(b.referrerPhone);
      await applyData(x=>{x.customers=x.customers||{};if(x.customers[P])return;x.nextCustNo=x.nextCustNo||(Object.keys(x.customers).length+1);cust.no=x.nextCustNo++;x.customers[P]=cust;if(rp&&x.customers[rp]&&rp!==P){x.referrals=x.referrals||[];x.referrals.push({id:'rf'+Date.now(),newPhone:P,newName:cust.name,refPhone:rp,refName:x.customers[rp].name||'',at:Date.now(),status:'pending'});}});
      res.status(200).json({ok:true});return;}
    if(op==='referral'){const P=norm(b.phone),rp=norm(b.referrerPhone);if(!P||!rp||!d.customers||!d.customers[P]||!d.customers[rp]||rp===P){res.status(200).json({ok:false});return;}
      await applyData(x=>{x.referrals=x.referrals||[];if(!x.customers||!x.customers[P]||!x.customers[rp])return;if(!x.referrals.some(r=>r.newPhone===P))x.referrals.push({id:'rf'+Date.now(),newPhone:P,newName:x.customers[P].name||'',refPhone:rp,refName:x.customers[rp].name||'',at:Date.now(),status:'pending'});});res.status(200).json({ok:true});return;}
    if(op==='readNotices'){const P=norm(b.phone);const c=d.customers&&d.customers[P];if(!c||String(c.password==null?'':c.password)!==String(b.pw||'')){res.status(401).json({ok:false});return;}
      await applyData(x=>{const cc=x.customers&&x.customers[P];if(cc)(cc.notices||[]).forEach(n=>n.read=true);});res.status(200).json({ok:true});return;}
    if(op==='board'){const P=norm(b.phone);const post=b.post||{};if(post.text)post.text=String(post.text).slice(0,2000);if(post.name)post.name=String(post.name).slice(0,60);d.boards=d.boards||[];
      if(b.action==='add'){post.owner=P;post.at=post.at||Date.now();if(!post.id)post.id='bd'+Date.now();d.boards.unshift(post);}
      else{const ix=d.boards.findIndex(x=>x.id===(b.id||post.id));if(ix<0){res.status(404).json({ok:false});return;}if(norm(d.boards[ix].owner)!==P&&!b.staffPw){res.status(403).json({ok:false});return;}
        if(b.action==='del'){d.delBoards=d.delBoards||[];const rid=d.boards[ix].id;if(!d.delBoards.includes(rid))d.delBoards.push(rid);d.boards.splice(ix,1);}else d.boards[ix]=Object.assign({},d.boards[ix],post,{owner:d.boards[ix].owner});}
      const snapshotBoards=d.boards,snapshotDel=d.delBoards;await applyData(x=>{x.boards=snapshotBoards;if(snapshotDel)x.delBoards=snapshotDel;});res.status(200).json({ok:true});return;}
    if(op==='order'){const o=b.order||{};if(!o.name||!o.phone||!Array.isArray(o.items)||!o.items.length){res.status(400).json({ok:false});return;}
      const w=(await kvGet('salon:work'))||{};w.orders=w.orders||[];o.id=o.id||('O'+Date.now());o.at=Date.now();o.status='new';w.orders.unshift(o);await kvSet('salon:work',w);res.status(200).json({ok:true,id:o.id});return;}
    res.status(400).json({ok:false,error:'unknown op'});
  }catch(e){res.status(500).json({ok:false,error:String(e&&e.message)});}
};
