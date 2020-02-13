const Auth = require('../../../routes/api/auth');

module.exports = async(req, res) => {
    switch(req.method) {
        // Log In
        case 'POST':
            await Auth.Login(req, res);
            break;
        default:
            res.status(405).end()
            break;
    }
}