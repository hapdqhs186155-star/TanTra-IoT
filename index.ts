import { createClient } from 'npm:@supabase/supabase-js@2';
const slots=['07:00','12:00','16:00'];
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const expected=Deno.env.get('IOT_INGEST_TOKEN');
 if(!expected||req.headers.get('x-device-token')!==expected)return new Response('Unauthorized',{status:401});
 try{
  const b=await req.json();
  if(!b.device_id||typeof b.device_id!=='string'||b.device_id.length>100||!slots.includes(b.slot)||!b.recorded_at||!Number.isFinite(Date.parse(b.recorded_at)))return new Response('Invalid metadata',{status:400});
  const bounds={soil_ph:[0,14],soil_moisture:[0,100],soil_temp:[-20,80],air_humidity:[0,100],air_temp:[-30,70]};
  const payload={device_id:b.device_id,slot:b.slot,recorded_at:b.recorded_at};
  for(const [k,[lo,hi]] of Object.entries(bounds)){if(typeof b[k]!=='number'||!Number.isFinite(b[k])||b[k]<lo||b[k]>hi)return new Response('Invalid '+k,{status:400});payload[k]=b[k]}
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {error}=await db.from('readings').upsert(payload,{onConflict:'device_id,recorded_at'});
  if(error)throw error;
  return Response.json({ok:true});
 }catch(e){console.error(e);return new Response('Invalid payload or server error',{status:400})}
});
