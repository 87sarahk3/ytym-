// script.js（完全修正）
console.log("script.js 読み込まれた");

const supabaseUrl = 'https://fnjmdbuwptysqwjtovzn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuam1kYnV3cHR5c3F3anRvdnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNjgzNTYsImV4cCI6MjA2MzY0NDM1Nn0.Xk4r6cjgirCg7vRVr_K-JHA9xuA_owpzpV98GGOAExI';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let ytymEvents = [];
let currentEditId = null;

// 月名（日本語）
const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

// カレンダー作成
function createMonthBoxes() {
  const container = document.getElementById('calendar');
  container.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const box = document.createElement('div');
    box.className = 'month-box';
    box.dataset.month = i + 1;
    box.innerHTML = `<div class="month-title">${monthNames[i]}</div>`;
    container.appendChild(box);
  }
}

// ytym読み込み
async function loadYtym() {
  const { data, error } = await supabase.from('ytym').select('*').order('date');
  if (error) return console.error('読み込みエラー:', error);
  ytymEvents = data;
  renderDots();
}

function renderDots() {
  document.querySelectorAll('.month-box').forEach(box => box.querySelectorAll('.dot').forEach(dot => dot.remove()));
  ytymEvents.forEach(event => {
    const month = parseInt(event.date.slice(4, 6));
    const day = parseInt(event.date.slice(6, 8));
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.title = event.title;
    dot.onclick = () => showDetail(event);
    const box = document.querySelector(`.month-box[data-month='${month}']`);
    if (box) box.appendChild(dot);
  });
}

function showDetail(event) {
  alert(`【${event.title}】\n日付: ${event.date}\n${event.description || ''}`);
  // ここに編集削除UIを後で追加できます
}

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

  const entry = { date, title, description, image_urls };
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
window.onload = () => {
  createMonthBoxes();
  loadYtym();
};
