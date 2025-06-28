// script.js - 最新版（2025年6月28日対応）
console.log("script.js 読み込まれた");

const supabaseUrl = 'https://fnjmdbuwptysqwjtovzn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuam1kYnV3cHR5c3F3anRvdnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNjgzNTYsImV4cCI6MjA2MzY0NDM1Nn0.Xk4r6cjgirCg7vRVr_K-JHA9xuA_owpzpV98GGOAExI';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let ytymEvents = [];

// 月ボックス生成
function createMonthBoxes() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = '';
  const container = document.createElement("div");
  container.className = "calendar-container";

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  for (let i = 0; i < 12; i++) {
    const box = document.createElement("div");
    box.className = "month-box";
    box.dataset.month = i + 1;
    box.innerHTML = `
      <div class="month-title">${monthNames[i]}</div>
      <div class="dot-container"></div>
    `;
    container.appendChild(box);
  }
  calendar.appendChild(container);
}

// ytymデータ取得
async function loadYtym() {
  const { data, error } = await supabase.from("ytym").select("*").order("date");
  if (error) return console.error("データ取得失敗", error);
  ytymEvents = data;
  renderDots();
}

// ドット描画
function renderDots() {
  const boxes = document.querySelectorAll(".month-box");
  boxes.forEach(box => {
    const month = parseInt(box.dataset.month);
    const container = box.querySelector(".dot-container");
    container.innerHTML = '';

    const dots = ytymEvents.filter(e => new Date(e.date).getMonth() + 1 === month);

    dots.forEach((e, index) => {
      const dot = document.createElement("div");
      dot.className = "dot";
      const day = new Date(e.date).getDate();
      const row = Math.floor((day - 1) / 10);
      const col = (day - 1) % 10;
      dot.style.top = `${row * 12}px`;
      dot.style.left = `${col * 12}px`;
      dot.title = `${e.date}\n${e.title}`;
      dot.addEventListener("click", () => showDetails(e.date));
      container.appendChild(dot);
    });
  });
}

// 詳細表示（仮）
function showDetails(date) {
  alert(`${date} の詳細をここに表示します（今後実装）`);
}

window.addEventListener("DOMContentLoaded", () => {
  createMonthBoxes();
  loadYtym();
});
