function assistantControlExam(req, res, next) {
    if (!req.assistant.examControl) return res.status(403).send('Access denied')
    next()
}

module.exports = assistantControlExam;
