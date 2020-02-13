const db = require('./db');

/** @module API */

/**
 * Gets a specific record from the supplied ID. Returns the data found from the SQL query if successful.
 * @memberof API
 * @param {Number} id The ID we wish to look up
 * @param {String} sql The SQL query to execute that's returned
 * @returns {Object} Returns the result of our SQL query from the supplied parameters.
 */
async function Get(id, sql) {
    try {
        if(isNaN(id) || id === undefined || id <= 0) {
            throw "No results found with the supplied ID!";
        }

        const [result] = await db.query(sql);
        if(result === undefined || result.length < 1) {
            throw "No results found with the supplied ID!"
        }

        return JSON.parse(`{"success": true, "result": ${JSON.stringify(result)} }`);
    }
    catch (err) {
        return JSON.parse(`{"success": false, "message": "${err}"}`);
    }
}

exports.Get = Get;