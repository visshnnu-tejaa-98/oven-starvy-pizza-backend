const express = require('express');
const mongodb = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mail = require('../mail');
const mongoClient = mongodb.MongoClient;

const DB_URL = `mongodb+srv://admin-vishnu:vishnu123@vishnu.1nuon.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const DATA_BASE = 'oven-starvy-pizza';

const USERS_COLLECTION = 'users';
const PIZZA_COLLECTION = 'pizzas';

const router = express.Router();

router.use(express.json());

const Authenticate = async (req, res, next) => {
	try {
		const bearer = await req.headers['authorization'];
		console.log(bearer);
		if (!bearer) {
			return res.json({ message: 'access failed' });
		} else {
			jwt.verify(bearer, 'secret', (err, decode) => {
				if (decode) {
					req.body.auth = decode;
					console.log('Authenticate middle ware success');
					next();
				} else {
					res.json({ message: 'authentication failed' });
				}
			});
		}
	} catch (error) {
		console.log(error);
		res.json({ message: 'Something went wrong in authentication' });
	}
};

router.post('/register', async (req, res) => {
	try {
		console.log(req.body);
		const client = await mongoClient.connect(DB_URL);
		const db = client.db(DATA_BASE);
		let user = await db.collection(USERS_COLLECTION).findOne({ email: req.body.email });
		if (user) {
			res.status(400).json({ message: 'User Already Exists' });
		} else {
			const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(req.body.password, salt);
			req.body.password = hash;
			await db.collection(USERS_COLLECTION).insertOne(req.body);
			let mailOptions = {
				from: process.env.EMAIL,
				to: req.body.email,
				subject: 'Registration Successful!!!',
				html: `<div>
						<p>Hi ${req.body.name},</p>
						<p>
							Thank you for Registering <strong>Oven Starvy Pizza</strong>
						</p>
						<p>Login Here to explore more</p>
						<p>{${process.env.FRONTEND_URL}/user/login}</p>
						
					</div>`,
			};

			mail.sendMail(mailOptions, (err, data) => {
				if (err) {
					console.log(err);
				} else {
					console.log('Email Sent');
				}
			});
			res.json({ message: 'User Added' });
		}
		client.close();
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'something went wrong' });
	}
});

router.post('/login', async (req, res) => {
	try {
		const client = await mongoClient.connect(DB_URL);
		const db = client.db(DATA_BASE);
		let user = await db.collection(USERS_COLLECTION).findOne({ email: req.body.email });
		if (user) {
			let match = await bcrypt.compare(req.body.password, user.password);
			console.log(match);
			if (match) {
				const token = jwt.sign({ email: req.body.email }, 'secret', { expiresIn: '1h' });
				console.log(token);
				res.send({ message: 'Allow', token });
			} else {
				res.json({ message: 'incorrect email or password' });
			}
		} else {
			res.send({ message: 'Not Allow' });
		}
		client.close();
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'something went wrong' });
	}
});

router.post('/forgot', async (req, res) => {
	try {
		const client = await mongoClient.connect(DB_URL);
		const db = client.db(DATA_BASE);
		let user = await db.collection(USERS_COLLECTION).findOne({ email: req.body.email });
		if (user) {
			let mailOptione = {
				from: process.env.EMAIL,
				to: req.body.email,
				subject: 'Reset Password!!!',
				html: `<div>
						<p>Hi ${req.body.name},</p>
						<p>
							Here is your link to reset your password!!
						</p>
						<p>${process.env.FRONTEND_URL}/user/reset</p>
					</div>`,
			};
			mail.sendMail(mailOptione, (err, data) => {
				if (err) {
					console.log(err);
				} else {
					console.log('Email Sent');
				}
			});
			res.status(200).json({ message: 'Mail sent to reset Password' });
		} else {
			res.json({ message: "User doesn't exist" });
		}
		client.close();
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'something went wrong' });
	}
});

router.put('/reset', async (req, res) => {
	try {
		console.log(req.body);
		const client = await mongoClient.connect(DB_URL);
		const db = client.db(DATA_BASE);
		let user = await db.collection(USERS_COLLECTION).findOne({ email: req.body.email });
		if (user) {
			const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(req.body.password, salt);
			req.body.password = hash;
			await db
				.collection(USERS_COLLECTION)
				.updateOne({ email: req.body.email }, { $set: { password: req.body.password } });
		}
		client.close();
		res.status(200).json({ message: 'Password updated Successfully' });
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'something went wrong' });
	}
});

router.post('/pizzas', Authenticate, async (req, res) => {
	try {
		console.log(req.body);

		console.log(req.body.auth);
		const client = await mongoClient.connect(DB_URL);
		const db = client.db(DATA_BASE);
		await db.collection(PIZZA_COLLECTION).insertOne(req.body);
		client.close();
		res.status(200).json({ message: 'Pizza Added Successfullly', clientMessage: 'Loggen In' });
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'something went wrong' });
	}
});

router.get('/pizzas', Authenticate, async (req, res) => {
	try {
		console.log(req.body);
		console.log(req.body.auth);
		if (req.body.auth) {
			const client = await mongoClient.connect(DB_URL);
			const db = client.db(DATA_BASE);
			let pizzas = await db.collection(PIZZA_COLLECTION).find().toArray();
			client.close();
			res.status(200).json(pizzas);
		} else {
			res.status(500).json({ message: 'Not Authorised' });
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'something went wrong' });
	}
});

router.get('/pizzas/:id', Authenticate, async (req, res) => {
	try {
		console.log(req.body);
		const client = await mongoClient.connect(DB_URL);
		const db = client.db(DATA_BASE);
		let pizza = await db
			.collection(PIZZA_COLLECTION)
			.findOne({ _id: mongodb.ObjectID(req.params.id) });
		client.close();
		res.status(200).json(pizza);
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'something went wrong' });
	}
});

module.exports = router;
