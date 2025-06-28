console.log("script.js 読み込まれた");

const supabaseUrl = 'https://fnjmdbuwptysqwjtovzn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（省略）';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let ytymEvents = [];
let currentEditId = null;

// 月名リスト
const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

window.onload = async () => {
  await loadYtym();
  generateCalendar();
  renderDots();
};

async function loadYtym() {
  const { data, error } = await supabase.from("ytym").select("*").order("date");
  if (error) return console.error("読み込みエラー:", error);
  ytymEvents = data;
}

function generateCalendar() {
  const container = document.getElementById("calendar");
  container.innerHTML = "";

  for (let i = 0; i < 12; i++) {
    const box = document.createElement("div");
    box.className = "month-box";

    const title = document.createElement("div");
    title.className = "month-title";
    title.textContent = monthNames[i];

    const dotGrid = document.createElement("div");
    dotGrid.className = "dot-container";
    dotGrid.id = `month-${i + 1}`;

    box.appendChild(title);
    box.appendChild(dotGrid);
    container.appendChild(box);
  }
}

function renderDots() {
  ytymEvents.forEach(event => {
    const date = new Date(event.date);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const targetBox = document.getElementById(`month-${month}`);
    if (!targetBox) return;

    const dot = document.createElement("div");
    dot.className = "dot";
    dot.style.left = `${(day % 10) * 10}px`;
    dot.style.top = `${Math.floor((day - 1) / 10) * 10}px`;
    dot.onclick = () => showDetails(month, day);

    dot.dataset.date = event.date;
    targetBox.appendChild(dot);
  });
}

function showDetails(month, day) {
  const container = document.getElementById("detail-container");
  container.innerHTML = "";

  const filtered = ytymEvents.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === month && d.getDate() === day;
  });

  filtered.forEach(event => {
    const block = document.createElement("div");
    block.className = "detail-block";

    const date = document.createElement("p");
    date.innerHTML = `<strong>${event.date}</strong>`;

    const title = document.createElement("p");
    title.textContent = event.title;

    const desc = document.createElement("p");
    desc.textContent = event.description;

    block.appendChild(date);
    block.appendChild(title);
    block.appendChild(desc);

    if (event.image_urls && event.image_urls.length > 0) {
      event.image_urls.forEach(url => {
        const img = document.createElement("img");
        img.src = url;
        block.appendChild(img);
      });
    }

    const editBtn = document.createElement("button");
    editBtn.textContent = "編集";
    editBtn.onclick = () => {
      document.getElementById("date").value = event.date;
      document.getElementById("title").value = event.title;
      document.getElementById("description").value = event.description;
      currentEditId = event.id;
      closeDetails();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "削除";
    deleteBtn.onclick = () => {
      if (confirm("削除しますか？")) {
        supabase.from("ytym").delete().eq("id", event.id).then(() => {
          loadYtym().then(() => {
            generateCalendar();
            renderDots();
            closeDetails();
          });
        });
      }
    };

    block.appendChild(editBtn);
    block.appendChild(deleteBtn);
    container.appendChild(block);
  });

  document.getElementById("detail-overlay").style.display = "flex";
}

function closeDetails() {
  document.getElementById("detail-overlay").style.display = "none";
}

document.getElementById("save-btn").addEventListener("click", async () => {
  const date = document.getElementById("date").value;
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const files = document.getElementById("image").files;

  let image_urls = [];
  for (const file of files) {
    const { data, error } = await supabase.storage.from("media").upload(`ytym/${Date.now()}_${file.name}`, file);
    if (!error) {
      image_urls.push(`${supabaseUrl}/storage/v1/object/public/media/${data.path}`);
    }
  }

  const payload = {
    date,
    title,
    description,
    image_urls,
  };

  if (currentEditId) {
    await supabase.from("ytym").update(payload).eq("id", currentEditId);
    currentEditId = null;
  } else {
    await supabase.from("ytym").insert([payload]);
  }

  document.getElementById("date").value = "";
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("image").value = "";

  await loadYtym();
  generateCalendar();
  renderDots();
});
