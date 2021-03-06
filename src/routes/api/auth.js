
const db = require("../../lib/db");
const escape = require('sql-template-strings');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const moment = require('moment');

/** @module Authentication */

/**
 * This function authenticates the username and password sent in the req parameter and returns a session token.
 * @memberof Authentication
 * @param {Object} req HTTP Request
 * @param {Object} res HTTP Response
 * @returns {Object} Returns a session token with the creation and expiration times.
 */
async function Login(req, res) {
    try {
        // Required parameters
        const params = req.query;
        const email = params.email;
        const password = params.password;

        // Verify that the user supplied the required parameters
        const emailBlank = (email === undefined || email === "") ? true : false;
        const passwordBlank = (password === undefined || password === "") ? true : false;

        if(emailBlank || passwordBlank) {
            // TODO: Check if this return message is valid
            // const returnMsg = `You must provide ${(emailBlank) ? "an email address" : ""}${(emailBlank && passwordBlank) ? " and " : ""}${(passwordBlank) ? "a password" : ""}`;
            throw "You must provide an email address and a password!";
        }
        
        // After checking that we've received valid parameters, query the database for the supplied email address to compare the password and to store the payload
        const user = await db.query(escape`
            SELECT 
                user.id,
                user.email,
                user.password,
                user.first_name,
                user.last_name,
                user.phone_number,
                user.job_title,
                user.security_group_id,
                security_group.title AS security_group,
                security_group.access_level,
                user.last_login,
                user.created_at,
                user.created_by,
                user.last_updated_at,
                user.last_updated_by
            FROM user
            INNER JOIN security_group ON user.security_group_id = security_group.id
            WHERE user.email = ${email}
        `);

        // Compare the password provided in the POST request with the password of the user supplied
        const match = await bcrypt.compare(password, user[0].password);
        if(match) {
             // Get the current date & time, and the expiration time (15 mins from current time)
            const currentTime = moment().format();
            const expirationTime = 15 * 60 * 1000;
            const expiresAt = new Date(new Date().getTime() + expirationTime);

            // Update the last login of the user
            await db.query(escape`
                UPDATE user
                SET last_login = ${currentTime}
                WHERE user.email = ${email}
            `);

            // Use JWT to sign a user token that expires after 1 hour
            const privateKey = fs.readFileSync('./src/private.key', 'utf8');
            jwt.sign({ data: user }, privateKey, { algorithm: 'RS256', expiresIn: expirationTime }, (err, token) => {
                if (err) throw err.message;
                return res.json({success: true, token: {sessionToken: token, createdAt: currentTime, expiresAt}});
            });
        } else {
            throw "Unable to authenticate user."
        }
    }
    catch (err) {
        return res.json({success: false, message: err});
    }
}

exports.Login = Login