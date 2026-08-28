import { app } from './app';
import './config/firebase';
import 'dotenv/config';
import { NotificationPublisherWorker } from './services/notification-publisher.worker';

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`ClassSync API listening on port ${port}`));

const worker = new NotificationPublisherWorker();
if (process.env.SYNC_WORKER_ENABLED === 'true') worker.start();
process.on('SIGTERM', () => worker.stop());
process.on('SIGINT', () => worker.stop());
