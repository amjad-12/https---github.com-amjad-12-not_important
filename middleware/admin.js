function user(req, res, next)  {
    if (!req.admin.isAdmin) return res.status(403).send('Access denied');
    next();
}

module.exports = user;