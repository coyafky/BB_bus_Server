import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// 启用 CORS 中间件
app.use(cors());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db('BB_bus'); // 替换为你的数据库名称
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// 在应用启动时连接数据库
connectToDatabase().catch(console.error);

app.get('/cities', async (req, res) => {
  try {
    if (!db) {
      await connectToDatabase();
    }
    const collection = db.collection('cities'); // 替换为你的集合名称

    const query = {}; // 你可以根据需要添加查询条件
    const options = {}; // 你可以根据需要添加查询选项

    const cursor = collection.find(query, options);
    const result = await cursor.toArray();

    console.log('Fetched cities:', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).send('Server Error');
  }
});

app.get('/routes', async (req, res) => {
  try {
    if (!db) {
      await connectToDatabase();
    }
    const collection = db.collection('routes'); // 替换为你的集合名称

    let query = {};

    const options = {}; // 你可以根据需要添加查询选项

    const cursor = collection.find(query, options);
    const result = await cursor.toArray();

    console.log('Fetched routes:', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;