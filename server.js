import registerLoginRoute from './server/routes/registerLoginRoutes.js';
import taskRoutes from './server/routes/tasksRoutes.js';
import express from 'express';
import sequelize from './server/config/db.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT;

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
	// store: ... , // Redis, Memcached, etc. See below.
});

const whitelist = [
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	'http://localhost:4000',
	'http://127.0.0.1:4000',
	// URLs here,'https://my‑app.com'
];
app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			if (whitelist.includes(origin)) return callback(null, true);
			return callback(new Error('Not allowed by CORS'));
		},
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization'],
		exposedHeaders: ['Set-Cookie'],
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	})
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

app.use('/api', registerLoginRoute);
app.use('/api/', taskRoutes);

app.use((err, req, res, next) => {
	console.error('error:', err);
	const status = err.status || 500;
	const message = err.message || 'Internal server error';

	res.status(status).json({ error: { message } });
	next();
});

(async () => {
	try {
		await sequelize.authenticate();
		console.log('connection established');

		await sequelize.sync();

		const server = app.listen(PORT, () => {
			console.log(`Server is listening at http://localhost:${PORT}`);
		});

		server.on('error', err => {
			console.error('HTTP server error:', err);
			process.exit(1);
		});
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
})();

// // sudo mysql -u <username> -p -h <host>

// export NODE_EXTRA_CA_CERTS=$(pwd)/certs/aiven-ca.pem
