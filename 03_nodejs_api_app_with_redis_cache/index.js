const express = require('express');
const redis = require('redis');
const app = express();
const PORT = 3000;

const client = redis.createClient();

// работа Redis - достаём данные, если они есть по ссылке /api/products
const cache = (req, res, next) => {
  const cacheKey = req.originalUrl;

  client.get(cacheKey, (err, data) => {
    if (err) throw err;
    if (data !== null) {
      res.json(JSON.parse(data));
    } else {
      next();
    }
  });
};

// сбрасываем кэш в случае обновления данных
const invalidateCache = (cacheKey) => {
  client.del(cacheKey, (err, response) => {
    if (err) throw err;
    console.log(`Cache key "${cacheKey}" invalidated`);
  });
};

app.get('/api/products', cache, (req, res) => {

  const products = //логика получения данных из MongoDB

  // Сохраняем данные по ключу /api/products на 1 минуту
  client.setex(req.originalUrl, 120, JSON.stringify(products));

  res.json(products);
});

// При обновлении данных - сбрасываем кэш
app.post('/api/products', (req, res) => {
  //обновляем данные в MongoDB

  invalidateCache('/api/products');

  res.json({ message: 'Product data updated successfully' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
