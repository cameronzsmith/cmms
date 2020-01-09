const db = require('../../../lib/db');
const escape = require('sql-template-strings');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

module.exports = async(req, res) => {
    switch(req.method) {
        case 'GET':
            let page = parseInt(req.query.page) || 1
            const limit = parseInt(req.query.limit) || 9
            if (page < 1) page = 1
            const users = await db.query(escape`
                SELECT *
                FROM user
                ORDER BY first_name
                LIMIT ${(page - 1) * limit}, ${limit}
            `)
            const count = await db.query(escape`
                SELECT COUNT(*)
                AS userCount
                FROM user
            `)
            const { userCount } = count[0]
            const pageCount = Math.ceil(userCount / limit)
            res.status(200).json({ users, userCount, pageCount, page })
            break
        case 'POST':
            // Check if a valid user token was provided
            let hasError = false;
            let hasPermissions = false;
            const token = await req.headers.token;
            const cert = fs.readFileSync('./public.key', 'utf8');

            // Store the payload data if a valid token is provided
            let user = {};
            jwt.verify(token, cert, { algorithms: ['RS256'] }, function(err, payload) {
                if(err) {
                    res.send({ success: false, message: err.message });
                    hasError = true;
                } else {
                    user = payload;
                }
            });

            if(hasError) break;

            // Retrieve the name of the security group the user belongs to
            let result = await db.query(escape`
                SELECT title
                FROM security_group
                WHERE id = ${user.data[0].security_group}
            `)

            // Check if the user belongs to the group(s) allowed to create users
            const createdBySecurityGroup = result[0].title
            if(createdBySecurityGroup === "Administrator" || createdBySecurityGroup == "Lead") {
                hasPermissions = true;
            }
            
            // Only continue if the user has a valid token and permissions to create users.
            if(!hasPermissions) {
                res.send({ success: false, message: "You don't have sufficient privileges!" });
                break;
            } 

            // Required parameters
            let password = req.query.password
            const email = req.query.email
            const securityGroup = req.query.securityGroup

            // Optional parameters
            const firstName = req.query.firstName
            const lastName = req.query.lastName
            const phoneNumber = req.query.phoneNumber
            const jobTitle = req.query.jobTitle

            // Check if the required parameters were provided
            const passwordBlank = (password === undefined || password === "") ? true : false;
            const emailBlank = (email === undefined || email === "") ? true : false;
            const securityGroupBlank = (securityGroup === undefined || securityGroup === "") ? true : false;

            if(passwordBlank || emailBlank || securityGroupBlank) {
                res.status(400).json({ success: false, message: "You must supply an email, password, and security group!" });
            }

            // Check if the email address being aupplied already exists
            let emailCount = await db.query(escape`
                SELECT COUNT(*)
                FROM user
                WHERE email = ${email}
            `)

            const emailExists = (emailCount[0]["COUNT(*)"] > 0) ? true : false;
            if(emailExists) {
                res.status(409).json({ success: false, message: "Email supplied is already in use!" });
                break;
            }

            // Retrieves the security group ID using the parameter supplied
            result = await db.query(escape`
                SELECT id
                FROM security_group
                WHERE title = ${securityGroup}
            `)
            
            // Verify the user provided a valid security group ID
            const securityGroupID = parseInt(result[0].id)
            if(securityGroupID === undefined || securityGroupID <= 0) {
                res.status(400).json({ success: false, message: "Unable to find security group from the supplied parameters."});
                break;
            }

            // Encrypt the password before storing in the database
            let salt = bcrypt.genSaltSync(10);
            let hash = bcrypt.hashSync(password, salt);

            // Insert the new user into the database
            result = await db.query(escape`
                INSERT INTO user (email, password, first_name, last_name, phone_number, job_title, security_group, created_at, created_by, last_updated_at, last_updated_by)
                VALUES (${email}, ${hash}, ${firstName}, ${lastName}, ${phoneNumber}, ${jobTitle}, ${securityGroupID}, NOW(), 'cameron@devforia.com', NOW(), 'cameron@devforia.com')
            `)

            res.status(200).json({ success: true, result });
            break;

        default:
            res.status(405).end();
            break;
    }
}