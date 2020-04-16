const jwt = require('jsonwebtoken');



function authenticateToken(req, res, next) {
    const bearerHeader = req.headers.authorization //.split(" ")[1];

    if (typeof bearerHeader !== 'undefined') {
        const token = bearerHeader.split(" ")[1];

        if (token == null) return res.status(401).json({ state: 'error', message: 'token not found' });

        jwt.verify(token, 'secretkey', (err, authUser) => {
            if (err) {
                res.status(403).json({ state: 'error', message: 'invalid token' });
            } else {
                console.log(authUser);
                req.authUser = authUser;
                next();

            }
        }) 
    }else { res.status(403).json({state: 'error', message: 'forbidden'})}
}


module.exports = authenticateToken;