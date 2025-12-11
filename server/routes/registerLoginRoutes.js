import express from 'express';
import { Router } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
	User,
	Workspace,
	UserWorkspace,
	Team,
	TeamMember,
	Task,
} from '../models/indexModel.js';
import { uniqueWorkspaceCode } from '../scripts/util.js';
import { query, body, param, validationResult } from 'express-validator';
import cookieParser from 'cookie-parser';
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

// =================== auth =================================
router.get('/me', async (req, res) => {
	const token = req.cookies?.token;

	if (!token) {
		return res.status(401).json({ error: 'Not authenticated' });
	}

	let payload;
	try {
		payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
		console.log('payload: ', payload);
	} catch (jwt_error) {
		console.log('JWT error: ', jwt_error);
		return res.status(401).json({ error: 'Invalid or expired token' });
	}

	let user;
	try {
		user = await User.unscoped().findByPk(payload.id, {
			attributes: [
				'id',
				'username',
				'email',
				'level',
				'total_xp',
				'current_xp',
				'numTasksCompleted',
				'theme',
				'avatar_url',
			],
		});
		console.log('user: ', user?.toJSON ? user.toJSON() : user);
	} catch (db_error) {
		console.log('Error finding user: ', db_error);
		return res.status(500).json({ error: 'Database error' });
	}

	if (!user) {
		console.log('No user found for id', payload.id);
		return res.status(404).json({ error: 'User not found' });
	}

	res.set('Cache-Control', 'no-store, private, max-age=0, must-revalidate');

	return res.status(200).json({
		data: {
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				level: user.level,
				total_xp: user.total_xp,
				current_xp: user.current_xp,
				numTasksCompleted: user.numTasksCompleted,
				theme: user.theme,
				avatar_url: user.avatar_url,
			},
		},
	});
});

router.post('/logout', (req, res) => {
	res.clearCookie('token', cookieOptions);
	return res.status(200).json({ data: 'Logged out' });
});

// =========================== Register ============================
router.post(
	'/register',
	[
		body('username')
			.trim()
			.notEmpty()
			.withMessage('Username is required')
			.isAlphanumeric('en-US', { ignore: '_-' })
			.withMessage('Username may only contain letters, numbers, underscored or hyphens')
			.isLength({ max: 50 })
			.withMessage('Username may be at most 50 characters'),

		body('email')
			.trim()
			.notEmpty()
			.withMessage('Email is required')
			.isEmail()
			.withMessage('Must be a valid email address')
			.isLength({ max: 150 })
			.withMessage('Email may be at most 150 characters'),

		body('password')
			.notEmpty()
			.withMessage('Password is required')
			.isLength({ min: 8 })
			.withMessage('Password must be at least 8 characters'),

		body('avatar_url').optional({ checkFalsy: true }),
		validate,
	],
	async (req, res) => {
		const { username, email, password, avatar_url } = req.body;

		const duplicate = await User.findOne({
			where: {
				[Op.or]: [{ email }, { username }],
			},
		});

		if (duplicate) {
			// Let the client know exactly what is duplicated
			const conflictField = duplicate.email === email ? 'email' : 'username';
			return res.status(409).json({
				error: `A user with that ${conflictField} already exists`,
			});
		}

		const hashedPass = await bcrypt.hash(password, BCRYPT_COST);

		const transaction = await User.sequelize.transaction();
		try {
			const newUser = await User.create(
				{
					username,
					email,
					password_hash: hashedPass,
					avatar_url: avatar_url || null,
				},
				{ transaction }
			);

			// create Workspace entry by default with randomized unique code and assign the users id as the admin_user_id
			const defaultWorkspace = await Workspace.create(
				{
					code: uniqueWorkspaceCode(25),
					admin_user_id: newUser.id,
				},
				{ transaction }
			);

			// add created Workspace to a UserWorkspace entry with the created Workspace id as the workspace_id, add the users id as user_id
			await UserWorkspace.create(
				{
					user_id: newUser.id,
					workspace_id: defaultWorkspace.id,
					role: 'admin',
				},
				{ transaction }
			);

			// Create default team entry on Teams called *personal* with the created Workspace id as the workspace_id and the admin_user id as the users id
			const defaultTeam = await Team.create(
				{
					workspace_id: defaultWorkspace.id,
					name: 'personal',
					admin_user_id: newUser.id,
				},
				{ transaction }
			);

			// Create a TeamMembers entry with the personal teams id as the team_id and the users id as user_id
			await TeamMember.create(
				{
					team_id: defaultTeam.id,
					user_id: newUser.id,
				},
				{ transaction }
			);

			await Task.create(
				{
					team_id: defaultTeam.id,
					created_by_user_id: newUser.id,
					task_name: 'Sample Task',
					task_desc: 'This is a test task, testing db connection',
					date_due: null,
					status: 'open',
					task_xp: 10,
				},
				{ transaction }
			);

			await transaction.commit();

			const token = signToken({
				id: newUser.id,
				username: newUser.username,
				email: newUser.email,
				level: newUser.level,
				total_xp: newUser.total_xp,
				current_xp: newUser.current_xp,
				numTnumTasksCompletedasks: newUser.numTasksCompleted,
				theme: newUser.theme,
				avatar_url: newUser.avatar_url,
			});

			res.cookie('token', token, cookieOptions);

			res.status(201).json({
				data: {
					message: 'New user created!',
					expire: ACCESS_TTL,
					user: {
						id: newUser.id,
						username: newUser.username,
						email: newUser.email,
						level: newUser.level,
						total_xp: newUser.total_xp,
						current_xp: newUser.current_xp,
						numTasksCompleted: newUser.numTasksCompleted,
						theme: newUser.theme,
						avatar_url: newUser.avatar_url,
					},
				},
			}); // don't send the user pass back for security
		} catch (error) {
			await transaction.rollback();
			console.error('Register error:', error);
			if (error.parent) {
				console.error('MySQL error code:', error.parent.errno);
				console.error('MySQL message   :', error.parent.sqlMessage);
			}

			if (error.name === 'SequelizeUniqueConstraintError') {
				return res.status(409).json({ error: 'Email or username already taken' });
			}

			// Handle a "data too long" scenario
			if (error.parent && error.parent.errno === 1406) {
				return res.status(400).json({
					error: 'One of the fields is too long for the database column.',
				});
			}

			return res.status(500).json({ error: 'Internal server error' });
		}
	}
);

//=============================== Login =====================================
router.post(
	'/login',
	[
		body('email')
			.trim()
			.notEmpty()
			.withMessage('Email is required')
			.isEmail()
			.withMessage('Must be a valid email address')
			.isLength({ max: 150 })
			.withMessage('Email may be at most 150 characters'),

		body('password')
			.notEmpty()
			.withMessage('Password is required')
			.isLength({ min: 8 })
			.withMessage('Password must be at least 8 characters'),
	],
	async (req, res) => {
		const { email, password } = req.body;

		try {
			const user = await User.findOne({ where: { email } });
			if (!user) return res.status(401).json({ error: 'No user with that email address' });

			const password_match = await bcrypt.compare(password, user.password_hash);
			if (!password_match) return res.status(401).json({ error: 'Incorrect password' });

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

			return res.status(200).json({
				data: {
					message: 'Login successful',
					expiresIn: ACCESS_TTL,
					user: {
						id: user.id,
						username: user.username,
						email: user.email,
						level: user.level,
						total_xp: user.total_xp,
						current_xp: user.current_xp,
						numTasksCompleted: user.numTasksCompleted,
						theme: user.theme,
						avatar_url: user.avatar_url,
					},
				},
			});
		} catch (error) {
			console.error('Login error:', error);
			if (error.parent) {
				console.error('MySQL error code:', error.parent.errno);
				console.error('MySQL message   :', error.parent.sqlMessage);
			}

			// Handle a "data too long" scenario
			if (error.parent && error.parent.errno === 1406) {
				return res.status(400).json({
					error: 'One of the fields is too long for the database column.',
				});
			}

			return res.status(500).json({ error: 'Internal server error' });
		}
	}
);

export default router;
