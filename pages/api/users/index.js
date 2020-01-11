const db = require('../../../lib/db');
const escape = require('sql-template-strings');
const bcrypt = require('bcryptjs');
const API = require('../../../lib/api');

module.exports = async(req, res) => {
     // Stores an array of groups allowed to perform the HTTP request submitted
     let allowedGroups = [];

     // Get the token to authorize the user
     const token = await req.headers.token;
     
     // Create a new user session and store their data
     const session = new API.Session(token);
     const params = req.query;

     // Store the user data, returning an error if the user couldn't be authenticated
     if(session.GetData().success == false) {
         return res.status(401).json(session.GetData());
     }

     // If we have a valid JWT token, handle the routes
     switch(req.method) {
        case 'GET':
            await session.GetAllUsers(req, res);
            break;
        case 'POST':
            const userCreated = await session.CreateAUser(params);
            if(userCreated.success) { 
                res.status(201).json(userCreated); 
            } else { 
                res.status(400).json(userCreated);
            }
            break;
        default:
            res.status(405).end();
            break;
    }
}