const Session = require('../../../lib/session');
const User = require('../../../routes/user');

module.exports = async (req, res) => {
    const session = new Session.Connection(await req.headers.token);
    const params = req.query;

    const authenticated = session.Login();
    if(!authenticated.success) {
        return res.json(authenticated);
    }

    switch(req.method) {
        case 'GET':
            res.json(await User.GetAllUsers(params));
            break;
        case 'POST':
            res.json(await User.CreateUser(session, params));
            break;
        default:
            res.status(405).end();
            break;
    }
}