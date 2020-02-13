const Session = require('../../../lib/session');
const Project = require('../../../routes/api/project');

module.exports = async (req, res) => {
    const session = new Session.Connection(await req.headers.token);
    const params = req.query;

    const authenticated = session.Login();
    if(!authenticated.success) {
        return res.json(authenticated);
    }

    switch(req.method) {
        case 'GET':
            res.json(await Project.GetProject(params.id));
            break;
        // case 'PATCH':
        //     res.json(await User.UpdateUser(session, params));
        //     break;
        default:
            res.status(405).end();
            break;
    }
}