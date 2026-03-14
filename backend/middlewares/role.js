const roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        // Admins can bypass role checks for management/testing purposes
        if (req.user.role === 'admin' || roles.includes(req.user.role)) {
            return next();
        }

        console.log(`Role Denied: User role ${req.user.role} not in ${roles}. Path: ${req.path}`);
        return res.status(403).json({ error: `Forbidden: Requires ${roles.join(' or ')} role.` });
    };
};

const verifiedMiddleware = (req, res, next) => {
    if (req.user.role === 'admin') return next();

    if (!req.user.isVerified) {
        console.log(`Verification Denied: User ${req.user.email} (role: ${req.user.role}) is NOT verified. Path: ${req.path}`);
        return res.status(403).json({ error: 'Your account is pending verification by the admin.' });
    }
    next();
};

module.exports = { roleMiddleware, verifiedMiddleware };
