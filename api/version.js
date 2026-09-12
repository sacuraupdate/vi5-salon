// 配信中の index.html のバージョンを返す（古い端末に更新を促すため）
const fs=require('fs'),path=require('path');let cached=null;
module.exports=(req,res)=>{res.setHeader('Cache-Control','no-store');try{if(!cached){const h=fs.readFileSync(path.join(process.cwd(),'index.html'),'utf8');const m=h.match(/APP_REV='([^']+)'/);cached=m?m[1]:'unknown';}}catch(e){cached=cached||'unknown';}res.status(200).json({ok:true,rev:cached});};
