const roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Forbidden: Requires ${roles.join(' or ')} role.` });
        }
        next();
    };
};

const verifiedMiddleware = (req, res, next) => {
    if (req.user.role === 'admin') return next();

    if (!req.user.isVerified) {
        return res.status(403).json({ error: 'Your account is pending verification by the admin.' });
    }
    next();
};

module.exports = { roleMiddleware, verifiedMiddleware };
