const fs = require('fs');
const jwt = require("jsonwebtoken");
const db = require('../lib/db');
const escape = require('sql-template-strings');

class User {
    constructor(token) {
        this.token = token;
        this.data = {};

        this.SignIn = function() {
            // Check if a valid user token was provided
            if(token === undefined || token == "") {
                throw "Token is undefined or empty."
            }
            
            // Store the payload data if a valid token is provided
            let cert = fs.readFileSync('./public.key', 'utf8');
            jwt.verify(token, cert, { algorithms: ['RS256'] }, function(err, payload) {
                if(err) {
                    throw "Error: " + err.message;
                } else {
                    data = payload.data[0];
                    delete data['password'];
                    data = JSON.parse(`{"success": true, "user": ${JSON.stringify(data)} }`);
                }
            });
        }

        this.CheckPermissions = async function (req, res, groups) {
            try {
                // Retrieve the name of the security group the user belongs to
                let result = await db.query(escape`
                    SELECT title
                    FROM security_group
                    WHERE id = ${data.user.security_group}
                `)

                // Check if the user belongs to a group allowed to create users
                let userHasPermissions = false;
                const createdBySecurityGroup = result[0].title;

                for(let i = 0; i < groups.length; ++i) {
                    if(createdBySecurityGroup === groups[i]) {
                        userHasPermissions = true;
                        break;
                    }
                }
        
                // Only continue if the user has a valid token and permissions to create users.
                if(!userHasPermissions) {
                    throw "You don't have sufficient privileges."
                }
            }
            catch (err) {
                res.status(401).json({ success: false, message: err });
                return false;
            }
        
            return true;
        }
    }
}

exports.User = User;