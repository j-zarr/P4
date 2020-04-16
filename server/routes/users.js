const express = require('express');
const router = express.Router();
const app = express();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../token');

db.openDb(app)
    .then(state => {
        if (state) {
            console.log('connected to db');
        }
    }).catch(err => {
        console.log(err);
    });




//login (create token on login)
router.post('/login', async (req, res, next) => {
    let { email, password } = req.body;
    if (!email || !password) {
        res.json({ state: 'error', message: 'missing field input' })
    } else {
        const conn = app.get('CONNECTION');
        sql = `SELECT * FROM users WHERE email ='${email}'`;
        conn.query(sql, async (err, result) => {
            if (err) {
                res.json({ state: 'error', message: err })
            } else {
                if (result.length > 0) {
                    const validPassword = await bcrypt.compare(password, result[0].password);
                    if (validPassword) {
                        jwt.sign({
                            email: result[0].email,
                            userId: result[0].user_id,
                            admin: result[0].admin
                        },
                            'secretkey',
                            {
                                expiresIn: '1d'
                            },
                            (err, token) => {
                                if (err) { res.json({ state: 'error', message: err }) }
                                else {
                                    res.json({ state: 'success', token, loggedUser: result[0] });
                                }
                            });
                    } else {
                        res.json({ state: 'error', message: 'email or password incorrect' })
                    }
                } else {res.json({ state: 'error', message: 'email or password incorrect' })}
            }
        })
    }
});



//check if user already exists
router.post('/check_if_user', (req, res, next) => {
    let { user_id, email } = req.body
    const conn = app.get('CONNECTION');
    let sql = `SELECT * FROM users WHERE email= '${email}' OR user_id= ${user_id}`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err })
        } else {
            if (result.length > 0) {
                res.json({ state: 'NA', message: 'user with email or ID already exists' })
            } else {
                res.json({ state: 'success', message: 'new user' })
            }
        }
    })
});



//register new user
router.post('/register', async (req, res, next) => {
    let { user_id, first_name, last_name, email, password, city, street } = req.body;

    if (!user_id || !first_name || !last_name || !email || !password || !city || !street) {
        res.json({ state: 'error', message: 'missing field input' })
    } else {

        const hashedPassword = await bcrypt.hash(password, 10);

        const conn = app.get('CONNECTION');
        let sql = `INSERT INTO users(
                    user_id, 
                    first_name,
                    last_name, 
                    email, 
                    password,  
                    city, 
                    street)
                VALUES(
                    ${user_id}, 
                    '${first_name}',
                    '${last_name}',
                    '${email}',
                    '${hashedPassword}',
                    '${city}',
                    '${street}'
                    )`;
        conn.query(sql, (err, result) => {
            if (err) {
                res.json({ state: 'error', message: err })
            } else {
                res.json({ state: 'success', message: 'new user created' })
            }

        })
    }

});



//get total number of orders 
router.get('/total_orders', (req, res, next) => {
    const conn = app.get('CONNECTION');
    const sql = `SELECT COUNT(*)  AS total_orders FROM customer_orders`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err });
        }
        else {
            res.json(result[0]);
        }
    })
});

//get total number of products in store
router.get('/total_products', (req, res, next) => {
    const conn = app.get('CONNECTION');
    const sql = `SELECT COUNT(*) AS total_products FROM products`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err });
        }
        else {
            res.json(result[0]);
        }
    })
});



//get user
router.post('/user', authenticateToken, (req, res, next) => {
    const conn = app.get('CONNECTION');
    let sql = `SELECT * FROM users WHERE user_id= ${req.authUser.userId}`; 
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err })
        } else {
            if (result.length > 0) {
                res.json({ state: 'success', message: result })
            } else {
                res.json({ state: 'error', message: 'user not found' })
            }
        }
    })
});



module.exports = router;