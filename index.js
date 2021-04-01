const express = require('express');
const mongodb = require('mongodb');
const dotenv = require('dotenv');
const cors = require('cors');
const Razorpay = require('razorpay');

const mongoClient = mongodb.MongoClient;
const DB_URL = `mongodb+srv://admin-vishnu:vishnu123@vishnu.1nuon.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

const DATA_BASE = 'oven-starvy-pizza';
const USERS_COLLECTION = 'users';
const ADMIN_COLLECTION = 'admins';
const PIZZA_COLLECTION = 'pizzas';
const ORDER_COLLECTION = 'orders';

const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config();

const razorpay = new Razorpay({
	key_id: process.env.RAZOPAY_KEY_ID,
	key_secret: process.env.RAZOPAY_KEY_SECRET,
});

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
	res.send('Welcome to oven stary pizza ( A pizza delivery application )');
});

app.use('/user', userRoutes);
app.use('/admin', adminRoutes);

app.post('/razorpay', async (req, res) => {
	console.log(req.body);
	const payment_capture = 1;
	const amount = req.body.price + req.body.increasedPrice;
	const currency = 'INR';
	const options = {
		amount: amount * 100,
		currency,
		receipt: Math.random().toString(36).split('.')[1].toUpperCase(),
		payment_capture,
	};
	try {
		const response = await razorpay.orders.create(options);
		// console.log(response);
		res.json({
			id: response.id,
			currency: response.currency,
			amount: response.amount,
		});
	} catch (error) {
		console.log(error);
	}
});

app.listen(PORT, () => console.log(`:::server is up and running at port ${PORT}:::`));
