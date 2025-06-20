// script.js
console.log("script.js 読み込まれた");

const supabaseUrl = 'https://fnjmdbuwptysqwjtovzn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuam1kYnV3cHR5c3F3anRvdnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNjgzNTYsImV4cCI6MjA2MzY0NDM1Nn0.Xk4r6cjgirCg7vRVr_K-JHA9xuA_owpzpV98GGOAExI';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let ytymEvents = [];
let currentEditId = null;

function createMonthBoxes() {
  const container = document.getElementById('calContainer');
  container.innerHTML = '';
  for (let m = 1; m <= 12; m++) {
    const box = document.createElement('div');
    box.className = 'month-box';

    const title = document.createElement('div');
    title.className = 'month-title';
    title.textContent = `${m}月`;

    const grid = document.createElement('div');
    grid.className = 'dot-grid';
    grid.id = `month-${m}`;
    grid.style.position = 'relative';

    box.appendChild(title);
    box.appendChild(grid);
    container.appendChild(box);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  createMonthBoxes();
  document.getElementById('ytym-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('modify-save-btn').addEventListener('click', saveModifiedEvent);
  document.getElementById('modify-cancel-btn').addEventListener('click', closeModifyModal);
  await loadEvents();
});

async function handleFormSubmit(e) {
  e.preventDefault();
  const date = document.getElementById('ytym-date').value;
  const title = document.getElementById('ytym-title').value;
  const details = document.getElementById('ytym-details').value;
  const file = document.getElementById('event-image').files[0];

  console.log("送信するデータ", { date, title, details, file });

  let fileUrl = '';
  if (file) {
    const filename = `${Date.now()}_${file.name.replace(/[^\w.]/g, '_')}`;
    const { data, error } = await supabase.storage.from('media').upload(filename, file, { upsert: true });
    if (error) {
      alert('アップロード失敗: ' + error.message);
      return;
    }
    fileUrl = supabase.storage.from('media').getPublicUrl(filename).data.publicUrl;
  }

  const { error: insertError } = await supabase.from('ytym').insert([{ date, title, details, file_url: fileUrl }]);
  if (insertError) {
    alert('登録失敗: ' + insertError.message);
    return;
  }

  document.getElementById('ytym-form').reset();
  await loadEvents();
}

async function loadEvents() {
  const { data, error } = await supabase.from('ytym').select('*').order('date', { ascending: true });
  if (error) {
    alert('イベント読み込み失敗: ' + error.message);
    return;
  }
  ytymEvents = data;
  renderDots();
}

function renderDots() {
  for (let m = 1; m <= 12; m++) {
    const grid = document.getElementById(`month-${m}`);
    if (!grid) continue;
    grid.innerHTML = '';

    const events = ytymEvents.filter(ev => new Date(ev.date).getMonth() + 1 === m);
    const byDay = {};
    events.forEach(ev => {
      const day = new Date(ev.date).getDate();
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(ev);
    });

    for (const [day, list] of Object.entries(byDay)) {
      list.forEach((ev, i) => {
        const dot = document.createElement('div');
        dot.className = 'event-dot';
        dot.style.position = 'absolute';
        dot.style.left = `${((day - 1) % 10) * 14 + i * 4}px`;
        dot.style.top = `${Math.floor((day - 1) / 10) * 14}px`;
        dot.onclick = () => showTooltip(ev.date);
        grid.appendChild(dot);
      });
    }
  }
}

function showTooltip(dateStr) {
  const tooltip = document.getElementById('tooltip');
  const list = ytymEvents.filter(ev => ev.date === dateStr);
  tooltip.innerHTML = list.map(ev => `
    <div class="tooltip-content">
      <strong>${ev.title}</strong><br>
      <small>${ev.date}</small><br>
      <p>${ev.details}</p>
      ${ev.file_url ?
        ev.file_url.match(/\.(mp4|webm)$/i) ?
        `<video src="${ev.file_url}" controls style="width:100%;border-radius:6px;"></video>` :
        `<img src="${ev.file_url}" style="width:100%;border-radius:6px;">`
      : ''}
      <button onclick="editEvent(${ev.id})">編集</button>
      <button onclick="deleteEvent(${ev.id})">削除</button>
    </div>
  `).join('');
  tooltip.style.display = 'block';
}

function editEvent(id) {
  const ev = ytymEvents.find(e => e.id === id);
  if (!ev) return;
  document.getElementById('modify-date').value = ev.date;
  document.getElementById('modify-title').value = ev.title;
  document.getElementById('modify-details').value = ev.details;
  currentEditId = id;
  document.getElementById('modify-modal').style.display = 'block';
}

async function saveModifiedEvent() {
  if (!currentEditId) return;
  const date = document.getElementById('modify-date').value;
  const title = document.getElementById('modify-title').value;
  const details = document.getElementById('modify-details').value;
  const file = document.getElementById('modify-image').files[0];
  let fileUrl = '';
  if (file) {
    const filename = `${Date.now()}_${file.name.replace(/[^\w.]/g, '_')}`;
    const { data, error } = await supabase.storage.from('media').upload(filename, file, { upsert: true });
    if (error) {
      alert('ファイル更新失敗: ' + error.message);
      return;
    }
    fileUrl = supabase.storage.from('media').getPublicUrl(filename).data.publicUrl;
  }
  const updateObj = { date, title, details };
  if (fileUrl) updateObj.file_url = fileUrl;
  const { error } = await supabase.from('ytym').update(updateObj).eq('id', currentEditId);
  if (error) {
    alert('更新失敗: ' + error.message);
    return;
  }
  document.getElementById('modify-modal').style.display = 'none';
  await loadEvents();
}

async function deleteEvent(id) {
  const { error } = await supabase.from('ytym').delete().eq('id', id);
  if (error) {
    alert('削除失敗: ' + error.message);
    return;
  }
  await loadEvents();
}

function closeModifyModal() {
  document.getElementById('modify-modal').style.display = 'none';
  currentEditId = null;
}

window.addEventListener('click', e => {
  if (!e.target.closest('.event-dot') && !e.target.closest('.tooltip-content') && !e.target.closest('#modify-modal')) {
    document.getElementById('tooltip').style.display = 'none';
  }
});
