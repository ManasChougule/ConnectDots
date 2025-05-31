
const env = require('./environment');        
const fs = require('fs');        
const path = require('path');     
        
module.exports = (app) => {
    app.locals.assetPath = function(filePath){   
        if (env.name == 'development'){
            return filePath;
        }

        const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/assets/rev-manifest.json'), 'utf8') );
        const normalized = filePath.replace(/^\//, '');               // 'css/home.css'
        const versioned  = '/' +  manifest[normalized];               // '/css/home-8448f564e2.css'
        return  versioned; 
    }
}  




