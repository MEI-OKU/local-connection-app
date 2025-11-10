const WEATHER_API_KEY = "0e7d85fae93411b2a3b0d5642fdbeb5c";

let regions = [];
let markers = [];

// 🗺️ Leaflet初期化
const map = L.map('map').setView([43.3, 142.5], 7);
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  { attribution: '&copy; Esri & contributors' }
).addTo(map);

// 🌤 天気情報（アイコン付き）
async function getWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&lang=ja&units=metric`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.weather || !data.main) return { text: "天気情報が取得できません", icon: "" };

  const iconCode = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  const text = `${data.weather[0].description}（${data.main.temp.toFixed(1)}℃）`;
  return { text, icon: iconUrl };
}

// 🧭 地域カードを描画
async function renderRegions(list) {
  const cardsContainer = document.getElementById("cards");
  cardsContainer.innerHTML = "";

  markers.forEach(m => map.removeLayer(m));
  markers = [];

  for (const region of list) {
    const marker = L.marker([region.lat, region.lng])
      .addTo(map)
      .bindPopup(`<b>${region.name}</b><br>${region.desc}`);
    markers.push(marker);

    // 🪧 カード要素生成
    const card = document.createElement("div");
    card.className = "region-card";
    card.setAttribute("data-region", region.name);
    card.innerHTML = `
      <h3>${region.name}</h3>
      <p>${region.desc}</p>
      <div class="weather"><p>天気を取得中...</p></div>
      <div class="card-actions">
        <button onclick="focusRegion('${region.name}')">地図で見る</button>
      </div>
    `;

    // 💡 カード全体クリックで詳細ページへ
    card.addEventListener("click", (e) => {
      // ボタンを押した時は無視
      if (e.target.tagName.toLowerCase() === "button") return;
      viewDetail(region.name);
    });

    cardsContainer.appendChild(card);

    // 🌤 天気を取得
    const weather = await getWeather(region.lat, region.lng);
    const weatherDiv = card.querySelector(".weather");
    weatherDiv.innerHTML = `
      <img src="${weather.icon}" alt="天気" style="width:40px;vertical-align:middle;">
      <span>${weather.text}</span>
    `;
  }
}

// 📍 地図フォーカス
function focusRegion(name) {
  const region = regions.find(r => r.name === name);
  if (region) {
    map.setView([region.lat, region.lng], 11);
    L.popup()
      .setLatLng([region.lat, region.lng])
      .setContent(`<b>${region.name}</b><br>${region.desc}`)
      .openOn(map);
  }
}

// 🔗 詳細ページへ
function viewDetail(name) {
  window.location.href = `detail.html?name=${encodeURIComponent(name)}`;
}

// 🎚️ フィルタ
function filterRegions(category) {
  document.querySelectorAll("#filters button").forEach(btn => btn.classList.remove("active"));
  const activeBtn = Array.from(document.querySelectorAll("#filters button"))
    .find(btn => btn.textContent === category || (category === 'all' && btn.textContent === 'すべて'));
  if (activeBtn) activeBtn.classList.add("active");

  if (category === "all") renderRegions(regions);
  else renderRegions(regions.filter(r => r.category === category));
}

// 🚀 JSON読み込み
fetch("regions.json")
  .then(res => res.json())
  .then(data => {
    regions = data;
    renderRegions(regions);
  })
  .catch(() => alert("地域データの読み込みに失敗しました"));





