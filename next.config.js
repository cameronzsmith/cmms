require('dotenv').config()

module.exports = {
    env: {
        MYSQL_HOST: process.env.MYSQL_HOST,
        MYSQL_DATABASE: process.env.MYSQL_DATABASE,
        MYSQL_USER: process.env.MYSQL_USER,
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
        SECRET: process.env.SECRET
    }
}