const API = require('../../lib/api');

/** @module User */

/**
 * Gets a specific user from the supplied ID.
 * @memberof User
 * @param {Number} id - The ID supplied in the request parameters.
 * @returns {Object} Returns the User data if successful.
 */
async function GetUser(id) {
    try {        
        const sql = `
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
                user.last_login, 
                user.created_at, 
                user.created_by, 
                user.last_updated_at, 
                user.last_updated_by
            FROM user
            INNER JOIN security_group ON user.security_group_id = security_group.id
            WHERE user.id = ${id}
        `;

        return await API.Get(id, sql);
    }
    catch(err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
}

/**
 * Retrieves the entire list of users.
 * @memberof User
 * @param {Object} params - Parameter object from the HTTP request.
 * @returns {Object} Returns success status, and result object with user data, the amount of users, and pagination info.
 */
async function GetAllUsers (params) {
    try {
        // Query for the user information
        const sql = `
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
                user.last_login, 
                user.created_at, 
                user.created_by, 
                user.last_updated_at, 
                user.last_updated_by
            FROM user
            INNER JOIN security_group ON user.security_group_id = security_group.id
            ORDER BY user.first_name
            
        `;

        return API.GetAll(params, sql, "user");
    }
    catch (err) {
        return JSON.parse(`{"success": false, "message": "${err}"}`);
    }
}

/**
* Creates a new user and returns the newly created user data.
* @memberof User
* @param {Connection} session - Connection object which contains authenticated user payload.
* @param {Object} params - Parameter object from the HTTP request
* @returns {Object} Returns success status and the user object. If unsuccessful, an error message is returned instead of the user object.
*/
async function CreateUser (session, params) {
   try {
        const data = {
            fields: [
                {field: "email", value: params.email, required: true, unique: true, alias: "Email"},
                {field: "password", value: params.password, required: true},
                {field: "security_group_id", value: params.securityGroup, required: true},
                {field: "first_name", value: params.firstName},
                {field: "last_name", value: params.lastName},
                {field: "phone_number", value: params.phoneNumber},
                {field: "job_title", value: params.jobTitle}
            ]
        };
        
        const settings = {
            session: session,
            database: { table: "user" },
            security: { groups: ['Administrator', "Lead"] }
        };

       return API.Create(data, settings);
   }
   catch (err) {
       return JSON.parse(`{ "success": false, "message": "${err}"}`);
   }
}

/**
 * Update a specific user.
 * @memberof User
 * @param {Connection} session - Connection object which contains authenticated user payload
 * @param {Object} params - Parameter object from the HTTP request
 * @returns {Object} Returns success status and the result of the update query.
 */
async function UpdateUser (session, params) {
    try {
        const data = {
            fields: [
                {field: "email", value: params.email, unique: true, alias: "Email"},
                {field: "security_group_id", value: params.securityGroup},
                {field: "first_name", value: params.firstName},
                {field: "last_name", value: params.lastName},
                {field: "phone_number", value: params.phoneNumber},
                {field: "job_title", value: params.jobTitle}
            ]
        };
        
        const settings = {
            id: params.id,
            session: session,
            database: { table: "user" },
            security: { groups: ['Administrator', "Lead"] }
        };

        const targetData = await this.GetUser(settings.id);
        if(!targetData.success) throw targetData.message;

        return API.Update(data, targetData, settings);
    }
    catch(err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
}

exports.GetUser = GetUser;
exports.GetAllUsers = GetAllUsers;
exports.CreateUser = CreateUser;
exports.UpdateUser = UpdateUser;