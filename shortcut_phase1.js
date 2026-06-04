localStorage.setItem('_bft','');
var of=window.fetch;
var ox=XMLHttpRequest.prototype.setRequestHeader;
var done=false;
function cap(t){
  if(done)return;
  done=true;
  localStorage.setItem('_bft',t);
  window.fetch=of;
  XMLHttpRequest.prototype.setRequestHeader=ox;
  completion('ok');
}
window.fetch=function(u,o){
  if(done)return of.apply(this,arguments);
  if(o&&o.headers&&u&&u.split('getList').length>1){
    var h=o.headers,a='';
    if(typeof h.get==='function'){
      a=h.get('authorization')||h.get('Authorization')||'';
    }else{
      a=h['Authorization']||h['authorization']||'';
    }
    if(a.substring(0,7).toLowerCase()==='bearer '){
      cap(a.substring(7));
    }
  }
  return of.apply(this,arguments);
};
XMLHttpRequest.prototype.setRequestHeader=function(n,v){
  if(!done&&n&&v){
    if(n.toLowerCase()==='authorization'){
      if(v.substring(0,7).toLowerCase()==='bearer '){
        cap(v.substring(7));
      }
    }
  }
  return ox.apply(this,arguments);
};
try{
  window.history.pushState({t:Date.now()},'',location.href);
  window.dispatchEvent(new PopStateEvent('popstate',{state:{}}));
}catch(e){}
setTimeout(function(){
  var e=document.querySelectorAll('[class*="Chip"],[class*="chip"]');
  if(e[0])e[0].click();
},800);
setTimeout(function(){
  if(!done){
    done=true;
    window.fetch=of;
    XMLHttpRequest.prototype.setRequestHeader=ox;
    completion('timeout');
  }
},10000);
