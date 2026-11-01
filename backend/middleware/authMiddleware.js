const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {

    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({message:'Authorization unavailable'});
    }

    if(!authHeader.startsWith("Bearer ")){
         return res.status(401).json({message:'Invalid authorization format'});
    }
    
    const token = authHeader.replace("Bearer ", "");

    try{

        const decoded = jwt.verify(token, process.env.JWT_SECRET,{ algorithms: ['HS256'] } );

        req.userId = decoded.userId;

        next();

    }catch(error){

        console.error('Verification error:', error);
        return res.status(401).json({ message: 'Token Verification Failed' })

    }
}

module.exports = authMiddleware;