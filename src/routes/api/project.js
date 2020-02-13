const moment = require('moment');
const db = require('../../lib/db');
const escape = require('sql-template-strings');
const Security = require('../../lib/security');
const API = require('../../lib/api');

/** @module Project */

/**
 * Gets a specific project from the supplied ID.
 * @memberof Project
 * @param {Number} id The ID to look up.
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

exports.GetProject = GetProject;