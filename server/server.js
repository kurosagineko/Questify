import registerLoginRoute from './routes/registerLoginRoutes.js';
import taskRoutes from './routes/tasksRoutes.js';
import userRoutes from './routes/userRoutes.js';
import express from 'express';
import sequelize from './config/db.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import bodyParser from 'body-parser';
import { Ollama } from 'ollama';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
	// store: ... , // Redis, Memcached, etc. See below.
});

const whitelist = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	'http://localhost:4000',
	'http://127.0.0.1:4000',
	'http://localhost:3002',
	'http://127.0.0.1:3002',
	'http://questify.digital',
	'https://questify.digital',
];
app.use((req, res, next) => {
	const origin = req.headers.origin;
	if (!origin || whitelist.includes(origin)) {
		res.header('Access-Control-Allow-Origin', origin || '*');
	}
	res.header(
		'Content-Security-Policy',
		"default-src 'self'; " +
			"script-src 'self' https://cdn.jsdelivr.net; " +
			"style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; " +
			"font-src 'self' https://fonts.gstatic.com; " +
			"img-src 'self' data: blob:; " +
			"connect-src 'self';"
	);
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
	res.header('Access-Control-Expose-Headers', 'Set-Cookie');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(204);
	}
	next();
});

// app.use(
// 	cors({
// 		origin: (origin, callback) => {
// 			if (!origin) return callback(null, true);
// 			if (whitelist.includes(origin)) return callback(null, true);
// 			return callback(new Error('Not allowed by CORS'));
// 		},
// 		credentials: true,
// 		allowedHeaders: ['Content-Type', 'Authorization'],
// 		exposedHeaders: ['Set-Cookie'],
// 		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
// 	})
// );
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.set('etag', false);

app.use('/api', registerLoginRoute);
app.use('/api', taskRoutes);
app.use('/api', userRoutes);

app.use(express.static(path.join(__dirname, '../dist')));

app.use((error, req, res, next) => {
	console.error('error:', error);
	const status = error.status || 500;
	const message = error.message || 'Internal server error';

	res.status(status).json({ error: { message } });
	next();
});

const ollama = new Ollama({
	host: `${process.env.HOST_URL}:11434`,
});

app.post('/api/generate', async (req, res) => {
	const { model, prompt, stream } = req.body;

	try {
		const result = await ollama.generate({
			model,
			prompt,
			stream: !!stream,
			keep_alive: '3m',
		});
		res.status(200).json(result);
	} catch (error) {
		console.error('Ollama error', error);
		res.status(500).json({ error: error.message || 'Ollama failure' });
	}
});

(async () => {
	try {
		console.log(path.join(__dirname, '../dist'));
		await sequelize.authenticate();
		console.log('connection established');

		await sequelize.sync();

		const server = app.listen(PORT, () => {
			console.log(`Server is listening at ${process.env.HOST_URL}:${PORT}`);
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
