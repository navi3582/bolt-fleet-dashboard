(function(){
var out=[];
var found=[];

out.push('=== localStorage ('+localStorage.length+' keys) ===');
for(var i=0;i<localStorage.length;i++){
  var k=localStorage.key(i);
  var v=localStorage.getItem(k)||'';
  out.push('['+k+'] '+v.substring(0,200));
  if(v.indexOf('eyJ')!==-1||v.indexOf('Bearer')!==-1||v.indexOf('token')!==-1)found.push('FOUND IN localStorage key: '+k);
}

out.push('\n=== sessionStorage ('+sessionStorage.length+' keys) ===');
for(var i=0;i<sessionStorage.length;i++){
  var k=sessionStorage.key(i);
  var v=sessionStorage.getItem(k)||'';
  out.push('['+k+'] '+v.substring(0,200));
  if(v.indexOf('eyJ')!==-1||v.indexOf('Bearer')!==-1||v.indexOf('token')!==-1)found.push('FOUND IN sessionStorage key: '+k);
}

out.push('\n=== cookies ===');
out.push(document.cookie||'(none)');

out.push('\n=== window token keys ===');
try{Object.keys(window).forEach(function(k){if(/token|auth|jwt|bearer|session/i.test(k)){out.push('window.'+k+' = '+String(window[k]).substring(0,100));found.push('window.'+k);}});}catch(e){}

var o=document.createElement('div');
o.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:#0a0a0a;z-index:999999;overflow:auto;padding:60px 16px 20px;font-family:monospace;font-size:11px;color:#ccc;white-space:pre-wrap;word-break:break-all';
var summary=found.length?'<div style="color:#1DC85A;font-weight:bold;font-size:13px;margin-bottom:12px">TOKEN HINTS:\n'+found.join('\n')+'</div>':'<div style="color:#ff5555;font-size:13px;margin-bottom:12px">No obvious token keys found — check full output below</div>';
o.innerHTML='<button onclick="this.parentElement.remove()" style="position:fixed;top:12px;right:12px;padding:8px 18px;background:#1DC85A;color:black;border:none;border-radius:8px;font-weight:800;cursor:pointer;font-size:14px;z-index:999999">Close</button>'+summary+out.join('\n');
document.body.appendChild(o);
})();
