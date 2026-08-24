import net from 'node:net';

const PORT = 8080;

const server = net.createServer((socket) => {
  console.log('[Arduino Virtual] ¡Conectado con la aplicación principal!');

  socket.on('data', (data) => {
    const comando = data.toString().trim();
    console.log(`[Arduino Virtual] Recibí el comando: "${comando}"`);

    if (comando === '1') {
      console.log('[Arduino Virtual] -> LED Encendido 💡');
      socket.write('LED ENCENDIDO\r\n');
    } else if (comando === '0') {
      console.log('[Arduino Virtual] -> LED Apagado 🌑');
      socket.write('LED APAGADO\r\n');
    }
  });

  socket.on('close', () => {
    console.log('[Arduino Virtual] Conexión cerrada.');
  });
});

server.listen(PORT, () => {
  console.log(`[Simulador Arduino] Escuchando en el puerto TCP localhost:${PORT}...`);
});