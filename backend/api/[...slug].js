const app = require('../server');

// Wrap Express app for Vercel Serverless function
module.exports = (req, res) => {
	try {
		return app(req, res);
	} catch (err) {
		// fallback error response
		console.error('Function handler error:', err);
		res.statusCode = 500;
		res.end('Internal Server Error');
	}
};
