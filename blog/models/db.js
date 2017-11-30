const mongodb = require('mongodb').MongoClient   //引包
const url=require('./../setting').url   //数据库地址   movie相当于use命令
const ObjectId=require('mongodb').ObjectID

//自己定义一些方法符合我们自己去使用
//dao层  =>  封装处理数据库的方法

//内部函数 :  处理链接
function __connectDb(callback) {
    mongodb.connect(url,(err,db)=>{
        if (err){
            callback(err,null)
            return
        }
        callback(null,db)
    })
}

//插入数据
exports.insertDocument=function (collectionName,json,callback) {
    __connectDb((err,db)=>{
        if (err){
            callback(err,null)
            return
        }
        db.collection(collectionName).insertMany(json,(err,r)=>{
            if (err){
                callback(err,null)
                db.close()
                return
            }
            callback(null,r)
            db.close()
        })
    })
}

//删除数据
exports.deleteDocument=function (collectionName,filterJson,callback) {
    __connectDb((err,db)=>{
        if (err){
            callback(err,null)
            return
        }
        db.collection(collectionName).deleteMany(filterJson,(err,r)=>{
            if (err){
                callback(err,null)
                db.close()
                return
            }
            callback(null,r)
            db.close()
        })
    })
}

//修改数据
//  ({age:{$gt:3}},{$set:{'age':85}},callback)  填写格式
exports.updateDocument=function (collectionName,filterJson,updateJson,callback) {
    __connectDb((err,db)=>{
        if (err){
            callback(err,null)
            return
        }
        db.collection(collectionName).updateMany(filterJson,updateJson,(err,r)=>{
            if (err){
                callback(err,null)
                db.close()
                return
            }
            callback(null,r)
            db.close()
        })
    })
}

//查找数据
//普通查找,分页查找(通过参数数量)   arguments    ...rest
//arguments  编写这个方法
exports.find=function (collectionName,json,callback,...rest) {
    if(rest.length==0){
        var skipNumber = 0;
        var limitNumber = 0;
        //普通查找
    }else if (rest.length==1){
        var skipNumber = rest[0].skip || 0;
        var limitNumber = rest[0].limit || 0;
        //分页查找
    }else {
        throw new Error('find函数的参数只能为三个或者4个')
        return
    }
    __connectDb((err,db)=>{
        if (err){
            callback(err,null)
            return
        }
        //普通查找
        db.collection(collectionName)
            .find(json)
            .skip(skipNumber)
            .limit(limitNumber)
            .sort({time:-1})
            .toArray(function (err,docs) {
                if (err){
                    callback(err,null)
                    db.close()
                    return
                }
                callback(null,docs)
                db.close()
        })
    })
}

exports.findArg=function (collectionName,json,c,d) {
    if (arguments.length == 3){
        var callback = c;
        var limitNumber = 0;
        var skipNumber = 0;
    }else if (arguments.length == 4){
        var callback = d;
        var page = c;
        var limitNumber = page.limit || 0;
        var skipNumber = page.skip || 0;
    }else {
        throw new Error('findArg函数的参数只能为三个或者4个')
        return
    }

    __connectDb(function (err,db) {
        if (err){
            callback(err,null)
            return
        }
        db.collection(collectionName)
            .find(json)
            .skip(skipNumber)
            .limit(limitNumber)
            .toArray(function (err,docs) {
                if (err){
                    callback(err,null)
                    db.close()
                    return
                }
                callback(null,docs)
                db.close()
            })
    })
}

//获取总数
exports.getCount=function (collectionName,callback) {
    __connectDb((err,db)=>{
        if (err){
            callback(err,null)
            return
        }
        db.collection(collectionName).count(function (err,count) {
            if (err){
                callback(err,null)
                return
            }
            callback(null,count)
        })  //promnise
    })
}


