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
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '6h';
const ACCESS_TTL = parseInt(process.env.ACCESS_TOKEN_TTL, 10) || 21600;

const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
	httpOnly: true,
	secure: isProd,
	sameSite: isProd ? 'None' : 'Lax', // None for cross‑origin, Lax for same‑origin
	maxAge: ACCESS_TTL * 1000, // ms
	path: '/',
	...(isProd && { partitioned: true }),
};

router.use(express.json());

function signToken(payload) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

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
			.optional()
			.trim()
			.isAlphanumeric('en-US', { ignore: '_-' })
			.withMessage('Username may only contain letters & numbers')
			.isLength({ max: 50 })
			.withMessage('Username may be at most 50 characters'),

		body('email')
			.optional()
			.trim()
			.isEmail()
			.normalizeEmail()
			.withMessage('Must be a valid email address')
			.isLength({ max: 150 })
			.withMessage('Email may be at most 150 characters'),

		body('current_password')
			.if(body('new_password').exists())
			.exists({ checkFalsy: true })
			.isLength({ min: 8 })
			.withMessage('Current password is required')
			.withMessage('Password must be at least 8 characters'),

		body('new_password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

		body('avatar_url').optional({ checkFalsy: true }).trim(),
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

		// Only verify current password if the user is changing their password
		if (new_password) {
			// check if current_password matches the users password in user_id row
			const passwordMatch = await bcrypt.compare(current_password || '', user.password_hash);
			if (!passwordMatch) {
				return res.status(401).json({ error: { message: 'Incorrect current password' } });
			}
		}

		// Whitelist theme values
		const allowedThemes = ['navy', 'ruby'];
		if (theme && !allowedThemes.includes(theme)) {
			return res.status(400).json({ error: { message: 'Invalid theme' } });
		}

		const changes = {};
		if (username && username !== user.username) changes.username = username;
		if (email && email !== user.email) changes.email = email;
		if (theme !== user.theme) changes.theme = theme;
		if (avatar_url && avatar_url !== user.avatar_url) changes.avatar_url = avatar_url;
		if (new_password) {
			try {
				const new_password_hash = await bcrypt.hash(new_password, BCRYPT_COST);
				changes.password_hash = new_password_hash;
			} catch (error) {
				console.log(error);
			}
		}

		if (Object.keys(changes).length === 0) {
			return res.status(400).json({ error: 'No change to apply' });
		}

		const transaction = await User.sequelize.transaction();
		try {
			await User.update(changes, { where: { id: paramUserId }, transaction });
			await transaction.commit();

			await user.reload();

			const tokenFieldsChanged =
				new_password ||
				(theme && theme !== user.theme) ||
				(username && username !== user.username) ||
				(avatar_url && avatar_url !== user.avatar_url) ||
				(email && email !== user.email);

			if (tokenFieldsChanged) {
				const token = signToken({
					id: user.id,
					username: user.username,
					email: user.email,
					level: user.level,
					total_xp: user.total_xp,
					current_xp: user.current_xp,
					numTasksCompleted: user.numTasksCompleted,
					theme: user.theme,
					avatar_url: user.avatar_url,
				});

				res.cookie('token', token, cookieOptions);
			}

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

export default router;
