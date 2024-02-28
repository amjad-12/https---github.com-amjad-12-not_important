function assistantBook(req, res, next) {
    if (!req.assistant.bookControl) return res.status(403).send('Access denied')
    next()
}

module.exports = assistantBook;
