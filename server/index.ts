require('dotenv').config();

import Application from './src/Application';

const main = async (): Promise<void> => {
  const app: Application = new Application();
  await app.start();
};

main().catch(console.error);
