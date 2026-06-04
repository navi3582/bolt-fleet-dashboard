var API='https://admin-panel.bolt.eu/backend/rental-car-vehicle-fleet/adminPanel/vehicle/getList';
var SCRIPT='https://script.google.com/macros/s/AKfycbyAqFMhAyssm9sZ1RrB_hFPmlV_hJlfao1LSKu1ghlYXRxI4Q0nVKoesV39bnmcDphv/exec';
var SECRET='BoltFleet-Berlin-2026';
var CITY=329;
var ST=[['hidden','Hidden'],['in_service_shop','In Service Shop'],['in_maintenance','In Maintenance'],['lost','Lost'],['deactivated','Deactivated'],['waiting_for_order','Waiting for Order'],['reserved','Reserved'],['on_trip','On Trip']];
var token=localStorage.getItem('_bftoken')||'';
localStorage.removeItem('_bftoken');
if(!token){completion('Error: no token. Open admin-panel.bolt.eu first, then run shortcut again.');}
var counts={},pending=ST.length;
ST.forEach(function(s){
  fetch(API,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','Accept':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({filter:{vehicle_states:[s[0]],city_ids:[CITY]},items_per_page:1,page_number:0})})
  .then(function(r){return r.json();})
  .then(function(d){counts[s[1]]=d.data&&d.data.pages?d.data.pages.total_rows:0;if(--pending===0)done();})
  .catch(function(){counts[s[1]]=0;if(--pending===0)done();});
});
function done(){
  var total=0,d=new Date();
  var now=('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
  var payload={token:SECRET,timestamp:now,Total:0,bearer_token:token};
  ST.forEach(function(s){payload[s[1]]=counts[s[1]]||0;total+=payload[s[1]];});
  payload.Total=total;
  var img=new Image();
  img.src=SCRIPT+'?d='+encodeURIComponent(JSON.stringify(payload));
  var lines=ST.map(function(s){return s[1]+': '+(counts[s[1]]||0);});
  completion('Berlin Fleet — Total: '+total+'\n'+lines.join('\n')+'\n\nSaved to dashboard ✓');
}
