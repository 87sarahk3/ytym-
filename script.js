// script.js（改善後）
console.log("script.js 読み込まれた");

const supabaseUrl = 'https://fnjmdbuwptysqwjtovzn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuam1kYnV3cHR5c3F3anRvdnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNjgzNTYsImV4cCI6MjA2MzY0NDM1Nn0.Xk4r6cjgirCg7vRVr_K-JHA9xuA_owpzpV98GGOAExI';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let ytymEvents = [];
let currentEditId = null;

// 投稿取得と表示
async function loadYtym() {
  const { data, error } = await supabase.from('ytym').select('*').order('date');
  if (error) return console.error('読み込みエラー:', error);
  ytymEvents = data;
  renderYtym();
}

function renderYtym() {
  const container = document.getElementById('ytym-list');
  container.innerHTML = '';
  ytymEvents.forEach(event => {
    const div = document.createElement('div');
    div.className = 'event';
    div.innerHTML = `
      <p><strong>${event.date}</strong>: ${event.title}</p>
      <p>${event.description}</p>
      ${event.image_urls ? event.image_urls.map(url => `<img src="${url}" width="100">`).join('') : ''}
      <button onclick="editYtym('${event.id}')">編集</button>
      <button onclick="deleteYtym('${event.id}')">削除</button>
    `;
    container.appendChild(div);
  });
}

// 新規投稿または編集保存
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

// 編集
function editYtym(id) {
  const event = ytymEvents.find(e => e.id === id);
  if (!event) return;
  document.getElementById('date').value = event.date;
  document.getElementById('title').value = event.title;
  document.getElementById('description').value = event.description;
  document.getElementById('image').value = '';
  currentEditId = id;
}

// 削除
async function deleteYtym(id) {
  if (!confirm('本当に削除しますか？')) return;
  const { error } = await supabase.from('ytym').delete().eq('id', id);
  if (error) return console.error('削除エラー:', error);
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
