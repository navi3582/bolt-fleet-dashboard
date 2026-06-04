var t=localStorage.getItem('_bft')||'';
localStorage.removeItem('_bft');
for(var i=0;i<localStorage.length;i++){
  var v=localStorage.getItem(localStorage.key(i))||'';
  if(v.indexOf('eyJ')===0&&v.split('.').length===3&&v.length>50){t=v;break;}
}
if(!t){
  for(var i=0;i<sessionStorage.length;i++){
    var v=sessionStorage.getItem(sessionStorage.key(i))||'';
    if(v.indexOf('eyJ')===0&&v.split('.').length===3&&v.length>50){t=v;break;}
  }
}
completion(t||'');
