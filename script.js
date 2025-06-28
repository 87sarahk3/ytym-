// script.js（完全修正・全体コード）
console.log("script.js 読み込まれた");

const supabaseUrl = 'https://fnjmdbuwptysqwjtovzn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuam1kYnV3cHR5c3F3anRvdnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNjgzNTYsImV4cCI6MjA2MzY0NDM1Nn0.Xk4r6cjgirCg7vRVr_K-JHA9xuA_owpzpV98GGOAExI';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let ytymEvents = [];
let currentEditId = null;

const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function createMonthBoxes() {
  const container = document.getElementById('calendar');
  container.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const box = document.createElement('div');
    box.className = 'month-box';
    box.dataset.month = i + 1;
    box.innerHTML = `<div class="month-title">${monthNames[i]}</div><div class="dot-container"></div>`;
    container.appendChild(box);
  }
}

async function loadYtym() {
  const { data, error } = await supabase.from('ytym').select('*').order('date');
  if (error) return console.error('読み込みエラー:', error);
  ytymEvents = data;
  renderDots();
}

function renderDots() {
  document.querySelectorAll('.dot-container').forEach(d => d.innerHTML = '');
  const grouped = {};
  ytymEvents.forEach(event => {
    const month = parseInt(event.date.slice(4, 6));
    const key = `${event.date}-${month}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(event);
  });

  for (const key in grouped) {
    const events = grouped[key].sort((a, b) => a.date.localeCompare(b.date));
    const sample = events[0];
    const month = parseInt(sample.date.slice(4, 6));
    const container = document.querySelector(`.month-box[data-month='${month}'] .dot-container`);
    events.forEach((e, idx) => {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.style.left = `${(idx % 10) * 12}px`;
      dot.style.top = `${Math.floor(idx / 10) * 12}px`;
      dot.title = e.title;
      dot.onclick = () => showDetailGroup(grouped[key]);
      container.appendChild(dot);
    });
  }
}

function showDetailGroup(events) {
  const overlay = document.getElementById('detail-overlay');
  const container = document.getElementById('detail-container');
  container.innerHTML = '';
  events.forEach(e => {
    const div = document.createElement('div');
    div.className = 'detail-block';
    div.innerHTML = `
      <h4>${e.title}</h4>
      <p>${e.date}</p>
      <p>${e.description || ''}</p>
      ${(e.image_urls || []).map(url => `<img src="${url}" width="100">`).join('')}
      <button onclick="startEdit('${e.id}')">編集</button>
      <button onclick="deleteYtym('${e.id}')">削除</button>
    `;
    container.appendChild(div);
  });
  overlay.style.display = 'block';
}

document.getElementById('detail-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'detail-overlay') e.target.style.display = 'none';
});

async function saveYtym() {
  const date = document.getElementById('date').value;
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const files = document.getElementById('image').files;
  let image_urls = [];

  for (const file of files) {
    const { data, error } = await supabase.storage.from('media').upload(`ytym/${Date.now()}_${file.name}`, file);
    if (!error) {
      image_urls.push(`${supabaseUrl}/storage/v1/object/public/media/${data.path}`);
    } else {
      console.error('アップロード失敗:', error);
    }
  }

  if (currentEditId) {
    const original = ytymEvents.find(e => e.id === currentEditId);
    const updated = {
      date,
      title,
      description,
      image_urls: original.image_urls.concat(image_urls)
    };
    await supabase.from('ytym').update(updated).eq('id', currentEditId);
    currentEditId = null;
  } else {
    const entry = { date, title, description, image_urls };
    await supabase.from('ytym').insert([entry]);
  }

  clearForm();
  loadYtym();
  document.getElementById('detail-overlay').style.display = 'none';
}

function startEdit(id) {
  const event = ytymEvents.find(e => e.id === id);
  if (!event) return;
  document.getElementById('date').value = event.date;
  document.getElementById('title').value = event.title;
  document.getElementById('description').value = event.description;
  document.getElementById('image').value = '';
  currentEditId = id;
}

async function deleteYtym(id) {
  if (!confirm('本当に削除しますか？')) return;
  await supabase.from('ytym').delete().eq('id', id);
  loadYtym();
  document.getElementById('detail-overlay').style.display = 'none';
}

function clearForm() {
  document.getElementById('date').value = '';
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  document.getElementById('image').value = '';
}

document.getElementById('save-btn').addEventListener('click', saveYtym);
window.onload = () => {
  createMonthBoxes();
  loadYtym();
};
