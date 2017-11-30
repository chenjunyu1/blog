var express = require('express');
var router = express.Router();
const db =require('../models/db');
const crypto = require('crypto');
const moment = require('moment');
const formidable =require('formidable');
const path =require('path');
const fs =require('fs');
const gm = require('gm');
const ObjectId=require('mongodb').ObjectID

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//用户登录页面呈递
router.get('/login',(req,res)=>{
  res.render('login',{'title':'登录',active:'login'})
})

//用户注册页面呈递
router.get('/register',(req,res)=>{
    res.render('register',{'title':'注册',active:'register'})
})

//注册功能
router.post('/register',(req,res,next) => {
    let {username,psw,sex,age} =req.body;
    let avatar='/img/avatar/avatar.jpg';
    if(username == ''){
      res.send('请输入你的用户名');
      return
    }
    if(psw == '') {
        res.send('请输入你的密码');
        return
    }
    db.find("users",{username},(err,r)=>{
        if (err){
            console.log(err)
            next(err)
            return
        }
        //r  ==> []   ||  非空数组
        if(r.length == 0){
            let md5 = crypto.createHash('md5');
            let sbt = parseInt(psw*10000)+username;
            let secretPsw=md5.update(sbt).digest('hex');
            db.insertDocument('users',[{username,secretPsw,sex,age,avatar}],(err,result) => {
                if (err){
                    console.log(err)
                    next(err)
                    return
                }
                res.redirect('/users/login')
            })
        }else {
            if (r[0].username == username){
                res.send('用户名已被占用')
            }else {
                let md5 = crypto.createHash('md5');
                let sbt = parseInt(psw*10000)+username;
                let secretPsw=md5.update(sbt).digest('hex');
                db.insertDocument('users',[{username,secretPsw,sex,age,avatar}],(err,result) => {
                    if (err){
                        console.log(err)
                        next(err)
                        return
                    }
                    res.redirect('/users/login')
                })
            }
        }
    })
})

//登录功能
router.post('/login',(req,res)=> {
    let {username,psw} =req.body;
    if(username == ''){
        res.send('请输入你的用户名');
        return
    }
    if(psw == '') {
        res.send('请输入你的密码');
        return
    }
    db.find('users',{username},(err,r)=> {
        if (err){
            console.log(err)
            next(err)
            return
        }
        //r  ==>  []  ||  [{},{}]
        if (r.length == 0) {
            res.send('你的用户名,不存在,请注册');
        }else {
            let md5 = crypto.createHash('md5');
            let sbt = parseInt(psw*10000)+username;
            let secretPsw=md5.update(sbt).digest('hex');
            if(r[0].username == username && r[0].secretPsw==secretPsw){
                req.session.user=r[0];  //会话状态使用
                res.redirect('/')
            }else {
                res.send('密码错误')
            }
        }

    })
})

//注销功能
router.get('/logout',(req,res)=>{
    req.session.user=null;
    res.redirect('/');
})

//发表功能
router.post('/dopost',requiredLogin,(req,res)=>{
    let {content} =req.body
    let {username} = req.session.user
    let time = Date.now(),
        comment=[];//评论
    console.log(content,username,time,comment)
    db.insertDocument('posts',[{username,content,time,comment}],(err,r)=>{
        if (err){
            console.log(err)
            res.json(-1);
            return
        }
        res.json(1)
    })
})

//呈递修改头像
router.get('/showavatar',setavatarrequiredLogin,(req,res) =>{
    res.render('showavatar',{title:'设置个人头像','active':'index'})
})

//处理上传,设置自定义头像的功能
router.post('/doavatar',setavatarrequiredLogin,(req,res)=>{
    const form = new formidable.IncomingForm();
    form.uploadDir=path.normalize(__dirname+'/../public/img/temp');
    form.parse(req,(err,fields,files)=>{
        if(err){
            console.log(err);
            return
        }
        //限制上传图片大小为10M;
        let size = parseInt(files.img.size);
        if(size>10*1024*1024){
            res.send('图片的大小不要超过10M')
            fs.unlink(files.img.path);
            return
        }

        let extname = path.extname(files.img.name);
        let oldpath = path.normalize(files.img.path);
        let newpath = path.normalize(__dirname+'/../public/img/avatar/'
            +req.session.user.username+extname);
        fs.rename(oldpath,newpath,(err)=>{
            //处理完了上传,数据库的数据  avatar  ==>  修改
            db.updateDocument('users',{'username':req.session.user.username},{$set:{'avatar':'/img/avatar/'+req.session.user.username+extname}},(err,r)=>{
                if(err){
                    console.log(err);
                    return
                }
                req.session.user.avatar='/img/avatar/'+req.session.user.username+extname
                res.redirect('back');
            })
        })
    })
})

//呈递裁剪头像
router.get('/show/avatar',setavatarrequiredLogin,(req,res) =>{
    res.render('docut',{title:'裁剪个人头像','active':'index'})
})

//处理裁剪功能
router.get('/docut',setavatarrequiredLogin,(req,res)=>{
    let {w,h,x,y}=req.query
    // 四个参数,gm有了
    let imgpath=req.session.user.avatar;  //   /img/avatar/小花.jpg
    let extname=path.extname(imgpath);  //文件拓展名
    let cutpath=path.normalize(__dirname+'/../public'+imgpath);

    gm(cutpath)
        .crop(w,h,x,y)
        .resize(200,200,'!')
        .write(cutpath,(err)=>{
            if (err) {
                console.log(err);
                res.json(-1);
                return;
            };
            res.json(1)
        })
})

//用户增加评论功能
router.post('/docomment',setavatarrequiredLogin,(req,res)=>{
    let {comment,id} =req.body;
    db.updateDocument('posts',{_id:ObjectId(id)},{$push:{comment}},(err,r)=>{
        if(err){console.log(err);res.json(-1);return}
        res.json(1);
    })
})

module.exports = router;

//会话状态  session(存的信息是加密过的,是一堆乱码)依赖于cookie

//判断是否登陆状态  ==>  执行下一步
function requiredLogin(req,res,next) {
    if(req.session.user){
        next();
    }else {
        res.json('-1');
    }
}

//进入修改头像页面需要登录
function setavatarrequiredLogin(req,res,next) {
    if(req.session.user){
        next();
    }else {
        res.redirect('/');
    }
}