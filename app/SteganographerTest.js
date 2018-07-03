const assert = require('assert'); 

const S = require('../');//from index
const StegError = require('./StegError');//relative path
describe('Steg',()=>{

  describe('#ready()',()=>{
    it('returns an Steg instance when a valid path is passed during instantiation',(done)=>{
      let s = new S('data/sample.bmp');
      s.ready((instance)=>{
        assert.ok(instance instanceof S);        
        done();
       });
    });
  
  describe('#write()',()=>{
    it('throws an error when called prior to calling #ready()',()=>{
      let s = new S('data/sample.bmp');
      let data = {username: 'myusername',password: 'mypassword'};
      function assertParam(){
        s.write(JSON.stringify(data));      
      }      
      assert.throws(assertParam,{name:'StegError',message:'S Not Ready'});
    });
   }); 
  });
  
  describe('#read()',()=>{
    it('returns the data that was previously written/committed',(done)=>{
      let s = new S('data/sample.bmp');
      let data = {username: 'myusername',password: 'mypassword'};
      s.ready((instance)=>{
        instance.write(JSON.stringify(data));
        instance.commit();
        assert.deepStrictEqual(instance.read(),JSON.stringify(data));
        done();
      });
    });
  });
  
  describe('#purge()',()=>{
    it('deletes the entire data on the storage medium and returns an empty string',(done)=>{
      let s = new S('data/sample.bmp');
      let data = {username: 'myusername',password: 'mypassword'};
      s.ready((instance)=>{
        instance.write(JSON.stringify(data));
        instance.commit();
        instance.purge();
        assert.deepStrictEqual(instance.read(),'');
        done();
      });
    });
  });


});


// s.ready().then().catch();