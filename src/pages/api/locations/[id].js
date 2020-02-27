const Session = require('../../../lib/session');
const Location = require('../../../routes/api/location');

module.exports = async (req, res) => {
    const session = new Session.Connection(await req.headers.token);
    const params = req.query;

    const authenticated = session.Login();
    if(!authenticated.success) {
        return res.json(authenticated);
    }

    switch(req.method) {
        case 'GET':
            res.json(await Location.GetLocation(params.id));
            break;
        case 'PATCH':
            res.json(await Location.UpdateLocation(session, params));
            break;
        default:
            res.status(405).end();
            break;
    }
}