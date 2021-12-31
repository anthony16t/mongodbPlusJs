const {MongoClient,ObjectId} = require('mongodb');

module.exports = class MongodbPlus{
    constructor(databaseName='',atlasUrl=''){
        let dbName = databaseName.trim()
        // if database was not given return an error
        if(!dbName || dbName===''){ this.__errorMsg('Database name is required') ; return }
        this.dbName = dbName
        if(atlasUrl!==''){ 
            this.CLIENT = new MongoClient(atlasUrl)
        }else{
            this.CLIENT = new MongoClient(`mongodb://127.0.0.1:27017/${dbName}`)
        }
        this.CONNECTION = false
        this.collectionName = false
    }

    // connect to database before you can run any query or manipulation
    async connect(){
        let connection = await this.CLIENT.connect()
        this.CONNECTION = connection
        this.DB = this.CLIENT.db(this.dbName)
        return connection
    }

    // add schema s
    addSchema(schemas){ this.SCHEMAS = schemas }

    // set collection name
    setCollection(collectionName){ 
        if(collectionName!==undefined){ this.collectionName=collectionName }
    }

    // drop current database
    dropDatabase(){
        // check if connection was made
        if(!this.__checkConn('dropDatabase')){return}
        return this.DB.dropDatabase()
    }

    // get a list of databases
    listDatabases(){
        // check if connection was made
        if(!this.__checkConn('listDatabases')){return}
        return new Promise((resolve)=>{
            resolve(this.CONNECTION.db(this.dbName).admin().listDatabases())
        })
    }

    // get a list of collection from current database
    listCollections(){
        // check if connection was made
        if(!this.__checkConn('listCollections')){return}
        let db = this.CLIENT.db(this.dbName)
        return db.listCollections().toArray()
    }

    // drop collection
    dropCollection(collectionName){
        // check if connection was made
        if(!this.__checkConn('dropCollection')){return}
        return new Promise((resolve)=>{
            if(collectionName){
                this.DB.collection(collectionName).drop((err)=>{
                    if(err){
                        this.__errorMsg(`Collection:${collectionName} do not exists in database:${this.dbName}`)                
                        resolve(false)
                    }else{
                        resolve(true)
                    }
                })
            }else{
                this.__errorMsg('Missing parameter collectionName .dropCollection(collectionName)')                
                resolve(false)
            }
        })// promise end
    }

    // find one document from database
    findOne(filter,exclude){
        // check if connection was made
        if(!this.__checkConn('findOne')){return}
        // check if filter was given
        filter = filter ? filter : {}
        if(this.collectionName===false){
            this.__errorMsg("Collection name can not be empty set it using .setCollection()")
            return false
        }
        exclude = exclude!==undefined?{projection:exclude}:''
        return new Promise((resolve)=>{ 
            resolve(this.DB.collection(this.collectionName).findOne(filter,exclude))
        })
    }

    // delete one document from database
    deleteOne(filter){
        // check if connection was made
        if(!this.__checkConn('deleteOne')){return}
        // check if filter was given
        filter = filter ? filter : {}
        if(this.collectionName===false){
            this.__errorMsg("Collection name can not be empty set it using .setCollection()")
            return false
        }
        return this.DB.collection(this.collectionName).deleteOne(filter)
    }

    // find one document using mongodb ObjectID
    findOneByObjectId(objectId,collectionName){
        return this.findOne({_id:ObjectId(objectId)},collectionName=collectionName)
    }

    // update one document from database
    updateOne(filter,newDocument){
        // check if connection was made
        if(!this.__checkConn('deleteOne')){return}
        // check if filter was given
        filter = filter ? filter : {}
        if(this.collectionName===false){
            this.__errorMsg("Collection name can not be empty set it using .setCollection()")
            return false
        }
        return this.DB.collection(this.collectionName).updateOne(filter,{$set:newDocument})
    }

    // insert one document to collection
    insertOne(document,checkSchema=true){
        // check if connection was made
        if(!this.__checkConn('insertOne')){return}
        // check if document object was given
        if(!document){
            this.__errorMsg('Document object was not pass on .insertOne(document)') ; return
        }else if(typeof document !== 'object'){
            this.__errorMsg('Only document object is allow to be inserted object') ; return
        }
        // check if collection name was given
        if(this.collectionName===false){
            this.__errorMsg("Collection name can not be empty set it using .setCollection()")
            return false
        }
        // check if schemas was defined, if yes 
        if(this.SCHEMAS!==undefined && checkSchema && this.collectionName in this.SCHEMAS){
            let colSchema = this.SCHEMAS[this.collectionName]
            let schemaSize = Object.keys(colSchema).length
            let giveSize = Object.keys(document).length
            // check if given document size is the same as schema size
            if(giveSize!==schemaSize){
                this.__errorMsg(`Schema size for:${this.collectionName} expected ${schemaSize} and ${giveSize} were given.`)
                return false
            }
            // check for schema error like data type and schema keys names
            for(let [docKey,docValue] of Object.entries(document)){
                // check if this key on given document exists in your schema
                if(docKey in colSchema===false){
                    this.__errorMsg(`Key:${docKey} do not exists in ${this.collectionName}'s schema`)
                    return false
                }
                let schemaKeyType = colSchema[docKey].name.toLowerCase()
                let docKeyType = typeof docValue
                // change document key type if it is a Date object
                if(typeof docValue  && String(docValue).includes('GMT-')){
                    docKeyType='date'
                }
                // check if schema data type is the same as given document key data type
                if(docKeyType!==schemaKeyType){
                    this.__errorMsg(`Key:${docKey} expect a ${schemaKeyType} data type not a ${docKeyType}`)
                    return
                }

            }
        }
        // insert
        return this.DB.collection(this.collectionName).insertOne(document)
    }

    // find multiple documents from database
    findMany(filter,exclude){
        // check if connection was made
        if(!this.__checkConn('findMany')){return}
        // check if filter was given
        filter = filter ? filter : {}
        if(this.collectionName===false){
            this.__errorMsg("Collection name can not be empty set it using .setCollection()")
            return false
        }
        exclude = exclude!==undefined?{projection:exclude}:''
        return this.DB.collection(this.collectionName).find(filter,exclude)
    }

    // insert multiple documents to collection
    insertMany(documentsArray){
        // check if connection was made
        if(!this.__checkConn('insertMany')){return}
        // check if collectionName was given
        if(this.collectionName===false){
            this.__errorMsg("Collection name can not be empty set it using .setCollection()")
            return false
        }
        // insert
        return this.DB.collection(this.collectionName).insertMany(documentsArray)
    }

    // update many document from database
    updateMany(filter,newDocument){
        // check if connection was made
        if(!this.__checkConn('deleteOne')){return}
        // check if filter was given
        filter = filter ? filter : {}
        if(this.collectionName===false){
            this.__errorMsg("Collection name can not be empty set it using .setCollection()")
            return false
        }
        return this.DB.collection(this.collectionName).updateMany(filter,{$set:newDocument})
    }

    // delete multiple documents to collection
    deleteMany(filter){
        // check if connection was made
        if(!this.__checkConn('deleteMany')){return}
        // check if collectionName was given
        if(this.collectionName===false){
            this.__errorMsg("Collection name can not be empty set it using .setCollection()")
            return false
        }
        // insert
        filter = filter ? filter : {}
        return this.DB.collection(this.collectionName).deleteMany(filter)
    }

    // aggregate
    aggregate(pipeline,options){
        return this.DB.collection(this.collectionName).aggregate(pipeline,options)
    }

    // show collection schema
    showSchema(){
        // check if connection was made
        if(!this.__checkConn('showSchema')){return}
        // check if collection was given
        if(this.collectionName===false){
            this.__errorMsg("Collection name can not be empty set it using .showSchema()")
            return false
        }
        // check if any schema was added
        if(this.SCHEMAS===undefined){
            this.__errorMsg("No schemas were added add one before you can use .showSchema()")
            return false
        }
        // this is another way to just display a string as the data type
        // let result = {}
        // for(let [name,value] of Object.entries(this.SCHEMAS[this.collectionName])){
        //     result[name]=value.name.toLowerCase()
        // }
        return this.SCHEMAS[this.collectionName]
    }

    // close database connection
    close(){ this.CONNECTION.close() }

    __errorMsg(msg){
        console.log(msg)
    }
    __checkConn(colName){
        // check if database was connected, if yes return error with a log
        if(this.CONNECTION===false){
            console.log("Connect to database or wait/await till connection is done before running .${colName}() function")
            return false
        }else{
            return true
        }
    }

}