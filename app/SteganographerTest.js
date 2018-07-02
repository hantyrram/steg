const assert = require('assert'); 

const S = require('../');

let s = new S('data/sample.bmp');

s.ready((instance)=>{

 let data = {username: 'myusername',password: 'mypassword'};

 // instance.write(JSON.stringify(data));

 assert.deepStrictEqual(JSON.stringify(data),instance.read());

});