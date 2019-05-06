const tableName  = 'cbintercom';
const tId  = 'AdminID';
const CBSiteName  = 'CBSiteName';
const CBApiKey = 'CBApiKey';
const tToken = 'token';
module.exports = {
  
  createTable :() => {
    return 'CREATE TABLE '+tableName+' ( '+tId+' TEXT , '+CBSiteName+' TEXT, '+CBApiKey+' TEXT, '+tToken+' TEXT)';
  },
  
  insert:( id,sitename,apikey,token)=> {
    return 'INSERT INTO '+tableName+' ('+tId+','+CBSiteName+','+CBApiKey+','+tToken+') VALUES ("'+id+'","'+sitename+'","'+apikey+'","'+token+'")';
  },
  
   update:( id,sitename,apikey,token)=> {
    return 'UPDATE '+tableName+' SET '+CBSiteName+'= "' + sitename + '", '+CBApiKey+'="' + apikey + '",'+tToken+'="' + token + '" WHERE '+tId+' =  "' + id + '"';
  },
  
  search: (id) => {
    return 'SELECT * from '+tableName+' where '+tId+'= "' + id+ '"';
    
  }
    
 
}