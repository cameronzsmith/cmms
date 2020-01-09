const db = require('../../../lib/db');
const escape = require('sql-template-strings');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

async function VerifyUser(req, res, groups) {
    try {
        let user = {};
        let userHasPermissions = false;
        console.log(userHasPermissions);

        // Check if a valid user token was provided
        const token = await req.headers.token;
        if(token === undefined || token == "") {
            throw "Token is undefined or empty."
        }
        
        // Store the payload data if a valid token is provided
        const cert = fs.readFileSync('./public.key', 'utf8');
        jwt.verify(token, cert, { algorithms: ['RS256'] }, function(err, payload) {
            if(err) {
                throw err.message;
            } else {
                user = payload;
            }
        });

        // Retrieve the name of the security group the user belongs to
        let result = await db.query(escape`
            SELECT title
            FROM security_group
            WHERE id = ${user.data[0].security_group}
        `)

        // Check if the user belongs to a group allowed to create users
        const createdBySecurityGroup = result[0].title
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

module.exports = async(req, res) => {
    let allowedGroups = [];

    switch(req.method) {
        case 'GET':
            // Verify the user's token and that they belong to the appropriate group(s)
            allowedGroups = ["Administrator", "Lead", "Technician", "Read Only"];
            let canGetUsers = await VerifyUser(req, res, allowedGroups);
            if(!canGetUsers) break;

            // Get the limit parameters to reduce payload size
            let page = parseInt(req.query.page) || 1
            const limit = parseInt(req.query.limit) || 9
            if (page < 1) page = 1
            
            // Query for the user information
            const users = await db.query(escape`
                SELECT id, email, first_name, last_name, phone_number, job_title, security_group, date_of_last_login, created_at, created_by, last_updated_at, last_updated_by
                FROM user
                ORDER BY first_name
                LIMIT ${(page - 1) * limit}, ${limit}
            `)
            
            // Get the count of the total users
            const count = await db.query(escape`
                SELECT COUNT(*)
                AS userCount
                FROM user
            `)

            // Store the summary values to return in response
            const { userCount } = count[0]
            const pageCount = Math.ceil(userCount / limit)

            res.status(200).json({ success: true, result: { users, userCount, pageCount, page }  })
            break;

        case 'POST':
            // Verify the user
            allowedGroups = ["Administrator", "Lead"];
            canCreateUser = await VerifyUser(req, res, allowedGroups);
            if(!canCreateUser) break;

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
                break;
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
                VALUES (${email}, ${hash}, ${firstName}, ${lastName}, ${phoneNumber}, ${jobTitle}, ${securityGroupID}, NOW(), ${user.data[0].email}, NOW(), ${user.data[0].email})
            `)

            res.status(200).json({ success: true, result });
            break;

        default:
            res.status(405).end();
            break;
    }
}