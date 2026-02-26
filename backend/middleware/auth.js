import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token (from Authorization header or cookies)
 */
export const verifyToken = (req, res, next) => {
  try {
    // Try to get token from Authorization header or cookies
    const token =
      req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please log in.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

/**
 * Middleware to check specific role(s)
 * @param {string|array} allowedRoles
 */
export const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }
    next();
  };
};

/**
 * Middleware to ensure student profile is verified
 */
export const requireVerifiedStudent = async (req, res, next) => {
  try {
    const Student = (await import('../models/Student.js')).default;
    const student = await Student.findById(req.userId);

    if (!student || !student.profileVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your profile must be verified by admin to perform this action',
      });
    }

    req.student = student;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying student status',
      error: error.message,
    });
  }
};

/**
 * Middleware for error handling
 */
export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  console.error(`[Error] ${statusCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

/**
 * Middleware to validate request body
 */
export const validateRequest = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Request body cannot be empty',
    });
  }
  next();
};

/**
 * Middleware to log requests (audit trail)
 */
export const auditLogger = (action) => {
  return async (req, res, next) => {
    try {
      const AuditLog = (await import('../models/AuditLog.js')).default;

      // Create audit log asynchronously (don't block request)
      setImmediate(() => {
        AuditLog.create({
          action,
          performedBy: req.userId,
          performedByRole: req.userRole,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          remarks: req.body?.remarks || '',
        }).catch((error) => {
          console.error('Failed to create audit log:', error.message);
        });
      });

      next();
    } catch (error) {
      // Log error but don't block request
      console.error('Audit logger error:', error.message);
      next();
    }
  };
};
