'use strict';
const {createServer} = require('http');
const fs = require('fs');
const path = require('path');
const {Server} = require('socket.io');
const Koa = require('koa');
const Router = require('koa-router');

const {
  NAME = 'ws-server',
  PORT = 3000,
  PING_INTERVAL = 2000,
} = process.env;

const VERSION = require('./package.json').version;

const app = new Koa();
const router = new Router();

const mapping = new Map();

router.get('/healthz', (ctx) => {
  ctx.body = mapping.size;
});

router.get('/index', (ctx) => {
  ctx.type = 'html';
  ctx.response.body = fs.createReadStream(path.resolve(__dirname, 'index.html'));
});

app.use(router.routes());
app.use(router.allowedMethods());

const server = createServer(app.callback());


const io = new Server(server);


io.on('connection', function(socket) {
  const {id, handshake} = socket;

  mapping.set(id, setInterval(function() {
    if (socket) {
      const response = `Hello ${handshake.address} FROM ${NAME} ${VERSION}.`;
      socket.emit('msg', response);
    }

  }, PING_INTERVAL));

  socket.on('disconnect', function() {
    clearInterval(mapping.get(id));
    mapping.delete(id);
  });

  socket.on('request', (msg) => {
    console.log(`Received message from socket ${id}`, msg);
  });
  socket.on('error', errorHandler);
});

server.listen(PORT);
console.log('server started on port ', PORT);

function errorHandler(error) {
  console.error(error);
}
process.on('uncaughtException', errorHandler);
process.on('unhandledRejection', errorHandler);