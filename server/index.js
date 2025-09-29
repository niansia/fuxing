// server/index.js (CommonJS 版)
// 需要配合根目錄 package.json 的 "start": "node server/index.js"
// 並在 Render 的 Web Service 環境變數設定 DATABASE_URL（Postgres）

const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const cheerio = require('cheerio');
const { transform } = require('esbuild');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// ---------------------- 基本設定 ----------------------
const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// 健康檢查
app.get('/health', (_, res) => res.send('ok'));

// （新增）根路由導到 simple.html，方便直接開站
app.get('/', (req, res) => {
  res.redirect('/simple.html');
});

// ---------------------- Postgres 設定 ----------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Render PG 需要
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      address TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      location_lat DOUBLE PRECISION,
      location_lng DOUBLE PRECISION,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS volunteers (
      id SERIAL PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);
}

initDb().catch(err => console.error('DB init error', err));

// ---------------------- JSX/JS 轉譯路由（放在 static *之前*！） ----------------------
// 讓 .jsx / 含 JSX 的 .js 先被攔截做即時轉譯，再交給瀏覽器以 ESM 載入。

app.get('*.jsx', async (req, res, next) => {
  try {
    const abs = path.join(process.cwd(), req.path);
    if (!fs.existsSync(abs)) return next();
    const source = await fs.promises.readFile(abs, 'utf8');
    const result = await transform(source, {
      loader: 'jsx',
      format: 'esm',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      sourcemap: 'inline'
    });
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    return res.send(result.code);
  } catch (e) {
    console.error('JSX transform error:', e);
    return next();
  }
});

app.get('*.js', async (req, res, next) => {
  try {
    const abs = path.join(process.cwd(), req.path);
    if (!fs.existsSync(abs)) return next();
    const source = await fs.promises.readFile(abs, 'utf8');

    // 粗略偵測是否含 JSX
    if (source.includes('<') && source.includes('React')) {
      const result = await transform(source, {
        loader: 'jsx',
        format: 'esm',
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment',
        sourcemap: 'inline'
      });
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      return res.send(result.code);
    } else {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      return res.send(source);
    }
  } catch (e) {
    console.error('JS transform error:', e);
    return next();
  }
});

// ---------------------- 靜態資源 ----------------------
// 放在 JSX/JS 轉譯路由之後，避免 .jsx 先被 static 送出而沒轉譯。
app.use(express.static('.', {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jsx')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
    // 可以加上基本快取（靜態檔 10 分鐘）
    if (/\.(css|js|jsx|png|jpg|svg|html)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=600');
    }
  }
}));

// ---------------------- 共用工具 ----------------------
const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const serializeRequestRow = (row, volunteers = []) => ({
  id: row.id,
  type: row.type,
  contactPerson: row.contact_person,
  contactPhone: row.contact_phone,
  address: row.address,
  description: row.description,
  status: row.status,
  createdAt: row.created_at,
  location: (row.location_lat != null && row.location_lng != null)
    ? { lat: row.location_lat, lng: row.location_lng }
    : null,
  volunteers: volunteers.map(v => ({
    name: v.name,
    phone: v.phone,
    note: v.note || '',
    createdAt: v.created_at
  }))
});

// ---------------------- Requests / Volunteers API ----------------------
app.get('/api/requests', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM requests ORDER BY created_at DESC');
    const { rows: vrows } = await pool.query(
      'SELECT request_id, name, phone, note, created_at FROM volunteers ORDER BY created_at ASC'
    );
    const bucket = new Map();
    for (const v of vrows) {
      if (!bucket.has(v.request_id)) bucket.set(v.request_id, []);
      bucket.get(v.request_id).push(v);
    }
    res.json(rows.map(r => serializeRequestRow(r, bucket.get(r.id) || [])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const { type, contactPerson, contactPhone, address, description, location } = req.body || {};
    if (!type || !contactPerson || !contactPhone || !address || !description) {
      return res.status(400).json({ error: '缺少必要欄位' });
    }
    // 若姓名看起來像 2-4 個中文，做簡單遮蔽，只留姓氏
    let safeContactPerson = String(contactPerson || '').trim();
    if (/^[\u4e00-\u9fa5]{2,4}$/.test(safeContactPerson)) {
      safeContactPerson = safeContactPerson.slice(0, 1) + '○';
    }
    const id = uuid();
    const createdAt = new Date().toISOString();
    const status = '新登記';

    await pool.query(
      `INSERT INTO requests
       (id, type, contact_person, contact_phone, address, description, status, location_lat, location_lng, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id, type, safeContactPerson, contactPhone, address, description, status,
        location?.lat ?? null, location?.lng ?? null, createdAt
      ]
    );

    const { rows } = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);
    res.status(201).json(serializeRequestRow(rows[0], []));
  } catch (err) {
    console.error('Create request error', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

app.patch('/api/requests/:id/status', async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: '缺少 status' });

    const cur = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);
    if (cur.rowCount === 0) return res.status(404).json({ error: '找不到資料' });

    await pool.query('UPDATE requests SET status = $1 WHERE id = $2', [status, id]);

    const { rows } = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);
    const { rows: vrows } = await pool.query(
      'SELECT name, phone, note, created_at FROM volunteers WHERE request_id = $1 ORDER BY created_at ASC',
      [id]
    );
    res.json(serializeRequestRow(rows[0], vrows));
  } catch (err) {
    console.error('Update status error', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

app.post('/api/requests/:id/volunteers', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, phone, note } = req.body || {};
    if (!name || !phone) return res.status(400).json({ error: '缺少志工姓名或電話' });

    const cur = await pool.query('SELECT id FROM requests WHERE id = $1', [id]);
    if (cur.rowCount === 0) return res.status(404).json({ error: '找不到需求' });

    await pool.query(
      'INSERT INTO volunteers (request_id, name, phone, note, created_at) VALUES ($1,$2,$3,$4,$5)',
      [id, name, phone, note || null, new Date().toISOString()]
    );

    const { rows } = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);
    const { rows: vrows } = await pool.query(
      'SELECT name, phone, note, created_at FROM volunteers WHERE request_id = $1 ORDER BY created_at ASC',
      [id]
    );
    res.status(201).json(serializeRequestRow(rows[0], vrows));
  } catch (err) {
    console.error('Add volunteer error', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const cur = await pool.query('SELECT id FROM requests WHERE id = $1', [id]);
    if (cur.rowCount === 0) return res.status(404).json({ error: '找不到需求' });

    await pool.query('DELETE FROM requests WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete request error', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 一些環境/網路可能會擋 DELETE，提供 POST 備援路由
app.post('/api/requests/:id/delete', async (req, res) => {
  try {
    const id = req.params.id;
    const cur = await pool.query('SELECT id FROM requests WHERE id = $1', [id]);
    if (cur.rowCount === 0) return res.status(404).json({ error: '找不到需求' });

    await pool.query('DELETE FROM requests WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete request (POST fallback) error', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ---------------------- 外部資料 Proxy / Aggregator ----------------------
const WRA_REALTIME_ENDPOINT = 'https://opendata.wra.gov.tw/WraApi/v1/Water/RealTimeWaterLevel';
app.get('/api/proxy/wra/realtime-water-level', async (req, res) => {
  try {
    const url = new URL(WRA_REALTIME_ENDPOINT);
    url.searchParams.set('$format', 'JSON');
    for (const [key, value] of Object.entries(req.query)) {
      if (value != null) url.searchParams.set(key, value);
    }
    const upstream = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!upstream.ok) {
      const detail = await upstream.text();
      return res.status(upstream.status).json({ error: '水利署資料取得失敗', detail: detail.slice(0, 1024) });
    }
    const payload = await upstream.json();
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json(payload);
  } catch (err) {
    console.error('WRA proxy error', err);
    return res.status(502).json({ error: '無法取得水利署資料' });
  }
});

// 堰塞湖監測資料（模擬結構）
app.get('/api/qlake', async (req, res) => {
  try {
    const mockData = {
      name: '馬太鞍溪堰塞湖',
      waterLevel: 168.39 + Math.random() * 0.5,
      warningLevel: 169.5,
      alertLevel: 170.0,
      status: Math.random() > 0.8 ? 'warning' : 'normal',
      lastUpdate: new Date().toLocaleString('zh-TW'),
      rainfall: Math.floor(Math.random() * 5),
      evacuationZones: [
        { name: '光復市區', distance: '2.1km', risk: 'medium' },
        { name: '大富村', distance: '1.8km', risk: 'high' },
        { name: '大進村', distance: '3.2km', risk: 'low' }
      ]
    };
    res.json(mockData);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch qlake data' });
  }
});

// ---------------------- Alerts 聚合 ----------------------
const parser = new Parser({ timeout: 10000 });
const sources = [
  { type: 'rss', name: 'CWA Earthquake', url: 'https://www.cwa.gov.tw/Data/service/eqk_rss.xml' },
  { type: 'html', name: 'WRA News', url: 'https://www.wra.gov.tw/News.aspx?n=7314' },
  { type: 'html', name: 'Forestry Agency', url: 'https://www.fa.gov.tw/cht/index.php?code=list&flag=detail&ids=23' }
];

let cache = { items: [], ts: 0 };
const CACHE_MS = 60 * 1000;

async function fetchRSS(src) {
  try {
    const feed = await parser.parseURL(src.url);
    return feed.items.slice(0, 15).map(i => ({
      source: src.name,
      title: i.title?.trim(),
      link: i.link,
      isoDate: i.isoDate || i.pubDate,
      ts: i.isoDate ? Date.parse(i.isoDate) : (i.pubDate ? Date.parse(i.pubDate) : Date.now()),
      summary: i.contentSnippet || i.content,
      type: 'rss'
    }));
  } catch (e) {
    console.error('RSS fetch error', src, e.message);
    return [];
  }
}

async function fetchHTMLList(src) {
  try {
    const resp = await fetch(src.url, { headers: { 'user-agent': 'Mozilla/5.0' } });
    const html = await resp.text();
    const $ = cheerio.load(html);
    const items = [];
    $('a').each((_, el) => {
      const title = $(el).text().trim();
      const href = $(el).attr('href');
      if (title && href && title.length > 6 && !href.startsWith('#')) {
        const link = href.startsWith('http') ? href : new URL(href, src.url).href;
        items.push({ source: src.name, title, link, ts: Date.now(), type: 'html' });
      }
    });
    const seen = new Set();
    const filtered = items.filter(i => {
      const key = i.title + i.link;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 30);
    return filtered;
  } catch (e) {
    console.error('HTML fetch error', src, e.message);
    return [];
  }
}

async function aggregateAlerts() {
  const now = Date.now();
  if (now - cache.ts < CACHE_MS && cache.items.length) return cache.items;
  const results = [];
  for (const src of sources) {
    const arr = src.type === 'rss' ? await fetchRSS(src) : await fetchHTMLList(src);
    results.push(...arr);
  }
  results.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  cache = { items: results, ts: now };
  return results;
}

app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = [];
    const aggregatedData = await aggregateAlerts();

    const relevantAlerts = aggregatedData.filter(item =>
      item.title && (
        item.title.includes('花蓮') ||
        item.title.includes('光復') ||
        item.title.includes('馬太鞍') ||
        item.title.includes('東部') ||
        item.title.includes('颱風') ||
        item.title.includes('地震') ||
        item.title.includes('豪雨') ||
        item.title.includes('淹水')
      )
    );

    relevantAlerts.slice(0, 6).forEach((item, index) => {
      alerts.push({
        id: `agg-${index}-${Date.now()}`,
        title: item.title,
        content: item.summary || '請點擊查看詳細資訊',
        level: item.title.includes('紅色') || item.title.includes('嚴重') ? 'critical' :
              item.title.includes('橙色') || item.title.includes('警戒') || item.title.includes('颱風') ? 'warning' : 'info',
        timestamp: item.isoDate || new Date().toISOString(),
        source: item.source,
        category: item.source.includes('地震') ? '地震資訊' :
                 item.source.includes('CWA') ? '氣象警報' : '災害資訊',
        link: item.link
      });
    });

    // 加入中央氣象署的示例資料（可用時）
    try {
      const cwbResponse = await fetch('https://opendata.cwa.gov.tw/api/v1/rest/datastore/W-C0033-001?Authorization=CWA-DEMO-KEY&locationName=花蓮縣', { timeout: 5000 });
      if (cwbResponse.ok) {
        const cwbData = await cwbResponse.json();
        if (cwbData.records && cwbData.records.location) {
          cwbData.records.location.forEach(location => {
            if (location.locationName === '花蓮縣' && location.hazardConditions?.hazard) {
              location.hazardConditions.hazard.slice(0, 2).forEach(hazard => {
                alerts.push({
                  id: 'cwb-' + hazard.hazardId,
                  title: `氣象警報：${hazard.phenomena}`,
                  content: hazard.significance || '請注意天氣變化，做好防護措施',
                  level: hazard.significance?.includes('嚴重') ? 'critical' : 'warning',
                  timestamp: hazard.issueTime || new Date().toISOString(),
                  source: '中央氣象署',
                  category: '氣象警報'
                });
              });
            }
          });
        }
      }
    } catch (cwbError) {
      console.log('氣象署警報API暫時無法使用:', cwbError.message);
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'status-' + Date.now(),
        title: '災害監控系統運作正常',
        content: '目前光復鄉各項災害監測指標正常，系統持續監控中。如有緊急狀況將立即發布警報通知。',
        level: 'info',
        timestamp: new Date().toISOString(),
        source: '災害監控系統',
        category: '系統狀態'
      });
    }

    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(alerts.slice(0, 8));
  } catch (error) {
    console.error('警報API錯誤:', error);
    res.json([{
      id: 'error-' + Date.now(),
      title: '災害監控系統運作中',
      content: '系統暫時無法取得最新警報資料，正在嘗試重新連線。請持續關注官方災害資訊發布。',
      level: 'info',
      timestamp: new Date().toISOString(),
      source: '災害監控系統',
      category: '系統狀態'
    }]);
  }
});

// SSE stream
app.get('/api/alerts/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let alive = true;
  req.on('close', () => { alive = false; });

  async function push() {
    const items = await aggregateAlerts();
    if (!alive) return;
    res.write(`event: alerts\n`);
    res.write(`data: ${JSON.stringify({ items })}\n\n`);
  }

  push();
  const timer = setInterval(push, 30000);
  req.on('close', () => clearInterval(timer));
});

// 攝影機佔位圖
app.get('/api/placeholder-camera', (req, res) => {
  const text = req.query.text || '攝影機';
  const svg = `
    <svg width="320" height="240" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="240" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
      <circle cx="160" cy="100" r="30" fill="#666"/>
      <rect x="140" y="130" width="40" height="20" rx="5" fill="#666"/>
      <text x="160" y="180" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">${text}</text>
      <text x="160" y="200" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">暫時無影像</text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// 即時天氣資料（含備援）
app.get('/api/weather', async (req, res) => {
  try {
    let realWeatherData = null;
    try {
      const cwbResponse = await fetch('https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=CWA-DEMO-KEY&StationId=46759', { timeout: 5000 });
      if (cwbResponse.ok) {
        const cwbData = await cwbResponse.json();
        if (cwbData.records && cwbData.records.Station && cwbData.records.Station.length > 0) {
          const station = cwbData.records.Station[0];
          const obsTime = station.ObsTime.DateTime;
          realWeatherData = {
            temperature: parseFloat(station.WeatherElement.AirTemperature) || 25,
            humidity: parseFloat(station.WeatherElement.RelativeHumidity) || 70,
            windSpeed: parseFloat(station.WeatherElement.WindSpeed) || 5,
            windDirection: parseFloat(station.WeatherElement.WindDirection) || 0,
            pressure: parseFloat(station.WeatherElement.AirPressure) || 1013,
            rainfall: parseFloat(station.WeatherElement.Now.Precipitation) || 0,
            lastUpdate: obsTime
          };
        }
      }
    } catch (apiError) {
      console.log('CWB API 暫時無法使用，使用備用資料:', apiError.message);
    }

    const baseData = realWeatherData || {
      temperature: 26,
      humidity: 75,
      windSpeed: 8,
      windDirection: 45,
      pressure: 1013,
      rainfall: 0,
      lastUpdate: new Date().toISOString()
    };

    const riverLevel = 45.2;

    const weatherData = {
      location: '花蓮縣光復鄉',
      station: '光復氣象站',
      rainfall: {
        hourly: baseData.rainfall,
        daily: baseData.rainfall * 24,
        trend: 'stable',
        warning: baseData.rainfall > 10 ? 'watch' : 'normal'
      },
      river: {
        level: riverLevel,
        status: riverLevel > 70 ? 'warning' : riverLevel > 50 ? 'watch' : 'normal',
        flow: 25.8,
        location: '馬太鞍溪光復橋'
      },
      wind: {
        speed: baseData.windSpeed,
        direction: baseData.windDirection,
        gust: baseData.windSpeed * 1.5,
        description: baseData.windDirection < 90 ? '東北風' :
                     baseData.windDirection < 180 ? '東南風' :
                     baseData.windDirection < 270 ? '西南風' : '西北風'
      },
      temperature: baseData.temperature,
      humidity: baseData.humidity,
      pressure: baseData.pressure,
      visibility: 12,
      airQuality: 42,
      lastUpdate: baseData.lastUpdate,
      alerts: riverLevel > 70 ? ['溪水水位偏高，請注意安全'] :
              baseData.rainfall > 8 ? ['降雨量增加，注意路面濕滑'] :
              ['天氣狀況穩定'],
      dataSource: realWeatherData ? '中央氣象署' : '備用資料'
    };

    res.json(weatherData);
  } catch (error) {
    console.error('氣象API錯誤:', error);
    res.status(500).json({ error: '無法獲取氣象資料' });
  }
});

// 物資發放資訊（示例）
app.get('/api/supplies', (req, res) => {
  const supplies = [
    {
      id: 1,
      type: '綜合物資',
      items: ['食物包', '清潔用品', '醫療包', '毛毯', '飲用水'],
      location: '光復國小（主要物資站）',
      address: '花蓮縣光復鄉中正路一段25號',
      time: '24小時開放',
      contact: '03-8701354',
      status: 'available',
      queue: Math.floor(Math.random() * 15) + 5,
      coordinates: { lat: 23.6710, lng: 121.4220 },
      lastUpdate: new Date().toISOString(),
      note: '主要物資集散中心，提供各類基本需求物品',
      volunteer: '需要志工協助分發'
    },
    {
      id: 2,
      type: '志工住宿',
      items: ['床位', '盥洗設施', '簡餐', '休息空間'],
      location: '光復國中',
      address: '花蓮縣光復鄉中正路一段55號',
      time: '全日開放',
      contact: '03-8701025',
      status: 'available',
      queue: Math.floor(Math.random() * 8) + 2,
      coordinates: { lat: 23.6697, lng: 121.4235 },
      lastUpdate: new Date().toISOString(),
      note: '提供外地志工住宿與生活支援',
      volunteer: '歡迎長期志工入住'
    },
    {
      id: 3,
      type: '醫療救護',
      items: ['急救處理', '常備藥品', '健康諮詢', '心理支持'],
      location: '光復衛生所',
      address: '花蓮縣光復鄉中正路二段10號',
      time: '24小時值班',
      contact: '03-8701456',
      status: 'available',
      queue: Math.floor(Math.random() * 5) + 1,
      coordinates: { lat: 23.6688, lng: 121.4201 },
      lastUpdate: new Date().toISOString(),
      note: '提供緊急醫療與心理支援服務',
      volunteer: '需要醫護志工支援'
    },
    {
      id: 4,
      type: '交通接駁',
      items: ['接駁服務', '交通資訊', '路況更新'],
      location: '光復火車站',
      address: '花蓮縣光復鄉中正路一段',
      time: '06:00-22:00',
      contact: '志工群組',
      status: 'limited',
      queue: Math.floor(Math.random() * 20) + 10,
      coordinates: { lat: 23.6730, lng: 121.4200 },
      lastUpdate: new Date().toISOString(),
      note: '往返災區接駁服務，請事先聯繫',
      volunteer: '需要有經驗的司機志工'
    }
  ];

  res.json({ supplies, lastUpdate: new Date().toISOString() });
});

// ---------------------- 啟動 ----------------------
if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = { app, pool };
