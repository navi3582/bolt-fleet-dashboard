var SCRIPT='https://script.google.com/macros/s/AKfycbyAqFMhAyssm9sZ1RrB_hFPmlV_hJlfao1LSKu1ghlYXRxI4Q0nVKoesV39bnmcDphv/exec';
var SECRET='BoltFleet-Berlin-2026';
var t=localStorage.getItem('_bft')||'';
localStorage.removeItem('_bft');
if(!t){
  for(var i=0;i<localStorage.length;i++){
    var v=localStorage.getItem(localStorage.key(i))||'';
    if(v.split('eyJ').length>1&&v.split('.').length===3&&v.length>50){
      t=v;
      break;
    }
  }
}
if(!t){
  for(var i=0;i<sessionStorage.length;i++){
    var v=sessionStorage.getItem(sessionStorage.key(i))||'';
    if(v.split('eyJ').length>1&&v.split('.').length===3&&v.length>50){
      t=v;
      break;
    }
  }
}
if(!t){
  completion('No token found.\nOpen admin-panel.bolt.eu, log in, then run again.');
}else{
  var d=new Date();
  var dd=('0'+d.getDate()).slice(-2);
  var mm=('0'+(d.getMonth()+1)).slice(-2);
  var yy=d.getFullYear();
  var hh=('0'+d.getHours()).slice(-2);
  var mn=('0'+d.getMinutes()).slice(-2);
  var now=dd+'.'+mm+'.'+yy+' '+hh+':'+mn;
  var payload={token:SECRET,bearer_token:t,timestamp:now,Total:0};
  var img=new Image();
  img.src=SCRIPT+'?d='+encodeURIComponent(JSON.stringify(payload));
  completion('Token saved!\nDashboard auto-updates every minute.\n'+now);
}
