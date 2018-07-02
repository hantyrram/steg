
/**
 * Encodes two bits of data unto an existing byte.Stores 2 bit data unto the 2 least significant bit,
 * preserving the existing 6 bits of data from the storageBuffer. The storage buffer's size should be greater 
 * than string length * 4.
 * @param {String/Array} data - The String or array of two bits data to encode
 * @param {Buffer} storageBuffer - The buffer where to encode the two bits pieces of the string, the first 6 bits should be preserved
 * @param {Offset} storageBufferOffset - The offset  in the storageBuffer where to start. Default = 0
 * @return storageBuffer with the data encoded on it
 */
function encode(data,storageBuffer,storageBufferOffset = 0){
 
  let twoBitified = typeof data === "string" ? twoBitifier(data): data ;
  let increment = 0;
  let index;
  while(twoBitified.length != 0){
   // console.log(`content @offset before OR] = ${this.content[this.offset]}`);
   secret = Number.parseInt(twoBitified.shift(),2);    
   
   //OR the current byte in the content with the 2 bit(in int) data 
   //the 2 bit data can only be 0,1,2,3 values 
   //so ORing will only affect the last 2 bits of each byte from the content
   // console.log(`Data @ ${this.offset} before shift right = ${this.content[this.offset]}`);
    index = storageBufferOffset + increment;
 
    let removed2LeastSignificantBits = Number.parseInt(storageBuffer[index],'hex') >> 2; // '11111111' = 00111111
    //00111111 = 11111100 now we can encode the data by ORing with 00 anyting we OR with 00 equals the data
    let insertZerozOnThe2LeastSignificantBits = removed2LeastSignificantBits << 2; 
 
    // console.log(`Data @ ${this.offset} after shift left = ${insertZerozOnThe2LeastSignificantBits}`);
    storageBuffer[index] = (insertZerozOnThe2LeastSignificantBits | secret);        
    // console.log(`Secret =  ${secret}  / content @ offset ${this.offset} after | = ${this.content[this.offset]}`);
    // console.log(`content @offset after OR = ${this.content[this.offset]}`);
    // this.offset += 1;
    increment++;
  }
  return storageBuffer;
 }
 
 
 function decode(storageBuffer,length,start = 0){
 
   let i = 0;
   let byte = "";
   let result = "";  
   while(i < (length * 4) + 1){ 
    let twoBits = ((252 | storageBuffer[start + i]) - 252).toString(2).padStart(2,'0');
    
    if(byte.length != 8 ){
 
     byte = byte + twoBits;
 
    }else{
     
     result = result + String.fromCharCode(Number.parseInt(byte,2));
     byte = "";//reset
     byte = byte + twoBits;
    }
 
    i++;
   }
   return result;
  }
 
 
 /**
  * Takes a string, gets the binary representation of the string then divide each byte into 4. Each 2 bit value 
  * is then pushed unto the array.
  * E.g. a = 01100001 after passing twoBitifier will become [01,10,00,01]
  * @param {String} rawString - Raw String that will be deconstructed unto an array of 2 bits
  */
 function twoBitifier(rawString){
  
  let result = [];
  
  let stringBuffer = new Buffer.from(rawString);
 
  stringBuffer.forEach(function(e){ // e is int representaion of the hex on the buffer
   // console.log(Number.parseInt(e.toString()).toString(2));
   //get binary representation of each byte in the buffer = 8 bits
     let bin = Number.parseInt(e.toString()).toString(2);
   //padd with 0 if less than 8, e.g. 1011 = 00001011, in order for us to store the data
     bin = bin.padStart(8,0);
   // slice by 4 such that 11,00,10,11, 
     let arrayOf8Bits = bin.split(""); //[1,1,0,1,1,1..]
     //consolidate the 2 bits to use and put it on the final array of 
     
     arrayOf8Bits.reduce(function(accumulator,currentElement){
       accumulator += currentElement;
       if(accumulator.length === 2){ //if accumulator = '1', next '10' push it to our result array
       result.push(accumulator);
         accumulator = "";//reset
       }
       return accumulator;
     });
     
 
  });
  //actually we don't need this because 2 bits of data should only contain 00,01,10,11 = 0,1,2,3 we just need this numbers     
  //we can directly convert 11 = 3 
  result.forEach(function(e,index){// we'll only use this for visual 
  result[index] = result[index].padStart(2,"0"); // will just convert each value to dec and OR it with the bytes on the storage
  });
 
  return result; 
 
 
 }


 module.exports = {
  encode: encode,
  decode: decode,
  twoBitifier: twoBitifier
}
