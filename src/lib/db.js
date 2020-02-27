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
    onError: async (e) => {
        if(e.code === "PROTOCOL_CONNECTION_LOST") {
            console.log("Connection lost. Reconnecting...");
            await db.quit();
            await db.connect();
        } else {
            console.log("Error: " + e.code);
        }        
    }
})

exports.query = async query => {
    try {
        const results = await db.query(query)
        await db.end()
        return results
    } catch(error) {
        return { error }
    }
}