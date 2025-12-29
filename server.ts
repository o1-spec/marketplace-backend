import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocket } from './src/lib/socket.js'; 

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? '', true);
    handle(req, res, parsedUrl);
  });

  const io = initSocket(server);
  global.io = io;

  const port = parseInt(process.env.PORT || '3000', 10);

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Socket.io server initialized`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
});