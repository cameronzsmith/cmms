const db = require('../../../lib/db')
const escape = require('sql-template-strings')

module.exports = async (req, res) => {
    // Verify the user entered the required parameters
    const userID = parseInt(req.query.id);
    if(userID === undefined || userID <= 0) {
        req.status(400).json({ success: false, message: "You must provide a User ID." });
    }

    // Retrieve the user information from the supplied UserID
    const [user] = await db.query(escape`
        SELECT *
        FROM user
        WHERE id = ${userID}
    `)

    res.status(200).json({ success: true, result: { user } })
}