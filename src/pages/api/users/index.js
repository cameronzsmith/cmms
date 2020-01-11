const Session = require('../../../lib/session');
const User = require('../../../routes/user');

module.exports = async(req, res) => {     
     // Create a new auth session from the header supplied session token
     const session = new Session.Connection(await req.headers.token);
     const params = req.query;

     // Store the user data, returning an error if the user couldn't be authenticated
     if(session.GetData().success == false) {
         return res.status(401).json(session.GetData());
     }

     switch(req.method) {
         // Get All Users
        case 'GET':
            res.json(await User.GetAllUsers(session, params));
            break;
        // Create A New User
        case 'POST':
            res.json(await User.CreateUser(session, params));
            break;
        default:
            res.status(405).end();
            break;
    }
}