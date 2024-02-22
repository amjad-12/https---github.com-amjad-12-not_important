function assistantBook(req, res, next) {
    console.log(req.assistant)
    if (!req.assistant.bookControl) return res.status(403).send('Access denied')
    next()
}

module.exports = assistantBook;
