// HUYDAIXU.SITE - SIMPLE & STABLE (NO CACHE - HARD FIX)
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

const API_URL = 'https://api50-gyw4.onrender.com/history';

/* =======================
   CORE ANALYSIS FUNCTIONS
======================= */

function analyzeHistory(history) {
  const last20 = history.slice(-20).map(h => h.result);
  const last = last20[last20.length - 1];

  let streak = 1;
  for (let i = last20.length - 2; i >= 0; i--) {
    if (last20[i] === last) streak++;
    else break;
  }

  const taiCount = last20.filter(x => x === 'Tài').length;
  const xiuCount = last20.length - taiCount;

  let switches = 0;
  for (let i = 1; i < last20.length; i++) {
    if (last20[i] !== last20[i - 1]) switches++;
  }

  return { last, streak, taiCount, xiuCount, switches };
}

function detectShortPattern(history) {
  if (history.length < 4) return 0;

  const p = history.slice(-4).map(h => h.result).join(',');

  if (p === 'Tài,Xỉu,Tài,Xỉu') return 2;
  if (p === 'Xỉu,Tài,Xỉu,Tài') return 1;
  if (p === 'Tài,Tài,Xỉu,Xỉu') return 1;
  if (p === 'Xỉu,Xỉu,Tài,Tài') return 2;

  return 0;
}

function generatePrediction(history) {
  if (history.length < 5) {
    return Math.random() < 0.5 ? 'Tài' : 'Xỉu';
  }

  const info = analyzeHistory(history);

  if (info.streak >= 6) return info.last === 'Tài' ? 'Xỉu' : 'Tài';
  if (info.streak >= 3 && info.streak < 6) return info.last;

  const short = detectShortPattern(history);
  if (short === 1) return 'Tài';
  if (short === 2) return 'Xỉu';

  if (info.taiCount >= 14) return 'Xỉu';
  if (info.xiuCount >= 14) return 'Tài';

  if (info.switches >= 12)
    return info.last === 'Tài' ? 'Xỉu' : 'Tài';

  return info.last;
}

/* =======================
   ROUTES
======================= */

app.get('/', (req, res) => {
  res.send('SERVER ALIVE');
});

app.get('/api/hitpro', async (req, res) => {
  try {
    const response = await axios.get(API_URL);

    const data = Array.isArray(response.data)
      ? response.data
      : response.data?.data;

    if (!Array.isArray(data) || data.length === 0) {
      return res.json({
        ok: false,
        reason: 'API không có mảng dữ liệu',
        raw: response.data
      });
    }

    // 🔥 MAP ĐÚNG JSON MÀY GỬI
    const history = data
      .slice(0, 100)
      .reverse()
      .map(item => ({
        session: item.Phien,
        result: item.ket_qua || item.Ket_qua,
        totalScore: item.tong || item.Tong
      }))
      .filter(x => x.result); // lọc null cho chắc

    if (history.length < 5) {
      return res.json({
        ok: false,
        reason: 'Không đủ lịch sử để phân tích',
        historyLength: history.length
      });
    }

    const latest = data[0];
    const duDoan = generatePrediction(history);

    const pattern = history
      .slice(-20)
      .map(h => (h.result === 'Tài' ? 'T' : 'X'))
      .join('');

    return res.json({
      ok: true,
      Phien: latest.Phien,
      Ket_qua: latest.ket_qua || latest.Ket_qua,
      Tong: latest.tong || latest.Tong,
      Xuc_xac_1: latest.xuc_xac_1,
      Xuc_xac_2: latest.xuc_xac_2,
      Xuc_xac_3: latest.xuc_xac_3,
      Pattern: pattern,
      Phien_tiep_theo: latest.Phien + 1,
      Du_doan: duDoan
    });

  } catch (err) {
    return res.json({
      ok: false,
      error: err.message
    });
  }
});

/* =======================
   START SERVER
======================= */

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
