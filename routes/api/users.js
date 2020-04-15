const express = require("express");
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const validateRegisterInput = require( '../../validation/register');
const validateLoginInput = require('../../validation/login');
const keys = require('../../config/keys');
const passport = require('passport');

router.get("/test", (req, res) => res.json({ msg: "This is the users route" })); //for testing

router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  // Check to make sure nobody has already registered with a duplicate email
  
  if (!isValid) {
    return res.status(400).json(errors);
  }
  
  User.findOne({ handle: req.body.handle })
    .then(user => {
      if (user) {
        // Throw a 400 error if the email address already exists
        errors.handle = "User already exists";
        return res.status(400).json({ errors })
      } else {
        // Otherwise create a new user
        const newUser = new User({
          handle: req.body.handle,
          email: req.body.email,
          password: req.body.password
        })

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                const payload = { id: user.id, handle: user.handle };
                jwt.sign( payload, keys.secretOrKey, { expiresIn: 3600 }, ( err, token ) => {
                  res.json({
                    success: true,
                    token: "Bearer " + token
                  });
                 })
                })
               .catch(err => console.log(err));
          });
        });
      }
    });

  });



router.post('/login', (req,res) => {
   const { errors, isValid } = validateLoginInput(req.body);

   if (!isValid) {
    return res.status(400).json(errors);
  }

   const email = req.body.email;
   const password = req.body.password;
   console.log("handle:"+ email)
    User.findOne( { email } )
        .then(user => {
          if( !user ){
            errors.handle = "This user does not exist";
            return res.status(400).json(errors);
          }

        bcrypt.compare( password, user.password )
              .then( isMatch => {
                 if( isMatch ){
                   const payload = { id: user.id, handle: user.handle };  
                   
                   jwt.sign(
                     payload,
                     keys.secretOrKey,
                     //Tell the key to expire in one hour
                     { expiresIn: 3600 },
                     (err, token) => {
                       res.json({
                         success: true,
                         token: 'Bearer ' + token
                       });
                     });
                 }else{
                   errors.password = "Incorrect password";
                   return res.status(400).json(errors);
                 }
              });
        });
});

// You may want to start commenting in information about your routes so that you can find the appropriate ones quickly.
router.get('/current', passport.authenticate('jwt', {session: false}), (req, res) => {
  res.json(
    {id: req.user.id,
     handle: req.user.handle,
     email: req.user.email 
    });
})
module.exports = router;