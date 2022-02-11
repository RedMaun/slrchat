const jwt = require('jsonwebtoken');

module.exports = function(req, res, next){
    var token = req.header('Cookie');
    if (!token) return res.redirect('/registration');
    token = token.substring(9);
    try
    {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        next();
    }
    catch(err)
    {
        console.log(err)
        res.status(404).send('error')
    }
}