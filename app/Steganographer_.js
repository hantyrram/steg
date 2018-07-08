
const filesystem = require('fs');
const path = require('path');
const StegError = require('./StegError');
const encoder = require('./encoder');
// const CONFIG.DEFAULT_OFFSET = 1024;
/**
 * @var {Buffer} storageBuffer
 * Raw file content buffer
 */
var storageBuffer = null;
var secret;
var secret_max_length = 0;

//this var is outside Steg so it can't be set
// let isReady = false;

/**
 * Implements stegangoraphy. Writes data in as string on a media e.g. image file. How the data is written 
 * depends on the selected encoder. 
 * Usage : 
 * Pass the path to the file to be used as storage/database medium.
 * Invoke the ready() function passing it a callback which will recieve an instantialized instance of this class
 * 
 */
class Steg{
 
 constructor(pathToFile){
  this.pathToFile = pathToFile;
  this.isReady = false;
  this.sizeOfData = 0; //The length of the string
  this.dataOffset;
  this.sizeOfDataOffset;
  
 }

 ready(callback){  
  let self = this;
  //IIFE
  (async function(){
   try {
    
    storageBuffer = await initStorageBuffer(self.pathToFile); 
    if(markerFound(storageBuffer,CONFIG.DEFAULT_SOS_MARKER) === false){
           console.log('CONFIG.DEFAULT_SOS_MARKER Not Found');
           let markerByteLength = storageBuffer.write(CONFIG.DEFAULT_SOS_MARKER,CONFIG.DEFAULT_OFFSET);
           console.log(`markerByteLength = ${markerByteLength}`);
           
           self.sizeOfDataOffset = CONFIG.DEFAULT_OFFSET + markerByteLength + 1;

           let offsetPlusNumBytesWritten = storageBuffer.writeUInt32BE(0,self.sizeOfDataOffset);

           console.log(`numBytesOfWrittenInt = ${offsetPlusNumBytesWritten}`);
           self.dataOffset = offsetPlusNumBytesWritten + 1;
           console.log(`Writable Offset = ${self.dataOffset}`);
           self.isReady = true;
           secret_max_length = Math.floor((storageBuffer.length - self.dataOffset) / 4);//??
           self.write(CONFIG.STARTING_DATA);//initialize
           self.commit();
        }else{
           self.dataOffset = storageBuffer.indexOf(CONFIG.DEFAULT_SOS_MARKER) + CONFIG.DEFAULT_SOS_MARKER.length + 4 + 1 + 1;
           //check if there is existing data/secret by reading the length storage
           self.sizeOfData  = storageBuffer.readUInt32BE(storageBuffer.indexOf(CONFIG.DEFAULT_SOS_MARKER) + CONFIG.DEFAULT_SOS_MARKER.length + 1);
           
           if(self.sizeOfData  > 0){//there is existing data
             //decode it
             secret = encoder.decode(storageBuffer,self.sizeOfData ,self.dataOffset);
           }
        }
        secret_max_length = Math.floor((storageBuffer.length - self.dataOffset) / 4);//??divided by 4 when using the twoBitEncoder only

        self.isReady = true;
        
        // callback.call(self);
        callback(self);
   } catch (error) {
    console.log(error);
   }
  })().catch((err)=>{
   console.log(err);
  });
  
 }

 /**
  * Writes the data to the buffer used by this class. Call commit() after write to actually write the data to the
  * storage medium e.g. a bitmap file.
  * The Steganographer does not care about the format of the string. It's up to the user to write a formatted 
  * string like a JSON string.
  * 
  * Write operation always overwrites the entire data on the storage medium.
  * 
  * @param {String} str - The string to write
  */
 write(str){
  
  if(this.isReady === false){
   throw new StegError('S Not Ready');
  }

  if(str.length >= secret_max_length){
   throw new StegError('Not enough storage');
  }
  storageBuffer.writeUInt32BE(str.length, storageBuffer.indexOf(CONFIG.DEFAULT_SOS_MARKER) + CONFIG.DEFAULT_SOS_MARKER.length + 1);
  storageBuffer = encoder.encode(str,storageBuffer,this.dataOffset);
 }


 /**
  * The secret string saved on the image file
  * @return {String} = The data as raw string
  */
 get data(){  
  return this.read();
 }

 /**
  * The maximum allowed length of the secret string
  * @return {Integer} = Maximum secret string length allowed
  */
 get secret_max_length(){
   return secret_max_length;
 }

 /**
  * Saves the secret to the image file
  */
 commit(){
  
  let ws = filesystem.createWriteStream(this.pathToFile);

  ws.on('error',(e)=>{
   console.log(e);
  });

  let ret = ws.write(storageBuffer);

  
 }

 /**
  * Reads the secret from the image file
  * @return {String} the secret text
  */
 read(){
  // let dataLengthOffset = storageBuffer.indexOf(CONFIG.DEFAULT_SOS_MARKER) + CONFIG.DEFAULT_SOS_MARKER.length + 1;
  // console.log(`@ Read dataLength = ${storageBuffer.readUInt32BE(dataLengthOffset)}`);
  // process.exit(0);

  if(this.isReady === false){
    throw new StegError('S Not Ready');
  }

  let dataLengthOffset = storageBuffer.indexOf(CONFIG.DEFAULT_SOS_MARKER) + CONFIG.DEFAULT_SOS_MARKER.length + 1;
  secret = encoder.decode(storageBuffer,storageBuffer.readUInt32BE(dataLengthOffset),this.dataOffset); 
  return secret;
 }


 purge(){
   this.write('');
   this.commit();
   return this.read();
 }

}

// createSnapshot(){}

/*--------------Util----------------*/

/**
 * Reads the file and returns the file buffer
 * 
 * @param {String} location of the file
 */
async function initStorageBuffer(location){
 
 return new Promise((resolve,reject)=>{

  
  filesystem.readFile(location,(err,content)=>{

   if(err){
    reject(err);
    return;
   } 

   resolve(content);
   
  });
   

 });
 
}


/**
 * Checks if the storage Buffer contains a CONFIG.DEFAULT_SOS_MARKER
 * @param {Mixed} false if CONFIG.DEFAULT_SOS_MARKER is not found on the storageBuffer, returns the offset of the CONFIG.DEFAULT_SOS_MARKER if found
 */
function markerFound(storageBuffer,marker){ 
 if( storageBuffer.indexOf(marker) === -1){
  return false;
 }else{
  return true;
 }
}




module.exports = Steg;