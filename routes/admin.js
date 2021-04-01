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

const ADMIN_COLLECTION = 'admins';
const FIELDS_COLLECTION = 'fields';

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
		const client = await mongoClient.connect(DB_URL);
		const db = client.db(DATA_BASE);
		let user = await db.collection(ADMIN_COLLECTION).findOne({ email: req.body.email });
		if (user) {
			res.send({ message: 'user Already exists' });
		} else {
			const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(req.body.password, salt);
			req.body.password = hash;
			await db.collection(ADMIN_COLLECTION).insertOne(req.body);
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
					</div>`,
			};
			mail.sendMail(mailOptions, (err, data) => {
				if (err) {
					console.log(err);
				} else {
					console.log('Email Sent');
				}
			});
			res.json({ message: 'Mail sent' });
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
		let user = await db.collection(ADMIN_COLLECTION).findOne({ email: req.body.email });
		if (user) {
			let match = await bcrypt.compare(req.body.password, user.password);
			console.log('match:::' + match);
			if (match) {
				const token = jwt.sign({ email: req.body.email }, 'secret', { expiresIn: '1h' });
				console.log('token:::' + token);
				res.send({ message: 'Allow', token });
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
		let user = await db.collection(ADMIN_COLLECTION).findOne({ email: req.body.email });
		if (user) {
			let mailOptione = {
				from: process.env.EMAIL,
				to: req.body.email,
				subject: 'Reset Password',
				html: `<div>
						<p>Hi ${req.body.name},</p>
						<p>
							Here is your link to reset your password!!
						</p>
						<p>${process.env.FRONTEND_URL}/admin/reset</p>
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
		const client = await mongoClient.connect(DB_URL);
		const db = client.db(DATA_BASE);
		let user = await db.collection(ADMIN_COLLECTION).findOne({ email: req.body.email });
		if (user) {
			const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(req.body.password, salt);
			req.body.password = hash;
			await db
				.collection(ADMIN_COLLECTION)
				.updateOne({ email: req.body.email }, { $set: { password: req.body.password } });
		}
		client.close();
		res.status(200).json({ message: 'Password updated Successfully' });
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'something went wrong' });
	}
});

router.post('/fields', async (req, res) => {
	try {
		console.log(req.body);
		const client = await mongoClient.connect(DB_URL);
		const db = client.db(DATA_BASE);

		await db.collection(FIELDS_COLLECTION).updateOne(
			{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
			{
				$inc: {
					thinCrust: req.body.thinCrust,
					flatBreadCrust: req.body.flatBreadCrust,
					neapolitan: req.body.neapolitan,
					classicHandTossed: req.body.classicHandTossed,
					cheeseBrust: req.body.cheeseBrust,
					pesto: req.body.pesto,
					hummus: req.body.hummus,
					marinara: req.body.marinara,
					whiteGarlic: req.body.whiteGarlic,
					garlicRanch: req.body.garlicRanch,
					mozzarella: req.body.mozzarella,
					cheddar: req.body.cheddar,
					gorgonzola: req.body.gorgonzola,
					pecorinoRomano: req.body.pecorinoRomano,
					tomato: req.body.tomato,
					sweetCorn: req.body.sweetCorn,
					bacon: req.body.bacon,
					mushroom: req.body.mushroom,
					onions: req.body.onions,
					meat: req.body.meat,
					spinach: req.body.spinach,
					pepperoni: req.body.pepperoni,
				},
			}
		);
		client.close();
		res.status(200).json({ message: 'fields inserted successfully' });
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'something went wrong' });
	}
});

router.get('/fields', async (req, res) => {
	try {
		console.log(req.body);
		const client = await mongoClient.connect(DB_URL);
		const db = client.db(DATA_BASE);

		let fields = await db
			.collection(FIELDS_COLLECTION)
			.findOne({ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') });

		client.close();
		res.status(200).json(fields);
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'something went wrong' });
	}
});

router.put('/fields', async (req, res) => {
	try {
		console.log(req.body);
		let addExtraPrice = 0;
		let array = [req.body.crustType, req.body.sauceType, req.body.cheeseType];
		for (let i = 0; i < req.body.toppings.length; i++) {
			array.push(req.body.toppings[i]);
		}
		console.log(req.body.toppings.length);
		if (req.body.toppings.length > 3) {
			addExtraPrice = (req.body.toppings.length - 3) * 50;
			console.log(addExtraPrice);
		}
		// console.log(array);
		const client = await mongoClient.connect(DB_URL);
		const db = client.db(DATA_BASE);

		for (let i = 0; i < array.length; i++) {
			let field = array[i];
			console.log(field);
			if (array[i] == 'thinCrust') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { thinCrust: -1 } }
				);
			} else if (array[i] == 'flatBreadCrust') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { flatBreadCrust: -1 } }
				);
			} else if (array[i] == 'neapolitan') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { neapolitan: -1 } }
				);
			} else if (array[i] == 'classicHandTossed') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { classicHandTossed: -1 } }
				);
			} else if (array[i] == 'cheeseBrust') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { cheeseBrust: -1 } }
				);
			} else if (array[i] == 'pesto') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { pesto: -1 } }
				);
			} else if (array[i] == 'hummus') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { hummus: -1 } }
				);
			} else if (array[i] == 'marinara') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { marinara: -1 } }
				);
			} else if (array[i] == 'whiteGarlic') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { whiteGarlic: -1 } }
				);
			} else if (array[i] == 'garlicRanch') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { garlicRanch: -1 } }
				);
			} else if (array[i] == 'mozzarella') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { mozzarella: -1 } }
				);
			} else if (array[i] == 'cheddar') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { cheddar: -1 } }
				);
			} else if (array[i] == 'gorgonzola') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { gorgonzola: -1 } }
				);
			} else if (array[i] == 'pecorinoRomano') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { pecorinoRomano: -1 } }
				);
			} else if (array[i] == 'tomato') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { tomato: -1 } }
				);
			} else if (array[i] == 'sweetCorn') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { sweetCorn: -1 } }
				);
			} else if (array[i] == 'bacon') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { bacon: -1 } }
				);
			} else if (array[i] == 'mushroom') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { mushroom: -1 } }
				);
			} else if (array[i] == 'onions') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { onions: -1 } }
				);
			} else if (array[i] == 'meat') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { meat: -1 } }
				);
			} else if (array[i] == 'spinach') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { spinach: -1 } }
				);
			} else if (array[i] == 'pepperoni') {
				db.collection(FIELDS_COLLECTION).updateOne(
					{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
					{ $inc: { pepperoni: -1 } }
				);
			}
			// db.collection(FIELDS_COLLECTION).updateOne(
			// 	{ _id: mongodb.ObjectID('6062e8d304f7095944f11ba8') },
			// 	{ $inc: {  array[i] : -1 } }
			// );
		}

		client.close();
		res.status(200).json({ message: 'Updated', addExtraPrice });
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'something went wrong' });
	}
});

module.exports = router;
