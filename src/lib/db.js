const mysql = require('serverless-mysql')
require('dotenv').config()

const db = mysql({
    config: {
        host: process.env.MYSQL_HOST || "localhost",
        database: process.env.MYSQL_DATABASE || "cmms",
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || ""
    },
    onConnectError: (e) => {
        console.log("Unable to connect to the database.");
    },
    onError: (e) => {
        switch(e.code) {
            case 'PROTOCOL_CONNECTION_LOST':
                reconnect();
                break;
            default:
                console.log("Error: " + e.code);
                break;
        }
    }
})

function reconnect() {
    try {
        const {
            host, database, user, password,
        } = db.config;
        
        this._connection = db.connect({
            host,
            database,
            user,
            password
        })

        this._connection.on("error", (error) => {
            throw error;
        });
    }
    catch(error) {
        console.log("Error: " + error);
        this.reconnect();
    }
}

exports.query = async query => {
    try {
        const results = await db.query(query)
        await db.end()
        return results
    } catch(error) {
        return { error }
    }
}