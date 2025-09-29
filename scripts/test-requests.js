const fs = require('fs');
const path = require('path');

(async () => {
  const dataDir = path.resolve(__dirname, '../tmp-test-data');
  process.env.DATA_DIR = dataDir;
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }

  const { app, db } = require('../server/index.js');
  const server = app.listen(0);
  const fetch = global.fetch;

  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const initial = await fetch(`${baseUrl}/api/requests`).then(r => r.json());

    const created = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: '志工人力',
        contactPerson: '測試',
        contactPhone: '0912345678',
        address: '花蓮縣光復鄉測試路1號',
        description: '測試用 API 建立'
      })
    }).then(r => r.json());

    const afterCreate = await fetch(`${baseUrl}/api/requests`).then(r => r.json());

    await fetch(`${baseUrl}/api/requests/${created.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: '處理中' })
    });

    await fetch(`${baseUrl}/api/requests/${created.id}/volunteers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '測試志工', phone: '0987654321' })
    });

    const final = await fetch(`${baseUrl}/api/requests`).then(r => r.json());

    console.log('initial count:', initial.length);
    console.log('after create count:', afterCreate.length);
    const createdItem = final.find(item => item.id === created.id);
    console.log('final status:', createdItem?.status);
    console.log('volunteer count:', createdItem?.volunteers?.length || 0);
  } catch (error) {
    console.error('API test failed:', error);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      db.close?.();
      fs.rmSync(dataDir, { recursive: true, force: true });
    });
  }
})();
