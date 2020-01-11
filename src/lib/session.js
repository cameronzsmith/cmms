const fs = require('fs');
const jwt = require("jsonwebtoken");
const db = require('./db');
const escape = require('sql-template-strings');

/** 
 * @class Connection
 * @classdesc This class helps authenticate the user's session token and helps verify the user has the appropriate access.
 * @param {string} token
 */
class Connection {
    constructor(token) {
        this.token = token;
        this.data = {};

        this.Login();
    }
    /** @lends Connection */
    
    /**
     * This function retrieves the logged in user data (assuming they have been logged in)
     * @returns {Object} Returns the payload object
     */
    GetData = function() {
        return this.data; 
    };

    /**
     * This function sets the data object to store the authenticated user payload.
     * @param {Object} payload The user data payload to store so we can keep a historical record of who made the transaction.
     */
    SetData = function(payload) {
        this.data = payload; 
    };

    /**
     * This function ensures the user provided a valid session token.
     * @returns {Object} Returns success status and the user data payload. If the user data can't be authenticated, an error message is returned instead of the payload.
     */
    Login = function() {
        try {
            // Check if a valid user token was provided
            if(this.token === undefined || this.token == "") {
                throw "Token is undefined or empty."
            }
            
            // Store the payload data if a valid token is provided
            let cert = fs.readFileSync('./src/public.key', 'utf8');
            let userData = {};
            jwt.verify(this.token, cert, { algorithms: ['RS256'] }, function(err, payload) {
                if(err) {
                    throw err.message;
                } else {
                    delete payload.data[0]["password"]; // Delete the password from the payload before storing.
                    userData = payload.data[0];
                }
            });

            userData = JSON.parse(`{"success": true, "user": ${JSON.stringify(userData)}}`);
            this.SetData(userData);
            return userData;
        }
        catch (err) {
            return JSON.parse(`{ "success": false, "message": "${err}"}`)
        }
    }
    /**
     * This function checks if the authenticated user has security access to the route they're requesting.
     * @param {Object} groupsAllowed Array of Security Groups allowed to perform the request. Accepts: Administrator, Lead, Technician, Read Only
     * @returns {Object} Returns success status and the group the user belongs to. If a user doesn't belong to a group, it returns an error message instead of the security group.
     */
    CheckPermissions = async function (groupsAllowed) {
        try {
            // Retrieve the name of the security group the user belongs to
            let result = await db.query(escape`
                SELECT title
                FROM security_group
                WHERE id = ${this.GetData().user.security_group}
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

exports.Connection = Connection;