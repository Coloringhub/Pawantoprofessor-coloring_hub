'use strict';
const {output,sb,signedRead}=require('../server/supabase');
module.exports=async(req,res)=>{if(req.method!=='GET')return output(res,405,{error:'Method not allowed'});try{
 const [works,countries,topics,mappings,tagMappings,tags,words,assets]=await Promise.all([
  sb('/rest/v1/studio_worksheets?select=id,title,description,editable_area,preparation_settings,country_id,status,created_at&status=eq.published&order=created_at.desc&limit=120'),
  sb('/rest/v1/studio_countries?select=id,name&is_active=eq.true'),
  sb('/rest/v1/studio_topics?select=id,name&is_active=eq.true'),
  sb('/rest/v1/studio_worksheet_topics?select=worksheet_id,topic_id'),
  sb('/rest/v1/studio_worksheet_tags?select=worksheet_id,tag_id'),
  sb('/rest/v1/studio_tags?select=id,name'),
  sb('/rest/v1/studio_vocabulary?select=worksheet_id,english_word,meaning,example_sentence,sort_order&order=sort_order.asc'),
  sb('/rest/v1/studio_worksheet_assets?select=worksheet_id,asset_kind,bucket_name,storage_path&asset_kind=eq.original')
 ]);
 const cm=new Map(countries.map(c=>[c.id,c.name])),tm=new Map(topics.map(t=>[t.id,t.name])),tagm=new Map(tags.map(t=>[t.id,t.name]));
 const published=await Promise.all(works.map(async w=>{const asset=assets.find(a=>a.worksheet_id===w.id);if(!asset)return null;let image;try{image=await signedRead(asset.bucket_name,asset.storage_path,3600)}catch{return null}const pre=w.preparation_settings||{};return{id:w.id,title:w.title,country:cm.get(w.country_id)||'Other',topic:tm.get(mappings.find(t=>t.worksheet_id===w.id)?.topic_id)||'Culture',description:w.description,image,editable:w.editable_area?.rect||[0,0,1,1],barriers:pre.barriers||[],specialRegions:pre.specialRegions||[],theme:pre.theme||'forest',threshold:pre.threshold??156,dilate:pre.dilate??1,tags:tagMappings.filter(t=>t.worksheet_id===w.id).map(t=>tagm.get(t.tag_id)).filter(Boolean),vocabulary:words.filter(t=>t.worksheet_id===w.id).map(t=>[t.english_word,t.meaning||'',t.example_sentence||''])}}));
 res.setHeader('Cache-Control','public,max-age=60,s-maxage=60');return res.status(200).json({worksheets:published.filter(Boolean),countries:countries.map(c=>c.name),topics:topics.map(t=>t.name)})
 }catch(err){return output(res,503,{error:'Catalog currently unavailable: '+err.message})}}
