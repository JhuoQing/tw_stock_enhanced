const $=s=>document.querySelector(s),root=document.documentElement;
const css=n=>getComputedStyle(root).getPropertyValue(n).trim();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>n==null?'—':Number(n).toLocaleString('zh-TW',{minimumFractionDigits:d,maximumFractionDigits:d});
const cls=v=>v>0?'up':v<0?'down':'flat',sg=v=>v>0?'+':'';
const Q=s=>D.quotes.find(q=>q.symbol===s);
let D,chart,rkTab='by_value',nf='all',days=66;

/* theme */
try{const t=localStorage.getItem('theme');if(t)root.dataset.theme=t}catch(e){}
function themeIcon(){$('#theme').textContent=root.dataset.theme==='light'?'☀':'☾'}
$('#theme').onclick=()=>{root.dataset.theme=root.dataset.theme==='light'?'dark':'light';try{localStorage.setItem('theme',root.dataset.theme)}catch(e){}themeIcon();if(D){drawChart();renderAll();renderCompare();if(dialog.open&&activeSymbol&&window.Chart&&$('#indicator'))drawDetail(activeSymbol)}};
themeIcon();

/* helpers */
function spark(a,c){if(!a||a.length<2)return '<span class="sp"></span>';const w=100,h=26,mn=Math.min(...a),mx=Math.max(...a),r=mx-mn||1;
  const p=a.map((v,i)=>[(i/(a.length-1)*w).toFixed(1),(h-3-(v-mn)/r*(h-6)).toFixed(1)]);
  const l=p.map(x=>x.join(',')).join(' ');
  return `<svg class="sp" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polygon points="0,${h} ${l} ${w},${h}" fill="${c}" opacity=".13"/><polyline points="${l}" fill="none" stroke="${c}" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`}
const colOf=v=>css(v>0?'--up':v<0?'--down':'--mute');
function row(q){const k=cls(q.chg);
  return `<div class="row" role="button" tabindex="0" data-symbol="${esc(q.symbol)}"><span class="nm">${esc(q.name)}</span>${spark(q.spark,colOf(q.chg))}<span class="px">${fmt(q.price)}</span><span class="chip ${k}">${sg(q.pct)}${fmt(q.pct)}%</span></div>`}
function countUp(el,to,d=2){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){el.textContent=fmt(to,d);return}
  const t0=performance.now(),D0=1000;(function f(t){const p=Math.min(1,(t-t0)/D0),e=1-Math.pow(1-p,3);el.textContent=fmt(to*e,d);if(p<1)requestAnimationFrame(f)})(t0)}

/* market status */
function status(){const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
  const g=t=>p.find(x=>x.type===t).value,m=(+g('hour')%24)*60+ +g('minute');
  const open=!['Sat','Sun'].includes(g('weekday'))&&m>=540&&m<=810;
  $('#st').className='pill'+(open?' open':'');$('#st span').textContent=open?'交易時段（未核對假日）':'非交易時段'}

/* hero */
function hero(){
  const t=Q('^TWII');if(!t||t.price==null)return;
  const hp=$('#hp');hp.classList.remove('skel');countUp(hp,t.price);
  const k=cls(t.chg);
  $('#hc').innerHTML=`<span class="${k}">${k==='up'?'▲':k==='down'?'▼':'—'} ${fmt(Math.abs(t.chg))}　${sg(t.pct)}${fmt(t.pct)}%</span><small>${esc(t.date)} 日線最新值</small>`;
  const v=Q('^VIX'),s=Q('^SOX');let m=t.pct>=1?'多方氣勢強勁，買盤積極進場。':t.pct>.3?'走勢偏多，盤勢穩步墊高。':t.pct>-.3?'指數窄幅整理，市場等待方向。':t.pct>-1?'賣壓略現，指數偏弱震盪。':'空方壓力沉重，留意風險控管。';
  if(s&&Math.abs(s.pct)>=1.5)m+=`費城半導體${s.pct>0?'走強':'走弱'}（${sg(s.pct)}${fmt(s.pct)}%），科技股情緒可能受牽動。`;
  if(v&&v.pct>8)m+='VIX 明顯升溫，全球避險情緒上升。';
  $('#mood').textContent=m;
  $('#mini').innerHTML=['^TWOII','2330.TW','TWD=X'].map(Q).filter(Boolean).map(q=>`<div role="button" tabindex="0" data-symbol="${esc(q.symbol)}"><div class="n">${esc(q.name)}</div><div class="v">${fmt(q.price)} <span class="${cls(q.chg)}" style="font-size:12.5px">${sg(q.pct)}${fmt(q.pct)}%</span></div></div>`).join('');
}
async function drawChart(){
  try{await ensureChart()}catch(e){return}
  const h=D.taiex_history;if(!h||!h.dates||!$('#cT'))return;
  const m20=h.close.map((_,i,a)=>i<19?null:a.slice(i-19,i+1).reduce((x,y)=>x+y,0)/20),s=Math.max(0,h.dates.length-days),span=h.dates.length-s,narrow=$('#cT').clientWidth<520;
  const ctx=$('#cT').getContext('2d'),g=ctx.createLinearGradient(0,0,0,ctx.canvas.clientHeight||320),L=css('--lamp');
  g.addColorStop(0,L+'55');g.addColorStop(1,L+'00');
  chart&&chart.destroy();
  chart=new Chart(ctx,{type:'line',data:{labels:h.dates.slice(s),datasets:[
    {label:'加權指數',data:h.close.slice(s),borderColor:L,backgroundColor:g,fill:true,borderWidth:2.2,pointRadius:0,pointHoverRadius:4,tension:.25},
    {label:'MA20',data:m20.slice(s),borderColor:css('--mute'),borderWidth:1,borderDash:[4,4],pointRadius:0,tension:.25}]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
    plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(12,10,30,.92)',borderColor:'rgba(255,255,255,.12)',borderWidth:1,padding:10,titleColor:'#bbb',bodyColor:'#fff'}},
    scales:{x:{ticks:{color:css('--mute'),maxTicksLimit:narrow?4:6,maxRotation:0,minRotation:0,autoSkip:true,autoSkipPadding:narrow?28:14,align:narrow?'inner':'center',callback(v){const d=String(this.getLabelForValue(v)),m=/^(\d{4})-(\d{2})-(\d{2})/.exec(d);if(!m)return d;return span>150?m[1].slice(2)+'/'+m[2]:m[2]+'/'+m[3]}},grid:{display:false},border:{display:false}},y:{position:'right',ticks:{color:css('--mute')},grid:{color:css('--edge')},border:{display:false}}}}});
}
function ranges(){
  const R=[['1M',22],['3M',66],['6M',132],['1Y',999]];
  $('#rng').innerHTML=R.map(r=>`<button data-d="${r[1]}" class="${r[1]===days?'on':''}">${r[0]}</button>`).join('');
  $('#rng').onclick=e=>{const b=e.target.closest('button');if(!b)return;days=+b.dataset.d;
    document.querySelectorAll('#rng button').forEach(x=>x.classList.toggle('on',x===b));drawChart()}}

/* panels */
function inst(){
  const i=D.institutional;$('#iD').textContent='單位：億元'+(i.date?'　'+i.date:'');
  if(!i.rows.length){$('#inst').innerHTML='<p class="flat">尚無資料。法人統計於收盤後公布，休市日不更新。</p>';return}
  const mx=Math.max(...i.rows.map(r=>Math.abs(r.net)))||1;
  $('#inst').innerHTML=i.rows.map(r=>{const w=Math.abs(r.net)/mx*50,k=r.net>=0?'up':'down';
    return `<div class="inst" role="button" tabindex="0" data-inst="${esc(r.name)}"><span>${esc(r.name.replace(/\(.*?\)/g,m=>m))}</span><div class="track"><div class="fill" style="${r.net>=0?'left':'right'}:50%;width:${w}%;background:var(--${k})"></div></div><span class="v ${k}">${sg(r.net)}${fmt(r.net,1)}</span></div>`}).join('');
}
function macro(){
  if(!D.macro.length)return;$('#macSec').style.display='';
  $('#mac').innerHTML=D.macro.map(m=>`<div><div class="n">${esc(m.name)}</div><div class="v">${fmt(m.value)}${m.unit}</div><div class="n">前值 ${fmt(m.prev)}${m.unit}</div></div>`).join('');
}
function ranks(){
  const T=[['by_value','成交值'],['gainers','漲幅'],['losers','跌幅']];
  $('#rkT').innerHTML=T.map(t=>`<button data-k="${t[0]}" class="${t[0]===rkTab?'on':''}">${t[1]}</button>`).join('');
  const L=D.rankings[rkTab]||[],mx=Math.max(...L.map(r=>r.value),1);
  $('#rk').innerHTML=L.map((r,i)=>`<div class="rk" role="button" tabindex="0" data-symbol="${esc(r.code)}.TW"><i>${i+1}</i><span class="nm">${esc(r.code)} ${esc(r.name)}</span><span class="r">${fmt(r.close)}</span><span class="r ${cls(r.pct)}">${sg(r.pct)}${fmt(r.pct)}%</span><span class="b" style="width:${r.value/mx*100}%"></span></div>`).join('')||'<p class="flat">尚無資料。</p>';
  $('#rkT').onclick=e=>{const b=e.target.closest('button');if(b){rkTab=b.dataset.k;ranks()}};
}
function news(){
  $('#nT').innerHTML=`<button data-f="all" class="${nf==='all'?'on':''}">全部</button><button data-f="imp" class="${nf==='imp'?'on':''}">重大</button>`;
  $('#nT').onclick=e=>{const b=e.target.closest('button');if(b){nf=b.dataset.f;news()}};
  const now=Date.now(),ago=t=>{const m=Math.max(0,(now-new Date(t))/6e4);return m<60?Math.round(m)+' 分鐘前':m<1440?Math.round(m/60)+' 小時前':Math.round(m/1440)+' 天前'};
  $('#news').innerHTML=D.news.filter(n=>nf==='all'||n.important).slice(0,24).map(n=>`<div class="nw${n.important?' imp':''}">${n.important?'<span class="tag">重大</span>':''}<a href="${esc(safeURL(n.link))}" target="_blank" rel="noopener noreferrer">${esc(n.title)}</a><div class="m">${esc(n.source)}　${ago(n.time)}</div>${newsAI(n)}</div>`).join('')||'<p class="flat">暫無新聞。</p>';
}
function renderAll(){
  const set=(id,f)=>$(id).innerHTML=D.quotes.filter(f).map(row).join('')||'<p class="flat">無資料</p>';
  set('#focus',q=>['2330.TW','2317.TW','2454.TW','0050.TW','^TWOII'].includes(q.symbol));
  set('#gl',q=>q.group==='全球');set('#fx',q=>q.group==='匯率商品');
  const tk=D.quotes.map(q=>`<button data-symbol="${esc(q.symbol)}"><b>${esc(q.name)}</b>${fmt(q.price)} <em class="${cls(q.chg)}" style="font-style:normal">${sg(q.pct)}${fmt(q.pct)}%</em></button>`).join('');
  $('#tick').innerHTML=tk+tk;
}


let comparisonEpoch=0;
let chartPromise,detailCharts=[],comparisonChart,activeSymbol=null,renderToken=0,returnFocus=null;
let watch=storage('watchlist',[]),selected=storage('compare',[]).slice(0,6);
function storage(key,fallback){try{const x=JSON.parse(localStorage.getItem(key));return Array.isArray(x)?x:fallback}catch{return fallback}}
function persist(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{$('#pageStatus').textContent='瀏覽器儲存不可用；偏好將只保留至本次瀏覽結束。'}}
function safeURL(url){try{const u=new URL(url,location.href);return ['https:','http:'].includes(u.protocol)?u.href:'#'}catch{return '#'}}
function ensureChart(){if(window.Chart)return Promise.resolve();if(chartPromise)return chartPromise;chartPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='vendor/chart.umd.min.js';s.onload=resolve;s.onerror=()=>{chartPromise=null;reject(Error('chart load failed'))};document.head.append(s)});return chartPromise}
function line(label,data,color){return {label,data,borderColor:color,borderWidth:1.6,pointRadius:0,tension:0,spanGaps:false}}
function newChart(id,labels,datasets,extra={}){return new Chart($(id),{type:'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:css('--mute'),boxWidth:12}}},scales:{x:{ticks:{color:css('--mute'),maxTicksLimit:5,maxRotation:0},grid:{display:false}},y:{position:'right',ticks:{color:css('--mute')},grid:{color:css('--edge')}}} ,...extra}})}
function age(meta,date){if(!meta?.fetched_at)return '尚無成功更新資料';const mins=Math.max(0,Math.floor((Date.now()-Date.parse(meta.fetched_at))/60000));return `${meta.status==='cached'?'更新失敗，顯示舊資料・':''}擷取於 ${mins<60?mins+' 分鐘前':Math.floor(mins/60)+' 小時前'}${date?'・資料日 '+date:''}`}
function old(meta,date){return meta?.status==='cached'||meta?.status==='unavailable'||!meta?.fetched_at||Date.now()-Date.parse(meta.fetched_at)>36e5||!!date&&Date.now()-Date.parse(date+'T16:00:00+08:00')>4*864e5}
function ageHTML(meta,date){return `<p class="age ${old(meta,date)?'stale':''}">${esc(age(meta,date))}</p>`}
function addAge(selector,meta,date){const el=$(selector);if(!el)return;let p=el.querySelector(':scope > .age');if(!p){p=document.createElement('p');el.append(p)}p.className='age'+(old(meta,date)?' stale':'');p.textContent=age(meta,date)}
function updateAges(){
  $('#upd').textContent='更新 '+new Date(D.updated_at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false,month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  addAge('#inst',D.institutional,D.institutional.date);addAge('#rk',D.rankings,D.rankings.by_value?.[0]?.date);addAge('#news',D.news_meta);addAge('#mac',D.macro_meta);
  for(const id of ['#focus','#gl','#fx','#watchlist']){const q=[...$(id).querySelectorAll('[data-symbol]')].map(e=>Q(e.dataset.symbol)).filter(Boolean);const stamps=q.map(x=>x.fetched_at).filter(Boolean).sort();addAge(id,{fetched_at:stamps[0],status:q.some(x=>x.status!=='ok')?'cached':'ok'},q.map(x=>x.date).filter(Boolean).sort()[0])}
}
function newsAI(n){const ai=D.ai?.news?.[n.id];return ai?`<div class="news-ai"><span class="${ai.sentiment==='利多'?'up':ai.sentiment==='利空'?'down':'flat'}">${esc(ai.sentiment)}</span>・${esc(ai.reason)}<br>可能影響：${esc(ai.industries.join('、')||'未指明')} <span class="ai-label">AI 生成，僅供參考</span></div>`:''}
function renderAI(){const ai=D.ai||{};$('#dailyAI').innerHTML=ai.daily?.length?ai.daily.map(c=>`<p class="summary">${esc(c.text)}</p>`).join(''):'<p class="flat">AI 分析尚未產生或本次略過；行情資料仍可使用。</p>';$('#temperature').innerHTML=ai.temperature==null?'':`<b>新聞多空溫度 ${fmt(ai.temperature,0)} / 100</b><meter min="0" max="100" value="${ai.temperature}" aria-label="新聞多空溫度"></meter><span class="note">已分析 ${ai.coverage} 則重大標題・非報酬預測<br>利空 0／中性 50／利多 100，等權平均</span>`;$('#aiAge').textContent=ai.generated_at?`生成於 ${new Date(ai.generated_at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})}・${ai.model}・${ai.status==='partial'?'部分完成':'已完成'}`:'AI 分析暫未提供。'}
function findSymbol(value){const v=value.trim();return D.quotes.find(q=>q.symbol.toLowerCase()===v.toLowerCase()||q.symbol.split('.')[0]===v||q.name===v)?.symbol}
function renderWatch(){watch=watch.filter(s=>typeof s==='string');$('#symbolOptions').innerHTML=D.quotes.map(q=>`<option value="${esc(q.symbol)}">${esc(q.name)}</option>`).join('');$('#watchlist').innerHTML=watch.length?watch.map(s=>`<div class="toolbar">${Q(s)?`<div style="flex:1">${row(Q(s))}</div>`:`<span>${esc(s)} 本次不在抓取範圍</span>`}<button data-remove-watch="${esc(s)}" aria-label="移除 ${esc(s)}">移除</button></div>`).join(''):'<p class="note">輸入標的代號，或在詳細面板加入自選。</p>';$('#availableSymbols').innerHTML=D.quotes.map(q=>`<button data-symbol="${esc(q.symbol)}">${esc(q.symbol)} ${esc(q.name)}</button>`).join(' ')}
$('#watchForm').onsubmit=e=>{e.preventDefault();const s=findSymbol($('#symbolInput').value);if(!s){$('#watchStatus').textContent='目前尚未提供此標的資料，請從現有清單選擇。';return}if(!watch.includes(s))watch.push(s);persist('watchlist',watch);renderWatch();$('#watchStatus').textContent='已加入自選。';$('#symbolInput').value=''};
$('#browseSymbols').onclick=()=>{$('#availableSymbols').hidden=!$('#availableSymbols').hidden};
function toggleCompare(symbol,checked){if(checked&&!selected.includes(symbol)){if(selected.length>=6){$('#dialogStatus').textContent='最多比較六檔標的。';return false}selected.push(symbol)}else if(!checked)selected=selected.filter(s=>s!==symbol);persist('compare',selected);renderCompare();return true}
async function renderCompare(){const epoch=++comparisonEpoch;const colors=['#f4b860','#7cb9ff','#46e0a8','#f49bd2','#ac9cff','#ff6b73'];$('#compareChoices').innerHTML=selected.map(s=>`<label><input type="checkbox" data-compare="${esc(s)}" checked> ${esc(Q(s)?.name||s)}</label>`).join('');const usable=selected.filter(s=>D.histories?.[s]?.close?.length);$('#compareBox').hidden=usable.length<2;if(comparisonChart){comparisonChart.destroy();comparisonChart=null}if(usable.length<2){$('#compareNote').textContent='請從詳細面板加入至少兩個有歷史資料的標的。';return}const series=TA.compare(usable.map(s=>D.histories[s]));if(series.dates.length<2){$('#compareNote').textContent='共同交易日不足，無法比較。';$('#compareBox').hidden=true;return}$('#compareNote').textContent=`${series.dates[0]} → ${series.dates.at(-1)}，${series.dates.length} 個共同交易日。基準日為 0%；使用原幣價格，未計股息與匯率；拆股處理依供應商，跨來源須留意，非總報酬。`;const signature=selected.join();try{await ensureChart();if(epoch!==comparisonEpoch||signature!==selected.join())return;comparisonChart=newChart('#compareChart',series.dates,usable.map((s,i)=>line(Q(s)?.name||s,series.values[i],colors[i])))}catch{$('#compareNote').textContent='圖表元件載入失敗，請重新連線。'}}
const dialog=$('#detail');
function openHash(value){location.hash=encodeURIComponent(value)}
function panelKey(symbol){return /^\d{4}\.TW$/.test(symbol)?symbol.split('.')[0]:symbol}
function destroyDetails(){renderToken++;detailCharts.forEach(c=>c.destroy());detailCharts=[]}
function closePanel(){destroyDetails();activeSymbol=null;dialog.close();document.body.classList.remove('modal-open');history.replaceState(null,'',location.pathname+location.search);returnFocus?.focus()}
$('#closePanel').onclick=closePanel;dialog.addEventListener('cancel',e=>{e.preventDefault();closePanel()});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientY<r.top)closePanel()}});
function showDialog(title){destroyDetails();$('#prevSymbol').disabled=!activeSymbol;$('#nextSymbol').disabled=!activeSymbol;$('#detailTitle').textContent=title;$('#dialogStatus').textContent='';if(!dialog.open){returnFocus=document.activeElement;dialog.showModal();document.body.classList.add('modal-open');$('#closePanel').focus()}}
function navigate(delta){if(!activeSymbol)return;const index=D.quotes.findIndex(q=>q.symbol===activeSymbol),s=D.quotes[(index+delta+D.quotes.length)%D.quotes.length]?.symbol;if(s)openHash(panelKey(s))}
$('#prevSymbol').onclick=()=>navigate(-1);$('#nextSymbol').onclick=()=>navigate(1);
$('#sharePanel').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('#dialogStatus').textContent='已複製面板連結。'}catch{$('#dialogStatus').textContent='請複製瀏覽器網址列分享此面板。'}};
function stat(name,value){return `<div><span>${esc(name)}</span><b>${value}</b></div>`}
function detailAI(symbol){const item=D.ai?.stocks?.[symbol];return item?`<div class="panel"><span class="ai-label">AI 生成，僅供參考</span><p>${esc(item.comment.text)}</p>${item.anomaly_explanation?`<p>${esc(item.anomaly_explanation)}</p>`:''}<p class="note">引用：${esc(item.comment.evidence_ids.map(x=>x.startsWith('news:')?D.news.find(n=>n.id===x.slice(5))?.title||'新聞':Q(x.slice(6))?.name||x).join('；'))}</p></div>`:'<p class="note">本標的尚無 AI 速評，或本次分析略過。</p>'}
async function showSymbol(symbol){const q=Q(symbol);activeSymbol=symbol;showDialog(q?`${q.name} ${q.symbol}`:symbol);const token=renderToken;
  if(!q){$('#detailContent').innerHTML='<p>目前尚未提供此標的資料，請從現有清單選擇。</p>';return}
  const h=D.histories?.[symbol],valid=h?.dates?.length>1;
  $('#detailContent').innerHTML=`<div class="toolbar"><strong class="detail-price">${fmt(q.price)}</strong><span class="${cls(q.pct)}">${sg(q.pct)}${fmt(q.pct)}%</span><button id="detailWatch">${watch.includes(symbol)?'移除自選':'加入自選'}</button><label><input id="detailCompare" type="checkbox" ${selected.includes(symbol)?'checked':''} ${valid?'':'disabled'}> 加入比較</label></div>${ageHTML(q,q.date)}<p class="note">來源 ${esc(q.source||'未取得')}・${esc(q.price_basis||'日線')}。${valid?`歷史 ${h.dates.length} 筆／${h.dates[0]} 起；新上市或來源不足時不滿一年。`:'一年歷史資料尚未取得。'}</p><div class="stats">${stat('開盤',fmt(q.open))}${stat('最高／最低',fmt(q.high)+' / '+fmt(q.low))}${stat('成交量（來源原始單位）',fmt(q.volume,0))}${stat('歷史區間高／低',fmt(q.year_high)+' / '+fmt(q.year_low))}${stat('前20日均量',fmt(q.volume_avg20,0))}${stat('量能倍數',fmt(q.volume_ratio)+' ×')} </div><p class="note">均量樣本 ${q.volume_samples||0} 日，排除當日；不同市場成交量單位不可直接比較。</p>${valid?'<div class="toolbar"><label for="indicator">技術指標</label><select id="indicator"><option value="rsi">RSI 14</option><option value="macd">MACD 12/26/9</option><option value="kd">KD 9/3/3</option><option value="bb">布林通道 20/2</option></select></div><div class="detail-chart"><canvas id="priceChart" role="img" aria-label="一年價格與均線"></canvas></div><div class="volume-chart"><canvas id="volumeChart" role="img" aria-label="成交量"></canvas></div><div class="indicator-chart" id="indicatorBox"><canvas id="indicatorChart" role="img" aria-label="技術指標"></canvas></div><p class="note">MA20／MA60；KD 使用高低收盤，初始 K/D=50；MACD 柱為 DIF−Signal。</p>':''}${detailAI(symbol)}`;
  $('#detailWatch').onclick=()=>{watch=watch.includes(symbol)?watch.filter(s=>s!==symbol):[...watch,symbol];persist('watchlist',watch);renderWatch();$('#detailWatch').textContent=watch.includes(symbol)?'移除自選':'加入自選'};
  $('#detailCompare').onchange=e=>{if(!toggleCompare(symbol,e.target.checked))e.target.checked=false};
  if(!valid)return;$('#indicator').onchange=()=>drawDetail(symbol);
  try{await ensureChart();if(token!==renderToken)return;drawDetail(symbol)}catch{$('#dialogStatus').textContent='圖表元件載入失敗，行情數字仍可閱讀。'}
}
function drawDetail(symbol){detailCharts.forEach(c=>c.destroy());detailCharts=[];const h=D.histories[symbol],c=h.close,mode=$('#indicator').value;const colors=[css('--lamp'),'#7cb9ff','#ac9cff'];let price=[line('收盤',c,colors[0]),line('MA20',TA.sma(c,20),colors[1]),line('MA60',TA.sma(c,60),colors[2])],ind=[];
  if(mode==='bb'){const b=TA.bollinger(c);price.push(line('上軌',b.upper,'#46e0a8'),line('下軌',b.lower,'#ff6b73'))}
  if(mode==='rsi')ind=[line('RSI14',TA.rsi(c),colors[0]),line('70',c.map(()=>70),'#ff6b73'),line('30',c.map(()=>30),'#46e0a8')];
  if(mode==='macd'){const m=TA.macd(c);ind=[line('DIF',m.dif,colors[0]),line('Signal',m.signal,colors[1]),{type:'bar',label:'DIF−Signal',data:m.hist,backgroundColor:m.hist.map(v=>colOf(v))}]}
  if(mode==='kd'){const k=TA.kd(c,h.high,h.low);ind=[line('K',k.k,colors[0]),line('D',k.d,colors[1])]}
  detailCharts.push(newChart('#priceChart',h.dates,price));detailCharts.push(newChart('#volumeChart',h.dates,[{type:'bar',label:'成交量',data:h.volume,backgroundColor:'#8889b488'}]));$('#indicatorBox').hidden=mode==='bb';if(ind.length)detailCharts.push(newChart('#indicatorChart',h.dates,ind))
}
async function showInstitution(name){activeSymbol=null;const current=D.institutional.rows.find(r=>r.name===name);showDialog(name);if(!current){$('#detailContent').textContent='查無法人資料。';return}const token=renderToken;const history=(D.institutional.history||[]).slice(-5),rows=history.map(p=>({date:p.date,row:p.rows.find(r=>r.name===name)})).filter(p=>p.row);$('#detailContent').innerHTML=`<div class="stats">${stat('買進（億元）',fmt(current.buy))}${stat('賣出（億元）',fmt(current.sell))}${stat('買賣超（億元）',fmt(current.net))}</div>${ageHTML(D.institutional,D.institutional.date)}<p>前 ${current.samples||0} 個交易日平均買賣超：${fmt(current.avg20)} 億元${current.samples<20?'（未滿20日）':''}</p><div class="detail-chart"><canvas id="instChart"></canvas></div><div class="table-scroll"><table><thead><tr><th>交易日</th><th>買進</th><th>賣出</th><th>買賣超</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${p.date}</td><td>${fmt(p.row.buy)}</td><td>${fmt(p.row.sell)}</td><td>${fmt(p.row.net)}</td></tr>`).join('')}</tbody></table></div>`;try{await ensureChart();if(token!==renderToken)return;detailCharts.push(newChart('#instChart',rows.map(p=>p.date),[{type:'bar',label:'近5交易日買賣超（億元）',data:rows.map(p=>p.row.net),backgroundColor:rows.map(p=>colOf(p.row.net))}]))}catch{$('#dialogStatus').textContent='圖表未載入，可閱讀下方明細。'}}
async function showReport(date){activeSymbol=null;showDialog(date+' 收盤報告');const token=renderToken;$('#detailContent').textContent='載入中…';if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){ $('#detailContent').textContent='無效日期';return}try{const r=await fetch(`reports/${date}.json`);if(!r.ok)throw Error();const report=await r.json();if(token!==renderToken)return;$('#detailContent').innerHTML=`<p class="ai-label">AI 生成，僅供參考</p>${report.ai?.daily?.length?report.ai.daily.map(c=>`<p>${esc(c.text)}</p>`).join(''):'<p>當日未產生 AI 日報。</p>'}<p class="note">封存於 ${esc(report.updated_at)}</p><div class="table-scroll"><table><thead><tr><th>標的</th><th>收盤</th><th>漲跌幅</th><th>行情日</th></tr></thead><tbody>${(report.quotes||[]).map(q=>`<tr><td>${esc(q.name)}</td><td>${fmt(q.price)}</td><td>${fmt(q.pct)}%</td><td>${esc(q.date)}</td></tr>`).join('')}</tbody></table></div>`}catch{if(token===renderToken)$('#detailContent').textContent='報告尚未下載或無法讀取。'}}
function route(){if(!D)return;let key;try{key=decodeURIComponent(location.hash.slice(1))}catch{return}if(!key){if(dialog.open){destroyDetails();dialog.close();document.body.classList.remove('modal-open')}return}if(key.startsWith('institutional:'))showInstitution(key.slice(14));else if(key.startsWith('report:'))showReport(key.slice(7));else showSymbol(findSymbol(key)||key)}
window.addEventListener('hashchange',route);
document.addEventListener('click',e=>{const s=e.target.closest('[data-symbol]'),i=e.target.closest('[data-inst]'),r=e.target.closest('[data-report]'),w=e.target.closest('[data-remove-watch]');if(s)openHash(panelKey(s.dataset.symbol));else if(i)openHash('institutional:'+i.dataset.inst);else if(r)openHash('report:'+r.dataset.report);else if(w){watch=watch.filter(x=>x!==w.dataset.removeWatch);persist('watchlist',watch);renderWatch()}});
document.addEventListener('change',e=>{if(e.target.matches('[data-compare]'))toggleCompare(e.target.dataset.compare,e.target.checked)});
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(dialog.open&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();navigate(e.key==='ArrowRight'?1:-1)}else if(e.target.matches('[role="button"]')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.click()}else if(['ArrowDown','ArrowUp'].includes(e.key)&&e.target.matches('[data-symbol],[data-inst]')){const nodes=[...document.querySelectorAll('[data-symbol],[data-inst]')].filter(n=>n.getClientRects().length);const index=nodes.indexOf(e.target),next=nodes[index+(e.key==='ArrowDown'?1:-1)];if(next){e.preventDefault();next.focus()}}});
function renderDepth(){const b=D.breadth;$('#breadth').textContent=b?.count?`漲 ${b.advances}・跌 ${b.declines}・平 ${b.flat}（${b.scope}，${b.date}）`:'漲跌家數暫缺';const m=D.margin||{rows:[]},f=D.futures||{rows:[]};$('#margin').innerHTML=m.rows.map(r=>`<p>${esc(r.name)}<br><b>${fmt(r.balance,0)}</b> <span class="${cls(r.change)}">${sg(r.change)}${fmt(r.change,0)}</span></p>`).join('')||'<p class="flat">尚無資料</p>';$('#margin').insertAdjacentHTML('beforeend',ageHTML(m,m.date));$('#futures').innerHTML=f.rows.length?`<div class="table-scroll"><table><thead><tr><th>身份</th><th>多單</th><th>空單</th><th>淨額（口）</th></tr></thead><tbody>${f.rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${fmt(r.long,0)}</td><td>${fmt(r.short,0)}</td><td class="${cls(r.net)}">${fmt(r.net,0)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="flat">尚無資料</p>';$('#futures').insertAdjacentHTML('beforeend',ageHTML(f,f.date));const sectors=D.sectors||{};$('#sectors').innerHTML=(sectors.rows||[]).map(r=>`<div class="heat ${cls(r.pct)}"><span>${esc(r.name)}</span><strong>${sg(r.pct)}${fmt(r.pct)}%</strong><span class="note">${fmt(r.price)}</span></div>`).join('')||'<p>尚無資料</p>';$('#sectorAge').textContent=age(sectors,sectors.date);$('#sectorAge').classList.toggle('stale',old(sectors,sectors.date));
  const supplemental=D.supplemental||{};$('#taiwanMacro').innerHTML=(supplemental.macro||[]).map(m=>`<div class="event"><b>${esc(m.name)} ${fmt(m.value)}${esc(m.unit||'')}</b><div class="note">資料期 ${esc(m.date)}・<a href="${esc(safeURL(m.url))}" target="_blank" rel="noopener">${esc(m.source)}</a></div></div>`).join('')||'<p class="note">景氣信號、出口訂單、CPI 與央行利率尚未接入已驗證來源。此處不填入推估數值。</p>';
  const events=[...(D.events?.rows||[]),...(supplemental.events||[])].filter(e=>e.date>=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei'}).format(new Date())).sort((a,b)=>a.date.localeCompare(b.date));$('#events').innerHTML=events.slice(0,25).map(e=>`<div class="event"><span class="note">${esc(e.date)}・${esc(e.type||'事件')}</span><br><a href="${esc(safeURL(e.url))}" target="_blank" rel="noopener">${esc(e.title)}</a><div class="note">${esc(e.source||'')}</div></div>`).join('')||'<p class="note">目前沒有已確認的未來事件。</p>';$('#events').insertAdjacentHTML('beforeend','<p class="note">自動來源：上市除權息；法說會、央行、FOMC 及經濟數據日期需另補經核對的事件資料。</p>'+ageHTML(D.events));
  $('#anomalies').innerHTML=(D.anomalies||[]).slice(0,20).map(a=>`<div class="event" role="button" tabindex="0" data-symbol="${esc(a.symbol)}"><b>${esc(a.name)}</b><div class="note">${esc(a.reasons.join('；'))}・${esc(a.date)}</div></div>`).join('')||'<p class="note">目前沒有符合門檻的標的。</p>';$('#reports').innerHTML=(D.reports||[]).map(r=>`<button data-report="${esc(r.date)}">${esc(r.date)} 收盤報告</button>`).join(' ')||'<p class="note">收盤報告在台灣時間 18:00 後、有當日加權指數資料時保存；每日保留第一份快照。</p>';
}
async function fetchData(){
  if('DecompressionStream' in window){try{const r=await fetch('data.json.gz',{cache:'no-cache'});if(!r.ok)throw Error();const d=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();if(!Array.isArray(d.quotes))throw Error();return d}catch{}}
  const r=await fetch('data.json',{cache:'no-cache'});if(!r.ok)throw Error();return r.json();
}
async function loadData(refresh=false){const d=await fetchData();if(refresh&&D&&d.updated_at===D.updated_at)return;if(!Array.isArray(d.quotes))throw Error();$('#err').style.display='none';D={histories:{},institutional:{rows:[]},rankings:{},macro:[],news:[],...d};status();hero();ranges();inst();macro();ranks();news();renderAll();renderAI();renderWatch();renderCompare();renderDepth();updateAges();new IntersectionObserver((entries,obs)=>{if(entries.some(e=>e.isIntersecting)){drawChart();obs.disconnect()}}).observe($('#cT'));route();$('#pageStatus').textContent=navigator.onLine?'行情為日線資料，各市場日期可能不同。':'離線中，顯示最後成功快取的資料。'}
loadData().catch(()=>{const e=$('#err');e.style.display='block';e.innerHTML='<b>目前沒有可用資料</b><br>資料暫時無法載入，請稍後重試；離線瀏覽須先在線上成功開啟過一次。';$('#st span').textContent='資料未載入'});
window.addEventListener('offline',()=>$('#pageStatus').textContent='離線中，顯示最後成功快取的資料。');window.addEventListener('online',()=>{refreshData();});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{$('#pageStatus').textContent='離線功能註冊失敗；一般瀏覽仍可使用。'});

let refreshPending=false;
async function refreshData(){
  if(refreshPending||document.visibilityState==='hidden'||!navigator.onLine)return;
  refreshPending=true;
  try{await loadData(true)}catch{$('#pageStatus').textContent=D?'更新暫時失敗，保留上次成功資料，稍後自動重試。':'資料暫時無法載入，稍後自動重試。'}
  finally{refreshPending=false}
}
setInterval(()=>{if(D){status();updateAges()}},60000);
setInterval(refreshData,5*60*1000);
window.addEventListener('focus',refreshData);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshData()});
