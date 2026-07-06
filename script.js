/* =========================================================================
   Delhi City Logistics Agentic Twin — Disrupt → Correct → Normal
   + Hub Addition + City Addition

   This version converts the original national corridor twin into a Delhi NCR
   city-wide logistics twin. It preserves the same controls and narration flow,
   but all routes, hubs, disruptions, corrections, dashboards, and city expansion
   scenarios are now scoped to Delhi.
   ======================================================================= */

/* -------------------- tiny debug pill -------------------- */
let __DBG=null;
function debug(msg){
  if(!__DBG){
    __DBG=document.createElement("div");
    __DBG.style.cssText="position:fixed;left:8px;bottom:8px;z-index:9999;background:rgba(0,0,0,.55);color:#eaf1f7;font:12px system-ui;padding:6px 8px;border-radius:6px;pointer-events:none";
    document.body.appendChild(__DBG);
  }
  __DBG.textContent=msg||"";
}
window.addEventListener("error",(e)=>debug(`Error: ${e.message||e}`));

/* -------------------- config -------------------- */
const STYLE_URL="style.json";
const MAP_INIT={center:[77.2190,28.6250],zoom:10.2,minZoom:8,maxZoom:15};
const WAREHOUSE_ICON_SRC="warehouse_iso.png";
const HUB_ID="H_ITO";
const CITY_HUB_ID="H_DWK";
const DEFAULT_CAPACITY_UNITS=10;
const DEFAULT_SPEED_KMPH=28;

/* -------------------- Delhi city anchors -------------------- */
const CITY={
  WH1:{name:"WH1 — West Gateway DC / Kapashera",       lat:28.5304, lon:77.0817},
  WH2:{name:"WH2 — North Fulfilment Hub / Narela",     lat:28.8527, lon:77.0924},
  WH3:{name:"WH3 — East Cross-Dock / Ghazipur",        lat:28.6296, lon:77.3164},
  WH4:{name:"WH4 — South Micro-Hub / Okhla",          lat:28.5355, lon:77.2745},
  WH5:{name:"WH5 — Central Sort Centre / Connaught Place", lat:28.6315, lon:77.2167},
  WH6:{name:"WH6 — Noida Last-Mile Pod / Sector 62",  lat:28.6261, lon:77.3668},
  WH7:{name:"WH7 — Gurugram Pod / Cyber City",        lat:28.4949, lon:77.0891}
};
const HUB={
  H_ITO:{name:"Hub — ITO / Pragati Maidan Urban Consolidation", lat:28.6236, lon:77.2427}
};

/* ---- City Addition anchors: Delhi micro-zones + proposed Dwarka hub ---- */
const CITY_ADD={
  Z_DWK:{ name:"Dwarka Sector 21",     lat:28.5523, lon:77.0584 },
  Z_PLM:{ name:"Palam / Aerocity",     lat:28.5562, lon:77.1000 },
  Z_JNP:{ name:"Janakpuri",            lat:28.6219, lon:77.0878 },
  Z_RHN:{ name:"Rohini Sector 18",     lat:28.7383, lon:77.1390 },
  Z_CHN:{ name:"Chandni Chowk",        lat:28.6506, lon:77.2303 },
  Z_VKJ:{ name:"Vasant Kunj",          lat:28.5290, lon:77.1550 }
};
const CITY_HUB={
  H_DWK:{ name:"Hub — Dwarka West Micro-Fulfilment", lat:28.5883, lon:77.0700 }
};

/* -------------------- route polylines (lat, lon) -------------------- */
const RP={
  // Delhi NCR base corridors
  "WH1-WH5":[[28.5304,77.0817],[28.5650,77.1300],[28.5900,77.1650],[28.6130,77.1980],[28.6315,77.2167]],
  "WH1-WH2":[[28.5304,77.0817],[28.6100,77.0700],[28.7000,77.0900],[28.7900,77.0950],[28.8527,77.0924]],
  "WH1-WH4":[[28.5304,77.0817],[28.5450,77.1400],[28.5450,77.2000],[28.5355,77.2745]],
  "WH1-WH7":[[28.5304,77.0817],[28.5150,77.0825],[28.5025,77.0875],[28.4949,77.0891]],
  "WH2-WH5":[[28.8527,77.0924],[28.7770,77.1300],[28.7200,77.1700],[28.6760,77.2010],[28.6315,77.2167]],
  "WH2-WH3":[[28.8527,77.0924],[28.7900,77.1750],[28.7350,77.2400],[28.6900,77.2880],[28.6296,77.3164]],
  "WH3-WH5":[[28.6296,77.3164],[28.6265,77.2850],[28.6275,77.2600],[28.6315,77.2167]],
  "WH3-WH6":[[28.6296,77.3164],[28.6260,77.3350],[28.6261,77.3668]],
  "WH4-WH5":[[28.5355,77.2745],[28.5600,77.2600],[28.5900,77.2450],[28.6150,77.2280],[28.6315,77.2167]],
  "WH4-WH6":[[28.5355,77.2745],[28.5550,77.3000],[28.5850,77.3350],[28.6261,77.3668]],
  "WH4-WH7":[[28.5355,77.2745],[28.5150,77.2300],[28.5000,77.1750],[28.4949,77.0891]],
  "WH5-WH6":[[28.6315,77.2167],[28.6275,77.2600],[28.6270,77.3150],[28.6261,77.3668]],
  "WH5-WH7":[[28.6315,77.2167],[28.6000,77.1800],[28.5650,77.1350],[28.5250,77.0950],[28.4949,77.0891]],
  "WH3-WH4":[[28.6296,77.3164],[28.5900,77.3100],[28.5600,77.2950],[28.5355,77.2745]],

  // ITO / Pragati Maidan consolidation hub spokes (shown only in Hub Addition)
  "WH1-H_ITO":[[28.5304,77.0817],[28.5600,77.1450],[28.5950,77.2050],[28.6236,77.2427]],
  "WH2-H_ITO":[[28.8527,77.0924],[28.7900,77.1550],[28.7200,77.2050],[28.6236,77.2427]],
  "WH3-H_ITO":[[28.6296,77.3164],[28.6270,77.2850],[28.6236,77.2427]],
  "WH4-H_ITO":[[28.5355,77.2745],[28.5700,77.2600],[28.6000,77.2500],[28.6236,77.2427]],
  "WH5-H_ITO":[[28.6315,77.2167],[28.6285,77.2300],[28.6236,77.2427]],
  "WH6-H_ITO":[[28.6261,77.3668],[28.6265,77.3150],[28.6250,77.2750],[28.6236,77.2427]],
  "WH7-H_ITO":[[28.4949,77.0891],[28.5250,77.1300],[28.5700,77.1900],[28.6236,77.2427]],

  // City Addition baseline: existing central sort → new Delhi micro-zones
  "WH5-Z_DWK":[[28.6315,77.2167],[28.6100,77.1750],[28.5850,77.1100],[28.5523,77.0584]],
  "WH5-Z_PLM":[[28.6315,77.2167],[28.6100,77.1800],[28.5850,77.1350],[28.5562,77.1000]],
  "WH5-Z_JNP":[[28.6315,77.2167],[28.6250,77.1700],[28.6250,77.1250],[28.6219,77.0878]],
  "WH5-Z_RHN":[[28.6315,77.2167],[28.6700,77.2000],[28.7050,77.1650],[28.7383,77.1390]],
  "WH5-Z_CHN":[[28.6315,77.2167],[28.6400,77.2250],[28.6506,77.2303]],
  "WH5-Z_VKJ":[[28.6315,77.2167],[28.5950,77.1850],[28.5600,77.1650],[28.5290,77.1550]],

  // City Addition proposal: West DC feeds Dwarka micro hub, then short fan-out runs
  "WH1-H_DWK":[[28.5304,77.0817],[28.5550,77.0780],[28.5883,77.0700]],
  "H_DWK-Z_DWK":[[28.5883,77.0700],[28.5700,77.0640],[28.5523,77.0584]],
  "H_DWK-Z_PLM":[[28.5883,77.0700],[28.5750,77.0870],[28.5562,77.1000]],
  "H_DWK-Z_JNP":[[28.5883,77.0700],[28.6050,77.0780],[28.6219,77.0878]],
  "H_DWK-Z_VKJ":[[28.5883,77.0700],[28.5600,77.1000],[28.5290,77.1550]],
  "WH5-Z_RHN-PROPOSAL":[[28.6315,77.2167],[28.6700,77.2000],[28.7050,77.1650],[28.7383,77.1390]],
  "WH5-Z_CHN-PROPOSAL":[[28.6315,77.2167],[28.6400,77.2250],[28.6506,77.2303]]
};

const keyFor=(a,b)=>`${a}-${b}`;
const toLonLat=ll=>ll.map(p=>[p[1],p[0]]);
function getAnchor(id){ return CITY[id] || HUB[id] || CITY_ADD[id] || CITY_HUB[id]; }
function getRoadLatLon(a,b){
  const k1=keyFor(a,b), k2=keyFor(b,a);
  if(RP[k1]) return RP[k1];
  if(RP[k2]) return [...RP[k2]].reverse();
  const ca=getAnchor(a)||{lat:28.62,lon:77.22};
  const cb=getAnchor(b)||{lat:28.62,lon:77.22};
  return [[ca.lat,ca.lon],[cb.lat,cb.lon]];
}
function expandIDsToLatLon(ids){
  const out=[];
  for(let i=0;i<ids.length-1;i++){
    const seg=getRoadLatLon(ids[i],ids[i+1]);
    if(i>0) seg.shift();
    out.push(...seg);
  }
  return out;
}
function networkGeoJSON(includeHub){
  const keys=Object.keys(RP).filter(k=>{
    const isCoreHub = k.includes(HUB_ID);
    const isCityHub = k.includes(CITY_HUB_ID);
    const isCityAdd = /Z_[A-Z0-9]+/.test(k);
    if(isCoreHub && !includeHub) return false;
    if(isCityHub || isCityAdd) return false;
    return true;
  });
  const features=keys.map(k=>({type:"Feature",properties:{id:k},geometry:{type:"LineString",coordinates:toLonLat(RP[k])}}));

  if (SHOW_CITY_ADD && !SHOW_CITY_HUB) {
    for (const id of Object.keys(CITY_ADD)) {
      const k = `WH5-${id}`;
      const coords = RP[k] ? RP[k] : getRoadLatLon("WH5", id);
      features.push({ type:"Feature", properties:{id:k}, geometry:{type:"LineString",coordinates:toLonLat(coords)} });
    }
  } else if (SHOW_CITY_ADD && SHOW_CITY_HUB) {
    features.push({ type:"Feature", properties:{id:"WH1-H_DWK"}, geometry:{type:"LineString",coordinates:toLonLat(getRoadLatLon("WH1","H_DWK"))} });
    for (const id of ["Z_DWK","Z_PLM","Z_JNP","Z_VKJ"]) {
      const k = `H_DWK-${id}`;
      features.push({ type:"Feature", properties:{id:k}, geometry:{type:"LineString",coordinates:toLonLat(getRoadLatLon("H_DWK", id))} });
    }
    features.push({ type:"Feature", properties:{id:"WH5-Z_RHN"}, geometry:{type:"LineString",coordinates:toLonLat(RP["WH5-Z_RHN-PROPOSAL"])} });
    features.push({ type:"Feature", properties:{id:"WH5-Z_CHN"}, geometry:{type:"LineString",coordinates:toLonLat(RP["WH5-Z_CHN-PROPOSAL"])} });
  }
  return {type:"FeatureCollection",features};
}

/* -------------------- scenarios -------------------- */
let SCN_BEFORE=null, SCN_AFTER=null, SCN_HUB=null;
let SCN_CITY_BASE=null, SCN_CITY_AFTER=null;
const DEFAULT_BEFORE={
  warehouses:Object.keys(CITY).map(id=>({id,location:CITY[id].name.split("—")[1].trim(),inventory:500})),
  trucks:[
    {id:"T1", origin:"WH1", destination:"WH5", status:"On-Time", delay_hours:0, units:4, speed_kmph:28},
    {id:"T2", origin:"WH2", destination:"WH3", status:"On-Time", delay_hours:0, units:5, speed_kmph:30},
    {id:"T3", origin:"WH4", destination:"WH6", status:"On-Time", delay_hours:0, units:4, speed_kmph:28}
  ],
  policies:{ capacity_units:10, default_speed_kmph:28, use_hub:false }
};

/* -------------------- Delhi disruption steps -------------------- */
const STEPS=[
  {id:"D1",route:["WH2","WH3"],reroute:[["WH2","WH5"],["WH5","WH3"]],
   cause:["Disruption one.","Outer Ring / Signature Bridge movement between Narela and Ghazipur is blocked by a heavy-vehicle incident.","North-to-East city freight is safely paused before the choke point.","Click Correct to apply the AI city reroute."],
   fix:["AI has corrected the disruption.","Loads are diverted Narela → Connaught Place sort → Ghazipur, keeping the eastern cross-dock supplied.","Green links show the safe intra-city detour. North-East Delhi flows are resuming."]},
  {id:"D2",route:["WH1","WH5"],reroute:[["WH1","WH4"],["WH4","WH5"]],
   cause:["Disruption two.","Dhaula Kuan / Airport Road is saturated, slowing Kapashera-to-Central transfers.","West Gateway trucks are held to prevent bunching near the airport belt.","Click Correct to route through the south corridor."],
   fix:["AI has corrected the disruption.","Kapashera loads now move via Okhla, then into the Central Sort Centre using a lower-congestion south arc.","Green segments confirm a stable alternative path with reduced queue risk."]},
  {id:"D3",route:["WH3","WH6"],reroute:[["WH3","WH4"],["WH4","WH6"]],
   cause:["Disruption three.","Akshardham / DND access toward Noida is constrained by an expressway pile-up.","East Delhi to Noida last-mile movements are paused.","Click Correct to use the Kalindi Kunj / Okhla bridge-back path."],
   fix:["AI has corrected the disruption.","The route switches Ghazipur → Okhla → Noida Sector 62 to protect the Noida delivery wave.","The green path shows the revised bridge strategy and outbound trucks restart."]},
  {id:"D4",route:["WH4","WH5"],reroute:[["WH4","WH1"],["WH1","WH5"]],
   cause:["Disruption four.","Mathura Road / Pragati Maidan inflow is constrained during an event window.","South-to-Central replenishment is paused to avoid holding inventory in traffic.","Click Correct to rebalance through the west arc."],
   fix:["AI has corrected the disruption.","Okhla inventory is shifted via Kapashera and then into the Central Sort Centre once capacity opens.","Green links show the west-arc correction now active."]},
  {id:"D5",route:["WH1","WH7"],reroute:[["WH1","WH4"],["WH4","WH7"]],
   cause:["Final disruption.","Delhi–Gurugram border queues are delaying Cyber City pod replenishment.","Kapashera-to-Gurugram trucks are paused for a controlled release.","Click Correct to redirect through the South Delhi corridor."],
   fix:["AI has corrected the disruption.","Cyber City replenishment now moves Kapashera → Okhla → Gurugram, bypassing the border bottleneck.","Green links confirm the recovery path and the Gurugram pod is back in flow."]}
];

/* -------------------- Map setup -------------------- */
const map=new maplibregl.Map({
  container:"map", style:STYLE_URL,
  center:MAP_INIT.center, zoom:MAP_INIT.zoom,
  minZoom:MAP_INIT.minZoom, maxZoom:MAP_INIT.maxZoom,
  attributionControl:true
});
map.addControl(new maplibregl.NavigationControl({visualizePitch:false}),"top-left");

/* -------------------- overlay canvas for trucks & labels -------------------- */
let overlay=null, ctx=null;
function ensureCanvas(){
  overlay=document.getElementById("trucksCanvas");
  if(!overlay){
    overlay=document.createElement("canvas");
    overlay.id="trucksCanvas";
    overlay.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:2;";
    map.getContainer().appendChild(overlay);
  }
  ctx=overlay.getContext("2d");
  resizeCanvas();
}
function resizeCanvas(){
  if(!overlay) return;
  const base=map.getCanvas(), dpr=window.devicePixelRatio||1;
  overlay.width=base.clientWidth*dpr; overlay.height=base.clientHeight*dpr;
  overlay.style.width=base.clientWidth+"px"; overlay.style.height=base.clientHeight+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener("resize",resizeCanvas);

/* -------------------- base network + highlight layers -------------------- */
let SHOW_HUB=false;
let SHOW_CITY_ADD=false;
let SHOW_CITY_HUB=false;

function ensureRoadLayers(){
  const net=networkGeoJSON(SHOW_HUB);
  if(!map.getSource("routes")) map.addSource("routes",{type:"geojson",data:net});
  else map.getSource("routes").setData(net);

  if(!map.getLayer("routes-halo")){
    map.addLayer({id:"routes-halo",type:"line",source:"routes",
      paint:{"line-color":"#9fb4ff","line-opacity":0.24,"line-width":8.5},
      layout:{"line-cap":"round","line-join":"round"}});
  }
  if(!map.getLayer("routes-base")){
    map.addLayer({id:"routes-base",type:"line",source:"routes",
      paint:{"line-color":"#ffffff","line-opacity":0.92,"line-width":3.2},
      layout:{"line-cap":"round","line-join":"round"}});
  }

  if(!map.getSource("alert")) map.addSource("alert",{type:"geojson",data:{type:"FeatureCollection",features:[]}});
  if(!map.getLayer("alert-red")){
    map.addLayer({id:"alert-red",type:"line",source:"alert",
      paint:{"line-color":"#ff4d4d","line-opacity":0.98,"line-width":5.4},
      layout:{"line-cap":"round","line-join":"round"}});
  }

  if(!map.getSource("fix")) map.addSource("fix",{type:"geojson",data:{type:"FeatureCollection",features:[]}});
  if(!map.getLayer("fix-green")){
    map.addLayer({id:"fix-green",type:"line",source:"fix",
      paint:{"line-color":"#00d08a","line-opacity":0.98,"line-width":6.2},
      layout:{"line-cap":"round","line-join":"round"}});
  }
  try { map.moveLayer("fix-green"); } catch(e) {}
}
function refreshRoadNetwork(){
  const src=map.getSource("routes");
  if(src) src.setData(networkGeoJSON(SHOW_HUB));
}
function featureForRoute(ids){
  return {type:"Feature",properties:{id:ids.join("-")},geometry:{type:"LineString",coordinates:toLonLat(expandIDsToLatLon(ids))}};
}
function setSourceFeatures(srcId,features){
  const src=map.getSource(srcId); if(!src) return;
  src.setData({type:"FeatureCollection",features:features||[]});
}

/* -------------------- warehouse icons + labels -------------------- */
const WH_IMG=new Image(); let WH_READY=false;
WH_IMG.onload=()=>{WH_READY=true;}; WH_IMG.onerror=()=>{WH_READY=false; debug("warehouse_iso.png missing at root");};
WH_IMG.src=`${WAREHOUSE_ICON_SRC}?v=${Date.now()}`;
const WH_BASE=28, WH_MIN=16, WH_MAX=38;
const sizeByZoom=z=>Math.max(WH_MIN,Math.min(WH_MAX, WH_BASE*(0.9+(z-10)*0.12)));
function drawLabelBox(text, p, z){
  const S=sizeByZoom(z);
  const label=text, pad=6, h=17, w=ctx.measureText(label).width+pad*2, py=p.y+S/2+13;
  ctx.fillStyle="rgba(10,10,12,.80)"; ctx.fillRect(p.x-w/2,py-h/2,w,h);
  ctx.fillStyle="#e8eef2"; ctx.textBaseline="middle"; ctx.fillText(label,p.x-w/2+pad,py);
}
function drawWarehouses(){
  if(!ctx) return; const z=map.getZoom();
  ctx.font="bold 11px system-ui, Segoe UI, Roboto, sans-serif";
  for(const id of Object.keys(CITY)){
    const c=CITY[id], p=map.project({lng:c.lon,lat:c.lat}), S=sizeByZoom(z);
    if(WH_READY) ctx.drawImage(WH_IMG, p.x-S/2, p.y-S/2, S, S);
    drawLabelBox(c.name, p, z);
  }
  if(SHOW_HUB){
    const c=HUB[HUB_ID], p=map.project({lng:c.lon,lat:c.lat}), S=sizeByZoom(z);
    if(WH_READY) ctx.drawImage(WH_IMG, p.x-S/2, p.y-S/2, S, S);
    drawLabelBox(c.name, p, z);
  }
  if(SHOW_CITY_ADD){
    for(const id of Object.keys(CITY_ADD)){
      const c=CITY_ADD[id], p=map.project({lng:c.lon,lat:c.lat}), S=sizeByZoom(z)*0.82;
      if(WH_READY) ctx.drawImage(WH_IMG, p.x-S/2, p.y-S/2, S, S);
    }
  }
  if(SHOW_CITY_HUB){
    const c=CITY_HUB[CITY_HUB_ID], p=map.project({lng:c.lon,lat:c.lat}), S=sizeByZoom(z);
    if(WH_READY) ctx.drawImage(WH_IMG, p.x-S/2, p.y-S/2, S, S);
    drawLabelBox(c.name, p, z);
  }
}

/* -------------------- trucks -------------------- */
const trucks=[]; const truckNumberById=new Map();
const SPEED_MULTIPLIER=12.0, MIN_GAP_PX=50, CROSS_GAP_PX=34, LANES_PER_ROUTE=3, LANE_WIDTH_PX=6.5, MIN_STEP=0.010;
function defaultPathIDs(o,d){
  const k1=keyFor(o,d), k2=keyFor(d,o);
  if(RP[k1]||RP[k2]) return [o,d];
  if(getAnchor(o) && getAnchor(d)) return [o,d];
  return (o!=="WH5"&&d!=="WH5") ? [o,"WH5",d] : [o,d];
}
function hashStr(s){ let h=0; for(let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0; } return Math.abs(h); }
function segProject(pt){ return map.project({lng:pt[1],lat:pt[0]}); }
function spawnTruck(tr, idx){
  const delayed=(tr.status||"").toLowerCase()==="delayed" || (tr.delay_hours||0)>0;
  const ids=tr.path || defaultPathIDs(tr.origin,tr.destination);
  const latlon=expandIDsToLatLon(ids); if(latlon.length<2) return;
  const startT=Math.random()*0.55;
  const base=delayed?2.2:3.4;
  const speed=base*(0.92+Math.random()*0.16);
  const startDelay=250+Math.random()*700;
  const laneIndex=((hashStr(tr.id)%LANES_PER_ROUTE)+LANES_PER_ROUTE)%LANES_PER_ROUTE;
  trucks.push({id:tr.id, origin:tr.origin, dest:tr.destination, latlon, seg:0, t:startT, dir:1, speed, delayed, laneIndex, startAt:performance.now()+startDelay, paused:false, savedPath:null});
  truckNumberById.set(tr.id, idx+1);
}
function roundRectPath(g,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);
  g.beginPath();
  g.moveTo(x+rr,y); g.arcTo(x+w,y,x+w,y+h,rr); g.arcTo(x+w,y+h,x,y+h,rr); g.arcTo(x,y+h,x,y,rr); g.arcTo(x,y,x+w,y,rr); g.closePath();
}
function drawVectorTruck(g,w,h,delayed,number){
  const trW=w*0.78,trH=h*0.72;
  g.fillStyle="rgba(0,0,0,.25)"; g.beginPath(); g.ellipse(0,trH*0.35,trW*0.9,trH*0.42,0,0,Math.PI*2); g.fill();
  const grad=g.createLinearGradient(-trW/2,0,trW/2,0); grad.addColorStop(0,"#eef2f6"); grad.addColorStop(1,"#cfd7df");
  g.fillStyle=grad; g.strokeStyle="#6f7a86"; g.lineWidth=1.2; roundRectPath(g,-trW/2,-trH/2,trW,trH,3); g.fill(); g.stroke();
  const cw=w*0.34,ch=h*0.72,cg=g.createLinearGradient(-cw/2,0,cw/2,0); cg.addColorStop(0,"#b3bcc6"); cg.addColorStop(1,"#9aa5b2");
  g.fillStyle=cg; g.strokeStyle="#5f6771"; roundRectPath(g,-w/2,-ch/2,cw,ch,3); g.fill(); g.stroke();
  g.fillStyle="#26303a"; g.fillRect(-w/2+2,-ch*0.44,cw-4,ch*0.32);
  const R=7; g.fillStyle="#fff"; g.strokeStyle="#20262e"; g.lineWidth=1.2;
  g.beginPath(); g.arc(trW*0.18,-trH*0.2,R,0,Math.PI*2); g.fill(); g.stroke();
  g.fillStyle="#111"; g.font="bold 9px system-ui"; g.textAlign="center"; g.textBaseline="middle";
  g.fillText(String(number), trW*0.18, -trH*0.2);
  g.fillStyle=delayed?"#ff3b30":"#00c853"; g.beginPath(); g.arc(trW*0.32,-trH*0.28,3.2,0,Math.PI*2); g.fill();
}
let __lastTS=performance.now(), __dt=1/60;
function drawFrame(){
  if(!ctx) return;
  ctx.clearRect(0,0,overlay.width,overlay.height);
  const now=performance.now();
  for(const T of trucks){
    if(now<T.startAt) continue;
    const a=T.latlon[T.seg], b=T.latlon[T.seg+T.dir]||a;
    const aP=segProject(a), bP=segProject(b);
    const segLenPx=Math.max(1,Math.hypot(bP.x-aP.x,bP.y-aP.y));
    if(!T.paused){
      let pxPerSec=SPEED_MULTIPLIER*T.speed*(0.9+(map.getZoom()-10)*0.12);
      let step=(pxPerSec*__dt)/segLenPx;
      const myProg=T.t*segLenPx; let minLead=Infinity;
      for(const O of trucks){
        if(O===T||now<O.startAt) continue;
        if(O.latlon[O.seg]===T.latlon[T.seg] && O.latlon[O.seg+O.dir]===T.latlon[T.seg+T.dir] && O.dir===T.dir){
          const a2=segProject(O.latlon[O.seg]), b2=segProject(O.latlon[O.seg+O.dir]);
          const seg2=Math.max(1,Math.hypot(b2.x-a2.x,b2.y-a2.y));
          const oProg=O.t*seg2; if(oProg>myProg) minLead=Math.min(minLead,oProg-myProg);
        }
      }
      if(isFinite(minLead)&&minLead<MIN_GAP_PX) step*=Math.max(0.25,(minLead/MIN_GAP_PX)*0.7);
      const x1=aP.x+(bP.x-aP.x)*T.t, y1=aP.y+(bP.y-aP.y)*T.t; let nearest=Infinity;
      for(const O of trucks){ if(O===T||now<O.startAt) continue;
        const aO=segProject(O.latlon[O.seg]), bO=segProject(O.latlon[O.seg+O.dir]);
        const xO=aO.x+(bO.x-aO.x)*O.t, yO=aO.y+(bO.y-aO.y)*O.t;
        nearest=Math.min(nearest,Math.hypot(xO-x1,yO-y1));
      }
      if(isFinite(nearest)&&nearest<CROSS_GAP_PX) step*=Math.max(0.30,(nearest/CROSS_GAP_PX)*0.6);
      step=Math.max(step,MIN_STEP);
      T.t+=step;
      if(T.t>=1){ T.seg+=T.dir; T.t-=1; if(T.seg<=0){T.seg=0;T.dir=1;} else if(T.seg>=T.latlon.length-1){T.seg=T.latlon.length-1;T.dir=-1;} }
    }
    const theta=Math.atan2(bP.y-aP.y,bP.x-aP.x);
    const nx=-(bP.y-aP.y), ny=(bP.x-aP.x), nL=Math.max(1,Math.hypot(nx,ny));
    const laneZero=T.laneIndex-(LANES_PER_ROUTE-1)/2, off=laneZero*LANE_WIDTH_PX;
    const x=aP.x+(bP.x-aP.x)*T.t+(nx/nL)*off, y=aP.y+(bP.y-aP.y)*T.t+(ny/nL)*off;
    const z=map.getZoom(), scale=1.0+(z-10)*0.10, w=30*scale, h=15*scale;
    const num=truckNumberById.get(T.id)||0;
    ctx.save(); ctx.translate(x,y); ctx.rotate(theta); drawVectorTruck(ctx,w,h,T.delayed,num); ctx.restore();
  }
  drawWarehouses();
}

/* -------------------- Narration + Chat -------------------- */
const synth=window.speechSynthesis; let VOICE=null;
function pickVoice(){
  const vs=synth?.getVoices?.()||[];
  const prefs=[/en-IN/i,/English.+India/i,/Neural|Natural/i,/Microsoft|Google/i,/en-GB/i,/en-US/i];
  for(const p of prefs){ const v=vs.find(v=>p.test(v.name)||p.test(v.lang)); if(v) return v; }
  return vs[0]||null;
}
VOICE=pickVoice(); if(!VOICE&&synth) synth.onvoiceschanged=()=>{VOICE=pickVoice();};
const ChatUI = (() => {
  const msgs = document.getElementById('msgs');
  const input = document.getElementById('chatInput');
  const send = document.getElementById('chatSend');
  const muteBtn = document.getElementById('muteBtn');
  const clearBtn = document.getElementById('clearBtn');
  let onCommand = null;
  let muted = false;
  function stamp() { const d = new Date(); return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
  function pushBubble(text, kind='system') {
    const div = document.createElement('div');
    div.className = `msg ${kind}`;
    div.innerHTML = `${escapeHTML(text)}<small>${stamp()}</small>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight + 200;
  }
  function handleSend(){
    const raw = (input.value||'').trim();
    if(!raw) return;
    pushBubble(raw, 'user'); input.value = '';
    const cmd = raw.toLowerCase();
    if(onCommand){
      if(cmd === 'disrupt' || cmd === 'correct' || cmd === 'normal' ||
         cmd === 'hub' || cmd === 'add hub' || cmd === 'hub addition' || cmd === 'urban hub' || cmd === 'ito hub' ||
         cmd === 'city' || cmd === 'city addition' || cmd === 'dwarka hub' || cmd === 'micro zones'){
        onCommand(cmd);
      } else {
        pushBubble('Valid commands: Disrupt, Correct, Normal, Hub Addition, City Addition.', 'system');
      }
    }
  }
  send.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ handleSend(); }});
  muteBtn.addEventListener('click', ()=>{ muted = !muted; muteBtn.setAttribute('aria-pressed', String(muted)); muteBtn.textContent = muted ? '🔇 Unmute' : '🔊 Mute'; Narrator.setMuted(muted); });
  clearBtn.addEventListener('click', ()=>{ msgs.innerHTML = ''; });
  document.addEventListener('keydown', (e)=>{ if((e.ctrlKey||e.metaKey) && (e.key==='m' || e.key==='M')){ e.preventDefault(); muteBtn.click(); } });
  return { appendSystem:(t)=>pushBubble(t,'system'), appendUser:(t)=>pushBubble(t,'user'), onCommand:(fn)=>{ onCommand = fn; }, setMuted:(val)=>{ muted=!!val; muteBtn.setAttribute('aria-pressed', String(muted)); muteBtn.textContent = muted ? '🔇 Unmute' : '🔊 Mute'; } };
})();
const Narrator = (() => {
  let muted = false;
  let currentRun = 0;
  const PASS_IDLE_GAP_MS = 700;
  function newRunToken(){ currentRun += 1; return currentRun; }
  function clearTTS(){ try{ synth?.cancel?.(); }catch(e){} }
  function wait(ms){ return new Promise(res=>setTimeout(res, ms)); }
  function speakOnceAsync(text, rate=0.95, runToken){
    return new Promise((resolve) => {
      if(muted || !synth || !text || runToken!==currentRun){ return resolve(); }
      const u = new SpeechSynthesisUtterance(String(text));
      if(VOICE) u.voice = VOICE;
      u.rate = rate; u.pitch = 1.0; u.volume = 1.0;
      u.onend = () => resolve(); u.onerror = () => resolve(); synth.speak(u);
    });
  }
  async function queueOnce(lines, gap=950, rate=0.95, runToken){
    for(const line of lines){
      if(runToken!==currentRun) return;
      ChatUI.appendSystem(line);
      await speakOnceAsync(line, rate, runToken);
      if(runToken!==currentRun) return;
      if(gap>0) await wait(gap);
    }
  }
  return {
    sayLinesTwice: async (lines, gap=950, rate=0.95)=>{ const run = newRunToken(); clearTTS(); await queueOnce(lines, gap, rate, run); if(run!==currentRun) return; await wait(PASS_IDLE_GAP_MS); if(run!==currentRun) return; await queueOnce(lines, gap, rate, run); },
    sayLinesOnce: async (lines, gap=950, rate=0.95) => { const run = newRunToken(); clearTTS(); await queueOnce(lines, gap, rate, run); },
    sayOnce: (line)=>{ const run = newRunToken(); clearTTS(); ChatUI.appendSystem(line); speakOnceAsync(line, 0.95, run); },
    clear: ()=>{ newRunToken(); clearTTS(); },
    setMuted: (m)=>{ muted = !!m; if(muted){ newRunToken(); clearTTS(); } }
  };
})();

/* -------------------- stats table helpers -------------------- */
const baseStats={}; let beforeStats=null; let afterStats=null; let hubStats=null;
let cityBaseStats=null; let cityAfterStats=null;
function computeStatsFromScenario(scn){
  const inC={}, outC={};
  (scn.trucks||[]).forEach(t=>{ outC[t.origin]=(outC[t.origin]||0)+1; inC[t.destination]=(inC[t.destination]||0)+1; });
  const stats={};
  (scn.warehouses||[]).forEach(w=>{ stats[w.id]={ inv:w.inventory??0, in:inC[w.id]||0, out:outC[w.id]||0 }; });
  return stats;
}
function renderStatsTable(pred, ids=null){
  const tbody=document.querySelector("#statsTable tbody"); if(!tbody) return; tbody.innerHTML="";
  const list = ids && ids.length ? ids : Object.keys(CITY);
  for(const id of list){
    const label = getAnchor(id)?.name || id;
    const s=pred?.[id]||{inv:"-",in:0,out:0};
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${label}</td><td>${s.inv}</td><td class="pos">+${s.in}</td><td class="neg">-${s.out}</td>`;
    tbody.appendChild(tr);
  }
}

/* -------------------- metrics -------------------- */
function haversineKm(a,b){
  const toRad=v=>v*Math.PI/180, R=6371;
  const dLat=toRad(b[0]-a[0]), dLon=toRad(b[1]-a[1]);
  const lat1=toRad(a[0]), lat2=toRad(b[0]);
  const x=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}
function pathDistanceKm(ids){ const pts=expandIDsToLatLon(ids); let d=0; for(let i=0;i<pts.length-1;i++) d+=haversineKm([pts[i][0],pts[i][1]],[pts[i+1][0],pts[i+1][1]]); return d; }
function truckDistanceKm(tr){ return pathDistanceKm(tr.path || [tr.origin, tr.destination]); }
function truckDriveMin(tr, scn){ const speed = tr.speed_kmph || scn?.policies?.default_speed_kmph || DEFAULT_SPEED_KMPH; const km = truckDistanceKm(tr); return (km / speed) * 60; }
function weightedStats(samples){
  const totalW = samples.reduce((s,x)=>s+(x.w||1),0) || 1;
  const mean = samples.reduce((s,x)=>s+(x.min*(x.w||1)),0)/totalW;
  const arr=[...samples].sort((a,b)=>a.min-b.min); let acc=0, p90T=0; const target=0.9*totalW;
  for(const x of arr){ acc += (x.w||1); if(acc>=target){ p90T=x.min; break; } }
  return { mean, p90:p90T, totalW };
}
function summarizeScenario(scn){
  const cap = scn?.policies?.capacity_units ?? DEFAULT_CAPACITY_UNITS;
  const useHub = !!(scn?.policies?.use_hub);
  const dwell = scn?.policies?.hub_dwell_min ?? 0;
  const batch = scn?.policies?.consolidation_window_min ?? 0;
  const movements = (scn.trucks||[]).length;
  const truckKm = (scn.trucks||[]).reduce((s,t)=>s+truckDistanceKm(t),0);
  const samples=[];
  for(const t of (scn.trucks||[])) samples.push({min:truckDriveMin(t, scn)+(useHub?dwell+batch:0), w:t.units||1});
  const {mean, p90, totalW} = weightedStats(samples.length? samples : [{min:0,w:1}]);
  const util = (scn.trucks||[]).reduce((s,t)=>s+((t.units||0)/cap),0) / Math.max(1,(scn.trucks||[]).length);
  return { movements, truckKm, meanEta:Math.round(mean), p90Eta:Math.round(p90), utilization:Math.round(util*100), totalUnits:totalW };
}
const fmtInt = (n)=>Math.round(n).toLocaleString("en-US");
const roundKm = (km)=>Math.round(km*10)/10;
const fmtKm = (km)=>`${fmtInt(roundKm(km))} km`;
const toHours1 = (min)=> (Math.round((min/60)*10)/10);
const fmtMinutes = (min)=> min>=60 ? `${toHours1(min)} hours` : `${Math.round(min)} minutes`;
function pctDeltaHuman(base, now){ if(base===0) return {dir:"changed", pct:0}; const d = Math.round(Math.abs((now-base)/base*100)); const dir = (now<base) ? "decreased" : "increased"; return {dir, pct:d}; }
function ppDeltaHuman(basePct, nowPct){ const d = Math.round(nowPct - basePct); const dir = (d<0) ? "decreased" : "increased"; return {dir, pp:Math.abs(d)}; }

/* -------------------- pause / reroute control -------------------- */
function odMatch(ids,o,d){ const a=ids[0], b=ids[ids.length-1]; return (a===o&&b===d)||(a===d&&b===o); }
function setTruckPath(T,latlon,toMid=false){ if(!latlon||latlon.length<2) return; T.latlon=latlon; T.seg=0; T.dir=1; T.t=toMid?0.5:0.0; }
function pauseAllOnRoute(step){
  const ids=step.route; const latlon=expandIDsToLatLon(ids);
  for(const T of trucks){
    const baseIDs=defaultPathIDs(T.origin,T.dest);
    if(odMatch(baseIDs, ids[0], ids[1])){
      if(!T.savedPath) T.savedPath={ latlon:[...T.latlon], seg:T.seg, t:T.t, dir:T.dir };
      setTruckPath(T, latlon, true); T.paused=true;
    }
  }
}
function reroutePaused(step){
  const full=step.reroute?.length ? expandIDsToLatLon(step.reroute.flat()) : null;
  if(!full) return 0;
  let released=0;
  for(const T of trucks){ if(!T.paused) continue; setTruckPath(T, full, false); T.paused=false; T.savedPath=null; released++; }
  return released;
}

/* -------------------- state machine -------------------- */
let mode="normal"; let currentStepIdx=-1;
function setAlert(ids){ setSourceFeatures("alert",[featureForRoute(ids)]); }
function clearAlert(){ setSourceFeatures("alert",[]); }
function setFix(pairs){ setSourceFeatures("fix",(pairs||[]).map(pair=>featureForRoute(pair))); }
function clearFix(){ setSourceFeatures("fix",[]); }
function activateTrucksFromScenario(scn){ trucks.length=0; truckNumberById.clear(); (scn.trucks||[]).forEach((t,i)=>spawnTruck(t,i)); }
function prefixTruckIds(trucksList, prefix){ return (trucksList||[]).map((t, i)=>({...t, id: `${prefix}${t.id || i}`})); }
function buildCombinedScenario(baseScn, overlayScn, overlayPrefix){
  const base = baseScn || {warehouses:[], trucks:[], policies:{}};
  const over = overlayScn || {warehouses:[], trucks:[], policies:{}};
  return { warehouses: [...(base.warehouses||[]), ...(over.warehouses||[])], trucks: [...(base.trucks||[]), ...prefixTruckIds(over.trucks||[], overlayPrefix||"CITY_")], policies: base.policies || {} };
}

/* -------------------- Disrupt/Correct/Normal -------------------- */
function startDisrupt(){
  if(mode==="disrupt"){ Narrator.sayLinesTwice(["A disruption is already active. Please click Correct to proceed."],900,0.92); return; }
  SHOW_HUB=false; SHOW_CITY_ADD=false; SHOW_CITY_HUB=false; refreshRoadNetwork();
  currentStepIdx = (currentStepIdx + 1) % STEPS.length;
  const step=STEPS[currentStepIdx];
  clearFix(); setAlert(step.route); pauseAllOnRoute(step);
  renderStatsTable(beforeStats);
  Narrator.sayLinesTwice([...step.cause,"Once ready, click Correct to execute the AI recovery plan."], 950, 0.9);
  mode="disrupt";
}
function applyCorrect(){
  if(mode!=="disrupt"){ Narrator.sayLinesTwice(["No active disruption. Click Disrupt first."],800,0.95); return; }
  SHOW_HUB=false; SHOW_CITY_ADD=false; SHOW_CITY_HUB=false; refreshRoadNetwork();
  const step=STEPS[currentStepIdx];
  clearAlert(); setFix(step.reroute); reroutePaused(step); renderStatsTable(afterStats);
  Narrator.sayLinesTwice(step.fix, 950, 0.92);
  mode="fixed";
}
function backToNormal(){
  SHOW_HUB=false; SHOW_CITY_ADD=false; SHOW_CITY_HUB=false; refreshRoadNetwork();
  Narrator.clear(); clearAlert(); clearFix(); activateTrucksFromScenario(SCN_BEFORE); renderStatsTable(beforeStats);
  Narrator.sayLinesTwice(["Returning to normal Delhi city operations. All core corridors are white and flowing."], 900, 0.95);
  mode="normal";
}

/* -------------------- Hub Addition flow -------------------- */
function hubAddition(){
  if(!SCN_HUB){ Narrator.sayLinesTwice(["Hub scenario not found in scenario_after.json under key 'hub'."], 800, 0.95); return; }
  Narrator.clear(); clearAlert(); clearFix();
  SHOW_CITY_ADD=false; SHOW_CITY_HUB=false; SHOW_HUB=true; refreshRoadNetwork();
  activateTrucksFromScenario(SCN_HUB); renderStatsTable(hubStats||beforeStats);
  const baseS = summarizeScenario(SCN_BEFORE);
  const hubS  = summarizeScenario(SCN_HUB);
  const mov = pctDeltaHuman(baseS.movements, hubS.movements);
  const km  = pctDeltaHuman(baseS.truckKm, hubS.truckKm);
  const util= ppDeltaHuman(baseS.utilization, hubS.utilization);
  const lines=[
    "Hub Addition engaged — evaluating ITO / Pragati Maidan as a neutral urban consolidation hub for Delhi.",
    `Truck movements ${mov.dir} by ${mov.pct} percent, from ${fmtInt(baseS.movements)} to ${fmtInt(hubS.movements)} movements.`,
    `City truck-km ${km.dir} by ${km.pct} percent, from ${fmtKm(baseS.truckKm)} to ${fmtKm(hubS.truckKm)}.`,
    `Average vehicle utilization ${util.dir} by ${util.pp} percentage points, from ${baseS.utilization}% to ${hubS.utilization}%.`,
    "The model consolidates fragmented point-to-point trips into controlled spokes, reducing mid-city congestion exposure."
  ];
  Narrator.sayLinesTwice(lines, 850, 0.92); mode="hub";
}

/* -------------------- City Addition flow -------------------- */
async function cityAddition(){
  if(!SCN_CITY_BASE || !SCN_CITY_AFTER){ Narrator.sayLinesOnce(["City Addition data not found. Check city.baseline and city.proposal in the scenario JSON files."], 800, 0.95); return; }
  Narrator.clear(); clearAlert(); clearFix();
  SHOW_HUB=false; SHOW_CITY_HUB=false; SHOW_CITY_ADD=true; refreshRoadNetwork();
  const COMBINED_CITY_BASE = buildCombinedScenario(SCN_BEFORE, SCN_CITY_BASE, "CTYB_");
  activateTrucksFromScenario(COMBINED_CITY_BASE);
  const ADD_IDS = Object.keys(CITY_ADD);
  renderStatsTable(cityBaseStats, ADD_IDS);
  const baseS = summarizeScenario(SCN_CITY_BASE);
  const baselineLines = [
    "City Addition baseline — extending Delhi coverage to Dwarka, Palam / Aerocity, Janakpuri, Rohini, Chandni Chowk and Vasant Kunj.",
    "Baseline design: all new micro-zones are served from the Central Sort Centre, so trucks cross high-density Delhi corridors repeatedly.",
    `Baseline new-zone movements: ${fmtInt(baseS.movements)}.`,
    `Baseline city distance: ${fmtKm(baseS.truckKm)}.`,
    `Average O→D time for new zones: ${fmtMinutes(baseS.meanEta)}.`,
    `P90 ETA for new zones: ${fmtMinutes(baseS.p90Eta)}.`,
    `Average utilization for new-zone vehicles: ${baseS.utilization} percent.`
  ];
  await Narrator.sayLinesOnce(baselineLines, 900, 0.92);

  await new Promise(r=>setTimeout(r, 900));
  SHOW_HUB=false; SHOW_CITY_ADD=true; SHOW_CITY_HUB=true; refreshRoadNetwork();
  const COMBINED_CITY_PROPOSAL = buildCombinedScenario(SCN_BEFORE, SCN_CITY_AFTER, "CTYP_");
  activateTrucksFromScenario(COMBINED_CITY_PROPOSAL);
  renderStatsTable(cityAfterStats, ADD_IDS);
  const afterS = summarizeScenario(SCN_CITY_AFTER);
  const mov = pctDeltaHuman(baseS.movements, afterS.movements);
  const km  = pctDeltaHuman(baseS.truckKm, afterS.truckKm);
  const mean = pctDeltaHuman(baseS.meanEta, afterS.meanEta);
  const p90  = pctDeltaHuman(baseS.p90Eta,  afterS.p90Eta);
  const util = ppDeltaHuman(baseS.utilization, afterS.utilization);
  const proposalLines = [
    "City Addition proposal — add a Dwarka West micro-fulfilment hub and split the new Delhi micro-zones intelligently.",
    "West and south-west demand moves through Dwarka; dense central demand remains on the Central Sort Centre. Existing Delhi core corridors continue moving.",
    `New-zone movements ${mov.dir} by ${mov.pct}% — from ${fmtInt(baseS.movements)} to ${fmtInt(afterS.movements)}.`,
    `Total city truck-km ${km.dir} by ${km.pct}% — from ${fmtKm(baseS.truckKm)} to ${fmtKm(afterS.truckKm)}.`,
    `Average ETA ${mean.dir} by ${Math.round(Math.abs(afterS.meanEta-baseS.meanEta))} minutes — from ${fmtMinutes(baseS.meanEta)} to ${fmtMinutes(afterS.meanEta)}.`,
    `P90 ETA ${p90.dir} by ${Math.round(Math.abs(afterS.p90Eta-baseS.p90Eta))} minutes — from ${fmtMinutes(baseS.p90Eta)} to ${fmtMinutes(afterS.p90Eta)}.`,
    `Average utilization ${util.dir} by ${util.pp} pp — from ${baseS.utilization}% to ${afterS.utilization}%.`
  ];
  await Narrator.sayLinesOnce(proposalLines, 900, 0.92); mode="city";
}

/* -------------------- camera helper -------------------- */
function fitToBoundsOfAnchors(ids){
  const b=new maplibregl.LngLatBounds();
  ids.forEach(id=>{ const a=getAnchor(id); if(a) b.extend([a.lon,a.lat]); });
  if(b.isEmpty()) return;
  map.fitBounds(b,{padding:{top:70,left:70,right:330,bottom:70},duration:800,maxZoom:11.5});
}

/* -------------------- boot -------------------- */
const mapReady=new Promise(res=>map.on("load",res));
(async function start(){
  await mapReady; ensureCanvas(); ensureRoadLayers();
  const ui=document.getElementById("ui")||document.body;
  const btnBefore=document.getElementById("btnBefore");
  const btnAfter=document.getElementById("btnAfter");
  if(btnBefore) btnBefore.textContent="Disrupt"; if(btnAfter) btnAfter.textContent="Correct";
  let btnNormal=document.getElementById("btnNormal");
  if(!btnNormal){ btnNormal=document.createElement("button"); btnNormal.id="btnNormal"; btnNormal.textContent="Normal"; btnNormal.style.marginLeft="8px"; ui.appendChild(btnNormal); }
  let btnHub=document.getElementById("btnHub");
  if(!btnHub){ btnHub=document.createElement("button"); btnHub.id="btnHub"; btnHub.textContent="Hub Addition"; btnHub.style.marginLeft="8px"; ui.appendChild(btnHub); }
  let btnCity=document.getElementById("btnCity");
  if(!btnCity){ btnCity=document.createElement("button"); btnCity.id="btnCity"; btnCity.textContent="City Addition"; btnCity.style.marginLeft="8px"; ui.appendChild(btnCity); }
  if(btnBefore) btnBefore.onclick=()=>startDisrupt(); if(btnAfter) btnAfter.onclick =()=>applyCorrect();
  btnNormal.onclick=()=>backToNormal(); btnHub.onclick=()=>hubAddition(); btnCity.onclick=()=>cityAddition();
  ChatUI.onCommand((cmd)=>{ if(cmd==='disrupt') startDisrupt(); else if(cmd==='correct') applyCorrect(); else if(cmd==='normal') backToNormal(); else if(cmd==='hub' || cmd==='add hub' || cmd==='hub addition' || cmd==='urban hub' || cmd==='ito hub') hubAddition(); else if(cmd==='city' || cmd==='city addition' || cmd==='dwarka hub' || cmd==='micro zones') cityAddition(); });

  const beforeRaw = await fetchOrDefault("scenario_before.json", DEFAULT_BEFORE);
  SCN_BEFORE = beforeRaw;
  const afterRaw  = await fetchOrDefault("scenario_after.json",  DEFAULT_BEFORE);
  SCN_AFTER = { warehouses: afterRaw.warehouses, trucks: afterRaw.trucks, policies: afterRaw.policies||{} };
  SCN_HUB   = afterRaw.hub ? { warehouses: afterRaw.hub.warehouses, trucks: afterRaw.hub.trucks, policies: afterRaw.hub.policies } : null;
  SCN_CITY_BASE  = beforeRaw.city?.baseline || null;
  SCN_CITY_AFTER = afterRaw.city?.proposal || null;
  beforeStats = computeStatsFromScenario(SCN_BEFORE); afterStats = computeStatsFromScenario(SCN_AFTER); hubStats = SCN_HUB ? computeStatsFromScenario(SCN_HUB) : null; cityBaseStats = SCN_CITY_BASE ? computeStatsFromScenario(SCN_CITY_BASE) : null; cityAfterStats = SCN_CITY_AFTER ? computeStatsFromScenario(SCN_CITY_AFTER) : null; Object.assign(baseStats, beforeStats);
  activateTrucksFromScenario(SCN_BEFORE);
  const b=new maplibregl.LngLatBounds(); Object.values(CITY).forEach(c=>b.extend([c.lon,c.lat]));
  map.fitBounds(b,{padding:{top:70,left:70,right:330,bottom:70},duration:800,maxZoom:10.9});
  renderStatsTable(beforeStats);
  Narrator.sayLinesTwice([
    "Delhi City Logistics Twin loaded. Use Disrupt, Correct, Normal, Hub Addition, or City Addition to operate the simulation.",
    "The product now models Delhi NCR corridors, intra-city disruptions, correction paths, a neutral consolidation hub, and new city micro-zone expansion.",
    "Toggle narration with Mute or press Ctrl+M."
  ], 900, 0.92);
})();

/* -------------------- fetch helper & tick -------------------- */
async function fetchOrDefault(file, fallback){
  try{ const r=await fetch(`${file}?v=${Date.now()}`,{cache:"no-store"}); if(!r.ok) throw new Error(`HTTP ${r.status}`); return await r.json(); }
  catch(e){ debug(`Using default scenario (${e.message})`); return fallback; }
}
function tick(){ const now=performance.now(); const dt=Math.min(0.05,(now-__lastTS)/1000); __lastTS=now; __dt=dt; drawFrame(); requestAnimationFrame(tick); }
requestAnimationFrame(tick);
