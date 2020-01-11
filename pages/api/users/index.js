const db = require('../../../lib/db');
const escape = require('sql-template-strings');
const bcrypt = require('bcryptjs');
const UserSession = require('../../../lib/user');

module.exports = async(req, res) => {
    // Stores an array of groups allowed to perform the HTTP request submitted
    let allowedGroups = [];

    // Get the token to authorize the user
    const token = await req.headers.token;
    
    // Create a new user session and store their data
    let user = new UserSession.User(token);
    user.setData(user.SignIn());

    // If the user can't be signed in, return an error
    if(user.getData().success == false) {
        res.status(401).json(user.getData());
    }
    
    switch(req.method) {
        case 'GET':
            // Verify the user can perform the action requested
            allowedGroups = ["Administrator", "Lead", "Technician", "Read Only"];
            const canGetUsers = await user.CheckPermissions(allowedGroups);
            if(!canGetUsers.success) break;

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
            // Verify that the user can perform the action requested
            allowedGroups = ["Administrator", "Lead"];
            const canCreateUser = await user.CheckPermissions(allowedGroups);
            if(!canCreateUser.success) break;

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
                VALUES (${email}, ${hash}, ${firstName}, ${lastName}, ${phoneNumber}, ${jobTitle}, ${securityGroupID}, NOW(), ${user.getData().user.email}, NOW(), ${user.getData().user.email})
            `)

            res.status(200).json({ success: true, result });
            break;

        default:
            res.status(405).end();
            break;
    }
}