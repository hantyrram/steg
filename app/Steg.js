
const filesystem = require('fs');
const path = require('path');
const StegError = require('./StegError');
const encoder = require('./encoder');
const CONFIG = require('../config');

/**
 * @var storageBuffer - The storage file content Buffer
 */
let storageBuffer = null;

/**
 * Start of steganography, where the sos marker should be located
 * @var sosOffset
 */
let sosOffset;
/**
 * @var lodOffset - the offset where the size of the data on the storage is stored offset where e.g. 'abc'.length is stored
 */
let lodOffset;
/**
 * @var lod - the size/length of the data on the storage e.g. 'abc'.length
 */
let lod = 0;

/**
 * @var sodOffset- Start Of Data, offset where the start of data is
 */
let sodOffset;

/**
 * @var isReady - Steg is ready, meaning the ready function has been called and resolved
 */
let isReady = false;

/**
 * @var isNew - storageFilePath is a new storage
 */
let isNew = true;

/**
 * @var maxStorageSize - The maximum number of bytes available as storage for the data. 
 * Equals to storageBuffer.length - sodOffset
 */
let maxStorageSize;


class Steg{
  constructor(storageFilePath){
    this.storageFilePath = storageFilePath;
  }

  async init(){
    //always start with a fresh storageBuffer
    storageBuffer = null;
    //check if the storageFilePath exists, is writable and readable throw an error if it is not
    let fs = require('fs');
    try {      
      fs.accessSync(this.storageFilePath,fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      let stegError;
      if(error.code === 'ENOENT'){
        stegError = new StegError('Invalid storage file path');
      }
      if(error.code === 'EACCESS'){
        stegError = new StegError('Permission to storage file denied');
      }
      throw stegError;
    }
    //get the contents of the file
    try {
      storageBuffer = await storageFileContentPromise(this.storageFilePath); 
     
    } catch (error) {
      throw error;
    }    
     //check for the CONFIG.SOS_MARKER
     let indexOfSOS_MARKER = storageBuffer.indexOf(CONFIG.SOS_MARKER);
     if(indexOfSOS_MARKER === -1){
       //this is a new storage
       //get the CONFIG.SOS_MARKER from config,and write it on the storage starting from the CONFIG.DEFAULT_SOS_OFFSET
       //set the sosOffset to the default set on config
       sosOffset = CONFIG.DEFAULT_SOS_OFFSET;
       let numberOfBytesOccupiedBySOS_MARKER = storageBuffer.write(CONFIG.SOS_MARKER,sosOffset);
       //set the lodOffset      
       lodOffset = sosOffset + numberOfBytesOccupiedBySOS_MARKER + 1;
       //initialize the size of data (lod) to 0
       lod = 0;
       //writeUInt returns lodOffset + number of bytes written, 
       sodOffset = storageBuffer.writeUInt32BE(lod,lodOffset) + 1;
       isReady = true;
       isNew = true;
       return this;
   } 
    //else existing storage
    sosOffset = indexOfSOS_MARKER;
    lodOffset = sosOffset + CONFIG.SOS_MARKER.length + 1;
    sodOffset = lodOffset + 4 + 1; //lod = 32 bit 4 bytes
    maxStorageSize = storageBuffer.length - sodOffset;
    isReady = true;
    isNew = true;
    return this;
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

  if(isReady === false){
   throw new StegError('S is not ready');
  }
  
  let sampleSizeOfStr = encoder.getSampleSize(str);
  
  if(!this.enoughStorageFor(str)){
   throw new StegError('Not Enough Storage');
  }

  storageBuffer.writeUInt32BE(str.length, lodOffset);
  storageBuffer = encoder.encode(str,storageBuffer,sodOffset);
 }

 /**
  * Tests if there is enough storage for the string data. Make sure init() was called prior to function invocation
  * @return {Boolean} - true if there is enough storage for the str, otherwise false
  */
 enoughStorageFor(str){

  if(isReady === false){
   throw new StegError('S is not ready');
  }

  let sampleSizeOfStr = encoder.getSampleSize(str);
  if(maxStorageSize < sampleSizeOfStr){
   return false;
  }
  return true;
 }

  /**
  * Saves the secret to the image file
  */
 commit(){
  let ws = filesystem.createWriteStream(this.storageFilePath);
  ws.on('error',(e)=>{
   console.log(e);
  });
  let ret = ws.write(storageBuffer);
  isNew = false;
 }

  /**
  * Reads the secret from the image file
  * @return {String} the data
  */
 read(){

  if(this.isReady === false){
    throw new StegError('S Not Ready');
  }

  if(storageBuffer.readUInt32BE(lodOffset) === 0){
    return null;//no data
  }

  let data = encoder.decode(storageBuffer,this.sizeOfData,sodOffset);

  return data;
 }

 /**
  * Erases the data written on the file, only erases the encoded data.
  */
 erase(){
   if(isReady && this.sizeOfData > 0){
    //create a string that's of the same length as the actual data
    let maskString = '0'.padEnd(this.sizeOfData);
    //reset lod to 0
    storageBuffer.writeUInt32BE(0,lodOffset);
    storageBuffer = encoder.encode(maskString,storageBuffer,sodOffset);
    this.commit();
   }
 }

 
  get sizeOfData(){
    return storageBuffer === null? 0: storageBuffer.readUInt32BE(lodOffset);
  }

  get isReady(){
    return isReady;
  }

  get isNew(){
    return isNew;
  }

  get maxStorageSize(){
   return maxStorageSize;
  }
  
}

/**
 * @return a Promise that resolves to the content of the file as a Buffer
 * @param {*} storageFilePath 
 */
function storageFileContentPromise(storageFilePath){
  return new Promise((resolve,reject)=>{
    let fs = require('fs');
    fs.readFile(storageFilePath,(err,content)=>{
    if(err){          
     reject(err);
     return;
    } 
    resolve(content);
   });
  });
}

//remove from cache on each import
// delete require.cache[require.resolve(__filename)];

module.exports = Steg;