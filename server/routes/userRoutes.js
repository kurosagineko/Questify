import express from 'express';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/indexModel.js';
import { authenticate } from '../middleware/authenticate.js';
import { query, body, param, validationResult } from 'express-validator';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const BCRYPT_COST = parseInt(process.env.BCRYPT_COST) || 10;

router.use(express.json());

const validate = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	next();
};
// ====================== Edit ==========================
router.put(
	'/user/:id',
	authenticate,
	[
		body('username')
			.optional.trim()
			.isAlphanumeric({ ignore: '_-' })
			.withMessage('Username may only contain letters & numbers')
			.isLength({ max: 50 })
			.withMessage('Username may be at most 50 characters'),

		body('email')
			.optional.trim()
			.isEmail()
			.normalizeEmail()
			.withMessage('Must be a valid email address')
			.isLength({ max: 150 })
			.withMessage('Email may be at most 150 characters'),

		body('current_password')
			.exists({ checkFalsy: true })
			.isLength({ min: 8 })
			.withMessage('Current password is required')
			.withMessage('Password must be at least 8 characters'),

		body('new_password').optional.isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

		body('avatar_url').optional({ checkFalsy: true }).trim().isURL().withMessage('Avatar URL must be a valid URL'),
		validate,
	],
	async (req, res) => {
		const authUserId = req.user.id;
		const paramUserId = parseInt(req.params.id, 10);

		if (authUserId !== paramUserId) {
			return res.status(403).json({
				error: { message: 'You are not allowed to edit this user' },
			});
		}

		const { username, email, current_password, new_password, theme, avatar_url } = req.body;

		// find the user
		const user = await User.findByPk(paramUserId);
		if (!user) {
			return res.status(404).json({ error: { message: 'User not found' } });
		}

		// check if current_password matches the users password in user_id row
		const password_match = await bcrypt.compare(current_password, user.password_hash);
		if (!password_match) return res.status(401).json({ error: { message: 'Incorrect password' } });

		const changes = {};
		if (username && username !== user.username) changes.username = username;
		if (email && email !== user.email) changes.email = email;
		if (theme !== user.theme) changes.theme = theme;
		if (avatar_url && avatar_url !== user.avatar_url) changes.avatar_url = avatar_url;
		if (new_password) {
			const new_password_hash = await bcrypt.hash(new_password, BCRYPT_COST);
			changes.password_hash = new_password_hash;
		}

		if (Object.keys(changes).length === 0) {
			return res.status(400).json({ error: 'No change to apply' });
		}

		try {
			const transaction = await Task.sequelize.transaction();
			await User.update(changes, { where: { id: paramUserId }, transaction });
			await transaction.commit();

			res.status(200).json({ message: 'Successfully edited user' });
		} catch (error) {
			if (transaction) await transaction.rollback();
			if (error.name === 'SequelizeUniqueConstraintError') {
				return res.status(409).json({ error: { message: 'Email already exists' } });
			}
			return res.status(400).json({ error: 'Error editing user details' });
		}
	}
);
