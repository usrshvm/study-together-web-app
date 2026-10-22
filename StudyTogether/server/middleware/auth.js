
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authorization = req.headers.authorization;

    let token = null;

    if (authorization && authorization.startsWith("Bearer ")) {
        token = authorization.slice(7);
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Please log in to access this resource."
        });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        if (!payload.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        req.user = {
            userId: payload.userId
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Your session is invalid or expired. Please log in again."
        });
    }
}

module.exports = authenticateToken;
