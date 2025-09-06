import mongoose from 'mongoose';
require('dotenv').config();

async function connectDB() {
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>console.log("connected!!!!!!"))
    .catch((err)=>console.log("Error connecting the database!!", err))
}
module.exports = connectDB;