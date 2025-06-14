const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const app = express();
const path = require('path');
// const logger = require('./logger');

const User = require('./models/User');
const userRoutes = require('./routes/UserRoutes');
const sellerRoutes = require('./routes/SellerRoutes');
const authRoutes = require('./routes/AuthRoutes');
const accountRoutes = require('./routes/AccountRoutes');
const pageRoutes = require('./routes/PageRoutes');
const faqRoutes = require('./routes/FaqRoutes');
const bannerRoutes = require('./routes/BannerRoutes');
const categoryRoutes = require('./routes/categories');
const subCategoryRoutes = require('./routes/subcategory.js');

const productRoutes = require('./routes/products');
const reviewRoutes = require('./routes/reviews');



app.use(cors());
// app.use(express.json());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));




// CRUD OPERATION ROUTES
app.use('/api/users', userRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/page', pageRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subCategoryRoutes);

app.use('/api/products', productRoutes);
app.use('/api/review', reviewRoutes);



// AUTHENTICATION  ROUTES
app.use('/api/auth', authRoutes);
app.use('/api', accountRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


mongoose.connect(process.env.MONGO_URI, { connectTimeoutMS: 30000 }).then(() => {
  console.log('MongoDB connected')
}).catch(err => {console.error(err), nlogger.info(err)});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));