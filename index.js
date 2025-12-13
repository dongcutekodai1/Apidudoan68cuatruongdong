// HUYDAIXU.SITE - SIMPLE & STABLE ALGORITHM (FIX SERVER ONLY)
const express = require('express');
const axios = require('axios');

const app = express();

// ⚠️ Render BẮT BUỘC dùng process.env.PORT
const PORT = process.env.PORT || 10000;

const API_URL = 'https://api50-gyw4.onrender.com/history';

let lastPhien = 0;
let cachedResult = null;

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

  // A. Chuỗi dài → bẻ
  if (info.streak >= 6) {
    return info.last === 'Tài' ? 'Xỉu' : 'Tài';
  }

  // B. Chuỗi vừa → theo
  if (info.streak >= 3 && info.streak < 6) {
    return info.last;
  }

  // C. Cầu ngắn
  const shortPattern = detectShortPattern(history);
  if (shortPattern === 1) return 'Tài';
  if (shortPattern === 2) return 'Xỉu';

  // D. Lệch mạnh → cân
  if (info.taiCount >= 14) return 'Xỉu';
  if (info.xiuCount >= 14) return 'Tài';

  // E. Đảo cầu nhiều
  if (info.switches >= 12) {
    return info.last === 'Tài' ? 'Xỉu' : 'Tài';
  }

  // F. Mặc định
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
    const { data } = await axios.get(API_URL);

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: 'Không có dữ liệu API' });
    }

    const latest = data[0];

    if (latest.Phien !== lastPhien) {
      lastPhien = latest.Phien;

      const history = data
        .slice(0, 100)
        .reverse()
        .map(item => ({
          session: item.Phien,
          result: item.Ket_qua,
          totalScore: item.Tong
        }));

      const duDoan = generatePrediction(history);

      const pattern = history
        .slice(-20)
        .map(h => (h.result === 'Tài' ? 'T' : 'X'))
        .join('');

      cachedResult = {
        Phien: latest.Phien,
        Ket_qua: latest.Ket_qua,
        Tong: latest.Tong,
        Xuc_xac_1: latest.Xuc_xac_1,
        Xuc_xac_2: latest.Xuc_xac_2,
        Xuc_xac_3: latest.Xuc_xac_3,
        Pattern: pattern,
        Phien_tiep_theo: latest.Phien + 1,
        Du_doan: duDoan
      };
    }

    res.json(cachedResult || { error: 'Chưa có dữ liệu mới' });
  } catch (err) {
    res.status(500).json({
      error: 'Lỗi server',
      message: err.message
    });
  }
});

/* =======================
   START SERVER (FIXED)
======================= */

// 🔥 Fix triệt để lỗi EADDRINUSE trên Render
if (!global.__serverStarted) {
  global.__serverStarted = true;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}
