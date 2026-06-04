var t=localStorage.getItem('_bft')||'';
localStorage.removeItem('_bft');
if(!t){for(var i=0;i<localStorage.length;i++){var v=localStorage.getItem(localStorage.key(i))||'';if(v.indexOf('eyJ')===0&&v.split('.').length===3&&v.length>50){t=v;break;}}}
if(!t){for(var i=0;i<sessionStorage.length;i++){var v=sessionStorage.getItem(sessionStorage.key(i))||'';if(v.indexOf('eyJ')===0&&v.split('.').length===3&&v.length>50){t=v;break;}}}
if(!t){var root=document.getElementById('root')||document.body;var fk=Object.keys(root).find(function(k){return k.startsWith('__reactFiber');});if(fk){var q=[root[fk]],seen=new Set(),c=0;while(q.length&&c<2000){var n=q.shift();if(!n||seen.has(n))continue;seen.add(n);c++;var st=n.memoizedState,sd=0;while(st&&sd<6){var ms=st.memoizedState;if(typeof ms==='string'&&ms.indexOf('eyJ')===0&&ms.split('.').length===3&&ms.length>50){t=ms;break;}st=st.next;sd++;}if(t)break;if(n.child)q.push(n.child);if(n.sibling)q.push(n.sibling);}}}
completion(t||'');
