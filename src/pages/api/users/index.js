const db = require('../../../lib/db');
const escape = require('sql-template-strings');
const Auth = require('../../../lib/auth');
const User = require('../../../routes/user');

module.exports = async(req, res) => {     
     // Create a new user session and store their data
     const session = new Auth.Session(await req.headers.token);
     const params = req.query;

     // Store the user data, returning an error if the user couldn't be authenticated
     if(session.GetData().success == false) {
         return res.status(401).json(session.GetData());
     }

     // If we have a valid JWT token, handle the routes
     switch(req.method) {
        case 'GET':
            res.json(await User.GetAllUsers(session, params));
            break;
        case 'POST':
            res.json(await User.CreateUser(session, params));
            break;
        default:
            res.status(405).end();
            break;
    }
}