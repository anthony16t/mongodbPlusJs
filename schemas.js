const Schemas = {
    'users':{
        name:String,
        lastName:String,
        email:String,
        password:String,
        createdAt:Date,
    },
    'NewProduct':{
        status:String,
        title:String,
        overview:String,
        price:Number,
        priceComp:Number,
        images:Object
    }
}
module.exports = Schemas