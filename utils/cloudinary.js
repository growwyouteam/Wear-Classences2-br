const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.clound_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});

module.exports = cloudinary;
