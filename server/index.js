const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
//const bodyParser = require('body-parser');
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const cartsRouter = require('./routes/carts');

//serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
//app.use(express.json());
app.use(express.json({limit: '200mb'}));
app.use(express.urlencoded({limit: '200mb', extended: true}));


//Middleware for logging each request to the API
app.use((req,res,next) => {
    console.log(`Received a ${req.method} request for ${req.url}`);
    if (req.body) console.log('req.body:',req.body);
    if (req.params) console.log('req.params:', req.params);
    if(req.query) console.log('req.query:', req.query);
  next();
}); 

app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter );
app.use('/api/carts', cartsRouter);
    

app.listen(3000, () => console.log('Server listening on port 3000...'));