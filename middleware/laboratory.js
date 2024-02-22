function laboratory(req, res, next) {
    if (!req.laboratory.isLaboratory) return res.status(403).send('Access denied')
    next()
}

module.exports = laboratory;
