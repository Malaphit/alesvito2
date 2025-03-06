require('dotenv').config();
const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const sizeRoutes = require('./routes/sizeRoutes'); 
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
console.log('Auth routes loaded:', authRoutes.stack.length > 0);
console.log('Auth routes:', authRoutes.stack.map(route => route.route ? route.route.path : 'unknown'));

app.use('/api/products', productRoutes);
console.log('Product routes loaded:', productRoutes.stack.length > 0);
console.log('Product routes:', productRoutes.stack.map(route => route.route ? route.route.path : 'unknown'));

app.use('/api/categories', categoryRoutes);
console.log('Category routes loaded:', categoryRoutes.stack.length > 0);
console.log('Category routes:', categoryRoutes.stack.map(route => route.route ? route.route.path : 'unknown'));

app.use('/api/sizes', sizeRoutes);
console.log('Size routes loaded:', sizeRoutes.stack.length > 0);
console.log('Size routes:', sizeRoutes.stack.map(route => route.route ? route.route.path : 'unknown'));

app.use('/api/cart', cartRoutes);
console.log('Cart routes loaded:', cartRoutes.stack.length > 0);
console.log('Cart routes:', cartRoutes.stack.map(route => route.route ? route.route.path : 'unknown'));

app.use('/api/orders', orderRoutes);
console.log('Order routes loaded:', orderRoutes.stack.length > 0);
console.log('Order routes:', orderRoutes.stack.map(route => route.route ? route.route.path : 'unknown'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
