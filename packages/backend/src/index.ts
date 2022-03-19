import { boot } from './server';

boot(process.env.HOST, process.env.PORT ? parseInt(process.env.PORT) : undefined);
