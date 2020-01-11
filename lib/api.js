const fs = require('fs');
const jwt = require("jsonwebtoken");
const db = require('./db');
const escape = require('sql-template-strings');

class Session {
    constructor(token) {
        this.token = token;
        this.data = {};

        this.SignIn();
    }

    GetData = function() {
        return this.data; 
    };

    SetData = function(payload) {
        this.data = payload; 
    };

    SignIn = function() {
        try {
            // Check if a valid user token was provided
            if(this.token === undefined || this.token == "") {
                throw "Token is undefined or empty."
            }
            
            // Store the payload data if a valid token is provided
            let cert = fs.readFileSync('./public.key', 'utf8');
            let userData = {};
            jwt.verify(this.token, cert, { algorithms: ['RS256'] }, function(err, payload) {
                if(err) {
                    throw err.message;
                } else {
                    delete payload.data[0]["password"];
                    userData = payload.data[0];
                }
            });

            userData = JSON.parse(`{"success": true, "user": ${JSON.stringify(userData)}}`);
            this.SetData(userData);
            return userData;
        }
        catch (err) {
            return JSON.parse(`{ "success": false, "message": "${err}"}`)
        }
    }

    CheckPermissions = async function (groupsAllowed) {
        try {
            // Retrieve the name of the security group the user belongs to
            let result = await db.query(escape`
                SELECT title
                FROM security_group
                WHERE id = ${this.GetData().user.security_group}
            `)

            // Check if the user belongs to a group allowed to create users
            let userHasPermissions = false;
            const createdBySecurityGroup = result[0].title;
            
            for(let i = 0; i < groupsAllowed.length; ++i) {
                if(createdBySecurityGroup === groupsAllowed[i]) {
                    userHasPermissions = true;
                    break;
                }
            }
    
            // Only continue if the user has a valid token and permissions to create users.
            if(!userHasPermissions) {
                throw "You don't have sufficient privileges."
            }

            return JSON.parse(`{"success": true, "result": "${createdBySecurityGroup}"}`);
        }
        catch (err) {
            return JSON.parse(`{"success": false, "message": "${err}"}`)
        }
    }

    GetAllUsers = async function (req, res) {
        // Verify the user can perform the action requested
        allowedGroups = ["Administrator", "Lead", "Technician", "Read Only"];
        const canGetUsers = await user.CheckPermissions(allowedGroups);
        if(!canGetUsers.success) throw canGetUsers.message;
   
        // Get the limit parameters to reduce payload size
        let page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 9
        if (page < 1) page = 1
        
        // Query for the user information
        const users = await db.query(escape`
            SELECT id, email, first_name, last_name, phone_number, job_title, security_group, date_of_last_login, created_at, created_by, last_updated_at, last_updated_by
            FROM user
            ORDER BY first_name
            LIMIT ${(page - 1) * limit}, ${limit}
        `)
        
        // Get the count of the total users
        const count = await db.query(escape`
            SELECT COUNT(*)
            AS userCount
            FROM user
        `)
   
        // Store the summary values to return in response
        const { userCount } = count[0]
        const pageCount = Math.ceil(userCount / limit)
   
        res.status(200).json({success: true, result: {users, userCount, pageCount, page}})
   }
   
  CreateAUser = async function (params) {
       try {
           // Verify that the user can perform the action requested
           allowedGroups = ["Administrator", "Lead"];
           const canCreateUser = await this.CheckPermissions(allowedGroups);
           if(!canCreateUser.success) throw canCreateUser.message;
   
           // Required parameters
           let password = params.password
           const email = params.email
           const securityGroup = params.securityGroup
   
           // Optional parameters
           const firstName = params.firstName
           const lastName = params.lastName
           const phoneNumber = params.phoneNumber
           const jobTitle = params.jobTitle
   
           // Check if the required parameters were provided
           const passwordBlank = (password === undefined || password === "") ? true : false;
           const emailBlank = (email === undefined || email === "") ? true : false;
           const securityGroupBlank = (securityGroup === undefined || securityGroup === "") ? true : false;
   
           if(passwordBlank || emailBlank || securityGroupBlank) {
               throw "You must supply an email, password, and security group!";
           }
   
           // Check if the email address being aupplied already exists
           let emailCount = await db.query(escape`
               SELECT COUNT(*)
               FROM user
               WHERE email = ${email}
           `)
   
           const emailExists = (emailCount[0]["COUNT(*)"] > 0) ? true : false;
           if(emailExists) {
               throw "Email supplied is already in use!";
           }
   
           // Retrieves the security group ID using the parameter supplied
           result = await db.query(escape`
               SELECT id
               FROM security_group
               WHERE title = ${securityGroup}
           `)
           
           // Verify the user provided a valid security group ID
           const securityGroupID = parseInt(result[0].id)
           if(securityGroupID === undefined || securityGroupID <= 0) {
               throw "Unable to find security group from the supplied parameters.";
           }
   
           // Encrypt the password before storing in the database
           let salt = bcrypt.genSaltSync(10);
           let hash = bcrypt.hashSync(password, salt);
   
           // Insert the new user into the database
           result = await db.query(escape`
               INSERT INTO user (email, password, first_name, last_name, phone_number, job_title, security_group, created_at, created_by, last_updated_at, last_updated_by)
               VALUES (${email}, ${hash}, ${firstName}, ${lastName}, ${phoneNumber}, ${jobTitle}, ${securityGroupID}, NOW(), ${this.GetData().user.email}, NOW(), ${this.GetData().user.email})
           `)
   
           return JSON.parse(`{ "success": true, "result": "${result}" }`);
       }
       catch (err) {
           return JSON.parse(`{ "success": false, "message": "${err}"}`);
       }
   }
}

exports.Session = Session;