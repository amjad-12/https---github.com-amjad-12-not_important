function pharmacist(req, res, next) {

    if (!req.doctor.isDoctor) return res.status(403).send({message:'Access denied', status: false,code:403, data:[]})
    next()
}

module.exports = pharmacist;
