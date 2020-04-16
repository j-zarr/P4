const express = require('express');
const router = express.Router();
const app = express();
const db = require('../db');
const multer = require('multer');
const authenticateToken = require('../token')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'server/public/product-images' )
    },
    filename: function(req, file, cb) {
        cb(null, `${file.originalname}`);
    }
})

const upload = multer({
    storage: storage /*,
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    } */
}).single('newImage');

/*
function checkFileType(file, cb) {
    const fileTypes = /jpeg | jpg | png/;
    const ext = fileTypes.test(path.extname(file.originalname).toLowercase());
    if (ext) {
        return cb(null, true)
    } else {
        cb('Error: Cannot upload non-image file');
    }
}
*/



db.openDb(app)
    .then(state => {
        if (state) {
            console.log('connected to db');
        }
    }).catch(err => {
        console.log(err);
    });




//upload image (-admin)
router.post('/upload', (req, res, next) => {
      upload(req, res, (err) => {
        if (err) {
            res.send(err);
        } else {
            if (req.file == undefined) {
                res.json({ message: 'no file selected' });
            } else {
                //res.json(req.file);
                res.json({message: 'file uploaded', file: `product-images/${req.file.filename}` });
            }
        }
    })
})

//get all products
router.get('/', (req, res, next) => {
    const conn = app.get('CONNECTION');
    let sql = `SELECT products.product_id,
     products.product_name, 
     products.category_id, 
     products.price, 
     products.image, 
     product_category.category_name 
     FROM products 
     INNER JOIN product_category ON products.category_id = product_category.id`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json(err)
        } else {
            res.json(result);
        }
    })
});

//get one product
router.get('/product/:id', (req, res, next) => {
    const conn = app.get('CONNECTION');
    let sql = `SELECT * FROM products WHERE product_id = ${req.params.id}`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json(err)
        } else {
            res.json(result);
        }
    })
});


//get all categories
router.get('/categories', (req, res, next) => {
    const conn = app.get('CONNECTION');
    let sql = `SELECT * FROM product_category`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json(err)
        } else {
            res.json(result);
        }
    })
});

//get all products from one category
router.get('/categories/:category_id', (req, res, next) => {
    const conn = app.get('CONNECTION');
  //  let sql = `SELECT * FROM products WHERE category_id = ${req.params.category_id}`;
    let sql = `SELECT products.product_id,
    products.product_name, 
    products.category_id, 
    products.price, 
    products.image, 
    product_category.category_name 
    FROM products 
    INNER JOIN product_category ON products.category_id = product_category.id
    WHERE products.category_id = ${req.params.category_id}`;
    conn.query(sql, (err, result) => {
        if (err) {
            res.json(err)
        } else {
            res.json(result);
        }
    })

});

//add new product - for admim only
router.post('/add_product', authenticateToken, (req, res, next) => {
    if(!req.authUser.admin){return res.json({state: 'error', message: 'Unauthorized!'})}
    let { product_name, category_id, price, image } = req.body;
    if (!product_name || !category_id || !price || !image) {
        res.json({ state: 'eror', message: 'missing field input' })
    } else {
        const conn = app.get('CONNECTION');
        let sql = `INSERT INTO products(product_name, category_id, price, image) 
        VALUES('${product_name}', ${category_id}, ${price}, '${image}')`;
        conn.query(sql, (err, result) => {
            if (err) {
                res.json({ state: 'error', message: err })
            } else {
                console.log(result)
                res.json({ state: 'success', message: 'product added' });
            }
        })
    }
});



//update product - for admin only
router.put('/update_product', /*authenticateToken,*/ (req, res, next) => {
   // if(!req.authUser.admin){return res.json({state: 'error', message: 'Unauthorized!'})}
    let { product_id, product_name, category_id, price, image } = req.body;
    if (!product_id || !product_name || !category_id || !price || !image) {
        res.json({ state: 'eror', message: 'missing field input' })
    } else {
        const conn = app.get('CONNECTION');
        let sql = `UPDATE products 
                   SET product_name='${product_name}',
                       category_id=${category_id},
                       price=${price},
                       image='${image}'
                   WHERE product_id= ${product_id}`;
        conn.query(sql, (err, result) => {
            if (err) {
                res.json({ state: 'error', message: err})
            } else {
                res.json({ state: 'success', message: 'product updated' })
            }
        })
    }
})

module.exports = router;