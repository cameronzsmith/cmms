const moment = require('moment');
const db = require('../../lib/db');
const escape = require('sql-template-strings');
const Security = require('../../lib/security');
const API = require('../../lib/api');

/** @module Project */

/**
 * Gets a specific project from the supplied ID.
 * @memberof Project
 * @param {Number} id - The ID to look up.
 * @returns {Object} Returns the Project data if successful.
 */
async function GetProject(id) {
    try {
        const sql = escape`
            SELECT
                id,
                title,
                description
            FROM project
            WHERE id = ${id}
        `;

        return await API.Get(id, sql)
    }
    catch(err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
}

/**
 * Retrieves the entire list of projects.
 * @memberof Project
 * @param {Object} params - Parameter object from the HTTP request.
 * @returns {Object} Returns the success status and project data.
 */
async function GetAllProjects (params) {
    try {
        // Query for the user information
        const sql = escape`
            SELECT 
                id,
                title,
                description
            FROM project
            ORDER BY title
        `;

        return API.GetAll(params, sql, "project");
    }
    catch (err) {
        return JSON.parse(`{"success": false, "message": "${err}"}`);
    }
}

/**
* Creates a new project and returns the newly created project data.
* @memberof Project
* @param {Connection} session - Connection object which contains authenticated user payload.
* @param {Object} params - Parameter object from the HTTP request
* @returns {Object} Returns success status and the project object. If unsuccessful, an error message is returned instead.
*/
async function CreateProject (session, params) {
    try {
        // Verify that the user can perform the action requested
        const allowedGroups = ["Administrator", "Lead"];
        const canCreate = await Security.CheckPermissions(session, allowedGroups);
        if(!canCreate.success) throw canCreate.message;
 
        // Required parameters
        const title = params.title

        // Other parameters
        const description = params.description
 
        // Check if the required parameters were provided
        const titleBlank = (title === undefined || title === "") ? true : false;
        if(titleBlank) {
            throw "You must supply a Project name!";
        }
 
        // Check if the project name already exists
        let count = await db.query(escape`
            SELECT COUNT(*)
            FROM project
            WHERE title = ${title}
        `)
 
        const exists = (count[0]["COUNT(*)"] > 0) ? true : false;
        if(exists) {
            throw "Project name supplied is already in use!";
        }

        // Insert the new project into the database
        const now = moment().format();
        result = await db.query(escape`
            INSERT INTO project (
                title, 
                description,
                created_at, 
                created_by
             )
            VALUES (
                 ${title},
                 ${description}, 
                 ${now}, 
                 ${session.GetData().user.email}
             );
        `)

        if(result.error) throw "#" + result.error.errno + " " + result.error.sqlMessage;
 
        return JSON.parse(`{ "success": true, "result": ${JSON.stringify({title, description, createdAt: now, createdBy: session.GetData().user.email})} }`);
    }
    catch (err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
 }

 
/**
 * Update a specific project.
 * @memberof Project
 * @param {Connection} session - Connection object which contains authenticated user payload
 * @param {Object} params - Parameter object from the HTTP request
 * @returns {Object} Returns success status and the result of the update query.
 */
async function UpdateProject (session, params) {
    try {
        // Set the groups allowed to perform this action
        const allowedGroups = ["Administrator", "Lead"];
        const canUpdate = await Security.CheckPermissions(session, allowedGroups);
        if(!canUpdate.success) throw canUpdate.message;

        // Check that the project ID the project wants to update is valid
        const id = parseInt(params.id);
        if(id === undefined || id <= 0) throw "You must supply a valid project ID";

        // Get the security group of the project that's being updated to make sure the account has sufficient privileges.
        const project = await this.GetProject(params.id);
        if(!project.success) throw project.message;

        // If the parameter wasn't supplied, use the old project data.
        const title = (params.title === undefined) ? project.result.title : params.title;
        const description = (params.description === undefined) ? project.result.security_group : params.description;

        // If the project isn't removing the project name, check that they're using a unique name.
        if(title !== null && title != project.result.title) {
            const duplicateCount = await db.query(escape`
                SELECT COUNT(*)
                FROM project
                WHERE title = ${title}
            `)

            const newNameExists = (duplicateCount[0]["COUNT(*)"] > 0) ? true : false;
            if(newNameExists) throw "Project name supplied is already in use!";
        }
        
        //  Update the project from the supplied parameters
        result = await db.query(escape`
            UPDATE project
            SET title = ${title}, description = ${description}
            WHERE id = ${id}
        `);

        return JSON.parse(`{ "success": true, "result": ${JSON.stringify({id, title, description})}}`);
    }
    catch(err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
}

exports.GetProject = GetProject;
exports.GetAllProjects = GetAllProjects;
exports.CreateProject = CreateProject;
exports.UpdateProject = UpdateProject;