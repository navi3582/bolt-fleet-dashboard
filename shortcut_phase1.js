localStorage.setItem('_bft','');
var of=window.fetch;
window.fetch=function(u,o){
  if(u&&u.indexOf('getList')!==-1&&o&&o.headers){
    var h=o.headers,a='';
    if(typeof h.get==='function')a=h.get('authorization')||h.get('Authorization')||'';
    else a=h['Authorization']||h['authorization']||'';
    if(a&&a.toLowerCase().indexOf('bearer ')===0)localStorage.setItem('_bft',a.replace(/^bearer /i,''));
  }
  return of.apply(this,arguments);
};
try{window.history.pushState({t:Date.now()},'',location.href);window.dispatchEvent(new PopStateEvent('popstate',{state:{}}));}catch(e){}
completion('ready');
