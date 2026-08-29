import { app } from './app';
import './config/firebase';
import 'dotenv/config';
import { NotificationPublisherWorker } from './services/notification-publisher.worker';
import { createServer } from 'node:http';
import { LiveClassSocketHandler } from './services/live-class-socket.handler';

const port = Number(process.env.PORT ?? 3000);
const httpServer = createServer(app);
const liveClassHandler = new LiveClassSocketHandler();
void liveClassHandler.attach(httpServer).then(() => httpServer.listen(port, () => console.log(`ClassSync API listening on port ${port}`)));

const worker = new NotificationPublisherWorker();
if (process.env.SYNC_WORKER_ENABLED === 'true') worker.start();
process.on('SIGTERM', () => { worker.stop(); httpServer.close(); });
process.on('SIGINT', () => { worker.stop(); httpServer.close(); });
