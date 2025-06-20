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

  adjustMonthBoxSize();
}

function adjustMonthBoxSize() {
  const isMobile = window.innerWidth <= 768;
  const boxes = document.querySelectorAll('.month-box');
  boxes.forEach(box => {
    if (isMobile) {
      box.style.width = '';
      box.style.height = '';
    } else {
      box.style.width = '150px';
      box.style.height = '150px';
    }
  });
}

window.addEventListener('resize', adjustMonthBoxSize);

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
  const files = document.getElementById('event-image').files;

  const fileUrls = [];
  for (let file of files) {
    const filename = `${Date.now()}_${file.name.replace(/[^\w.]/g, '_')}`;
    const { data, error } = await supabase.storage.from('media').upload(filename, file, { upsert: true });
    if (error) {
      alert('アップロード失敗: ' + error.message);
      return;
    }
    const url = supabase.storage.from('media').getPublicUrl(filename).data.publicUrl;
    fileUrls.push(url);
  }

  const { error: insertError } = await supabase.from('ytym').insert([{ date, title, details, file_url: JSON.stringify(fileUrls) }]);
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
    alert('読み込み失敗: ' + error.message);
    return;
  }
  ytymEvents = data;
  renderDots();
  populateYearOptions();
}

function renderDots(filtered = null) {
  const events = filtered || ytymEvents;
  for (let m = 1; m <= 12; m++) {
    const grid = document.getElementById(`month-${m}`);
    if (!grid) continue;
    grid.innerHTML = '';

    const monthly = events.filter(ev => new Date(ev.date).getMonth() + 1 === m);
    const byDay = {};
    monthly.forEach(ev => {
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
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          showTooltip(ev.date);
        });
        grid.appendChild(dot);
      });
    }
}

function showTooltip(dateStr) {
  const tooltip = document.getElementById('tooltip');
  const list = ytymEvents.filter(ev => ev.date === dateStr);
  tooltip.innerHTML = list.map(ev => {
    const files = ev.file_url ? JSON.parse(ev.file_url) : [];
    const mediaHTML = files.map(url => {
      return url.match(/\.(mp4|webm)$/i)
        ? `<video src="${url}" controls style="width:100%;border-radius:6px;"></video>`
        : `<img src="${url}" style="width:100%;border-radius:6px;">`;
    }).join('');
    return `
      <div class="tooltip-content">
        <strong>${ev.title}</strong><br>
        <small>${ev.date}</small><br>
        <p>${ev.details}</p>
        ${mediaHTML}
        <button onclick="editEvent(${ev.id})">編集</button>
        <button onclick="deleteEvent(${ev.id})">削除</button>
      </div>
    `;
  }).join('');
  tooltip.style.display = 'block';
}

function populateYearOptions() {
  const years = [...new Set(ytymEvents.map(ev => new Date(ev.date).getFullYear()))].sort();
  const select = document.getElementById('yearFilter');
  select.innerHTML = '<option value="all">すべての年</option>';
  years.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = `${y}年`;
    select.appendChild(opt);
  });
}

document.addEventListener('click', (e) => {
  const tooltip = document.getElementById('tooltip');
  const isTooltip = e.target.closest('.tooltip-content');
  const isDot = e.target.closest('.event-dot');
  const isModal = e.target.closest('#modify-modal');
  if (!isTooltip && !isDot && !isModal) {
    tooltip.style.display = 'none';
  }
});

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
  const files = document.getElementById('modify-image').files;

  let fileUrls = [];
  if (files.length > 0) {
    for (let file of files) {
      const filename = `${Date.now()}_${file.name.replace(/[^\w.]/g, '_')}`;
      const { data, error } = await supabase.storage.from('media').upload(filename, file, { upsert: true });
      if (error) {
        alert('アップロード失敗: ' + error.message);
        return;
      }
      const url = supabase.storage.from('media').getPublicUrl(filename).data.publicUrl;
      fileUrls.push(url);
    }
  }

  const updateObj = { date, title, details };
  if (fileUrls.length > 0) updateObj.file_url = JSON.stringify(fileUrls);

  const { error } = await supabase.from('ytym').update(updateObj).eq('id', currentEditId);
  if (error) {
    alert('更新失敗: ' + error.message);
    return;
  }

  document.getElementById('modify-modal').style.display = 'none';
  document.getElementById('tooltip').style.display = 'none';
  await loadEvents();
}

async function deleteEvent(id) {
  if (!confirm('本当に削除しますか？')) return;
  const { error } = await supabase.from('ytym').delete().eq('id', id);
  if (error) {
    alert('削除失敗: ' + error.message);
    return;
  }
  alert('削除しました');
  document.getElementById('tooltip').style.display = 'none';
  await loadEvents();
}
