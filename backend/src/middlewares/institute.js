const jwt = require('jsonwebtoken');
const {JWT_INSTITUTE_SECRET} =  require('../config.js');


function instituteMiddleware(req,res,next){
    const token = req.body.token;
    const decoded = jwt.verify(token, JWT_INSTITUTE_SECRET);
    if(decoded){
        req.instituteId = decoded.id;
        next();
    }
    else{
        res.status(303).json({
            message : "you are not signed in lad."
        })
    }
}

module.exports = {
    instituteMiddleware
}