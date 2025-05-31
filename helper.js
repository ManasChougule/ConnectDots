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
    return '13.204.64.57';
}

module.exports.getWiFiIPv4Address = getWiFiIPv4Address;