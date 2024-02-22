function user(req, res, next)  {
    if (!req.user.isUser) return res.status(403).send('Access denied');
    next();
}

module.exports = user;