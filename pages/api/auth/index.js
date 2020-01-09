const db = require('../../../lib/db');
const escape = require('sql-template-strings');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

module.exports = async(req, res) => {
    switch(req.method) {
        case 'POST':
            // Required parameters
            const email = req.query.email;
            const password = req.query.password;

            // Verify that the user supplied the required parameters
            const emailBlank = (email === undefined || email === "") ? true : false;
            const passwordBlank = (password === undefined || password === "") ? true : false;

            if(emailBlank || passwordBlank) {
                const returnMsg  = `You must provide ${(emailBlank) ? "an email address" : ""}${(emailBlank && passwordBlank) ? " and " : ""}${(passwordBlank) ? "a password" : ""}`;
                res.status(400).json({ success: false, message: returnMsg });
            }
            
            // After checking that we've received valid parameters, query the database for the supplied email address to compare the password and to store the payload
            const user = await db.query(escape`
                SELECT *
                FROM user
                WHERE email = ${email}
            `)

            // Compare the password provided in the POST request with the password of the user supplied
            const match = await bcrypt.compare(password, user[0].password);
            if(match) {        

                // Use JWT to sign a user token that expires after 1 hour
                const privateKey = fs.readFileSync('./private.key', 'utf8');
                jwt.sign({ data: user }, privateKey, { algorithm: 'RS256', expiresIn: "1h" }, (err, token) => {
                    if (err) throw err;
                    
                    // Get the date and return the user token and expiration time.
                    let currentDate = new Date();
                    currentDate.setHours(currentDate.getHours() + 1);
                    res.status(200).json({
                        success: true,
                        token: {
                            sessionToken: token,
                            expiresAt: currentDate
                        }
                    })
                });
            } else {
                res.status(401).json({ "success": false, "message": "Passwords do not match" });
            }
            break
        default:
            res.status(405).end()
            break
    }
}