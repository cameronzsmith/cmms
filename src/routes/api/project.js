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
        const data = {
            fields: [
                {field: "title", value: params.title, required: true, unique: true, alias: "Project name"},
                {field: "description", value: params.description}
            ]
        };
        const settings = {
            session,
            database: { table: "project" },
            security: { groups: ['Administrator', "Lead"] }
        };

        return API.Create(data, settings);
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
        const data = {
            fields: [
                {field: "title", value: params.title, unique: true, alias: "Project name"},
                {field: "description", value: params.description}
            ]
        };
        const settings = {
            id: params.id,
            session,
            database: { table: "project" },
            security: { groups: ['Administrator', "Lead"] }
        };

        const targetData = await this.GetProject(settings.id);
        if(!targetData.success) throw targetData.message;

        return API.Update(data, targetData, settings);
    }
    catch(err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
}

exports.GetProject = GetProject;
exports.GetAllProjects = GetAllProjects;
exports.CreateProject = CreateProject;
exports.UpdateProject = UpdateProject;