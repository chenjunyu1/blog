var express = require('express');
var router = express.Router();
const db = require('../models/db');
const moment =require('moment');
const ObjectId=require('mongodb').ObjectID

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: '首页', active: 'index'});
});

router.get('/index/getAllPost', requiredLogin, (req, res, next) => {
    let page =req.query.p;  //p  ==>  页数
    db.find('posts', {}, (err, r) => {
        if (err) {
            console.log(err)
            next();
        }
        r.forEach(function (doc) {
            doc.time=moment(doc.time).format('llll');
        })
        res.json({'result':r,'err':0})
    },{skip:6*page,limit:6})
});

//todo 获取头像,路由参数冲突问题
router.get('/index/getavatar/:username', requiredLogin, (req, res, next) => {
    let username=req.params.username;
    db.find('users', {username}, (err, r) => {
        if (err) {
            console.log(err)
            next();
        }
        res.json({'avatar':r[0].avatar,'username':r[0].username,'err':0})
    })
});

router.get('/index/getCount',requiredLogin,(req,res)=>{
    let col=req.query.col; // ==>  col  ==> 集合的名字
   db.getCount(col,(err,count)=>{
       if (err){
           res.json({count:'error',err:1})
           return
       }
       res.json({count:count,err:0})
   })
});

//jsonp  在node.js  使用
router.get('/index/add/data', (req, res, next) => {
    let _callbak=req.query.callback;  //callabck=jsoncallback
    let data ={'r':1};
    console.log(_callbak+ '('+JSON.stringify(data)+ ')');
    res.type('text/javascript')
    res.send(_callbak+ '('+JSON.stringify(data)+ ')')
    //jsoncallback({'r':1})
});

//呈递静态页面  =>  发表内容的详细信息
router.get('/index/detail/posts',reqLogin,(req,res)=>{
    let {id} = req.query;
    //todo 增加头像 => avatar
    db.find('posts',{_id:ObjectId(id)},(err,r) =>{
        if(err){
            console.log(err);
            return
        }
        r[0].time=moment(r[0].time).format('llll')
        res.render('comment',{title:'详细页',active:'index',post:r[0]})
    })

})

module.exports = router;

//md5加密:   32,16,8,  无论什么东西加密出来的结果每次都是一样的  不可逆的加密(破解不了,字典)

//判断是否登陆状态  ==>  执行下一步
function requiredLogin(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.json({'result': '用户发表的内容需要登录才能够获取','err':1});
    }
}

//进入页面需要登录
function reqLogin(req,res,next) {
    if(req.session.user){
        next();
    }else {
        res.redirect('/');
    }
}