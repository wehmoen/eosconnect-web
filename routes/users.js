var express = require('express');
let helper = require('../helper');
let EosApi = require('eosjs-api');
let eos = EosApi({httpEndpoint: 'https://eos.greymass.com'});
var router = express.Router();

/* GET users listing. */
router.post('/me', async (req, res, next) => {
    let {authorization = null} = req.headers;
    let token = await helper.db.getToken(authorization);
    if (token.length !== 1) {
        res.status(401).json({error: "unauthorized"});
    } else {
        token = token[0];
        eos.getAccount({account_name: token.account}).then(account => {
            helper.db.log(token.client_id, req.ip, token.token, '/users/me', null, token.account);
            res.json(account)
        });
    }
});

module.exports = router;
