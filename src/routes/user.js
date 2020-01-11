const bcrypt = require('bcryptjs');
const escape = require('sql-template-strings');

const db = require('../lib/db');

/** @module User */

/**
 * Retrieves the entire list of users.
 * @memberof User
 * @param {Connection} session Connection object which contains authenticated user payload.
 * @param {Object} params Parameter object from the HTTP request.
 * @returns {Object} If a valid session token is provided, it will return a list of users, the count of users, the total amount of pages the user list consumes, and the current page number.
 */
async function GetAllUsers (session, params) {
    try {
        // Verify the user can perform the action requested
        const allowedGroups = ["Administrator", "Lead", "Technician", "Read Only"];
        const canGetUsers = await session.CheckPermissions(allowedGroups);
        if(!canGetUsers.success) throw canGetUsers.message;

        // Get the limit parameters to reduce payload size
        let page = parseInt(params.page) || 1
        const limit = parseInt(params.limit) || 9
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

        return JSON.parse(`{"success": true, "result": {"users": ${JSON.stringify(users)}, "userCount": ${userCount}, "pageCount": ${pageCount}, "page": ${page}}}`);
    }
    catch (err) {
        return JSON.parse(`{"success": false, "message": "${err}"}`);
    }
}

/**
* Creates a new user and returns the newly created user data.
* @memberof User
* @param {Session} session Session object which contains authenticated user payload.
* @param {Object} params Parameter object from the HTTP request
* @returns {Object} Returns success status and the user object. If unsuccessful, an error message is returned instead of the user object.
*/
async function CreateUser (session, params) {
   try {
       // Verify that the user can perform the action requested
       const allowedGroups = ["Administrator", "Lead"];
       const canCreateUser = await session.CheckPermissions(allowedGroups);
       if(!canCreateUser.success) throw canCreateUser.message;

       // Required parameters
       let password = params.password
       const email = params.email
       const securityGroup = params.securityGroup

       // Optional parameters
       const firstName = params.firstName
       const lastName = params.lastName
       const phoneNumber = params.phoneNumber
       const jobTitle = params.jobTitle

       // Check if the required parameters were provided
       const passwordBlank = (password === undefined || password === "") ? true : false;
       const emailBlank = (email === undefined || email === "") ? true : false;
       const securityGroupBlank = (securityGroup === undefined || securityGroup === "") ? true : false;

       if(passwordBlank || emailBlank || securityGroupBlank) {
           throw "You must supply an email, password, and security group!";
       }

       // Check if the email address being aupplied already exists
       let emailCount = await db.query(escape`
           SELECT COUNT(*)
           FROM user
           WHERE email = ${email}
       `)

       const emailExists = (emailCount[0]["COUNT(*)"] > 0) ? true : false;
       if(emailExists) {
           throw "Email supplied is already in use!";
       }

       // Retrieves the security group ID using the parameter supplied
       result = await db.query(escape`
           SELECT id, title, access_level
           FROM security_group
           WHERE title = ${securityGroup}
       `)

       // Verify the user provided a valid security group ID
       const securityGroupID = parseInt(result[0].id);
       if(securityGroupID === undefined || securityGroupID <= 0) {
           throw "Unable to find security group from the supplied parameters.";
       }

       // Check that the access level of the logged in user is able to perform the action
       const accessLevel = parseInt(result[0].access_level); // 1
       const groupTitle = result[0].title;

       if(accessLevel < session.GetData().user.security_group) {
           throw "Your account doesn't have access to create users in the " + groupTitle + " group!";
       }

       // Encrypt the password before storing in the database
       let salt = bcrypt.genSaltSync(10);
       let hash = bcrypt.hashSync(password, salt);

       // Insert the new user into the database
       result = await db.query(escape`
           INSERT INTO user (email, password, first_name, last_name, phone_number, job_title, security_group, created_at, created_by, last_updated_at, last_updated_by)
           VALUES (${email}, ${hash}, ${firstName}, ${lastName}, ${phoneNumber}, ${jobTitle}, ${securityGroupID}, NOW(), ${session.GetData().user.email}, NOW(), ${session.GetData().user.email})
       `)

       return JSON.parse(`{ "success": true, "result": ${JSON.stringify(result)} }`);
   }
   catch (err) {
       return JSON.parse(`{ "success": false, "message": "${err}"}`);
   }
}

exports.GetAllUsers = GetAllUsers;
exports.CreateUser = CreateUser;