const mongoose = require("mongoose");
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const users = require("./routes/api/users");
const tweets = require("./routes/api/tweets");
const passport = require('passport');
require('./config/passport')(passport);
const path = require('path');//added when deploying


const db = require('./config/keys').mongoURI;
mongoose.connect(db,{ useNewUrlParser:true })
        .then(() => console.log("connected to db"))
        .catch( err => console.log(err));

app.use(passport.initialize());


//setup some middleware for body parser:
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/api/users", users);   //Tell Express to use your newly imported routes
app.use("/api/tweets", tweets);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));


// added when deploying
//tell our server to load the static build folder in production:
if (process.env.NODE_ENV === 'production') {
        app.use(express.static('frontend/build'));
        app.get('/', (req, res) => {
          res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
        })

}



