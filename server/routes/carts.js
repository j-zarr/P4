const express = require('express');
const router = express.Router();
const app = express();
const db = require('../db');
const authenticateToken = require('../token')
const fs = require('fs');


db.openDb(app)
    .then(state => {
        if (state) {
            console.log('connected to db');
        }
    }).catch(err => {
        console.log(err);
    });


//get user cart
router.post('/user_cart', authenticateToken, (req, res, next) => {
    const conn = app.get('CONNECTION');
    let sql = `SELECT * FROM shopping_cart 
               WHERE user_id = ${req.body.user_id} 
               ORDER BY id DESC`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err })
        }
        else {
            if (result.length > 0 && !undefined) {
                res.json({ state: 'success', message: result[0] });
            } else {
                res.json({ state: 'error', message: 'Happy first-time-shopping with us!' })
            }
        }
    })
})


//create new shopping cart
router.post('/new_cart', (req, res, next) => {
    const conn = app.get('CONNECTION');
    let sql = `INSERT INTO shopping_cart(user_id, cart_date ) 
               VALUES (${req.body.user_id}, CURDATE())`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err })
        } else {
            res.json({ state: 'success', message: 'new cart created'})
        }
    })
});


//add item to cart
router.post('/add_item', (req, res, next) => {
    let { product_id, quantity, cart_id } = req.body;
    const conn = app.get('CONNECTION');
    let sql = `INSERT INTO cart_item(product_id, quantity, total_price, cart_id)
               VALUES(${product_id}, ${quantity}, ${quantity}*(SELECT price FROM products WHERE products.product_id=${product_id}), ${cart_id})`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err })
        } else {
            res.json({ state: 'success', message: 'item added' })
        }
    })
});


//update item quantity
router.put('/update_item_quantity', (req, res, next) => {
    let { quantity, item_id } = req.body
    const conn = app.get('CONNECTION');
    let sql = `UPDATE cart_item
               SET 
                  quantity = ${quantity},
                  total_price = ${quantity}*(SELECT price FROM products WHERE products.product_id = cart_item.product_id)
                  WHERE item_id = ${item_id}`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err })
        } else {
            res.json({ state: 'success', message: 'item quantity updated'})
        }
    })
})


//delete item from cart
router.delete('/delete_item/:itemId', (req, res, next) => {
    const conn = app.get('CONNECTION');
    let sql = `DELETE FROM cart_item WHERE item_id = ${req.params.itemId}`
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err })
        } else {
            res.json({ state: 'success', message: 'item deleted from cart' })
        }
    })
})



//delete all cart items
router.delete('/delete_all/:cartId', (req, res, next) => {
    const conn = app.get('CONNECTION');
    let sql = `DELETE FROM cart_item WHERE cart_id = ${req.params.cartId}`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err })
        } else {
            res.json({ state: 'success', message: 'cart emptied' })
        }
    })
})

//get all items of one cart
router.get('/cart_items/:cartId', (req, res, next) => {
    const conn = app.get('CONNECTION');
    let sql = `SELECT 
        cart_item.cart_id,
        cart_item.item_id,
        products.image,
        products.product_id, 
        products.product_name, 
        products.price,  
        cart_item.quantity, 
        cart_item.total_price 
        FROM cart_item
        INNER JOIN products
        ON  cart_item.product_id = products.product_id 
        WHERE cart_item.cart_id = ${req.params.cartId}`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err })
        } else {
            if (result.length > 0) {
                res.json({ state: 'success', message: result })
            } else {
                res.json({ state: 'error', message: 'no cart items' })
            }
        }
    })
})



//get autofill user info
router.post('/submit_order/user_info', authenticateToken, (req, res, next) => {
    const conn = app.get('CONNECTION');
    let sql = `SELECT first_name, last_name, city, street FROM users WHERE user_id = ${req.authUser.userId} `
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err })
        }
        else {
            res.json({ state: 'success', message: result[0] })
        }
    })
})


//check available delivery dates (3 deliveries max per day)
router.get('/dates', (req, res, next) => {
    const conn = app.get('CONNECTION');
    let sql = `SELECT shipping_date, COUNT(*) 
               FROM customer_orders 
               GROUP BY shipping_date 
               HAVING COUNT(*) > 2 `;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err })
        } else {
            res.json({ state: 'success', message: result })
        }

    })
})

//submit order
router.post('/submit', authenticateToken, (req, res, next) => {
    let { customer_id, cart_id, shipping_city, shipping_street, shipping_date, cc_digits } = req.body;
    if (!customer_id || !cart_id || !shipping_city || !shipping_street || !shipping_date || !cc_digits) {
        res.json({ state: 'error', message: 'missing field input' })
    } else {
        const conn = app.get('CONNECTION');
        let sql = `INSERT INTO customer_orders(
                   customer_id, 
                   cart_id,
                   cart_price, 
                   shipping_city, 
                   shipping_street, 
                   shipping_date,
                   cc_digits)
                VALUES (
                    ${customer_id},
                    ${cart_id}, 
                    (SELECT SUM(total_price) FROM cart_item WHERE cart_id=${cart_id}),
                    '${shipping_city}', 
                    '${shipping_street}', 
                    '${shipping_date}',
                     ${cc_digits} )`;
        conn.query(sql, (err, result) => {
            if (err) {
                res.json({ state: 'error', message: err })
            } else {
                res.json({ state: 'success', message: 'order submitted' });
            }
        })
    }
})

//receipt download
router.post('/receipt', (req, res, next) => {
    const conn = app.get('CONNECTION');
    let sql = `SELECT products.product_name, 
                      products.price, 
                      cart_item.quantity, 
                      cart_item.total_price, 
                      customer_orders.order_id,
                      customer_orders.cart_price,
                      customer_orders.shipping_date,
                      customer_orders.cc_digits
                FROM cart_item
                INNER JOIN products ON cart_item.product_id = products.product_id
                INNER JOIN customer_orders ON cart_item.cart_id = customer_orders.cart_id
                WHERE customer_orders.cart_id =  ${req.body.cart_id}
                GROUP BY products.product_name
                ORDER BY products.product_name`;

    conn.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err })
        } else {
            let date = new Date(Date.now()).toLocaleString().split(',')[0];
            let shipDate = result[0].shipping_date.toLocaleString().split(',')[0];
            let lastCCDigits = (result[0].cc_digits);
            lastCCDigits =  lastCCDigits.toString().slice(-4);
            let receipt = `\n  Order Number: ${result[0].order_id}  Order Date: ${date}\n\n`
            result.map(item => {
                receipt += `  item: ${item.product_name}   price: ${item.price}   quantity: ${item.quantity}    total: ${item.total_price} \n`;
            })
            receipt += `\n  Order Total: ${result[0].cart_price}\n  Payment: CC# XXXX-XXXX-${lastCCDigits}\n  Delivery Date: ${shipDate}\n\n  Thank you for shopping with us!`;

            let filepath = process.cwd() + `\\server\\public\\receipts\\receipt-${result[0].order_id}.txt`
           fs.writeFile(filepath, receipt, (err) => {
                if (err) throw err
               
            })

            res.json({ state: 'success', message: receipt, receipt: `receipt-${result[0].order_id}.txt created`, fileName: `receipt-${result[0].order_id}.txt` })
        }

    })

})




module.exports = router;