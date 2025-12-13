const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ API CHỈ TRẢ 1 PHIÊN
const API_URL = 'https://api68-6tko.onrender.com/history';

let lastPhien = null;
let cachedResult = null;

// ✅ LƯU LỊCH SỬ TRONG RAM
let history = [];

/* =====================
   THUẬT TOÁN CŨ (GIỮ)
===================== */

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

function generatePrediction(history) {
  if (history.length < 5) {
    return Math.random() < 0.5 ? 'Tài' : 'Xỉu';
  }

  const info = analyzeHistory(history);

  if (info.streak >= 6) {
    return info.last === 'Tài' ? 'Xỉu' : 'Tài';
  }

  if (info.streak >= 3) {
    return info.last;
  }

  if (info.taiCount >= 14) return 'Xỉu';
  if (info.xiuCount >= 14) return 'Tài';

  if (info.switches >= 12) {
    return info.last === 'Tài' ? 'Xỉu' : 'Tài';
  }

  return info.last;
}

/* =====================
   ROUTES
===================== */

app.get('/', (req, res) => {
  res.send('SERVER OK');
});

app.get('/api/hitpro', async (req, res) => {
  try {
    const response = await axios.get(API_URL);
    const data = response.data;

    // ❌ không có phiên
    if (!data || !data.Phien) {
      return res.json({
        ok: false,
        reason: 'API không có dữ liệu hợp lệ',
        raw: data
      });
    }

    // ✅ chỉ xử lý khi có phiên mới
    if (data.Phien !== lastPhien) {
      lastPhien = data.Phien;

      history.push({
        session: data.Phien,
        result: data.ket_qua,
        total: data.tong
      });

      if (history.length > 50) history.shift();

      const duDoan = generatePrediction(history);

      cachedResult = {
        ok: true,
        Phien: data.Phien,
        Ket_qua: data.ket_qua,
        Tong: data.tong,
        Xuc_xac_1: data.xuc_xac_1,
        Xuc_xac_2: data.xuc_xac_2,
        Xuc_xac_3: data.xuc_xac_3,
        Phien_tiep_theo: data.Phien + 1,
        Du_doan: duDoan
      };
    }

    res.json(cachedResult);

  } catch (err) {
    res.status(500).json({
      ok: false,
      error: 'Lỗi server',
      message: err.message
    });
  }
});

/* =====================
   START SERVER
===================== */

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
