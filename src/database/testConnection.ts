import { AppDataSource } from './data-source';

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully!');
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });
