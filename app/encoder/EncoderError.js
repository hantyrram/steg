
module.exports = class EncoderError extends Error{
  constructor(message){
    super(message);
    this.name = 'EncoderError';
    Object.freeze(this.name);
  }
}