/* Pure daily-series calculations. KD(9,3,3), Wilder RSI14, MACD12/26/9. */
(function(scope){
const sma=(a,n)=>a.map((_,i)=>i<n-1?null:a.slice(i-n+1,i+1).reduce((x,y)=>x+y,0)/n);
function ema(a,n){let seed=[],prev=null;return a.map(v=>{if(v==null)return null;if(prev===null){seed.push(v);if(seed.length<n)return null;return prev=seed.reduce((x,y)=>x+y,0)/n}return prev=v*2/(n+1)+prev*(1-2/(n+1))})}
function rsi(a,n=14){let g=0,l=0;return a.map((v,i)=>{if(!i)return null;const d=v-a[i-1];if(i<=n){g+=Math.max(0,d)/n;l+=Math.max(0,-d)/n}else{g=(g*(n-1)+Math.max(0,d))/n;l=(l*(n-1)+Math.max(0,-d))/n}return i<n?null:g===0&&l===0?50:l===0?100:100-100/(1+g/l)})}
function macd(a){const e12=ema(a,12),e26=ema(a,26),dif=a.map((_,i)=>e26[i]==null?null:e12[i]-e26[i]),signal=ema(dif,9);return {dif,signal,hist:dif.map((x,i)=>signal[i]==null?null:x-signal[i])}}
function kd(close,high,low,n=9){let k=50,d=50;const ks=[],ds=[];close.forEach((c,i)=>{if(i<n-1){ks.push(null);ds.push(null);return}const h=Math.max(...high.slice(i-n+1,i+1)),l=Math.min(...low.slice(i-n+1,i+1)),r=h===l?50:100*(c-l)/(h-l);k=k*2/3+r/3;d=d*2/3+k/3;ks.push(k);ds.push(d)});return {k:ks,d:ds}}
function bollinger(a,n=20){const mid=sma(a,n);return {mid,upper:a.map((v,i)=>mid[i]==null?null:mid[i]+2*Math.sqrt(a.slice(i-n+1,i+1).reduce((s,x)=>s+(x-mid[i])**2,0)/n)),lower:a.map((v,i)=>mid[i]==null?null:mid[i]-2*Math.sqrt(a.slice(i-n+1,i+1).reduce((s,x)=>s+(x-mid[i])**2,0)/n))}}
function compare(series){if(!series.length)return {dates:[],values:[]};const maps=series.map(s=>new Map(s.dates.map((d,i)=>[d,s.close[i]])));const dates=series[0].dates.filter(d=>maps.every(m=>m.has(d)&&m.get(d)>0));return {dates,values:maps.map(m=>dates.map(d=>(m.get(d)/m.get(dates[0])-1)*100))}}
const api={sma,ema,rsi,macd,kd,bollinger,compare};if(typeof module!=='undefined'&&module.exports)module.exports=api;scope.TA=api;
})(typeof globalThis==='undefined'?window:globalThis);
