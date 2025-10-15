const express = require('express');
const path = require('path');
const app = express();

const PORT = 3000;

// 정적 파일 제공 (현재 폴더 기준)
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`✅ Local Dev Server:http://localhost:${PORT}`);
});