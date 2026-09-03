#!/bin/sh
# Forward localhost:3000 and localhost:3001 to the host machine so the
# sidekick library's hardcoded localhost references work inside Docker.
node -e "
const net = require('net');
function proxy(localPort, target) {
  net.createServer(client => {
    const srv = net.connect(target, 'host.docker.internal');
    client.pipe(srv);
    srv.pipe(client);
    srv.on('error', () => client.destroy());
    client.on('error', () => srv.destroy());
  }).listen(localPort, '127.0.0.1', () =>
    console.log('proxy localhost:' + localPort + ' -> host.docker.internal:' + target)
  );
}
proxy(3000, 3000);
proxy(3001, 3001);
" &

exec "$@"
