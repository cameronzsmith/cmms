const db = require('../../../lib/db')
const escape = require('sql-template-strings')
const bcrypt = require('bcryptjs')

module.exports = async(req, res) => {
    switch(req.method) {
        case 'GET':
            let page = parseInt(req.query.page) || 1
            const limit = parseInt(req.query.limit) || 9
            if (page < 1) page = 1
            const users = await db.query(escape`
                SELECT *
                FROM user
                ORDER BY first_name
                LIMIT ${(page - 1) * limit}, ${limit}
            `)
            const count = await db.query(escape`
                SELECT COUNT(*)
                AS userCount
                FROM user
            `)
            const { userCount } = count[0]
            const pageCount = Math.ceil(userCount / limit)
            res.status(200).json({ users, userCount, pageCount, page })
            break
        case 'POST':
            const email = req.query.email
            const firstName = req.query.firstName
            const lastName = req.query.lastName
            const phoneNumber = req.query.phoneNumber
            const securityGroup = req.query.securityGroup

            let password = req.query.password
            let salt = bcrypt.genSaltSync(10);
            let hash = bcrypt.hashSync(password, salt);

            const result = await db.query(escape`
                INSERT INTO user (email, password, first_name, last_name, phone_number, security_group)
                VALUES (${email}, ${hash}, ${firstName}, ${lastName}, ${phoneNumber}, ${securityGroup})
            `)
            res.status(200).json({ result })
            break
        default:
            res.status(405).end()
            break
    }
}