let express = require('express');
let router = express.Router();
let helper = require('../helper');
let EosApi = require('eosjs-api');
let eos = EosApi({httpEndpoint: 'https://eos.greymass.com'});
let srs = require('secure-random-string');
let middle = require('./middle');

let stripe = require("stripe")(process.env.stripeKey);
router.get('/', async (req, res) => {
    let apps = await helper.db.getAppsByOwner(req.session.username);
    res.render("int/dashboard", {apps})
});

router.get('/apps', async (req, res) => {
    let apps = await helper.db.getAppsByOwner(req.session.username);
    res.locals.active = 'apps';
    res.render('int/apps', {apps})
});

router.get('/apps/:client_id/reset', async (req, res) => {
    let app = await helper.db.getApp(req.params.client_id);
    if (app.length === 0 || app[0].owner !== req.session.username || app[0].is_enabled === 0) {
        res.status(403).render('error/403');
    } else {
        let secret = srs({length: 48});
        helper.db.query("UPDATE apps SET secret = ? WHERE name = ?", [secret, req.params.client_id], (err, result) => {
            helper.db.query("DELETE FROM token WHERE client_id = ?", [req.params.client_id], (err, result) => {
                res.redirect('/int/apps/' + req.params.client_id);
            })
        });
    }
});

router.get('/apps/:client_id/revoke', async (req, res) => {
    let app = await helper.db.getApp(req.params.client_id);
    if (app.length === 0 || app[0].owner !== req.session.username) {
        res.status(403).render('error/403');
    } else {
        helper.db.query('DELETE FROM token WHERE client_id = ?', [req.params.client_id], (err, result) => {
            res.redirect('/int/apps/' + app[0].name);
        });
    }
});

router.get('/apps/:client_id/edit', async (req, res) => {
    let app = await helper.db.getApp(req.params.client_id);
    if (app.length === 0 || app[0].owner !== req.session.username || app[0].is_enabled === 0) {
        res.status(403).render('error/403');
    } else {
        app[0].redirect_uri = JSON.parse(app[0].redirect_uri);
        res.render('int/app_edit', {app: app[0]});
    }
});

router.post('/apps/:client_id/edit', middle.validateAppUpdate, async (req, res) => {
    res.redirect('/int/apps/' + req.params.client_id);
});

router.post('/apps/new', middle.validateNewApp, async (req, res) => {

    const {stripeToken = null, stripeEmail = null} = req.body;

    if (!stripeToken || !stripeEmail) {
        res.render('error/400');
    } else {
        stripe.charges.create({
            amount: 699,
            currency: 'eur',
            description: 'EOSconnect App',
            source: stripeToken,
        }).then(charge => {
            if (charge.outcome.type === 'authorized') {
                helper.db.query('INSERT INTO apps (name, description, logo, email, redirect_uri, owner, secret) VALUES (?,?,?,?,?,?,?)',
                    [
                        req.session.newApp.name,
                        req.session.newApp.description,
                        req.session.newApp.logo,
                        req.session.newApp.email = stripeEmail,
                        JSON.stringify(req.session.newApp.redirect_uri),
                        req.session.username,
                        srs({length: 48})
                    ], (err, result) => {
                        res.redirect('/int/apps/' + req.session.newApp.name);
                        req.session.newApp = null;
                    })
            } else {
                res.render('error/cc', {message: charge.outcome.seller_message})
            }
        }).catch(error => {
            res.render("error/cc", {message: error.message});
        });
    }
});

router.get('/apps/:name', async (req, res) => {
    if (req.params.name !== "new") {
        let app = await helper.db.getApp(req.params.name);
        if (app.length === 0 || app[0].owner !== req.session.username || app[0].is_enabled === 0) {
            res.status(403).render('error/403');
        } else {
            let userCount = await helper.db.countUserByApp(app[0].name);
            res.render('int/app_detail', {'app': app[0], userCount});
        }
    } else {
        res.render('int/app_new');

    }
});

router.get('/authorized', async (req, res) => {
    helper.db.query('SELECT client_id FROM token WHERE account = ? GROUP BY(client_id)', [req.session.username], (err, result) => {
        res.render('int/authorized', {apps: result})
    })
});

router.get('/authorized/:client_id/revoke', async (req, res) => {
    helper.db.query('DELETE FROM token WHERE account = ? and client_id = ?', [req.session.username, req.params.client_id], (err, result) => {
        res.redirect('/int/authorized')
    })
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/')
});

/* GET users listing. */
router.get('/login', async (req, res, next) => {
    res.redirect('/int');
});

module.exports = router;
