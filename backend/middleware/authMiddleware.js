const jwt = require('jsonwebtoken');

// JWT authentication middleware.
// Validates bearer tokens before allowing access to protected routes.
// Attaches the authenticated user's ID to req.userId.
function authMiddleware(req, res, next) {

    // Retrieve the Authorization header from the incoming request
    const authHeader = req.headers.authorization;

    // Reject requests without an Authorization header
    if(!authHeader){
        return res.status(401).json({message:'Authorization unavailable'});
    }

    // Ensure the header follows the "Bearer <token>" format
    if(!authHeader.startsWith("Bearer ")){
         return res.status(401).json({message:'Invalid authorization format'});
    }

    // Extract the JWT from the Authorization header
    const token = authHeader.replace("Bearer ", "");

    try{

        // Verify the token's signature and expiration using JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET,{ algorithms: ['HS256'] } );

        // Attach the decoded user ID to the request for subsequent route handlers
        req.userId = decoded.userId;

        // Continue to the protected route if authentication succeeds
        next();

    }catch(error){

        // Reject invalid or expired tokens
        console.error('Verification error:', error);
        return res.status(401).json({ message: 'Token Verification Failed' })

    }
}

module.exports = authMiddleware;