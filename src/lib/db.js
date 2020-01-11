const mysql = require('serverless-mysql')
require('dotenv').config()

const db = mysql({
    config: {
        host: process.env.MYSQL_HOST || "localhost",
        database: process.env.MYSQL_DATABASE || "cmms",
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || ""
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