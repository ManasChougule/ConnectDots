const os = require("os");
// this fucntion return wifiIPv4 address on which server is running (created for demo purpose to showcase application to friends connected on same wifi)
function getWiFiIPv4Address() {
    // const interfaces = os.networkInterfaces();
    
    // for (const [name, iface] of Object.entries(interfaces)) {
    //     if (name.toLowerCase().includes("wi-fi") || name.toLowerCase().includes("wlan")) { 
    //         for (const details of iface) {
    //             if (details.family === "IPv4" && !details.internal) {
    //                 return details.address;
    //             }
    //         }
    //     }
    // }
    // return "No Wi-Fi IPv4 address found";
    // if (process.env.CONNECT_DOTS_ENVIRONMENT == 'production') {
    //     // Usage
    // getPublicIP()
    //     .then(ip => console.log('Public IP:', ip))
    //     .catch(err => console.error('Error:', err.message));
    
    // }
    // return '13.204.64.57';
    return process.env.WIFI_IP + ':' + process.env.SERVER_PORT
}
const http = require('http');

function getPublicIP() {
    return new Promise((resolve, reject) => {
        const options = {
            host: '169.254.169.254',
            path: '/latest/meta-data/public-ipv4',
            timeout: 2000
        };

        const req = http.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}
module.exports.getWiFiIPv4Address = getWiFiIPv4Address;