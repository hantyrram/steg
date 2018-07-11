const encoder = require('./twoBitEncoder');

function Encoder(){}

module.exports = (function(type){
    
    if(type === undefined){      
      Encoder.prototype.encode = encoder.encode;
      Encoder.prototype.decode = encoder.decode;
      Encoder.prototype.getSampleSize = encoder.getSampleSize;
      return new Encoder();
    }
    //else instantiate other encoders
  
  })()

