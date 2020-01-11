const fs = require('fs');
const jwt = require("jsonwebtoken");
const db = require('../lib/db');
const escape = require('sql-template-strings');

class User {
    constructor(token) {
        this.token = token;
        this.data = {};
    }

    getData = function() {
        return this.data; 
    };

    setData = function(payload) {
        this.data = payload; 
    };

    SignIn = function() {
        try {
            // Check if a valid user token was provided
            if(this.token === undefined || this.token == "") {
                throw "Token is undefined or empty."
            }
            
            // Store the payload data if a valid token is provided
            let cert = fs.readFileSync('./public.key', 'utf8');
            let userData = {};
            jwt.verify(this.token, cert, { algorithms: ['RS256'] }, function(err, payload) {
                if(err) {
                    throw err.message;
                } else {
                    delete payload.data[0]["password"];
                    userData = payload.data[0];
                }
            });

            userData = JSON.parse(`{"success": true, "user": ${JSON.stringify(userData)}}`);
            return userData;
        }
        catch (err) {
            return JSON.parse(`{ "success": false, "message": "${err}"}`)
        }
    }

    CheckPermissions = async function (groupsAllowed) {
        try {
            // Retrieve the name of the security group the user belongs to
            let result = await db.query(escape`
                SELECT title
                FROM security_group
                WHERE id = ${this.getData().user.security_group}
            `)

            // Check if the user belongs to a group allowed to create users
            let userHasPermissions = false;
            const createdBySecurityGroup = result[0].title;
            
            for(let i = 0; i < groupsAllowed.length; ++i) {
                if(createdBySecurityGroup === groupsAllowed[i]) {
                    userHasPermissions = true;
                    break;
                }
            }
    
            // Only continue if the user has a valid token and permissions to create users.
            if(!userHasPermissions) {
                throw "You don't have sufficient privileges."
            }

            return JSON.parse(`{"success": true, "result": "${createdBySecurityGroup}"}`);
        }
        catch (err) {
            return JSON.parse(`{"success": false, "message": "${err}"}`)
        }
    }
}

exports.User = User;