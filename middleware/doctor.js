function pharmacist(req, res, next) {
    if (!req.doctor.isDoctor) return res.status(403).send('Access denied')
    next()
}

module.exports = pharmacist;
