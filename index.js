//load the config
const config = require('./config');
const Steganographer = require('./app/Steganographer');

/**
 * Makes the configuration keys available globally
 * @param {Object} c 
 */
function loadConfig(c){
 global.CONFIG = {};
 let configs = Object.getOwnPropertyNames(c);
 if(configs.length > 0){
  configs.forEach((prop)=>{
   global.CONFIG[prop] = c[prop];
  });
 }
 
}

loadConfig(config);

module.exports = Steganographer;

