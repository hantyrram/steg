const filesystem = require('fs');
const path = require('path');
const encoder = require('./encoder');
const DEFAULT_OFFSET = 1024;
/**
 * @var {Buffer} storageBuffer
 * Raw file content buffer
 */
var storageBuffer = null;
var writableOffset = 0; //the secret data's offset ??rename to dataOffset?
var isReady = false;
var secret;
var secret_max_length = 0;

class S{
 
 constructor(pathToFile){
  this.pathToFile = pathToFile;
 }

 ready(callback){
  let self = this;
  //IIFE
  (async function(){
   try {
    
    storageBuffer = await initStorageBuffer(self.pathToFile); 
    if(markerFound(storageBuffer,CONFIG.MARKER) === false){
           console.log('CONFIG.MARKER Not Found');
           let markerByteLength = storageBuffer.write(CONFIG.MARKER,DEFAULT_OFFSET);
           console.log(`markerByteLength = ${markerByteLength}`);
           let offsetPlusNumBytesWritten = storageBuffer.writeUInt32BE(0,DEFAULT_OFFSET + markerByteLength + 1);
           console.log(`numBytesOfWrittenInt = ${offsetPlusNumBytesWritten}`);
           writableOffset = offsetPlusNumBytesWritten + 1;
           console.log(`Writable Offset = ${writableOffset}`);
           isReady = true;
           secret_max_length = Math.floor((storageBuffer.length - writableOffset) / 4);//??
           self.write("{}");//initialize
           self.commit();
        }else{
           writableOffset = storageBuffer.indexOf(CONFIG.MARKER) + CONFIG.MARKER.length + 4 + 1 + 1;
           //check if there is existing data/secret by reading the length storage
           let dataLength = storageBuffer.readUInt32BE(storageBuffer.indexOf(CONFIG.MARKER) + CONFIG.MARKER.length + 1);
           
           if(dataLength > 0){//there is existing data
             //decode it
             secret = encoder.decode(storageBuffer,dataLength,writableOffset);
           }
        }
        secret_max_length = Math.floor((storageBuffer.length - writableOffset) / 4);//??divided by 4 when using the twoBitEncoder only
        isReady = true;
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
  * Writes the secret string
  * @param {String} str - The secret string
  */
 write(str){
  
  if(isReady === false){
   throw new Error('S Not Ready');
  }

  if(str.length >= secret_max_length){
   throw new Error('Not enough storage');
  }

  storageBuffer.writeUInt32BE(str.length, storageBuffer.indexOf(CONFIG.MARKER) + CONFIG.MARKER.length + 1);
  
  storageBuffer = encoder.encode(str,storageBuffer,writableOffset);
  
  
 }

 /**
  * True if the S@ready function was invoked
  * @return {Boolean} - true if S is ready
  */
 get isReady(){
  return isReady;
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
  // let dataLengthOffset = storageBuffer.indexOf(CONFIG.MARKER) + CONFIG.MARKER.length + 1;
  // console.log(`@ Read dataLength = ${storageBuffer.readUInt32BE(dataLengthOffset)}`);
  // process.exit(0);

  if(isReady === false){
    throw new Error('S Not Ready');
  }

  let dataLengthOffset = storageBuffer.indexOf(CONFIG.MARKER) + CONFIG.MARKER.length + 1;
  secret = encoder.decode(storageBuffer,storageBuffer.readUInt32BE(dataLengthOffset),writableOffset); 
  return secret;
  

 }

}

// createSnapshot(){}

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
 * Checks if the storage Buffer contains a CONFIG.MARKER
 * @param {Mixed} false if CONFIG.MARKER is not found on the storageBuffer, returns the offset of the CONFIG.MARKER if found
 */
function markerFound(storageBuffer,marker){ 
 if( storageBuffer.indexOf(marker) === -1){
  return false;
 }else{
  return true;
 }

}




module.exports = S;