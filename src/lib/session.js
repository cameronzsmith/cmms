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
            if(this.token === undefined || this.token == "") throw "Token is undefined or empty.";

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
}

exports.Connection = Connection;