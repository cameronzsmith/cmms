const API = require('../../lib/api');
const escape = require('sql-template-strings');

/** @module Location */

/**
 * Gets a specific project from the supplied ID.
 * @memberof Location
 * @param {Number} id - The ID to look up.
 * @returns {Object} Returns the Location data if successful.
 */
async function GetLocation(id) {
    try {
        const sql = escape`
            SELECT
                location.id,
                location.project_id,
                project.title AS project_name,
                location.title,
                location.address,
                location.parent_location_id,
                parent_location.title AS parent_location
            FROM location 
                LEFT JOIN location AS parent_location ON location.parent_location_id = parent_location.parent_location_id
                INNER JOIN project ON location.project_id = project.id
            WHERE location.id = ${id}
        `;

        return await API.Get(id, sql)
    }
    catch(err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
}

/**
 * Retrieves the entire list of locations.
 * @memberof Location
 * @param {Object} params - Parameter object from the HTTP request.
 * @returns {Object} Returns the success status and location data.
 */
async function GetAllLocations (params) {
    try {
        // Query for the location information
        const sql = escape`
            SELECT
                location.id,
                location.project_id,
                project.title AS project_name,
                location.title,
                location.address,
                location.parent_location_id,
                parent_location.title AS parent_location
            FROM location 
                JOIN location AS parent_location ON location.parent_location_id = parent_location.parent_location_id
                JOIN project ON location.project_id = project.id
            ORDER BY location.title
        `;

        return API.GetAll(params, sql, "location");
    }
    catch (err) {
        return JSON.parse(`{"success": false, "message": "${err}"}`);
    }
}

/**
* Creates a new location and returns the newly created location data.
* @memberof Location
* @param {Connection} session - Connection object which contains authenticated user payload.
* @param {Object} params - Parameter object from the HTTP request
* @returns {Object} Returns success status and the location object. If unsuccessful, an error message is returned instead.
*/
async function CreateLocation (session, params) {
    try {
        const data = {
            fields: [
                {field: "project_id", value: params.project_id, required: true, foreign_key: true, table: "project"},
                {field: "title", value: params.title, required: true, unique: true, alias: "Location name"},
                {field: "address", value: params.address, required: true},
                {field: "parent_location_id", value: params.parent_location_id, foreign_key: true, table: "location"}                
            ]
        };
        const settings = {
            session,
            database: { table: "location" },
            security: { groups: ['Administrator', "Lead"] }
        };

        return API.Create(data, settings);
    }
    catch (err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
 }

 
/**
 * Update a specific location.
 * @memberof Location
 * @param {Connection} session - Connection object which contains authenticated user payload
 * @param {Object} params - Parameter object from the HTTP request
 * @returns {Object} Returns success status and the result of the update query.
 */
async function UpdateLocation (session, params) {
    try {
        const data = {
            fields: [
                {field: "project_id", value: params.project_id, type: "number", foreign_key: true, table: "project" },
                {field: "title", value: params.title, unique: true, alias: "Location name"},
                {field: "address", value: params.address},
                {field: "parent_location_id", value: params.parent_location_id, type: "number", foreign_key: true, table: "location"}
            ]
        };
        const settings = {
            id: params.id,
            session,
            database: { table: "location" },
            security: { groups: ['Administrator', "Lead"] }
        };

        const targetData = await this.GetLocation(settings.id);
        if(!targetData.success) throw targetData.message;

        return API.Update(data, targetData, settings);
    }
    catch(err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
}

exports.GetLocation = GetLocation;
exports.GetAllLocations = GetAllLocations;
exports.CreateLocation = CreateLocation;
exports.UpdateLocation = UpdateLocation;