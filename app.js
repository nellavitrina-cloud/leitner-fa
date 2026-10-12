'use strict';
const $ = id => document.getElementById(id);
const KEY = 'vazhe-vazhe-progress-v1';
const ids = CARDS.map(c => c.id);
const escapeHTML = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = n => n.toLocaleString('fa-IR');
let state = Leitner.fresh(), undoState = null, current = null, revealed = false, page = 0, completed = new Set();
let storageBlocked = false;
function warning(message) { $('storageWarning').hidden = false; $('storageWarning').textContent = message; $('saveStatus').textContent = 'ذخیره‌سازی نیاز به توجه دارد'; }
try { const raw = localStorage.getItem(KEY); if (raw) state = Leitner.validate(JSON.parse(raw), ids); }
catch (error) { storageBlocked = true; warning('خواندن پیشرفت ممکن نشد. دادهٔ قبلی بازنویسی نمی‌شود؛ برای ادامه از پشتیبان معتبر یا «شروع دوباره» استفاده کنید.'); }
function save() {
  if (storageBlocked) return;
  try { localStorage.setItem(KEY, JSON.stringify(state)); $('saveStatus').textContent = 'ذخیره در همین مرورگر'; }
  catch (error) { warning('ذخیره در مرورگر ممکن نیست. پیش از بستن صفحه پشتیبان بگیرید.'); }
}
let toastTimer;
function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => $('toast').hidden = true, 3500); }
function progress(card) { return state.cards[card.id] || Leitner.initial(); }
function dayKey(time) { return new Date(time).toLocaleDateString('en-CA'); }
function queue() {
  const filters = { mode:$('mode').value, search:$('search').value, type:$('type').value, box:$('boxFilter').value };
  return CARDS.filter(c => !completed.has(c.id) && Leitner.matches(c, state, filters)).sort((a,b) => Number(progress(b).weak) - Number(progress(a).weak) || progress(a).due - progress(b).due);
}
function details(card) {
  return `<div class="meaning">${escapeHTML(card.fa)}</div>${card.note ? `<p class="note">${escapeHTML(card.note)}</p>` : ''}` + card.examples.map(e => `<div class="example"><small>${escapeHTML(e.tense)}</small><p class="en" dir="ltr">${escapeHTML(e.en)}</p><p class="fa">${escapeHTML(e.fa)}</p></div>`).join('');
}
function renderReview() {
  const list = queue();
  current = list.find(c => c.id === current?.id) || list[0] || null;
  $('dueCount').textContent = number(CARDS.filter(c => Leitner.matches(c,state,{mode:'due'})).length);
  $('todayCount').textContent = number(state.history.filter(h => dayKey(h.at) === dayKey(Date.now())).length);
  $('queueCount').textContent = `${number(list.length)} کارت در صف این نوبت`;
  $('sessionInfo').textContent = `${number(completed.size)} کارت در این نوبت مرور شد.`;
  $('undo').disabled = !undoState;
  $('boxes').innerHTML = [1,2,3,4,5].map(box => `<div class="box"><label>جعبهٔ ${number(box)}</label><strong>${number(CARDS.filter(c => progress(c).box === box).length)}</strong><small>فاصلهٔ مرور: ${number(Leitner.intervals[box-1])} روز</small></div>`).join('');
  if (!current) {
    $('study').innerHTML = '<div class="empty"><h2>کارت دیگری در این صف نیست.</h2><p>فیلترها یا مسیر مرور را تغییر دهید، یا نوبت تازه‌ای آغاز کنید.</p><button id="restart">نوبت تازه</button></div>';
    $('restart').onclick = () => { completed.clear(); revealed = false; renderReview(); };
    return;
  }
  $('study').innerHTML = `<div class="studyhead"><span>${escapeHTML(current.type)}</span><span>جعبهٔ ${number(progress(current).box)}</span></div><div class="cardbody"><div class="wordrow" dir="ltr"><h2 class="word">${escapeHTML(current.word)}</h2><button id="speak" class="speaker" aria-label="تلفظ واژه">♪</button></div>${revealed ? details(current) : '<p class="prompt">معنی این واژه چیست؟</p><div class="revealarea"><button class="primary" id="reveal">نمایش معنی و مثال‌ها</button></div>'}</div>${revealed ? '<div class="actions"><button id="wrong" class="danger">بلد نیستم</button><button id="correct" class="primary">بلدم</button></div>' : ''}`;
  $('speak').onclick = () => {
    if (!('speechSynthesis' in window)) return toast('تلفظ در این مرورگر پشتیبانی نمی‌شود.');
    speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(current.word); utterance.lang = 'en-US'; speechSynthesis.speak(utterance);
  };
  if (!revealed) $('reveal').onclick = () => { revealed = true; renderReview(); };
  else { $('wrong').onclick = () => answer(false); $('correct').onclick = () => answer(true); }
}
function answer(correct) {
  if (!current || !revealed) return;
  undoState = { state: JSON.parse(JSON.stringify(state)), completed: [...completed], id: current.id };
  state = Leitner.answer(state,current.id,correct); completed.add(current.id); current = null; revealed = false; save(); render();
}
$('undo').onclick = () => {
  if (!undoState) return;
  state = undoState.state; completed = new Set(undoState.completed); current = CARDS.find(c => c.id === undoState.id); undoState = null; revealed = false; save(); render();
};
function renderLibrary() {
  const list = CARDS.filter(c => Leitner.matches(c,state,{search:$('libSearch').value,type:$('libType').value,mode:$('libStatus').value}));
  const pages = Math.max(1,Math.ceil(list.length/24)); page = Math.min(page,pages-1);
  $('libCount').textContent = `${number(list.length)} واژه`;
  $('wordList').innerHTML = list.slice(page*24,page*24+24).map(c => `<button class="worditem panel" data-card="${escapeHTML(c.id)}"><b dir="ltr">${escapeHTML(c.word)}</b><span>${escapeHTML(c.fa)}</span><small>${escapeHTML(c.type)} · جعبهٔ ${number(progress(c).box)}</small></button>`).join('') || '<p>واژه‌ای پیدا نشد.</p>';
  $('pageInfo').textContent = `${number(page+1)} / ${number(pages)}`; $('prev').disabled = page === 0; $('next').disabled = page >= pages-1;
  $('wordList').querySelectorAll('[data-card]').forEach(button => button.onclick = () => { const c = CARDS.find(c => c.id === button.dataset.card); $('detailBody').innerHTML = `<h2 dir="ltr">${escapeHTML(c.word)}</h2>${details(c)}`; $('detail').showModal(); });
}
function renderStats() {
  const count = state.history.length, correct = state.history.filter(h => h.correct).length;
  $('metrics').innerHTML = [[CARDS.length,'کل واژه‌ها'],[CARDS.filter(c => progress(c).seen).length,'مرورشده'],[count,'کل مرورها'],[count ? Math.round(correct/count*100):0,'درصد پاسخ درست']].map(([n,t]) => `<div class="panel metric"><b>${number(n)}</b><span>${t}</span></div>`).join('');
  const days = Array.from({length:7},(_,i) => { const d = new Date(); d.setDate(d.getDate()-6+i); return { d, n:state.history.filter(h => dayKey(h.at) === dayKey(d)).length }; });
  const max = Math.max(1,...days.map(d => d.n));
  $('dayChart').innerHTML = days.map(({d,n}) => `<div class="day">${number(n)}<div class="daybar" style="height:${Math.max(3,n/max*90)}px"></div>${d.toLocaleDateString('fa-IR',{weekday:'short'})}</div>`).join('');
  $('statBars').innerHTML = [1,2,3,4,5].map(b => { const n = CARDS.filter(c => progress(c).box === b).length; return `<div><div class="barlabel"><span>جعبهٔ ${number(b)}</span><span>${number(n)}</span></div><div class="bartrack"><div class="barfill" style="width:${CARDS.length ? n/CARDS.length*100:0}%"></div></div></div>`; }).join('');
}
function render() { renderReview(); renderLibrary(); renderStats(); }
document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => {
  document.querySelectorAll('main > section').forEach(section => section.hidden = section.id !== button.dataset.tab);
  document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active',b === button); if (b === button) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); }); render();
});
['mode','search','type','boxFilter'].forEach(id => $(id).addEventListener(id === 'search' ? 'input':'change',() => { current = null; revealed = false; completed.clear(); renderReview(); }));
$('clearFilters').onclick = () => { $('mode').value = 'due'; $('search').value = ''; $('type').value = $('boxFilter').value = 'all'; current = null; revealed = false; completed.clear(); renderReview(); };
['libSearch','libType','libStatus'].forEach(id => $(id).addEventListener(id === 'libSearch' ? 'input':'change',() => { page = 0; renderLibrary(); }));
$('prev').onclick = () => { page--; renderLibrary(); }; $('next').onclick = () => { page++; renderLibrary(); };
$('closeDetail').onclick = () => $('detail').close();
$('export').onclick = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})); const a = document.createElement('a'); a.href = url; a.download = 'leitner-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000); };
$('import').onclick = () => $('importFile').click();
$('importFile').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 10*1024*1024) throw Error('Too large');
    const next = Leitner.validate(JSON.parse(await file.text()),ids);
    if (!confirm('پیشرفت فعلی با اطلاعات پشتیبان جایگزین شود؟')) return;
    state = next; storageBlocked = false; $('storageWarning').hidden = true; undoState = null; completed.clear(); current = null; revealed = false; save(); render(); toast('پشتیبان بازیابی شد.');
  } catch (error) { toast('فایل پشتیبان معتبر نیست یا با واژه‌های این نسخه سازگار نیست.'); }
  finally { event.target.value = ''; }
};
$('reset').onclick = () => { if (!confirm('همهٔ پیشرفت‌ها پاک شود؟ ابتدا می‌توانید پشتیبان بگیرید.')) return; state = Leitner.fresh(); storageBlocked = false; $('storageWarning').hidden = true; undoState = null; completed.clear(); current = null; revealed = false; save(); render(); };
document.addEventListener('keydown',event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || /INPUT|SELECT|TEXTAREA|BUTTON/.test(event.target.tagName) || event.target.isContentEditable || $('detail').open || $('review').hidden) return;
  const key = event.key.toLowerCase(); const action = {r:'reveal','1':'wrong','2':'correct',z:'undo'}[key]; if (action && $(action)) { event.preventDefault(); $(action).click(); }
});
let deferredPrompt;
window.addEventListener('beforeinstallprompt',event => { event.preventDefault(); deferredPrompt = event; $('installBtn').style.display = 'inline-block'; });
$('installBtn').onclick = async () => { if (!deferredPrompt) return; const prompt = deferredPrompt; deferredPrompt = null; $('installBtn').style.display = 'none'; try { await prompt.prompt(); await prompt.userChoice; } catch (error) { toast('نصب ممکن نشد؛ از منوی مرورگر استفاده کنید.'); } };
window.addEventListener('appinstalled',() => { deferredPrompt = null; $('installBtn').style.display = 'none'; });
if ('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load',() => navigator.serviceWorker.register('./sw.js').catch(() => toast('حالت آفلاین فعال نشد؛ اتصال و تنظیمات مرورگر را بررسی کنید.')));
document.addEventListener('visibilitychange',() => { if (!document.hidden) render(); });
setInterval(() => { if (!document.hidden) render(); },60000);
$('vocabularySummary').textContent = `${number(CARDS.length)} واژه، همراه با معنی و مثال‌های ترجمه‌شده.`;
render();
