const jwt = require('jsonwebtoken')
const config = require('config')

module.exports = function (req, res, next) {
    `// we get the x-auth-token from the header because we add it in the userController 
    // in createUser function`
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send('Access denied. No token provided.')

    
    // in const decode we sure if the token we get in the request is valid
    // by decoded it and compare the secret key they have with the secret key we store 
    // in the environment variable using config module and if the token was valid it will decode
    // it else it will raise an exception to tell the client this is invalid token
    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        req.user = decoded;
        next()
    }
    catch (ex) {
        res.status(400).send('Invalid token.')
    }

}

