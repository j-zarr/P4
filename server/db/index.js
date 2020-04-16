const mysql = require('mysql');

let conn;


function openDb(app) {
    return new Promise((resolve, reject) => {
        conn = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: 'market'
        });

        conn.connect( err => {
            if (err) {
                conn.end();
                reject(err);
            } else {
                console.log('db connected');
                app.set('CONNECTION', conn);
                resolve(true);
            }
        });
    });
}


module.exports = { openDb }; 