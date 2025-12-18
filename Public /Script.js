const API_BASE = 'http://localhost:3000/api';
let token = localStorage.getItem('token');

// نرخ زنده هر ۵ ثانیه
async function updateRates() {
  try {
    const res = await fetch(`${API_BASE}/rates`);
    const data = await res.json();
    document.getElementById('rates').innerHTML = `
      <div class="rate-item">دلار: ${data.usdToIrt.toLocaleString()} ریال</div>
      <div class="rate-item">تتر: \[ {data.tether}</div>
      <div class="rate-item">بیت‌کوین: \]{data.bitcoin}</div>
    `;
  } catch (e) { console.log('خطا در نرخ‌ها'); }
}
setInterval(updateRates, 5000);
updateRates();

// ورود/ثبت‌نام مودال
document.getElementById('loginBtn').onclick = () => document.getElementById('modal').style.display = 'block';
document.querySelector('.close').onclick = () => document.getElementById('modal').style.display = 'none';
document.getElementById('authForm').onsubmit = async (e) => {
  e.preventDefault();
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;
  const isLogin = document.getElementById('submitBtn').textContent === 'ورود'; // ساده‌سازی
  const endpoint = isLogin ? '/login' : '/register';
  try {
    const res = await fetch(`\( {API_BASE} \){endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      localStorage.setItem('token', token);
      document.getElementById('modal').style.display = 'none';
      loadWallet();
    }
  } catch (e) { alert('خطا'); }
};

// کیف پول
async function loadWallet() {
  if (!token) return;
  try {
    const res = await fetch(`\( {API_BASE}/wallet/ \){token}`);
    const bal = await res.json();
    document.getElementById('balance').innerHTML = `
      <p>ریال: ${bal.rial.toLocaleString()}</p>
      <p>تتر: ${bal.usdt}</p>
      <p>بیت: ${bal.btc}</p>
    `;
  } catch (e) {}
}
loadWallet();

// شارژ
document.getElementById('chargeBtn').onclick = async () => {
  const amount = prompt('مقدار (ریال):');
  if (amount && token) {
    await fetch(`${API_BASE}/charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, amount: parseInt(amount), currency: 'rial' })
    });
    loadWallet();
  }
};

// بت‌ها
async function loadBets() {
  try {
    const res = await fetch(`${API_BASE}/bets`);
    const bets = await res.json();
    document.getElementById('betsList').innerHTML = bets.map(bet => `
      <div class="bet-item">
        <h3>${bet.match}</h3>
        <p>ضرایب: خانه ${bet.odds.home} | خارج ${bet.odds.away}</p>
        <button onclick="betOn(${bet.id}, 'home')">بت خانه</button>
      </div>
    `).join('');
  } catch (e) {}
}
loadBets();

// بت ساده (شبیه‌سازی)
window.betOn = (id, side) => alert(`بت ${side} روی مسابقه ${id} ثبت شد!`);

// بازی انفجار ساده
document.getElementById('playExplosion').onclick = () => {
  document.getElementById('gameArea').innerHTML = '<canvas id="explosion" width="300" height="200"></canvas>';
  const canvas = document.getElementById('explosion');
  const ctx = canvas.getContext('2d');
  let multiplier = 1;
  const interval = setInterval(() => {
    ctx.clearRect(0, 0, 300, 200);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`ضریب: x${multiplier.toFixed(2)}`, 10, 50);
    multiplier += 0.1;
    if (multiplier > 10) clearInterval(interval); // انفجار
  }, 100);
};
