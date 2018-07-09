const assert = require('assert'); 

let S;

const StegError = require('./StegError');//relative path
describe('Steg',()=>{

  beforeEach(function(){
    delete require.cache[require.resolve('./Steganographer')];  
    S = require('./Steganographer');//fresh copy
  });

  describe('#init()',()=>{
    it('returns an Steg instance when a valid path is passed during instantiation',(done)=>{
      let s = new S('data/sample.bmp');
      let initialize = s.init();
      initialize.then((steg)=>{
        assert.ok(steg instanceof S);
        done();
      }).catch(e=>{
        console.log(e);
        done();
      });
    });
  
  describe('#write()',()=>{
    it('throws an error when called prior to calling #init()',()=>{
      let s = new S('data/sample.bmp');
      let data = {username: 'myusername',password: 'mypassword'};
      function assertParam(){
        s.write(JSON.stringify(data));      
      }      
      assert.throws(assertParam,{name:'StegError',message:'S is not ready'});
    });
   }); 
  });
  
  describe('#read()',()=>{
    it('returns the data that was previously written/committed',(done)=>{
      let s = new S('data/sample.bmp');
      let data = {username: 'myusername',password: 'mypassword'};   
      s.init().then((instance)=>{
        instance.write(JSON.stringify(data));
        instance.commit();
        assert.deepStrictEqual(instance.read(),JSON.stringify(data));
        done();
      }).catch(e=>{
        console.log(e);
        done();
      });
    });
  });

  describe('sizeOfData',()=>{
    it('Returns the size of the data',(done)=>{
      let s = new S('data/sample.bmp');
      let data = {username: 'myusername',password: 'mypassword'};      
      s.init().then((instance)=>{
        instance.write(JSON.stringify(data));
        instance.commit();
        assert.strictEqual(instance.sizeOfData,JSON.stringify(data).length);
        done();
      }).catch(e=>{
        console.log(e);
      });
    });
  });
  
  describe('#erase()',()=>{
    it('Erases the data on the storage',(done)=>{
      let s = new S('data/sample.bmp');
      let data = {username: 'myusername',password: 'mypassword'};
      s.init().then((instance)=>{
        instance.write(JSON.stringify(data));
        instance.commit();
        instance.erase();
        assert.deepStrictEqual(instance.read(),null);
        done();
      }).catch(e=>{
        console.log(e);
        done();
      });
    });
  });





 


});


// s.init().then().catch();