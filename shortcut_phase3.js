var SCRIPT='https://script.google.com/macros/s/AKfycbyAqFMhAyssm9sZ1RrB_hFPmlV_hJlfao1LSKu1ghlYXRxI4Q0nVKoesV39bnmcDphv/exec';
var SECRET='BoltFleet-Berlin-2026';
var token=localStorage.getItem('_bftoken')||'';
localStorage.removeItem('_bftoken');
if(!token){
  completion('No token found.\n\nMake sure you are logged in to admin-panel.bolt.eu and try again.');
} else {
  var d=new Date();
  var now=('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
  var payload={token:SECRET,bearer_token:token,timestamp:now,Total:0};
  var img=new Image();
  img.src=SCRIPT+'?d='+encodeURIComponent(JSON.stringify(payload));
  completion('Token saved to Apps Script.\n\nDashboard will auto-update every minute.\n\nToken captured at: '+now);
}
