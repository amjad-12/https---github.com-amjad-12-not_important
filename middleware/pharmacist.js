function pharmacist(req, res, next) {
    if (!req.pharmacist.isPharmacist) return res.status(403).send('Access denied')
    next()
}

module.exports = pharmacist;
