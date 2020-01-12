
const db = require('./db');
const escape = require('sql-template-strings');

/** @module Security */

/**
 * Gets the name of the security group from the @securityGroupID.
 * @memberof Security
 * @param {number} securityGroupID The ID of the security group you want to get the name of
 * @returns {Object} Returns success status 
 */
async function GetSecurityGroup (securityGroupID) {
    try {
        // Retrieves the security group ID from the supplied security group
        const [group] = await db.query(escape`
            SELECT title
            FROM security_group
            WHERE id = ${securityGroupID}
        `);
        if(group === undefined) throw "Unable to retrieve security group";

        return JSON.parse(`{"success": false, "result": "${JSON.stringify(group)}"}`);
    }
    catch (err) {
        return JSON.parse(`{"success": false, "message": "${err}"}`);
    }
}

/**
 * Get the ID of the security group from the @securityGroup.
 * @memberof Security
 * @param {string} securityGroup The name of the security group
 * @returns {Object} Returns success status and the ID of the security group.
 */
async function GetSecurityGroupID (securityGroup) {
    try {
        // Retrieves the security group ID from the supplied security group
        const [group] = await db.query(escape`
            SELECT id
            FROM security_group
            WHERE title = ${securityGroup}
        `);

        return JSON.parse(`{"success": true, "result": ${JSON.stringify(group)}}`);
    }
    catch (err) {
        return JSON.parse(`{"success": false, "message": "${err}"}`);
    }
}

/**
 * This function checks if the authenticated user has security access to the route they're requesting.
 * @memberof Security 
 * @param {Connection} session Connection object that has the authenticated user data.
 * @param {Object} groupsAllowed Array of Security Groups allowed to perform the request. Accepts: Administrator, Lead, Technician, Read Only
 * @returns {Object} Returns success status and the group the user belongs to. If a user doesn't belong to a group, it returns an error message instead of the security group.
 */
async function CheckPermissions (session, groupsAllowed) {
    try {
        // Check if the user belongs to a group allowed to create users
        let userHasPermissions = false;
        const createdBySecurityGroup = session.GetData().user.security_group;
        
        for(let i = 0; i < groupsAllowed.length; ++i) {
            if(createdBySecurityGroup === groupsAllowed[i]) {
                userHasPermissions = true;
            }
        }

        // Only continue if the user has a valid token and permissions to create users.
        if(!userHasPermissions) {
            throw "You don't have sufficient privileges."
        }

        return JSON.parse(`{"success": true, "result": "${createdBySecurityGroup}"}`);
    }
    catch (err) {
        return JSON.parse(`{"success": false, "message": "${err}"}`);
    }
}

/**
 * Compares the authenticated user session security group with the @securityGroup parameter.
 * @memberof Security
 * @param {Connection} session Connection object that has the authenticated user data
 * @param {string} securityGroup The security group to compare with the authenticated user
 */
async function CheckAccessLevel (session, securityGroup) {
    try {
        // Retrieves the security group ID using the parameter supplied
        const [result] = await db.query(escape`
            SELECT id, access_level
            FROM security_group
            WHERE title = ${securityGroup}
        `)
        // Verify the user provided a valid security group
        const securityGroupID = parseInt(result.id);
        if(securityGroupID === undefined || securityGroupID <= 0) {
            throw "Unable to find security group from the supplied parameters.";
        }

        // Verify that the security group has an access level set, and check whether the user is trying to perform an action on an account above their permitted level
        const accessLevel = parseInt(result.access_level);
        if(accessLevel === undefined || accessLevel <= 0) {
            throw "Unable to find access level from the supplied parameters.";
        }

        // Compare the access level of the group that was passed in the arguments with the authenticated user
        if(accessLevel < session.GetData().user.access_level) {
            throw "You don't have sufficient privileges";
        }

        return JSON.parse(`{ "success": true, "result": ${JSON.stringify(result)} }`);
    }
    catch (err) {
        return JSON.parse(`{ "success": false, "message": "${err}" }`);
    }
}

exports.GetSecurityGroup = GetSecurityGroup;
exports.GetSecurityGroupID = GetSecurityGroupID;
exports.CheckPermissions = CheckPermissions;
exports.CheckAccessLevel = CheckAccessLevel;