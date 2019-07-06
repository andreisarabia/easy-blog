import Application from './lib/Application';

const main = async (): Promise<void> => {
  const start = Date.now();
  const app: Application = new Application();
  await app.start();
  console.log(`Startup time: ${Date.now() - start}ms`);
};

main().catch(console.error);
