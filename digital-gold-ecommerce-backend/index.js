const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Register endpoint
app.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const userRole = role || 'buyer';
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, password, userRole]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = rows[0];
    res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transactions (admin)
app.get('/transactions', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM transactions');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add transaction (buyer) with payment proof
app.post('/transactions', async (req, res) => {
  const { userId, product, amount, paymentMethod, paymentProof } = req.body;
  if (!userId || !product || !amount || !paymentMethod) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    await db.query('INSERT INTO transactions (user_id, product, amount, payment_method, payment_proof) VALUES (?, ?, ?, ?, ?)', [userId, product, amount, paymentMethod, paymentProof || null]);
    res.status(201).json({ message: 'Transaction recorded' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get products
app.get('/products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product (admin)
app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, stock, image_url } = req.body;
  if (!name || !price || !stock || !image_url) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    await db.query('UPDATE products SET name = ?, price = ?, stock = ?, image_url = ? WHERE id = ?', [name, price, stock, image_url, id]);
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
