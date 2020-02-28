const db = require('./db');
const escape = require('sql-template-strings');
const moment = require('moment');
const bcrypt = require('bcryptjs');

const Security = require('./security');

/** @module API */

/**
 * Checks for duplicate records 
 * @param {String} table The table to check for duplicates from
 * @param {Object} field The field to check for duplicates on
 * @param {Number} projectID (Optional) Pass in the project ID if the duplicate check is project specific.
 * @param {String} alias If a duplicate is found, a string is returned "<Alias> is already taken. Please try a different value."
 */
async function CheckForDuplicates(settings, field, projectID = -1) {
    try {
        let filter = "WHERE " + field.field + " = '" + field.value + "'"; 
        if(settings.project_specific) filter += " AND project_id = " + projectID;

        const count = await db.query(escape`SELECT COUNT(*) FROM `.append(settings.database.table).append(" ").append(filter));
        const taken = (count[0]["COUNT(*)"] > 0) ? true : false;
       
        if(taken) throw field.alias + " is already taken. Please try a different value.";
        return {success: true}
    } 
    catch (error) {
        return {success: false, message: error}
    }
 }

 /**
  * Converts the field data type to the supplied type. Defaults to string.
  * @param {Object} field The field to perform data type conversion on
  */
 async function ConvertDataTypes(field) {
    try {
        field.type = (field.type === undefined) ? "string" : field.type;

        if(field.type == "string" && typeof field.value !== "string") {
            field.value.toString();
            if(typeof field.value !== "string") throw "Unable to convert " + field.field + " to a " + field.type + "!"; 
        }
        else if(field.type == "number" && typeof field.value !== "number") {
            field.value = parseInt(field.value);
            if(isNaN(field.value)) throw "Unable to convert " + field.field + " to a " + field.type + "!";
        }

        return {success: true, result: field.value}
    }
    catch (error) {
        return {success: false, message: error}
    }
 }

/**
 * Gets a specific record from the supplied ID. Returns the data found from the SQL query if successful.
 * @memberof API
 * @param {Number} id The ID we wish to look up
 * @param {String} sql The SQL query to execute that's returned
 * @returns {Object} Returns the result of our SQL query from the supplied parameters.
 */
async function Get (id, sql) {
    try {
        if(isNaN(id) || id === undefined || id <= 0) {
            throw "No results found with the supplied ID!";
        }

        const [result] = await db.query(escape``.append(sql));
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
        const result = await db.query(escape``.append(sql).append("LIMIT " + (page - 1) * limit + "," + limit));
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

/**
* Creates data based on the route
* @memberof API
* @param {Object} data - A data object that takes the following fields: { fields: [ {field, value, unique (optional), alias (optional)} ]}
* @param {Object} settings - A settings object that takes the following fields: { session, database: { table }, security: { groups } }
* @returns {Object} Returns success status and the user object. If unsuccessful, an error message is returned instead of the user object.
*/
async function Create (data, settings) {
    try {
        // Verify that the user can perform the action requested
        const canCreate = await Security.CheckPermissions(settings.session, settings.security.groups);
        if(!canCreate.success) throw canCreate.message;

        const now = moment().format();
        const by = settings.session.GetData().user.email;

        // Build an update string to set all of the values passed in from the data object and update the table from the settings object
        let INSERT_STRING_START = "INSERT INTO " + settings.database.table + " (";
        let INSERT_STRING_FIELDS = "";
        let INSERT_STRING_VALUES = " VALUES (";

        let INSERT_STRING_ADDITIONAL_FIELDS = "created_at, created_by, last_updated_at, last_updated_by";
        let INSERT_STRING_ADDITIONAL_VALUES = `'${now}', '${by}', '${now}', '${by}'`;

        let returnObj = {};
        for(let field in data.fields) {
            let key = data.fields[field].field;
            let value = data.fields[field].value;
            let alias = data.fields[field].alias;
            
            if(data.fields[field].required) {
                if(value === undefined || value === "" || value === " ") throw "You must supply a " + key + "!";
            }

            if(alias === undefined) alias = key;

            if(value !== undefined) {
                const types = await ConvertDataTypes(data.fields[field]);
                if(!types.success) throw types.message;
                value = types.result;
            }

            if(data.fields[field].unique) {
                const duplicates = await CheckForDuplicates(settings, data.fields[field], settings.project_id);
                if(!duplicates.success) throw duplicates.message;
            }

            if(data.fields[field].foreign_key && data.fields[field].value !== undefined) {
                const count = await db.query(escape`SELECT COUNT(*)`.append(" FROM " + data.fields[field].table + " WHERE id = " + data.fields[field].value));
                if(count[0]["COUNT(*)"] < 1) throw "Invalid " + data.fields[field].field + " provided!";
            }

            if(key == "password") {
                if(value.length < 12) throw "Password must be more than 12 characters.";
                const salt = bcrypt.genSaltSync(10);
                value = bcrypt.hashSync(value, salt);
            }
            
            if(key == "security_group_id" && isNaN(value)) {      
                const userHasAccess = await Security.CheckAccessLevel(settings.session, value);
                if(!userHasAccess.success) throw userHasAccess.message;

                if(returnObj["security_group"] == undefined) {
                    returnObj["security_group"] = value;
                }

                value = userHasAccess.result[0].id;
                data.fields[field].value = value;
            }

            if(key != "password" && value != "NULL") returnObj[key] = value;
                     
            if(value === undefined) value = "NULL";
            else if(typeof value == "string") value = "'" + value + "'"; 

            if(field != data.fields.length - 1) {
                INSERT_STRING_FIELDS += key + ","
                INSERT_STRING_VALUES += value + ",";
            } else {
                INSERT_STRING_FIELDS += key + "," + INSERT_STRING_ADDITIONAL_FIELDS + ")";
                INSERT_STRING_VALUES += value + "," + INSERT_STRING_ADDITIONAL_VALUES + ");";
            }
        }

        const INSERT_STRING = INSERT_STRING_START + INSERT_STRING_FIELDS + INSERT_STRING_VALUES;
        result = await db.query(INSERT_STRING);
        if(result.error) throw "#" + result.error.errno + " " + result.error.sqlMessage;

        returnObj["id"] = result.insertId;
        return JSON.stringify({ success: true, result: returnObj  });
    }
    catch (err) {
        return JSON.stringify({ success: false, message: err });
    }
 }

/**
 * Update data based on the route
 * @memberof API
 * @param {Object} data - A data object that takes the following fields: { fields: [ {field, value, unique (optional), alias (optional)} ]}
 * @param {Object} targetData - The target data obtained by performing a Get request. Needs to be passed in so that it knows what SQL query to run.
 * @param {Object} settings - A settings object that takes the following fields: { id, session, database: { table }, security: { groups } }
 * @returns {Object} Returns success status and the result of the update query.
 */
async function Update (data, targetData, settings) {
    try {
        // Check that the logged in user session has permissions to perform the requested function
        const canUpdate = await Security.CheckPermissions(settings.session, settings.security.groups);
        if(!canUpdate.success) throw canUpdate.message;

        // Check that the ID supplied is valid
        const id = parseInt(settings.id);
        if(id === undefined || id <= 0) throw "Invalid ID provided!";

        // Check if the authenticated session is trying to update a record that belongs to a group above their level
        if(targetData.result.security_group != undefined) {
            const targetLocked = await Security.CheckAccessLevel(settings.session, targetData.result.security_group);
            if(!targetLocked.success) throw targetLocked.message;
        }

        // Build an update string to set all of the values passed in from the data object and update the table from the settings object
        let UPDATE_STRING_START = "UPDATE " + settings.database.table + " SET ";
        let UPDATE_STRING_BODY = "";
        let UPDATE_STRING_END = "WHERE id = " + id;

        let returnObj = {id};

        for(let field in data.fields) {
            // Get the value from the params object. If it's undefined, use the original value, otherwise update the value.
            let key = data.fields[field].field;
            let value = data.fields[field].value;
           
            value = (value === undefined) ? targetData.result[key] : value;
            data.fields[field].value = value;

            const types = await ConvertDataTypes(data.fields[field]);
            if(!types.success) throw types.message;
            
            if(data.fields[field].alias === undefined) data.fields[field].alias = key;

            if(value != targetData.result[key]) {
                // Check that there are no duplicates for fields marked unique
                if(data.fields[field].unique) {
                    const duplicates = await CheckForDuplicates(settings, data.fields[field], targetData.result.project_id);
                    if(!duplicates.success) throw duplicates.message;
                }

                // Check that valid foreign keys have been provided
                if(data.fields[field].foreign_key && data.fields[field].value !== undefined) {
                    const count = await db.query(escape`SELECT COUNT(*)`.append(" FROM " + data.fields[field].table + " WHERE id = " + data.fields[field].value));
                    if(count[0]["COUNT(*)"] < 1) throw "Invalid " + data.fields[field].field + " provided!";
                }
                
                // Check if the user passed something other than a number to the security group ID. If so, check if the value is found in the table and return the ID from the lookup.
                if(key == "security_group_id" && isNaN(value)) {              
                    const userHasAccess = await Security.CheckAccessLevel(settings.session, value);
                    if(!userHasAccess.success) throw userHasAccess.message;

                    if(returnObj["security_group"] == undefined) {
                        returnObj["security_group"] = value;
                    }

                    value = userHasAccess.result[0].id;
                    data.fields[field].value = value;
                }

                if(field != data.fields.length - 1) {
                    UPDATE_STRING_BODY += key + " = '" + value + "', ";
                } else {
                    UPDATE_STRING_BODY += key + " = '" + value + "' ";
                }
            }

            returnObj[key] = value;
        }

        // Perform the update
        if(UPDATE_STRING_BODY != "" && UPDATE_STRING_BODY !== undefined) {
            const now = moment().format();       
            const UPDATE_STRING = UPDATE_STRING_START + UPDATE_STRING_BODY + "last_updated_at = '" + now + "', last_updated_by = '" + settings.session.GetData().user.email + "' " + UPDATE_STRING_END;
            const result = await db.query(UPDATE_STRING);
            if(result.error) throw "#" + result.error.errno + " " + result.error.sqlMessage;
        }

        return JSON.parse(`{ "success": true, "result": ${JSON.stringify(returnObj)}}`);
    }
    catch(err) {
        return JSON.parse(`{ "success": false, "message": "${err}"}`);
    }
}

exports.Get = Get;
exports.GetAll = GetAll;
exports.Create = Create;
exports.Update = Update;