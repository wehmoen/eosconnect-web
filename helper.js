let mysql = require('mysql');
let db = mysql.createConnection({
    host: 'localhost',
    user: process.env.db_user,
    password: process.env.db_pass,
    database: 'eosconnect'
});

db.connect(error => {
    db.query('DELETE FROM token WHERE created < ADDDATE(NOW(), INTERVAL -1 HOUR)', (err, result) => {
        console.log('Removed ' + result.affectedRows + ' expired tokens.');
        setInterval(() => {
            db.query('DELETE FROM token WHERE created < ADDDATE(NOW(), INTERVAL -1 HOUR)', (err, result) => {
                console.log('Removed ' + result.affectedRows + ' expired tokens.');
            })
        }, 1000 * 60)
    })
});

db.countUserByApp = async (name) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT account FROM token WHERE client_id = ? GROUP BY account", [name], (err, result) => {
            resolve(result);
        })
    })
};

db.getApp = async (name) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM apps WHERE name = ?", [name], (err, result) => {
            resolve(result);
        })
    })
};

db.getAppsByOwner = async (owner) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM apps WHERE owner = ?", [owner], (err, result) => {
            resolve(result);
        })
    })
};

db.getToken = async (token) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM token WHERE `token` = ?", [token], (err, result) => {
            resolve(result);
        })
    })
};

db.insertToken = async (app_name, username, token) => {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO token (account, token, client_id, created) VALUES (?,?,?,?)",
            [username, token, app_name, (new Date()).toISOString().slice(0, 19).replace('T', ' ')],
            (err, result) => {
                resolve(true);
            }
        )
    })
};

db.log = async (app, ip, token, endpoint, body, account) => {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO log (client_id, ip_adress, access_token, endpoint, request_body, account, request) VALUES (?,?,?,?,?,?,?)",
            [app, ip, token, endpoint, body, account, (new Date()).toISOString().slice(0, 19).replace('T', ' ')], () => {
            resolve()
        })
    })
};

module.exports = {
    db,
    scopes: ["login","accountcreate"],
    jwt_token: process.env.jwt_token
};