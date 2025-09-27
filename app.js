const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// MIME 타입 매핑
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

const PORT = 8080;
const PUBLIC_DIR = path.join(__dirname, 'docs');

// HTTP 서버 생성
const server = http.createServer((req, res) => {
  // URL 파싱
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // 기본 파일 설정 (루트 경로일 때 index.html 제공)
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // 파일 경로 구성
  const filePath = path.join(PUBLIC_DIR, pathname);
  
  // 보안을 위해 public 디렉토리 밖으로 나가지 못하도록 검증
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }
  
  // 파일 확장자 확인
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  // 파일 읽기
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 404 - 파일을 찾을 수 없음
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>404 - Not Found</title>
          </head>
          <body>
            <h1>404 - Page Not Found</h1>
            <p>The requested file "${pathname}" was not found.</p>
          </body>
          </html>
        `);
      } else {
        // 500 - 서버 에러
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Internal Server Error');
      }
    } else {
      // 성공적으로 파일을 읽음
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(data);
    }
  });
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`Static web server is running on http://localhost:${PORT}`);
  console.log(`Serving files from: ${PUBLIC_DIR}`);
  console.log('Press Ctrl+C to stop the server');
});

// 우아한 종료 처리
process.on('SIGINT', () => {
  console.log('\nShutting down the server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

// 에러 처리
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});