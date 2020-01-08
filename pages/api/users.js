export default (req, res) => {
    switch(req.method) {
        case 'GET':
            break
        case 'POST':
            break
        default:
            res.status(405).end() // Methd not allowed
            break
    }
}