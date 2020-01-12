const bcrypt = require('bcryptjs');
const moment = require('moment');
const db = require('../lib/db');
const escape = require('sql-template-strings');
const Security = require('../lib/security');

/** @module User */

/**
 * Gets the user from the passed in user ID.
 * @memberof User
 * @param {Object} params Parameter object from the HTTP request.
 * @returns {Object} Return the success status and the user data, or if an error is found, it will return the error message.
 */
async function GetUser(params) {
    try {        
        
        // Verify the user entered the required parameters
        const userID = parseInt(params.id);
        if(userID === undefined || userID <= 0) {
            throw "You must provide a User ID.";
        }

        // Retrieve the user information from the supplied UserID
        const [user] = await db.query(escape`
            SELECT 
                user.id, 
                user.email, 
                user.first_name, 
                user.last_name, 
                user.phone_number, 
                user.job_title, 
                security_group.title AS security_group,
                user.security_group_id,
                security_group.access_level,
                user.date_of_last_login, 
                user.created_at, 
                user.created_by, 
                user.last_updated_at, 
                user.last_updated_by
            FROM user
            INNER JOIN security_group ON user.security_group_id = security_group.id
            WHERE user.id = ${userID}
        `)

        return JSON.parse(`{ "success": true, "result": ${JSON.stringify(user)} }`);
    }
    catch(err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
}

/**
 * Retrieves the entire list of users.
 * @memberof User
 * @param {Object} params Parameter object from the HTTP request.
 * @returns {Object} Returns success status, and result object with user data, the amount of users, and pagination info.
 */
async function GetAllUsers (params) {
    try {
        // Get the limit parameters to reduce payload size
        let page = parseInt(params.page) || 1
        const limit = parseInt(params.limit) || 9
        if (page < 1) page = 1
        
        // Query for the user information
        const users = await db.query(escape`
            SELECT 
                user.id, 
                user.email, 
                user.first_name, 
                user.last_name, 
                user.phone_number, 
                user.job_title, 
                security_group.title AS security_group,
                user.security_group_id,
                security_group.access_level,
                user.date_of_last_login, 
                user.created_at, 
                user.created_by, 
                user.last_updated_at, 
                user.last_updated_by
            FROM user
            INNER JOIN security_group ON user.security_group_id = security_group.id
            ORDER BY user.first_name
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
       const canCreateUser = await Security.CheckPermissions(session, allowedGroups);
       if(!canCreateUser.success) throw canCreateUser.message;

       const hasAccess = await Security.CheckAccessLevel(session, params.securityGroup);
       if(!hasAccess.success) throw hasAccess.message;

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
       let result = await db.query(escape`
           SELECT id, title, access_level
           FROM security_group
           WHERE title = ${securityGroup}
       `)

       // Verify the user provided a valid security group ID
       const securityGroupID = parseInt(result[0].id);
       if(securityGroupID === undefined || securityGroupID <= 0) {
           throw "Unable to find security group from the supplied parameters.";
       }

       // Encrypt the password before storing in the database
       const salt = bcrypt.genSaltSync(10);
       const hash = bcrypt.hashSync(password, salt);

       // Insert the new user into the database
       const now = moment().format();
       result = await db.query(escape`
           INSERT INTO user (email, password, first_name, last_name, phone_number, job_title, security_group_id, created_at, created_by, last_updated_at, last_updated_by)
           VALUES (${email}, ${hash}, ${firstName}, ${lastName}, ${phoneNumber}, ${jobTitle}, ${securityGroupID}, ${now}, ${session.GetData().user.email}, ${now}, ${session.GetData().user.email})
       `)

       return JSON.parse(`{ "success": true, "result": ${JSON.stringify(result)} }`);
   }
   catch (err) {
       return JSON.parse(`{ "success": false, "message": "${err}"}`);
   }
}

/**
 * Update a specific user.
 * @memberof User
 * @param {Connection} session Session object which contains authenticated user payload
 * @param {Object} params Parameter object from the HTTP request
 * @returns {Object} Returns success status and the result of the update query.
 */
async function UpdateUser (session, params) {
    try {
        // Set the groups allowed to perform this action
        const allowedGroups = ["Administrator", "Lead"];
        const canUpdateUser = await Security.CheckPermissions(session, allowedGroups);
        if(!canUpdateUser.success) throw canUpdateUser.message;

        // Check that the user ID the user wants to update is valid
        const userID = parseInt(params.id);
        if(userID === undefined || userID <= 0) throw "You must supply a valid User ID";

        // Get the security group of the user that's being updated to make sure the account has sufficient privileges.
        const user = await this.GetUser(params);
        if(!user.success) throw user.message;

        // If the parameter wasn't supplied, use the old user data.
        const email = (params.email === undefined) ? user.result.email : params.email;
        const securityGroup = (params.securityGroup === undefined) ? user.result.security_group : params.securityGroup;
        const firstName = (params.firstName === undefined) ? user.result.first_name : params.firstName;
        const lastName = (params.lastName === undefined) ? user.result.last_name : params.lastName;
        const phoneNumber = (params.phoneNumber === undefined) ? user.result.phone_number : params.phoneNumber;
        const jobTitle = (params.jobTitle === undefined) ? user.result.job_title : params.jobTitle;

        // Check if the authenticated user is trying to set an account to a group above their level
        const hasAccess = await Security.CheckAccessLevel(session, securityGroup);
        if(!hasAccess.success) throw hasAccess.message;

        // Check if the authenticated user is trying to update an account that belongs to a group above their level
        const userLocked = await Security.CheckAccessLevel(session, user.result.security_group);
        if(!userLocked.success) throw userLocked.message;

        // If the user isn't removing the email address, check that they're using a unique email address.
        if(email !== null && email != user.result.email) {
            const duplicateEmailCount = await db.query(escape`
                SELECT COUNT(*)
                FROM user
                WHERE email = ${email}
            `)

            const newEmailExists = (duplicateEmailCount[0]["COUNT(*)"] > 0) ? true : false;
            if(newEmailExists) throw "Email supplied is already in use!";
        }

        // Check if the user provided a valid Security Group
        const securityGroupID = await Security.GetSecurityGroupID(securityGroup);
        if(!securityGroupID.success) throw securityGroupID.message;
        
        //  Update the user from the supplied parameters
        const now = moment().format();
        result = await db.query(escape`
            UPDATE user
            SET email = ${email}, security_group_id = ${securityGroupID.result.id}, first_name = ${firstName}, last_name = ${lastName}, phone_number = ${phoneNumber}, job_title = ${jobTitle}, last_updated_at = ${now}, last_updated_by = ${session.GetData().user.email}
            WHERE id = ${userID}
        `);

        return JSON.parse(`{ "success": true, "result": ${JSON.stringify(result)}}`);
    }
    catch(err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
}

exports.GetUser = GetUser;
exports.GetAllUsers = GetAllUsers;
exports.CreateUser = CreateUser;
exports.UpdateUser = UpdateUser;