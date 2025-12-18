const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'xalo_secret_key_2025'; // در تولید عوض کن

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public')); // فولدر public برای فایل‌های استاتیک

// داده‌های نمونه کاربران (در تولید از دیتابیس مثل MongoDB استفاده کن)
let users = [];
let balances = {}; // کیف پول: {userId: {rial: 0, usdt: 0, btc: 0}}

// API نرخ زنده (دلار، تتر، بیت‌کوین)
app.get('/api/rates', async (req, res) => {
  try {
    const [cryptoRes, usdRes] = await Promise.all([
      axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd'),
      axios.get('https://api.exchangerate-api.com/v4/latest/USD') // نرخ دلار به ریال (نمونه)
    ]);
    res.json({
      usdToIrt: usdRes.data.rates.IRR || 70000, // نرخ تقریبی
      bitcoin: cryptoRes.data.bitcoin.usd,
      tether: cryptoRes.data.tether.usd
    });
  } catch (error) {
    res.json({ usdToIrt: 70000, bitcoin: 60000, tether: 1 }); // fallback
  }
});

// ثبت‌نام
app.post('/api/register', async (req, res) => {
  const { phone, password } = req.body;
  if (users.find(u => u.phone === phone)) return res.status(400).json({ error: 'شماره تکراری' });
  const hashed = await bcrypt.hash(password, 10);
  const userId = Date.now();
  users.push({ id: userId, phone, password: hashed });
  balances[userId] = { rial: 0, usdt: 0, btc: 0 };
  res.json({ message: 'ثبت‌نام موفق', token: jwt.sign({ id: userId }, SECRET_KEY) });
});

// ورود
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  const user = users.find(u => u.phone === phone);
  if (!user || !await bcrypt.compare(password, user.password)) return res.status(400).json({ error: 'اشتباه' });
  res.json({ token: jwt.sign({ id: user.id }, SECRET_KEY) });
});

// کیف پول (نیاز به توکن)
app.get('/api/wallet/:token', (req, res) => {
  const decoded = jwt.verify(req.params.token, SECRET_KEY);
  res.json(balances[decoded.id] || { rial: 0, usdt: 0, btc: 0 });
});

// شارژ کیف پول (شبیه‌سازی پرداخت)
app.post('/api/charge', (req, res) => {
  const { token, amount, currency } = req.body; // currency: 'rial' or 'usdt'
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (currency === 'rial') balances[decoded.id].rial += amount;
    else if (currency === 'usdt') balances[decoded.id].usdt += amount;
    res.json({ message: 'شارژ موفق' });
  } catch {
    res.status(401).json({ error: 'توکن نامعتبر' });
  }
});

// API بت (پیش‌بینی‌های نمونه)
app.get('/api/bets', (req, res) => {
  res.json([
    { id: 1, match: 'بارسلونا vs رئال', odds: { home: 2.1, away: 1.8 }, status: 'live' },
    { id: 2, match: 'منچستر vs لیورپول', odds: { home: 1.9, away: 2.3 }, status: 'upcoming' }
  ]);
});

app.listen(PORT, () => console.log(`سرور روی http://localhost:${PORT} راه افتاد!`));
