const router = require("express").Router();
const verify = require('../verifyToken');
const User = require('../model/User');

router.get('/', verify, async (req, res) => {
    // const token = req.header('Cookie').substring(9);
    // var decoded = jwt_decode(token);
    // const user = await User.findOne({ _id: decoded._id });
    // res.setHeader('name', user.name);
    // req.header('avatar', user.avatar);
    res.render('home', {title: "СЬЛРЖАЛСЧ чат"});
});

router.get('/registration', (req, res) => {
    res.render('registration', {title: "Registration"});
});

router.get('/login', (req, res) => {
    res.render('login', {title: "Login"});
});

module.exports = router;