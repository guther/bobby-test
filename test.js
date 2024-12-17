const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;

let dbConnection = null;

const createConnection = () => {
    let conn = null;

    // added Try Catch
    
    try{  
        conn = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: 'test_db'
        });
    }
    catch(err){
        console.error('Database Error:', err.message);
    } 
    return conn
}

const cache = [];
 
app.use(express.json());

// fix method, changing from POST to GET
// fix endpoint name to keep API REST patterns with /user
// added userId path parameter
app.get('/user/:userId', (req, res) => {
    const userId = +req.params.userId;

    // added validation for userId
    if(!userId || isNaN(userId)){
        console.error('Bad Request: userId was not a number');
        return res.status(400).send('Bad Request');
    }

    // added Prepare Statement
    const sql = `SELECT * FROM users WHERE id = ?`; 

    const responseObject = {
        message: 'User data fetched successfully',
        data: null
    }

    if(!dbConnection){ // get opened connection or creating the first one
        dbConnection = createConnection();   
    }    

    if(dbConnection){

        // get from cache
        const resultFound = cache.find((result) => result.userId === userId); 

        if(resultFound){
            const { results } = resultFound;

            responseObject.data = results;
            responseObject.fromCache = true; // <---- fromCache (Just for cache validation purposes)
            res.json(responseObject);
        }
        else{
            dbConnection.query(sql,  
                [userId], // Prepare Statement
                (err, results) => {
                if (err) {
                    console.error('Database Error:', err.message);
                    return res.status(500).send('Internal Server Error');
                }
    
                cache.push({ userId, results });

                responseObject.data = results;
                res.json(responseObject);
            });          

            cache.push({ userId, results });
                
            responseObject.data = results;
            res.json(responseObject);
        }
    }
    else{
        console.error('Connection Error');        
        return res.status(500).send('Internal Server Error');
    }
}); 

app.get('/cache-size', (req, res) => {
    res.json({ cacheSize: cache.length });
});
 
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});