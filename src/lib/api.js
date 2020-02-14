const db = require('./db');
const escape = require('sql-template-strings');

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

/**
 * Gets a paginated list of records based on the SQL query provided.
 * @memberof API
 * @param {Object} params - The parameter object from the HTTP request.
 * @param {String} sql - The SQL query to execute that's returned.
 * @param {String} table - The name of the table to get the record count from
 * @param {String} [alias = table + "s"] -  The alias of the object that's returned in the returned result object
 * @returns {Object} Returns success status, and result object with user data, the amount of users, and pagination info.
 */
async function GetAll (params, sql, table, alias = table + "s") {
    try {
        // Get the limit parameters to reduce payload size
        let page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 9;
        if (page < 1) page = 1

        // Apply a limit to the query provided to paginate the data
        const result = await db.query(sql.append("LIMIT " + (page - 1) * limit + "," + limit));
        if(result === undefined || result.length < 1) {
            throw "No results found with the supplied query!"
        }

        // Get the count of the results
        const count = await db.query(escape`
            SELECT COUNT(*)
            AS resultCount
        `.append('FROM ' + table));

        // Store the summary values to return in response
        const { resultCount } = count[0]
        const pageCount = Math.ceil(resultCount / limit)

        return JSON.parse(`{"success": true, "result": {"${alias}": ${JSON.stringify(result)}, "resultCount": ${resultCount}, "page": ${page}, "pageCount": ${pageCount}}}`);
    }
    catch (err) {
        return JSON.parse(`{"success": false, "message": "${err}"}`);
    }
}

exports.Get = Get;
exports.GetAll = GetAll;