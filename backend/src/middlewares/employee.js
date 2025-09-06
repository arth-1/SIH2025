const jwt = require('jsonwebtoken');
const {JWT_INSTITUTE_SECRET} =  require('../config.js');
function employeeMiddleware(req,res,next){
    const token = req.body.token;
    const decoded = jwt.verify(token, JWT_INSTITUTE_SECRET);
    if(decoded){
        req.managerId = decoded.id;
    }
    else{
        res.status(303).json({
            message : "you are not signed in brother"
        })
    }
}

module.exports = {
    employeeMiddleware
}