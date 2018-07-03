module.exports = class StegError extends Error{
  constructor(message){
    super(message);
    this.name = 'StegError';
    Object.freeze(this.name);
  }
}