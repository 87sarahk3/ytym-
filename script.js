// script.js - 修正版（「ytym年表」に対応）

console.log("script.js 読み込まれた");

const supabaseUrl = 'https://fnjmdbuwptysqwjtovzn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let ytymEvents = [];
let currentEditId = null;

// Supabaseからデータ取得
async function loadYtym() {
  const { data, error } = await supabase.from('ytym').select('*').order('date');
  if (error) return console.error('読み込みエラー:', error);
  ytymEvents = data;
  renderCalendar();
}

// カレンダー表示
function renderCalendar() {
  const container = document.getElementById('ytym-calendar');
  if (!container) {
    console.error("要素 #ytym-calendar が見つかりません");
    return;
  }
  container.innerHTML = '';
  for (let m = 1; m <= 12; m++) {
    const monthBox = document.createElement('div');
    monthBox.className = 'month-box';

    const title = document.createElement('div');
    title.className = 'month-title';
    title.textContent = `${m}月`;

    const dotContainer = document.createElement('div');
    dotContainer.className = 'dot-container';

    const events = ytymEvents.filter(e => new Date(e.date).getMonth() + 1 === m);
    events.forEach(event => {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.title = `${event.date}: ${event.title}`;
      dot.onclick = () => showDetails(event.date);
      dotContainer.appendChild(dot);
    });

    monthBox.appendChild(title);
    monthBox.appendChild(dotContainer);
    container.appendChild(monthBox);
  }
}

// 詳細表示
function showDetails(date) {
  const overlay = document.getElementById('detail-overlay');
  const detailContainer = document.getElementById('detail-container');
  detailContainer.innerHTML = '';

  const events = ytymEvents.filter(e => e.date === date);
  events.forEach(e => {
    const block = document.createElement('div');
    block.className = 'detail-block';
    block.innerHTML = `
      <p><strong>${e.date}</strong>: ${e.title}</p>
      <p>${e.description}</p>
    `;
    if (e.image_urls && e.image_urls.length) {
      e.image_urls.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        block.appendChild(img);
      });
    }
    detailContainer.appendChild(block);
  });

  overlay.style.display = 'flex';
  overlay.onclick = () => (overlay.style.display = 'none');
}

// 保存処理
async function saveYtym() {
  const date = document.getElementById('date').value;
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const files = document.getElementById('image').files;

  let image_urls = [];
  for (const file of files) {
    const { data, error } = await supabase.storage.from('media').upload(`ytym/${Date.now()}_${file.name}`, file);
    if (error) console.error('アップロード失敗:', error);
    else image_urls.push(`${supabaseUrl}/storage/v1/object/public/media/${data.path}`);
  }

  let entry;
  if (currentEditId) {
    const original = ytymEvents.find(e => e.id === currentEditId);
    entry = {
      date,
      title,
      description,
      image_urls: original.image_urls ? original.image_urls.concat(image_urls) : image_urls
    };
    await supabase.from('ytym').update(entry).eq('id', currentEditId);
    currentEditId = null;
  } else {
    entry = { date, title, description, image_urls };
    await supabase.from('ytym').insert([entry]);
  }

  clearForm();
  loadYtym();
}

function clearForm() {
  document.getElementById('date').value = '';
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  document.getElementById('image').value = '';
}

document.getElementById('save-btn').addEventListener('click', saveYtym);
window.onload = loadYtym;
