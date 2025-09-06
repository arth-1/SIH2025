const express = require('express');
const app = express();
require('dotenv').config();
const connectdb = require('./src/config/db.js');
const employerRouter = require('./routes/employerRoute.js')
const instituteRouter = require('./routes/instituteRouter.js');
connectdb()
app.use(express.json());
app.use('/api/v1/employer', employerRouter);
app.use('/api/v1/institute', instituteRouter);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
