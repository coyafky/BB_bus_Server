import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import bcrypt from 'bcryptjs'; // 使用 bcryptjs 替代 bcrypt
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import serverless from 'serverless-http';

dotenv.config(); // 加载 .env 文件

const app = express();
const port = process.env.PORT || 3000;

// 启用 CORS 中间件
app.use(
  cors({
    origin: '*', // 允许任意源
    credentials: true, // 允许发送 cookies
  })
);

app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true })); // 解析 x-www-form-urlencoded 请求体
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET, // 会话密钥
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // 如果使用 HTTPS，请设置为 true
  })
);

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

app.get('/', (req, res) => {
  res.send('Hello, World!');
});
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

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

// 注册路由
app.post('/register', async (req, res) => {
  try {
    if (!db) {
      await connectToDatabase();
    }
    const collection = db.collection('user'); // 替换为你的集合名称

    const { username, password } = req.body;

    // 检查请求体是否包含 username 和 password
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: 'Username and password are required' });
    }

    // 检查用户是否已存在
    const existingUser = await collection.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const newUser = {
      username,
      password: hashedPassword,
    };

    // 保存用户到数据库
    await collection.insertOne(newUser);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Server Error');
  }
});

// 登录路由
app.post('/login', async (req, res) => {
  try {
    if (!db) {
      await connectToDatabase();
    }
    const collection = db.collection('user'); // 替换为你的集合名称

    const { username, password } = req.body;

    // 检查请求体是否包含 username 和 password
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: 'Username and password are required' });
    }

    // 查找用户
    const user = await collection.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // 设置会话
    req.session.user = { username: user.username };

    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Server Error');
  }
});

// 登出路由
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err);
      res.status(500).send('Server Error');
    } else {
      res.json({ message: 'Logout successful' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;
