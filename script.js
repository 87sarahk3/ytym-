// script.js - 最新全体コード（2025年6月29日修正）

console.log("script.js 読み込まれた");

const supabaseUrl = 'https://fnjmdbuwptysqwjtovzn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuam1kYnV3cHR5c3F3anRvdnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNjgzNTYsImV4cCI6MjA2MzY0NDM1Nn0.Xk4r6cjgirCg7vRVr_K-JHA9xuA_owpzpV98GGOAExI';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let ytymEvents = [];
let currentEditId = null;

async function loadYtym() {
  const { data, error } = await supabase.from('ytym').select('*').order('date');
  if (error) return console.error('読み込みエラー:', error);
  ytymEvents = data;
  renderCalendar();
}

function renderCalendar() {
  const container = document.getElementById('calendar-container');
  container.innerHTML = '';
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  months.forEach(month => {
    const box = document.createElement('div');
    box.className = 'month-box';

    const title = document.createElement('div');
    title.className = 'month-title';
    title.textContent = `${month}月`;

    const dotArea = document.createElement('div');
    dotArea.className = 'dot-container';

    const filtered = ytymEvents.filter(e => new Date(e.date).getMonth() + 1 === month);
    filtered.forEach(event => {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.title = `${event.date}: ${event.title}`;
      dot.onclick = () => showDetails(event.date);
      dotArea.appendChild(dot);
    });

    box.appendChild(title);
    box.appendChild(dotArea);
    container.appendChild(box);
  });
}

function showDetails(date) {
  const overlay = document.getElementById('detail-overlay');
  const detailContainer = document.getElementById('detail-container');
  detailContainer.innerHTML = '';

  const events = ytymEvents.filter(e => {
    const eventDate = new Date(e.date).toISOString().split('T')[0];
    return eventDate === date;
  });

  events.forEach(e => {
    const block = document.createElement('div');
    block.className = 'detail-block';
    block.innerHTML = `
      <p><strong>${e.date}</strong>: ${e.title}</p>
      <p>${e.details || ''}</p>
    `;

    const urls = Array.isArray(e.file_url) ? e.file_url : (e.file_url ? [e.file_url] : []);
    urls.forEach(url => {
      if (url.endsWith('.mp4')) {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.style.maxWidth = '100%';
        block.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '8px';
        block.appendChild(img);
      }
    });

    detailContainer.appendChild(block);
  });

  overlay.style.display = 'flex';
  overlay.onclick = () => (overlay.style.display = 'none');
}

async function saveYtym() {
  const date = document.getElementById('date').value;
  const title = document.getElementById('title').value;
  const details = document.getElementById('description').value;
  const files = document.getElementById('image').files;

  let file_url = null;
  for (const file of files) {
    const { data, error } = await supabase.storage.from('media').upload(`ytym/${Date.now()}_${file.name}`, file);
    if (!error) {
      file_url = `${supabaseUrl}/storage/v1/object/public/media/${data.path}`;
    } else {
      console.error('アップロード失敗:', error);
    }
  }

  const entry = { date, title, details, file_url };
  await supabase.from('ytym').insert([entry]);

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
