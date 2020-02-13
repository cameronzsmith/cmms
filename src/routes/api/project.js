const moment = require('moment');
const db = require('../../lib/db');
const escape = require('sql-template-strings');
const Security = require('../../lib/security');
const API = require('../../lib/api');

/** @module Project */

/**
 * Gets the project from the passed in project ID.
 * @memberof Project
 * @param {Object} params Parameter object from the HTTP request.
 * @returns {Object} Returns the success status, and if successful, the project data.
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

        return await API.GetSpecific(id, sql)
    }
    catch(err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
}

exports.GetProject = GetProject;