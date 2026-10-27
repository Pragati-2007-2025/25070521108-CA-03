import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const envPath = fileURLToPath(new URL('./.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const app = express();
app.use(express.json());

const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexora';
const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 3000 });
let myDb;

function requireDatabase(response) {
  if (!myDb) {
    response.status(503).json({ message: 'Database is unavailable. Start MongoDB and try again.' });
    return false;
  }
  return true;
}

function getTokenSecret(response) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.startsWith('replace-with-')) {
    response.status(503).json({ message: 'Set a private JWT_SECRET in server/.env before logging in.' });
    return null;
  }
  return secret;
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', message: 'NEXORA API is running' });
});

app.post('/api/auth/register', async (request, response) => {
  if (!requireDatabase(response)) return;
  const name = typeof request.body.name === 'string' ? request.body.name.trim() : '';
  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const password = typeof request.body.password === 'string' ? request.body.password : '';

  if (name.length < 2 || name.length > 80) {
    return response.status(400).json({ message: 'Enter a name between 2 and 80 characters.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return response.status(400).json({ message: 'Enter a valid email address.' });
  }
  if (password.length < 8 || password.length > 72) {
    return response.status(400).json({ message: 'Choose a password between 8 and 72 characters.' });
  }

  try {
    const users = myDb.collection('users');
    const existingUser = await users.findOne({ email }, { projection: { _id: 1 } });
    if (existingUser) return response.status(409).json({ message: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    await users.insertOne({ name, email, passwordHash, createdAt: new Date() });
    return response.status(201).json({ message: 'Your account is ready. Please sign in.' });
  } catch (error) {
    if (error.code === 11000) return response.status(409).json({ message: 'An account with this email already exists.' });
    console.error('Registration failed:', error.message);
    return response.status(500).json({ message: 'Could not create your account. Please try again.' });
  }
});

function authenticate(request, response, next) {
  const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  const secret = process.env.JWT_SECRET;
  if (!token || !secret || secret.startsWith('replace-with-')) return response.status(401).json({ message: 'Please sign in to continue.' });
  try { request.userId = new ObjectId(jwt.verify(token, secret).sub); return next(); }
  catch { return response.status(401).json({ message: 'Your session has expired. Please sign in again.' }); }
}
app.post('/api/auth/login', async (request, response) => {
  if (!requireDatabase(response)) return;
  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const password = typeof request.body.password === 'string' ? request.body.password : '';
  const secret = getTokenSecret(response);
  if (!secret) return;

  try {
    const user = await myDb.collection('users').findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ message: 'Email or password is incorrect.' });
    }

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, secret, { expiresIn: '1h' });
    return response.json({
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login failed:', error.message);
    return response.status(500).json({ message: 'Could not sign in. Please try again.' });
  }
});

app.post('/api/orders', authenticate, async (request, response) => {
  if (!requireDatabase(response)) return;
  const { items, customer } = request.body;
  const name = typeof customer?.name === 'string' ? customer.name.trim() : '';
  const phone = typeof customer?.phone === 'string' ? customer.phone.trim() : '';
  const address = typeof customer?.address === 'string' ? customer.address.trim() : '';
  if (!name || !phone || !address || !Array.isArray(items) || !items.length || items.length > 30) return response.status(400).json({ message: 'Enter delivery details and add at least one item.' });
  const catalog = new Map([
    ['sonic-arc', ['Sonic Arc Headphones', 14990]], ['pulse-mini', ['Pulse Mini Earbuds', 6990]],
    ['arc-watch', ['Arc Watch Series 4', 18990]], ['halo-speaker', ['Halo Portable Speaker', 8990]],
    ['moment-camera', ['Moment X Mirrorless', 68990]], ['nova-phone', ['Nova One Smartphone', 52990]],
    ['studio-notebook', ['Studio Air 14', 114990]], ['horizon-home', ['Horizon Home Speaker', 12990]],
    ['airwave-pro', ['Airwave Pro Studio', 22990]], ['echo-buds', ['Echo Buds Active', 5490]],
    ['aura-soundbar', ['Aura Cinema Bar', 24990]], ['orbit-watch', ['Orbit Active Watch', 14990]],
    ['halo-glasses', ['Halo View Glasses', 32990]], ['nova-fold', ['Nova Fold Smartphone', 89990]],
    ['vista-tab', ['Vista Tab 11', 32990]], ['prism-instant', ['Prism Instant Camera', 11990]],
    ['lens-camera', ['Lens Studio Camera', 58990]], ['drift-mouse', ['Drift Precision Mouse', 3290]],
    ['studio-keys', ['Studio Mechanical Keys', 8990]], ['pixel-lamp', ['Pixel Ambient Lamp', 4990]],
    ['nest-sense', ['Nest Sense Camera', 8990]], ['playpad', ['Playpad Wireless Controller', 6990]],
    ['pulse-console', ['Pulse Pocket Console', 38990]], ['power-dock', ['Power Dock 3-in-1', 3990]],
  ]);
  const orderItems = items.map(({ productId, quantity }) => {
    const product = catalog.get(productId);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return null;
    return { productId, name: product[0], price: product[1], quantity };
  });
  if (orderItems.some((item) => !item)) return response.status(400).json({ message: 'The bag contains an invalid item.' });
  try {
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const result = await myDb.collection('orders').insertOne({ userId: request.userId, customer: { name, phone, address }, items: orderItems, total, paymentMethod: 'Cash on delivery', status: 'placed', createdAt: new Date() });
    return response.status(201).json({ message: 'Your order has been placed.', orderId: result.insertedId.toString(), total });
  } catch (error) {
    console.error('Order placement failed:', error.message);
    return response.status(500).json({ message: 'Could not place the order. Please try again.' });
  }
});
// Keep the starter repository's student demo routes available while NEXORA is built.
app.get('/getall', async (_request, response) => {
  if (!requireDatabase(response)) return;
  response.json(await myDb.collection('student').find().toArray());
});

app.get('/get/:id', async (request, response) => {
  if (!requireDatabase(response)) return;
  response.json(await myDb.collection('student').findOne({ _id: new ObjectId(request.params.id) }));
});

app.post('/create', async (request, response) => {
  if (!requireDatabase(response)) return;
  const { name, age, status, password, email } = request.body;
  const hashedPass = await bcrypt.hash(password, 10);
  response.json(await myDb.collection('student').insertOne({ name, age, status, password: hashedPass, email }));
});

app.post('/login', async (request, response) => {
  if (!requireDatabase(response)) return;
  const { email, password } = request.body;
  const student = await myDb.collection('student').findOne({ email });
  if (!student || !(await bcrypt.compare(password, student.password))) {
    return response.status(422).json({ message: 'Invalid email or password' });
  }
  const secret = getTokenSecret(response);
  if (!secret) return;
  response.json({ jwtToken: jwt.sign({ subject: student.name, role: student.status }, secret) });
});

app.put('/update/:id', async (request, response) => {
  if (!requireDatabase(response)) return;
  const result = await myDb.collection('student').updateOne(
    { _id: new ObjectId(request.params.id) },
    { $set: { status: request.body.status } },
  );
  if (!result.matchedCount) return response.status(404).json({ message: 'Student ID is invalid' });
  response.json(result);
});

app.delete('/delete/:id', async (request, response) => {
  if (!requireDatabase(response)) return;
  response.json(await myDb.collection('student').deleteOne({ _id: new ObjectId(request.params.id) }));
});

app.listen(port, () => {
  console.log(`NEXORA API listening on http://localhost:${port}`);
});

try {
  await client.connect();
  myDb = client.db();
  await myDb.collection('users').createIndex({ email: 1 }, { unique: true });
  console.log('Connected to MongoDB.');
} catch (error) {
  console.warn(`MongoDB is unavailable; API started without database access: ${error.message}`);
}


