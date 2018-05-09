$(document).ready(function () {
    'use strict';

    //调整tip位置
    $(".u-tips-holder").css("margin-left", "-160px;");

    // 动画常量
    var Speed = {
        FAST  : 50,
        NORMAL: 150,
        SLOW  : 300
    };

    // 键盘值常量
    var Keys = {
        ENTER: 13
    };

    // 全局变量
    var $newsListDIV = $('.j-news-list');
    var $framePhotoDetail = $(".j-frame-photo-detail");
    var $framePhotoShare = $(".j-frame-photo-share");
    var $framePhotoShow = $(".j-frame-photo-show");
    var $frameWriteArticle = $("#j-frame-write-article");
    window.sliding = false;
    var $newsInput = $('#j-news-input'),
        $forwardFrame = $(".j-forward_frame"),
        $friendUploadBox = $("#j-friend-upload-box"),
        $addImageTrigger = $('.j-add_image');
    var permission = 0,
        shieldFriendList = [],
        shieldFactionList = [],
        shieldNumLimit = 20,
        $shieldList = $(".j-shield-list"),
        $frameFriendFactionShield = $(".j-frame-friend-faction-shield");
    var $permission = $(".j-permission"),
        $perDownMenu = $(".j-permission-downmenu");
    var $popVideoInsertFrame = $('.j-pop_video_insert_frame'),
        $videoInsert = $popVideoInsertFrame.find('.j-video_insert'),
        $videoTitle = $popVideoInsertFrame.find('.j-video_title');


    var rHttp = /http/i;

    /**
     *接口初始化
     */
    Api.getNews = Api.get('/dyq/api/getfriendnews');          // 获取动态
    Api.postNews = Api.get('/dyq/api/v2/person/postNew', 'post');       // 发表动态
    Api.getVisitors = Api.get('/dyq/api/getrecentvisit');     // 获取最近访问
    Api.getForwards = Api.get('/dyq/api/getforwards'); // 获取分享列表
    Api.getComments = Api.get('/dyq/api/getcomments'); // 获取某条动态的评论
    Api.delComment = Api.get('/dyq/api/deletecomments', 'POST'); // 删除评论
    Api.delNews = Api.get('/dyq/api/deletenews', 'POST'); // 删除动态
    Api.shieldNews = Api.get('/dyq/api/shield', 'POST'); // 屏蔽某人
    Api.like = Api.get('/dyq/api/praise', 'POST'); // 点赞
    Api.getNewsRemide = Api.get('/zone/api/remind/news'); // 查询是否有新动态
    Api.postComment = Api.get('/dyq/api/v2/person/postComment', 'POST'); // 发表评论
    Api.postForward = Api.get('/dyq/api/v2/person/forwardNew', 'POST'); // 分享动态
    Api.getPraisePerson = Api.get('/dyq/api/getpraiseperson');// 获取某条动态点赞用户列表
    Api.getRecentPhoto = Api.get('/dyq/api/friend/getrencentphoto');//获取最近战友上传图片列表
    Api.permission = Api.get("/dyq/api/permission/desc");//获取权限详情
    Api.searchFriend = Api.get("/dyq/api/searchfriend");//搜索战友列表
    Api.postArticle = Api.get("/dyq/api/article/post_article", "POST");//发布文章
    Api.articleDetail = Api.get("/dyq/api/article/detail");//文章详情
    Api.saveDraft = Api.get("/dyq/api/article/savedraft", "POST");//文章草稿保存
    Api.getDraft = Api.get("/dyq/api/article/getdraft");//获取文章草稿
    Api.delDraft = Api.get("/dyq/api/article/deldraft", "POST");//删除文章草稿
    Api.video = Api.get("/dyq/api/article/video");//视频插入
    Api.PubAccounts = Api.get('/dyq/api/pubAccount/PubAccounts');//相关游戏主页
    Api.modifyArticle = Api.get('/dyq/api/article/modifyArticle','POST');//修改文章
    Api.getAccount= Api.get('/dyq/api/getUserNick');//获取用户信息




    //发布框初始化
    $newsInput.val(window.localStorage[$.md5(dyq.data.account.id)+ $newsInput.attr("data-localstorage")]);


    // 上传图片
    var filesData = {// 记录当前图片张数、总大小
        size           : 0,
        length         : 0,
        uploadsize     : 0,
        uploadlength   : 0,
        uploadedFilesId: [],
        index:0,
        indexArr:[]
    };
    var uploader = WebUploader.create({
        auto:true,
        swf     : '/js/lib/webuploader/Uploader.swf',
        server : '/dyq/api/uploadimg',
        // resize:false,
        pick:'#filePicker',
        accept  : {
            title     : 'Images',
            extensions: 'jpg,jpeg,png,gif,bmp',
            mimeTypes : 'image/jpg,image/jpeg,image/png,image/gif,image/bmp'//chrome52以上，使用image/*会卡一小会
        },
        compress:false
    });

    //图片不符合类型
    uploader.on('error',function(type){
        if(type==='F_DUPLICATE'){
            //ui.modal("图片已经添加！");
            if($('#j-modal_tip').is(':hidden')){
                $('#j-modal_tip').css('display','block');
                $('#errorTip').html('图片已经添加！');
                setTimeout(function(){
                    $('#j-modal_tip').css('display','none');
                },1000);
            }
            $('.j-post-news').removeClass('disable');
            return false;
        }else if(type==='Q_TYPE_DENIED'){
            ui.modal("图片类型不符合要求！");
            return false;
        }
    });
    //拿到文件后
    uploader.on('filesQueued',function(files){
        if(files.length > 9){
            ui.modal('最多可以分享9张图片！');
            uploader.reset();
            return false;
        }

        var imgBoxNum=$('.j-img_li').length;


        if(imgBoxNum+files.length>9){
            ui.modal('最多可以分享9张图片！');
            for(var i=0;i<files.length;i++){
                uploader.removeFile(files[i]);
            }
            return false;
        }
        //$('.j-post-news').addClass('disable');
        $(files).each(function (index, file) {
            var t_index = file.id;

            filesData.size += file.size;
            filesData.length += 1;

            var $newImage = $('<li class="j-img_li z-loading imgBox'+t_index+' "><a href="javascript:void(0);"><img src="/img/loading1.gif" width="30" height="30"></a> <i class="i-close j-close"></i></li>');

            $addImageTrigger.parent().before($newImage);
            //
            // }else{
            //     ui.modal('最多可以分享9张图片！');
            //     // for(var j=9-filesData.length;j<filesData.lenght;j++){
            //     //     $addImageTrigger.parent().remove($(".imgBox"+));
            //     // }
            //     console.log($addImageTrigger.parent().find($(".imgBox"+8)));
            //
            //     uploader.reset();
            //     return false;
            // }



            // // 缩略图预览
            // uploader.makeThumb(file, function (err, src) {
            //     console.log(src);
            //     var $photoHTML = $(template('template-photo-list', {src: src, id: file.id, size: file.size, photoName: file.name}));
            //     // framePhotoNameWordControl.call($photoHTML.find(".j-input")[0]);
            //     // $photoList.prepend($photoHTML);
            // });
        });
    });

    // 上传过程中
    uploader.on('uploadProgress', function (file, percentage) {
        var $file = $('#' + file.id);
        percentage = percentage * 100;
        $file.find('.bar .inner').css('width', percentage + '%');
        $file.find('.bar .text').text(percentage + '%');
    });
    //上传完成
    uploader.on('uploadSuccess',function(file,res){
        var $file = $('#'+file.id);
        // res = JSON.parse(res);
        var $newImage=$('.imgBox'+file.id);
        if (res.code !== 0) { // 上传失败
            ui.modal('上传失败！请重新选择图片。');
            return false;
        }

        var imagePath = res.imgsPath;
        // 加入缓存
        var pictureurl = $newsInput.data('pictureurl') || [];
        pictureurl.push(imagePath);
        $('.j-post-news').removeClass('disable');
        if(pictureurl.length<9){
            $('.j-upload-image-num').text('（共'+pictureurl.length+'张，还能上传'+(9-pictureurl.length)+'张）');
        }else{
            $('.j-upload-image-num').text('（最多可上传9张）');
        }
        $newsInput.data('pictureurl', pictureurl);
        // $newsInput.data('fileIndex',filesData.index);
        // filesData.indexArr.push(filesData.index);
        $newImage.data('src', imagePath);
        $newImage.data('id',file.id);
        // var endTime = new Date();
        // var passTime = endTime - startTime;
        // 保证至少0.5秒后才触发
        // if (passTime > 500) {
        $newImage.find('img').replaceWith('<img src="' + imagePath + '">');
        //调整图片位置
        imageAdjust({images: $newImage.find('img'), size: {width: 80, height: 80}});

        filesData.index++;

        // } else {
        //     setTimeout(function () {
        //         $newImage.find('img').replaceWith('<img src="' + imagePath + '">');
        //         //调整图片位置
        //         imageAdjust({images: $newImage.find('img'), size: {width: 80, height: 80}});
        //     }, 500 - passTime);
        // }
        // $this.val('');
        // uploader.makeThumb(file, function (err, src) {
        //     console.log(src,res);
        //     // var $photoHTML = $(template('template-photo-list', {src: src, id: file.id, size: file.size, photoName: file.name}));
        //     // framePhotoNameWordControl.call($photoHTML.find(".j-input")[0]);
        //     // $photoList.prepend($photoHTML);
        // });
    });

    /*$('.j-upload-input').change(function () {
     var $this = $(this);
     var _value = [];
     var len=0;
     $.each($(this).prop('files'),function(i,item){
     _value.push(item);
     });
     len=_value.length;
     if (!_value) {
     return false;
     }
     if(len>9){
     ui.modal('最多9张图片！');
     return false;
     }
     // 判断文件类型
     for(var i=0;i<len;i++){
     if (!Tool.isImage(_value[i].name)) {
     ui.modal('不支持的图片类型！请重新选择图片。');
     return false;
     }
     }
     console.log(_value,$('.j-upload-form'));
     for(var i=0;i<len;i++){
     var $newImage = $('<li class="j-img_li z-loading"><a href="javascript:void(0);"><img src="/img/loading.gif" width="30" height="30"></a> <i class="i-close j-close"></i></li>');
     $addImageTrigger.parent().before($newImage);
     // var html=$('<input type="file" accept="image/!*" name="upload-file'+i+'" style="display: none;"/>');
     // $('.j-upload-form').append(html);
     }

     // jquery.form上传
     var startTime = new Date();
     $('.j-upload-form').ajaxSubmit({
     // data:
     dataType: 'text',
     success : function (rsp) {
     rsp = JSON.parse(rsp);
     if (rsp.code !== 0) { // 上传失败
     ui.modal('上传失败！请重新选择图片。');
     return false;
     }
     var imagePath = rsp.imgsPath;
     // 加入缓存
     var pictureurl = $newsInput.data('pictureurl') || [];
     pictureurl.push(imagePath);
     $newsInput.data('pictureurl', pictureurl);
     $newImage.data('src', imagePath);
     var endTime = new Date();
     var passTime = endTime - startTime;
     // 保证至少0.5秒后才触发
     if (passTime > 500) {
     $newImage.find('img').replaceWith('<img src="' + imagePath + '">');
     //调整图片位置
     imageAdjust({images: $newImage.find('img'), size: {width: 80, height: 80}});
     } else {
     setTimeout(function () {
     $newImage.find('img').replaceWith('<img src="' + imagePath + '">');
     //调整图片位置
     imageAdjust({images: $newImage.find('img'), size: {width: 80, height: 80}});
     }, 500 - passTime);
     }
     $this.val('');
     }
     });

     });*/
    // 将已上传的图片删掉
    $('.j-image_list').on('click', '.i-close', function (evt) {
        var pictureurl = $newsInput.data('pictureurl') || [];
        var src = $(this).parent().data('src');
        var id = $(this).parent().data('id');
        if(id){
            uploader.cancelFile(id);
        }
        for (var i = 0, len = pictureurl.length; i < len; ++i) {
            if (pictureurl[i] === src) {
                pictureurl.splice(i, 1);
                $newsInput.data('pictureurl', pictureurl); // 更新缓存
                break;
            }
        }
        $('.j-upload-image-num').text('（共'+pictureurl.length+'张，还能上传'+(9-pictureurl.length)+'张）')
        $(this).parent().remove();
    });

    // 在玩游戏
    Api.get('/dyq/api/getgamelist')({userid: dyq.data.account.id}, function (resp) {
        if (!resp.code) {
            resp.gameMapping = {
                'sw'  : '神武2',
                'm2sw': '《神武2》手游',
                'mx'  : '梦想世界',
                'dw'  : '梦想帝王',
                'mx2' : '梦想世界2',
                'm2mx': '梦想手游',
                'd10' : '第十域',
                'm2kd': '空岛争霸',
                'mf'  : '永恒魔法',
                'm2k8': '梦想世界3D',
                'm2jt': '超时空萌物军团'
            };
            resp.ismy = 'true';
            resp.userid = dyq.data.account.id;
            resp.ispub = dyq.data.ispub;
            // 按时间排个序
            resp.gameList.sort(function (x, y) {
                return y.recentLoginTime - x.recentLoginTime;
            });
            $(".j-game-list").html(template("latedPlaying", resp));
            //文章编辑器底部渲染
            if (resp.ispub) {
                $.ajax({
                    url: '/dyq/api/getallmobilegame',
                    type: 'GET',
                    data: {},
                    success: function(res) {
                        if (res.code == 0) {
                            resp.mobileGame = res.gameList;
                            $frameWriteArticle.find(".j-article_bottom").html(template("template-article-bottom", resp));
                        } else {
                            ui.fastTips(res.message || '请求推荐游戏失败');
                        }

                    },
                    error: function(err) {
                        ui.fastTips(res.message || '请求推荐游戏失败');
                    }

                });

            } else {
                $frameWriteArticle.find(".j-article_bottom").html(template("template-article-bottom", resp));
                //自定义提示渲染
                ui.title($frameWriteArticle.find('.j-article-bottom-tips'),'文章审核通过后将出现在游戏主页','inline-block');
            }

        }
    });
    // 获取最近访问列表
    Api.getVisitors({ userid: dyq.data.account.id }, function (rsp) {
        if(rsp.recentvisit && rsp.recentvisit.length>0){
            for(var i=0;i<rsp.recentvisit.length;i++){
                rsp.recentvisit[i].visit_headPath = addHeadPathPrefix(rsp.recentvisit[i].visit_headPath);
            }
        }
        var $visitor = $('.j-visitor-number span a');
        $visitor.get(0).innerHTML = rsp.todayvisitcount;
        $visitor.get(1).innerHTML = rsp.allvisitcount;
        var html = '';
        if (rsp.allvisitcount > 0) {
            html = template('template-visitor-list', {visitorList: rsp.recentvisit});
            $('.j-visitor-list').html(html).show();
            if (Math.ceil(rsp.recentvisit.length / 6) > 1) {
                $(".j-next-trigger").removeClass("none");
            }
        } else {
            html = template('template-recommend-list', {visitorList: rsp.recommandList});
            $('.j-recommend-list').html(html).show();
        }
    });

    /**
     * 战友上传相关操作
     */
    var photoArr = [];
    (function(){

        var currIndex = 0;
        var totalPhoto = 0;
        var photoSlipTimer = null;
        //战友上传
        Api.getRecentPhoto({}, function (res) {
            totalPhoto = res.friendRecentPhotos.length;
            if (totalPhoto <= 0) {
                return false;
            }
            for (var i = 0; i < res.friendRecentPhotos.length; i++) {
                var tmp = addHeadPathPrefix(res.friendRecentPhotos[i].picture_url);
                res.friendRecentPhotos[i].picture_url = tmp;

                photoArr.push(res.friendRecentPhotos[i]);
            }

            var $friendUpload = $(template("template-friend-upload-box", {photoInfo: res.friendRecentPhotos[0], totalPhoto: totalPhoto}));
            //调整图片位置
            replaceErrorImage($friendUpload);
            imageAdjust({images: $friendUpload.find("img"), size: {width: 230, height: 230}});
            $friendUploadBox.html($friendUpload);
            //缓存数据
            $friendUploadBox.data("photoInfo", res.friendRecentPhotos[0]);

            //图片轮播

            if (totalPhoto > 1) {
                photoSlipTimer = setInterval(function () {
                    $friendUploadBox.find(".j-next-photo").trigger("click");
                }, 5000);
            }

        });
        //战友上传->上一张
        $friendUploadBox.on("click", ".j-prev-photo", function (evt) {
            if (totalPhoto <= 1) {
                return;
            }
            currIndex = (totalPhoto + currIndex - 1) % totalPhoto;
            var $friendUpload = $(template("template-friend-upload", {photoInfo: photoArr[currIndex]}));
            //调整图片位置
            replaceErrorImage($friendUpload);
            imageAdjust({images: $friendUpload.find("img"), size: {width: 230, height: 230}});
            //$friendUploadBox.find("#j-friend-upload").html($friendUpload);

            if( !$friendUploadBox.find("#j-friend-upload").is(":animated")){
                $friendUploadBox.find("#j-friend-upload").prepend($friendUpload).css("marginLeft",-230).animate({"marginLeft":0},500,function(){
                    $(this).find(".m-album").eq(1).remove();
                });
            }
            //缓存数据
            $friendUploadBox.data("photoInfo", photoArr[currIndex]);
            // recordOperator();
            evt.stopPropagation();
        });
        //战友上传->下一张
        $friendUploadBox.on("click", ".j-next-photo", function (evt) {
            if (totalPhoto <= 1) {
                return;
            }
            currIndex = (currIndex + 1) % totalPhoto;
            var $friendUpload = $(template("template-friend-upload", {photoInfo: photoArr[currIndex]}));
            //调整图片位置
            replaceErrorImage($friendUpload);
            imageAdjust({images: $friendUpload.find("img"), size: {width: 230, height: 230}});
            //$friendUploadBox.find("#j-friend-upload").html($friendUpload);
            if( !$friendUploadBox.find("#j-friend-upload").is(":animated")) {
                $friendUploadBox.find("#j-friend-upload").append($friendUpload).css("marginLeft", 0).animate({"marginLeft": -230}, 500, function () {
                    $(this).css("marginLeft", 0).find(".m-album").eq(0).remove();
                });
            }

            //缓存数据
            $friendUploadBox.data("photoInfo", photoArr[currIndex]);
            // recordOperator();
            evt.stopPropagation();
        });
        //战友上传->点赞
        $friendUploadBox.on("click", ".j-praise-photo", function () {
            var $this = $(this);
            var ispraise = 0;
            var _praiseNum = parseInt($this.find(".j-praise-num").text());
            var _cachePhotoInfo = $friendUploadBox.data("photoInfo");

            if($this.hasClass('disabled')){
                ui.modal('操作过于频繁，请稍后再试！');
                return false;
            }
            $this.addClass('disabled');//防止多次点击
            //点赞
            Api.like({praiseType: 2, photoid: _cachePhotoInfo.photoid, bpraiseuserid: _cachePhotoInfo.userid}, function (res) {
                $this.removeClass('disabled');
                if (res.code != 0) {
                    ui.modal(res.message);
                    return false;
                }
                $this.removeClass('disabled');
                $this.toggleClass("z-active");
                if ($this.hasClass("z-active")) {
                    $this.find(".j-praise-num").text(++_praiseNum);
                    ispraise = 1;
                } else {
                    $this.find(".j-praise-num").text(--_praiseNum);
                    ispraise = 0;
                }
                //改变缓存
                $.extend(_cachePhotoInfo, {praise_num: _praiseNum, ispraise: ispraise});
            });
        });
        //战友上传->mouseenter
        $friendUploadBox.on("mouseenter", ".j-friend-upload,.j-prev-photo,.j-next-photo", function () {
            if (totalPhoto <= 1) {
                return;
            }
            //清除图片轮播效果
            clearInterval(photoSlipTimer);
        });
        //战友上传->mouseleave
        $friendUploadBox.on("mouseleave", ".j-friend-upload,.j-prev-photo,.j-next-photo", function () {
            if (totalPhoto <= 1) {
                return;
            }

            if ($framePhotoDetail.find(".m-pop_photo").length == 0) {
                //图片轮播
                photoSlipTimer = setInterval(function () {
                    $friendUploadBox.find(".j-next-photo").trigger("click");
                }, 5000);
            }
        });
        // 全局下拉（fadeIn效果：使用animate）
        $(document).on('click', '.j-drop_fade', function (evt) {
            var $this = $(this);
            var _target = $(this).attr('data-target');
            if (!_target) {
                return false;
            }
            $this.closest(".j-news-module").siblings(".j-news-module").find(".j-drop-menu").hide();
            $this[_target]('.j-drop-menu').slideToggle(Speed.FAST);
        });
    }());

    /**
     * 动态发布框、评论回复框、动态评论框、动态分享框下AT初始化以及表情初始化
     */
    (function(){
        //发布框：AT初始化
        (function () {
            var options = {
                source: '/dyq/api/autocomplete?search=',
                shift : { top: 10 }
            };
            if (browser.name === 'Internet Explorer' && browser.version === '8.0') {
                options.shift.top = 10;
            }
            $newsInput.nameComplete(options);
        })();
        // 表情初始化(动态的发布框下)
        $(".j-news_emotion").qqFace({
            id      : 'facebox',
            assign_P: 'j-personalInfo',
            assign_C: 'j-news-input',
            path    : '/img/emotion/'	//表情存放的路径
        });
        //点赞人列表悬浮框初始化
        praseTip({
            entrustClass: document,
            triggerClass: ".j-praise",
            tipClass    : ".j-poptip",
            tipPopMt    : -108,
            temp        : "template-pop-tip",
            left        : 484
        });
        // 点击"AT战友"触发AT功能(动态的发布框下)
        $('.j-at-trigger').click(function () {
            $newsInput.focus();
            var pos = $newsInput.caret('pos');
            var _val = $newsInput.val();
            $newsInput.val(_val.slice(0, pos) + "@" + _val.slice(pos));
            $newsInput.caret('pos', pos + 1);
        });
        // 点击"AT战友"触发AT功能（每条评论的回复框下）
        $newsListDIV.on('click', '.j-reply-at-trigger', function () {
            var $replyInput = $(this).closest(".j-reply-frame").find(".j-reply-input");
            $replyInput.focus();
            var pos = $replyInput.caret('pos');
            var _val = $replyInput.val();
            $replyInput.val(_val.slice(0, pos) + "@" + _val.slice(pos));
            $replyInput.caret('pos', pos + 1);
        });
        // 点击"AT战友"触发AT功能（每条动态的评论框下）
        $newsListDIV.on('click', '.j-comment-at-trigger', function () {
            var $commentInput = $(this).closest(".j-news-module").find(".j-comment-input");
            $commentInput.focus();
            var pos = $commentInput.caret('pos');
            var _val = $commentInput.val();
            $commentInput.val(_val.slice(0, pos) + "@" + _val.slice(pos));
            $commentInput.caret('pos', pos + 1);
        });
        // 点击"AT战友"触发AT功能（每条动态的分享框下）
        $forwardFrame.on('click', '.j-forward-at-trigger', function () {
            var $forwardInput = $forwardFrame.find(".j-forward_textarea");
            $forwardInput.focus();
            var pos = $forwardInput.caret('pos');
            var _val = $forwardInput.val();
            $forwardInput.val(_val.slice(0, pos) + "@" + _val.slice(pos));
            $forwardInput.caret('pos', pos + 1);
        });
    }());

    /*======================================= 动态加载器 ==============================================*/
    var lastId = 0;           //用来保存最后一条动态id
    //滑到页面底部加载更多
    var newsLoader = {
        stop     : false,
        isLoading: false, // 同步锁
        lastId   : 0,          //存储最后一条newid
        type     : 0,
        load     : function () {
            if (this.stop) { // 停止加载
                return false;
            }
            if (this.isLoading) {
                return false;
            }
            if (!this.lastId) {
                this.lastId = lastId;
            }
            var that = this;
            var getData = {
                type  : that.type,
                lastId: that.lastId
            };
            that.isLoading = true; // 上锁
            Api.getNews(getData, function (rsp) {
                if(rsp.newsList && rsp.newsList.length>0){
                    for(var i=0; i<rsp.newsList.length;i++){
                        rsp.newsList[i].headPath=addHeadPathPrefix(rsp.newsList[i].headPath);
                        if(rsp.newsList[i].comments.length>0){
                            for(var j=0;j<rsp.newsList[i].comments.length;j++){
                                if(rsp.newsList[i].comments[j].bcomment_headPath){
                                    rsp.newsList[i].comments[j].bcomment_headPath=addHeadPathPrefix(rsp.newsList[i].comments[j].bcomment_headPath);
                                }
                                if(rsp.newsList[i].comments[j].comment_headPath){
                                    rsp.newsList[i].comments[j].comment_headPath=addHeadPathPrefix(rsp.newsList[i].comments[j].comment_headPath);
                                }
                            }
                        }
                        if(rsp.newsList[i].praises.length>0){
                            for(var j=0;j<rsp.newsList[i].praises.length;j++){
                                rsp.newsList[i].praises[j].headPath=addHeadPathPrefix(rsp.newsList[i].praises[j].headPath);
                            }
                        }
                    }
                }
                if (rsp.code !== 0) {
                    ui.modal("获取动态失败！请稍候重试。");
                    return false;
                }
                if (rsp.newsList.length === 0) { // 没有更多了，停止加载
                    that.stop = true;
                    return false;
                }
                var $newsList = newsDataProcess.apply(this, [rsp]);
                $newsListDIV.append($newsList);
                that.lastId = rsp.newsList[rsp.newsList.length - 1].new_id;
                that.isLoading = false; // 解锁
            });
        }
    };
    var loader = {
        currentType: 0, // 当前动态类型，默认为全部
        currentPage: 1, // 当前分页，默认第一页
        /**
         * 获取战友动态
         * @param {String} newsType 动态类型。0为全部，1为原创，2为图片 （必须）
         * @param {Number} page 第几页（必须）
         * @param {Boolean} fadeIn 是否使用淡入动画（可选）
         * */
        loadNews   : function (newsType, page, fadeIn) {
            //用于快捷发布动态判断
            dyq.data.currentPage = "index";

            //头部信息加自定义title
            ui.title($('.tooptips-userimg'),'修改头像可到战盟客户端');
            ui.title($('.tooltips-info'),'修改资料可到战盟客户端');


            fadeIn = !!fadeIn;
            var getData = {
                type: newsType,
                page: page
            };
            //addHeadPathPrefix
            Api.getNews(getData, function (rsp) {
                if(rsp.newsList && rsp.newsList.length>0){
                    for(var i=0; i<rsp.newsList.length;i++){
                        rsp.newsList[i].headPath=addHeadPathPrefix(rsp.newsList[i].headPath);
                        if(rsp.newsList[i].comments.length>0){
                            for(var j=0;j<rsp.newsList[i].comments.length;j++){
                                if(rsp.newsList[i].comments[j].bcomment_headPath){
                                    rsp.newsList[i].comments[j].bcomment_headPath=addHeadPathPrefix(rsp.newsList[i].comments[j].bcomment_headPath);
                                }
                                if(rsp.newsList[i].comments[j].comment_headPath){
                                    rsp.newsList[i].comments[j].comment_headPath=addHeadPathPrefix(rsp.newsList[i].comments[j].comment_headPath);
                                }
                            }
                        }
                        if(rsp.newsList[i].praises.length>0){
                            for(var j=0;j<rsp.newsList[i].praises.length;j++){
                                rsp.newsList[i].praises[j].headPath=addHeadPathPrefix(rsp.newsList[i].praises[j].headPath);
                            }
                        }
                    }
                }
                if (rsp.code !== 0) {
                    ui.modal("获取动态失败！请稍候重试。");
                    return false;
                }

                // 暂无动态
                if (rsp.newsList.length === 0) {
                    $newsListDIV.html('<div class="g-box1 g-mb10 s-radius3 j-nothing"><p style="text-align:center;padding: 100px 0 500px 0;font-family: microsoft yahei;">您暂无战友动态，发条动态抢沙发吧</p></div>');
                    newsLoader.stop = true;
                    return false;
                }
                //保存最后一条动态id
                lastId = rsp.newsList[rsp.newsList.length - 1].new_id;

                var $newsList = newsDataProcess.apply(this, [rsp]);
                if (fadeIn) {
                    $newsList.css('display', 'none');
                }
                $newsListDIV.html($newsList);

                if (fadeIn) {
                    $newsList.fadeIn();
                }
                $(window).trigger("resize");
                //重新加载页面时先把scrollTop清掉
                if(dyq.cookie.getItem("scrollTop")){
                    dyq.cookie.setItem("scrollTop",0);
                }
                var loaded = false;

                // var siv = setInterval(function () {
                //     if (dyq.cookie.getItem("scrollTop") > Number($(document).height() - $(window).height())) {
                //         if (!newsLoader.isLoading) {
                //             newsLoader.load();
                //         }
                //     } else {
                //         loaded = true;
                //     }
                //     if (loaded) {
                //             $(document).scrollTop(0);
                //             clearInterval(siv);
                //     }
                // }, 40);
                //刷新时回到顶部，因为浏览器默认会记录当前位置-----方法二
                // window.onload=function() {
                //     setTimeout(function(){
                //         window.scrollTo(0,0)
                //     },10)
                // }
                //刷新时回到顶部，因为浏览器默认会记录当前位置
                $(window).on('beforeunload',function(){
                    $(window).scrollTop(0);
                })
            });
        }
    };
    loader.loadNews(0, 1);
    /*======================================= 动态加载器 ==============================================*/

    /**
     * 图片上传相关操作
     */
    (function(){
        // 上传图片->触发
        $('.j-pop-image').click(function (evt) {
            $('.j-pop-upload').toggleClass("f_hidden");
            //------隐藏动态删除或屏蔽动态------//
            var $dropMenu;
            if (($dropMenu = $(".j-drop-menu:visible")).length) {
                $dropMenu.hide();
            }
            if ($("#facebox")) {
                $("#facebox").remove();
            }
            if(!$videoInsert.is('.f-hide') && !$popVideoInsertFrame.find('input').val()){
                $popVideoInsertFrame.addClass("f-hide");
            }else{
                $('.j-pop-upload').css({'z-index':parseInt($popVideoInsertFrame.css('z-index'))+1});
            }
            recordOperator();
            evt.stopPropagation();
        });
        // 关闭图片弹出层(去除已经选择的图片)
        $('.j-close_upload').click(function (evt) {
            $('.j-pop-upload').addClass("f_hidden");
            uploader.reset();
            $('.j-upload-image-num').text('（最多可上传9张）');
            $('.j-pop-upload').find(".j-img_li").remove();
            $newsInput.data('pictureurl', []);
            $("#j-news-input").focus();
        });

        $('.j-upload-input').hover(function () {
            $addImageTrigger.css('background-position', '0px -655px');
        }, function () {
            $addImageTrigger.css('background-position', '0px -575px');
        });


    }());

    /**
     * 视频上传相关操作
     */
    (function(){
        //动态框下视频->触发
        $('.j-video-upload-trigger').on('click',function(evt){
            $popVideoInsertFrame.toggleClass('f-hide');
            //------隐藏动态删除或屏蔽动态------//
            var $dropMenu;
            if (($dropMenu = $(".j-drop-menu:visible")).length) {
                $dropMenu.hide();
            }
            if($(".j-pop-upload").find(".j-img_li").length<=0){
                $(".j-pop-upload").addClass("f_hidden ");
                // uploader.reset();
            }else{
                $popVideoInsertFrame.css({'z-index':parseInt($('.j-pop-upload').css('z-index'))+1});
            }
            if ($("#facebox")) {
                $("#facebox").remove();
            }
            recordOperator();
            evt.stopPropagation();
        });
        //动态框下视频->关闭
        $popVideoInsertFrame.on('click','.j-close',function(evt){
            if($videoInsert.hasClass('f-hide')){
                $popVideoInsertFrame.addClass('f-hide');
                $videoTitle.addClass('f-hide'),$videoInsert.removeClass('f-hide');
                //清除缓存
                $newsInput.data({videoInfo:null});
            }else{
                $popVideoInsertFrame.addClass('f-hide').find('input').val('');
            }
        });
        //动态框下视频->插入->触发
        $popVideoInsertFrame.on('click','.j-video_insert_confirm',function(evt){
            var videoUrl = $popVideoInsertFrame.find('input').val(),
                $tip = $popVideoInsertFrame.find('.j-tip');
            if($.trim(videoUrl) == ''){
                $tip.text('请输入视频链接').addClass('error');
                setTimeout(function(){
                    $tip.text('目前支持优酷、搜狐、56网等视频播放页网址').removeClass('error');
                },3000);
                return;
            }
            clearTimeout($tip[0].timer);
            Api.video({videoUrl:videoUrl},function(res){
                switch(res.code){
                    case 0:$videoInsert.addClass('f-hide').find('input').val('');
                        $videoTitle.removeClass('f-hide').find('p').text(res.info.title.length>21?res.info.title.slice(0,21)+'...':res.info.title);
                        //缓存视频数据
                        $newsInput.data({videoInfo:res.info});
                        break;
                    case 1002:$tip.text('抱歉，您输入的视频链接暂不支持').addClass('error');
                        break;
                    case 1003:$tip.text('抱歉，您输入的视频链接无法识别').addClass('error');
                        break;
                    default:$tip.text('未知错误').addClass('error');
                }
                if(res.code != 0) {
                    $tip[0].timer = setTimeout(function () {
                        $tip.text('目前支持优酷、搜狐、56网等视频播放页网址').removeClass('error');
                    }, 3000);
                }
            });
        });
        //视频播放->触发
        $newsListDIV.on('click','.j-video-trigger',function(evt){
            var $videoPlayField = $(this).closest(".j-news-module").find(".j-video_play_field");
            var data = $(this).closest(".j-news-module,.j-news_detail-module").data();
            var videoData = {
                videoUrl:$(this).attr('data-url'),
                type:$(this).attr('data-type'),
                title:data.article_title
            };
            var $this = $(this);
            // if(data.source == '视频空间'){
            //     $.ajax({
            //         url:'/dyq/api/getvideodownloadurl',
            //         data:{
            //             videoUrl:$(this).attr('data-url')
            //         },
            //         success:function(res){
            //             if(res.code==0){
            //                 videoData.videoUrl = res.results;
            //                 $.extend(videoData,data);
            //                 $this.closest('.j-video-box').hide();
            //                 $videoPlayField.html(template('template-video-play-field',videoData));
            //             }
            //         }
            //     })
            // }else{
            $.extend(videoData,data);
            $this.closest('.j-video-box').hide();
            $videoPlayField.html(template('template-video-play-field',videoData));
            // }
        });
        //视频播放->收起
        $newsListDIV.on('click','.j-video_close',function(evt){
            var $videoPlayField = $(this).closest('.j-video_play_field'),
                $videoBox = $videoPlayField.siblings('.j-video-box');
            $videoPlayField.html('');
            $videoBox.show();
        });
    }());

    /**
     * 动态发布权限相关操作
     */
    (function(){
        //个人中心->权限选择打开
        $(".j-permission").click(function () {
            $perDownMenu.toggle();
        });
        /**
         * 动态发布权限选择->公开、仅自己可见
         */
        (function(){
            //个人中心->权限选择->公开
            $('.j-open').click(function () {
                shieldFriendList = [], permission = 0;
                $shieldList.html(""), $permission.attr({title: "发布的动态大家可以公开查看"}).find("span").text("公开");
            });
            //个人中心->权限选择->仅自己可见
            $(".j-self").click(function () {
                shieldFriendList = shieldFactionList = [], permission = 1;
                $('.u-downmenu .j-faction-shield').removeClass('z-active');
                $shieldList.html(""), $permission.attr({title: "发表的动态只有自己才能看到"}).find("span").text("仅自己可见");
            });
            //个人中心->权限选择->仅战友可见
            $('.j-friend').click(function(){
                shieldFriendList = [], permission = 4;
                $shieldList.html(""), $permission.attr({title: "发表的动态只有战友才能看到"}).find("span").text("仅战友可见");
            })
        }());
        /**
         * 动态发布权限选择->部分不可见
         */
        (function(){
            //个人中心->权限选择->部分不可见
            $(".j-friend-shield").click(function () {
                permission = 2;
                $permission.attr({title: "发表的动态被选择的战友不能看到"}).find("span").text("部分不可见");
                var _friendShieldListTmpl = template("template-friend-shield-list", {shieldList: shieldFriendList});
                $shieldList.html(_friendShieldListTmpl);
                $.ajax({
                    url     : '/dyq/api/getfriendslist',
                    type    : 'GET',
                    dataType: 'json',
                    data    : {userid: dyq.data.account.id}
                }).done(function (res) {
                    var friendsList = [];
                    for (var key in res.friendsList) {
                        var friend = {};
                        friend.userid = key;
                        friend.headPath = res.friendsList[key].headPath;
                        friend.nick = res.friendsList[key].nick;
                        friend.ispub = res.friendsList[key].ispub;
                        friendsList.push(friend);
                    }
                    var _friendShieldFrameTmpl = template("template-friend-shield-frame", {friendsList: friendsList, shieldList: shieldFriendList});
                    $frameFriendFactionShield.html(_friendShieldFrameTmpl);
                    $frameFriendFactionShield.find(".j-friend-check").each(function (index, ele) {
                        $(ele).data(friendsList[index]);
                    });
                });
            });
            //个人中心->屏蔽战友增加
            $shieldList.on("click", ".j-friend-shield-add", function () {
                $.ajax({
                    url     : '/dyq/api/getfriendslist',
                    type    : 'GET',
                    dataType: 'json',
                    data    : {userid: dyq.data.account.id}
                }).done(function (res) {
                    var friendsList = [];
                    for (var key in res.friendsList) {
                        var friend = {};
                        friend.userid = key;
                        friend.headPath = res.friendsList[key].headPath;
                        friend.nick = res.friendsList[key].nick;
                        friend.ispub = res.friendsList[key].ispub;
                        friendsList.push(friend);
                    }
                    var _friendShieldFrameTmpl = template("template-friend-shield-frame", {friendsList: friendsList, shieldList: shieldFriendList});
                    $frameFriendFactionShield.html(_friendShieldFrameTmpl);
                    $frameFriendFactionShield.find(".j-friend-check").each(function (index, ele) {
                        $(ele).data(friendsList[index]);
                    });
                });
            });
            //个人中心->屏蔽战友删除
            $shieldList.on("click", ".j-friend-shield-delete", function () {
                var _cacheData = $(this).data();
                for (var i = 0; i < shieldFriendList.length; i++) {
                    if (_cacheData.userid === shieldFriendList[i].userid) {
                        shieldFriendList.splice(i, 1);
                        break;
                    }
                }
                $(this).remove();
                $shieldList.find(".j-shield-num").text(shieldFriendList.length);
            });
            //个人中心->战友选择屏蔽
            $frameFriendFactionShield.on("click", ".j-friend-check", function () {
                $(this).toggleClass("z-active");
                var chooseNum = $frameFriendFactionShield.find(".j-friend-check.z-active").length;
                $frameFriendFactionShield.find(".j-choose-num").text(chooseNum);
            });
            $frameFriendFactionShield.on("click", ".j-friend-content", function () {
                $(this).prev().toggleClass("z-active");
                var chooseNum = $frameFriendFactionShield.find(".j-friend-check.z-active").length;
                $frameFriendFactionShield.find(".j-choose-num").text(chooseNum);
            });

            //个人中心->战友选择屏蔽->关闭
            $frameFriendFactionShield.on("click", ".j-friend-shield-close", function () {
                $frameFriendFactionShield.html("");
            });
            //个人中心->战友选择屏蔽->确定
            $frameFriendFactionShield.on("click", ".j-friend-shield-submit", function () {
                var $allChooseFriend = $frameFriendFactionShield.find(".j-friend-check.z-active");
                //if ($allChooseFriend.length <= shieldNumLimit) {
                shieldFriendList = [];
                $allChooseFriend.each(function (index, ele) {
                    shieldFriendList.push($(ele).data());
                });
                $frameFriendFactionShield.html("");
                var _friendShieldListTmpl = template("template-friend-shield-list", {shieldList: shieldFriendList});
                $shieldList.html(_friendShieldListTmpl);
                $shieldList.find(".j-friend-shield-delete").each(function (index, ele) {
                    $(ele).data(shieldFriendList[index]);
                });
                //} else {
                //    ui.modal("超过个数限制，请重新选择");
                //}

            });
            //个人中心->战友搜索
            $frameFriendFactionShield.on("keyup", ".j-search-friend", function () {
                var $this = $(this);
                var _searchStr = $.trim($this.val());
                var $friendList = $(".j-friend-list");
                var postData = {
                    userid   : dyq.data.account.id,
                    searchStr: _searchStr
                };
                Api.searchFriend(postData, function (res) {
                    var $allFriendCheck = $frameFriendFactionShield.find(".j-friend-check");
                    $allFriendCheck.each(function (index, ele) {
                        $(ele).parent("li").hide();
                        for (var key in res.friendsList) {
                            if ($(ele).data().userid == key) {
                                $(ele).parent("li").show();
                                break;
                            }
                        }
                    });
                    var visiLength = $allFriendCheck.parent('li:visible').length;
                    if(visiLength ==0){
                        $frameFriendFactionShield.find('.none-tip').show();
                    }else{
                        $frameFriendFactionShield.find('.none-tip').hide();
                    }
                });
            });
        }());
        /**
         * 动态发布权限选择->同步到帮派
         */
        (function(){
            //个人中心->权限选择->同步到帮派
            $(".j-faction-shield").click(function () {
                if(permission == 1) {
                    ui.fastTips('动态仅自己可见时，无法同步到帮派','faction_tips',2000);
                    return;
                }
                /*$permission.attr({title: "当前动态会同步到帮派社区"}).find("span").text("同步到帮派");
                 var _factionShieldListTmpl = template("template-faction-shield-list", {shieldList: shieldFactionList});
                 $shieldList.html(_factionShieldListTmpl);*/
                $.ajax({
                    url     : '/dyq/api/getfaction',
                    type    : 'GET',
                    dataType: 'json',
                    data    : {userid: dyq.data.account.id}
                }).done(function (res) {
                    var _factionShieldFrameTmpl = template("template-faction-shield-frame", {factionsList: res.factionList, shieldList: shieldFactionList});
                    $frameFriendFactionShield.html(_factionShieldFrameTmpl);
                    $frameFriendFactionShield.find(".j-faction-check").each(function (index, ele) {
                        $(ele).data(res.factionList[index]);
                    });
                });
            });

            //个人中心->同步帮派增加
            $shieldList.on("click", ".j-faction-shield-add", function () {
                $.ajax({
                    url     : '/dyq/api/getfaction',
                    type    : 'GET',
                    dataType: 'json',
                    data    : {userid: dyq.data.account.id}
                }).done(function (res) {
                    var _factionShieldFrameTmpl = template("template-faction-shield-frame", {factionsList: res.factionList, shieldList: shieldFactionList});
                    $frameFriendFactionShield.html(_factionShieldFrameTmpl);
                    $frameFriendFactionShield.find(".j-faction-check").each(function (index, ele) {
                        $(ele).data(res.factionList[index]);
                    });
                });
            });
            //个人中心->同步帮派删除
            $shieldList.on("click", ".j-faction-shield-delete", function () {
                var _cacheData = $(this).data();
                for (var i = 0; i < shieldFactionList.length; i++) {
                    if (_cacheData.userid === shieldFactionList[i].userid) {
                        shieldFactionList.splice(i, 1);
                        break;
                    }
                }
                $(this).remove();
            });
            //个人中心->帮派选择同步
            $frameFriendFactionShield.on("click", ".j-faction-check", function () {
                $(this).toggleClass("z-active");
            });
            $frameFriendFactionShield.on("click", ".j-faction-content", function () {
                $(this).prev().toggleClass("z-active");
            });
            //个人中心->帮派选择同步->关闭
            $frameFriendFactionShield.on("click", ".j-faction-shield-close", function () {
                $frameFriendFactionShield.html("");
            });
            //个人中心->帮派选择同步->确定
            $frameFriendFactionShield.on("click", ".j-faction-shield-submit", function () {
                var $allChooseFaction = $frameFriendFactionShield.find(".j-faction-check.z-active");
                shieldFactionList = [];
                $allChooseFaction.each(function (index, ele) {
                    shieldFactionList.push($(ele).data());
                });
                if(shieldFactionList.length > 0) {
                    $('.u-downmenu .j-faction-shield').addClass('z-active');
                } else {
                    $('.u-downmenu .j-faction-shield').removeClass('z-active');
                }
                $frameFriendFactionShield.html("");
                // $frameFriendFactionShield.html("");
                // var _factionShieldListTmpl = template("template-faction-shield-list", {shieldList: shieldFactionList});
                // $shieldList.html(_factionShieldListTmpl);
                // $shieldList.find(".j-faction-shield-delete").each(function (index, ele) {
                //     $(ele).data(shieldFactionList[index]);
                // });
            });
            template.helper("checkOrNot", function (item, list) {
                for (var i in list) {
                    if (item.userid === list[i].userid) {
                        return true;
                    }
                }
                return false;
            });
            template.helper('checkIfSelect', function(item, list) {
                for(var i in list) {
                    if(item.factionId === list[i].factionId) {
                        return true;
                    }
                }
                return false;
            });
            //权限查看
            $newsListDIV.on("mouseover", ".j-permission-tip", function () {
                var $this = $(this);
                var _cacheData = $this.closest(".j-news-module").data();
                $this[0].tip = setTimeout(function () {
                    Api.permission({newid: _cacheData.new_id}, function (res) {
                        if (res.code == 0) {
                            $this.attr("title", res.introduce)
                        } else {
                            $this.attr("title", "获取权限信息失败");
                        }
                    });
                }, 1000);
            });
            $newsListDIV.on("mouseleave", ".j-permission-tip", function () {
                clearTimeout($(this)[0].tip);
            });
        }());
    }());

    /**
     * 文章相关操作
     */
    var draftTitle = '', draftContent = '',targetModule = '';
    (function(){
        //写文章->打开
        $(".j-article-trigger").on("click", function (evt) {
            if (window.UE) {
                openArtile(evt);
            }else{
                var config = document.createElement('script');
                var all = document.createElement('script');
                var zhCn = document.createElement('script');
                var dyEmotion = document.createElement('script');
                var videoLink = document.createElement('script');
                config.type = all.type = zhCn.type = dyEmotion.type = videoLink.type = 'text/javascript';
                config.charset = all.charset = zhCn.charset = dyEmotion.charset = videoLink.charset = 'utf-8';
                config.src = "/ueditor/ueditor.config.min.js";
                all.src = "/ueditor/ueditor.all.min.js";
                zhCn.src = "/ueditor/lang/zh-cn/zh-cn.min.js";
                dyEmotion.src = "/ueditor/customize/dyEmotion.min.js";
                videoLink.src = "/ueditor/customize/videoLink.min.js";
                document.body.appendChild(config);
                config.onload = function(){
                    document.body.appendChild(all);
                };
                all.onload = function(){
                    document.body.appendChild(zhCn);
                };
                zhCn.onload = function(){
                    document.body.appendChild(dyEmotion);
                };
                dyEmotion.onload = function(){
                    document.body.appendChild(videoLink);
                };
                videoLink.onload = function(){
                    UE.Editor.prototype._bkGetActionUrl = UE.Editor.prototype.getActionUrl;
                    window.initUEditorAction = function (options) {
                        UE.Editor.prototype.getActionUrl = function (action) {
                            if (action == 'uploadimage' && options.uploadimage) {
                                return options.uploadimage;
                            } else if (action == 'catchimage' && options.uploadscrawl) {
                                return options.uploadscrawl;
                            } else {
                                return this._bkGetActionUrl.call(this, action);
                            }
                        };
                    };
                    var config = {
                        uploadimage: '/dyq/api/article/uploadimg',
                        uploadscrawl: '/dyq/api/article/uploadimg'
                    };
                    initUEditorAction(config);
                    window.ue = UE.getEditor('editor');
                    ue.ready(function() {
                        openArtile(evt);
                    });
                    /*setTimeout(function(){
                     openArtile(evt);
                     }, 200);*/
                };
                /*config.addEventListener('load',function(){
                 document.body.appendChild(all);
                 });
                 all.addEventListener('load',function(){
                 document.body.appendChild(zhCn);
                 });
                 zhCn.addEventListener('load',function(){
                 document.body.appendChild(dyEmotion);
                 });
                 dyEmotion.addEventListener('load',function(){
                 document.body.appendChild(videoLink);
                 });
                 dyEmotion.addEventListener('load',function(){
                 UE.Editor.prototype._bkGetActionUrl = UE.Editor.prototype.getActionUrl;
                 window.initUEditorAction = function (options) {
                 UE.Editor.prototype.getActionUrl = function (action) {
                 if (action == 'uploadimage' && options.uploadimage) {
                 return options.uploadimage;
                 } else if (action == 'catchimage' && options.uploadscrawl) {
                 return options.uploadscrawl;
                 } else {
                 return this._bkGetActionUrl.call(this, action);
                 }
                 };
                 };
                 var config = {
                 uploadimage: '/dyq/api/article/uploadimg',
                 uploadscrawl: '/dyq/api/article/uploadimg'
                 };
                 initUEditorAction(config);
                 window.ue = UE.getEditor('editor');
                 openArtile();
                 });*/
            }
        });
        //写文章->关闭
        $frameWriteArticle.on("click", ".j-article_close", function () {
            if(!$frameWriteArticle.find('.j-article_bottom').hasClass('fn_hide')){
                var article_title = $frameWriteArticle.find(".j-article_title").val();
                var article_detail = ue.getContent();
                $(window).off("scroll.ban");
                //判断内容是否有改变
                if (draftTitle == article_title && draftContent == article_detail) {
                    $frameWriteArticle.addClass('fn_hide');
                    ue.execCommand("cleardoc");
                    return false;
                }
                ui.confirm('退出前是否保存本次编辑？', function () {
                    //保存文章
                    $frameWriteArticle.find(".j-save").removeClass('disable').trigger("click");
                }, function () {
                    $frameWriteArticle.addClass('fn_hide');
                    //清空文档
                    ue.execCommand("cleardoc");
                    //清空编辑器视频封面缓存
                    $frameWriteArticle.removeData();
                }, '否', '是');
            }else{
                //修改的时候
                var article_title = $frameWriteArticle.find(".j-article_title").val();
                var article_detail = ue.getContent();
                $(window).off("scroll.ban");
                //判断内容是否有改变
                if (draftTitle == article_title && draftContent == article_detail) {
                    $frameWriteArticle.addClass('fn_hide');
                    return false;
                }
                ui.confirm('确认放弃本次编辑？', function(){
                    $frameWriteArticle.addClass('fn_hide');
                    //清空文档
                    ue.execCommand("cleardoc");
                    //清空编辑器视频封面缓存
                    $frameWriteArticle.removeData();
                },null, '是', '否');
            }

        });
        //写文章->投稿项->触发
        $frameWriteArticle.on("click", ".j-game_choose", function () {
            // $(this).find(".j-game_list").show();
            $(this).find(".j-game_list").toggleClass('f-hide');
        });
        //写文章->投稿项->选择
        $frameWriteArticle.on("click", ".j-game_list li", function (evt) {
            $(this).closest(".j-game_list").toggleClass('f-hide');
            $(this).closest(".j-game_list").siblings('.curr-text').text($(this).text()).attr({'data-game': $(this).attr('data-game')});
            // recordOperator();
            evt.stopPropagation();
        });
        //写文章->发表
        $frameWriteArticle.on("click", ".j-post", function () {
            var root = UE.htmlparser(ue.getContent(), true);
            var imgNodes = root.getNodesByTagName('img');
            var imgs = UE.dom.domUtils.filterNodeList([].slice.call(imgNodes, 0), function (node) {
                return node.getAttr('data-imgType') != "dyFace";
            });
            var picture_url = imgs ? imgs.getAttr('src') : '';
            var videoUrl = root.getNodesByTagName('embed').length ? root.getNodesByTagName('embed')[0].getAttr('src') : '';
            var videoCache = $frameWriteArticle.data();
            var game = $frameWriteArticle.find(".game_choose span").attr('data-game');          //投稿游戏
            var article_type = $frameWriteArticle.find(".type_choose span").attr('data-game');          //投稿游戏
            var postData = {
                content       : ue.getContentTxt().replace(/[\r\n]/g, '').slice(0, 170),
                picture_url   : picture_url,
                source        : "盟友圈",
                permission    : 0,
                article_title : $.trim($frameWriteArticle.find(".j-article_title").val()),
                article_detail: ue.getContent(),
                video_cover   : videoCache["coverImgUrl"] || '',
                // game          : game == 'none' ? '' : game,
                videoPlayerUrl: videoCache["player"] ||'',
                videoLongUrl  : videoCache["longurl"] ||'',
                article_type : article_type
            };
            if (dyq.data.ispub){
                if (game != 'none' && game != '') {
                    postData.gameId = game;
                }
            } else {
                postData.game = game == 'none' ? '' : game;
            }
            if (picture_url == '' && videoUrl == '' && $.trim(postData.article_detail) == '') {
                ui.modal("文章内容不能为空");
                return false;
            }
            $(this).css('pointer-events','none');
            var that = this;
            Api.getAccount({}, function (res) {
                if (res.code === 0) {
                    if(res.info.ispub==1){
                        ui.confirm('确定要发布文章到<span style="color:#23A4ED;">'+res.info.user_nick+'</span><br>游戏主页吗', function () {
                            Api.postArticle(postData, function (res) {
                                $(that).css('pointer-events','');
                                ui.modal(res.message);
                                $(window).off("scroll.ban");
                                if (res.code === 0) {
                                    $frameWriteArticle.addClass('fn_hide');
                                    //清空文档
                                    ue.execCommand("cleardoc");
                                    //清空编辑器视频封面缓存
                                    $frameWriteArticle.removeData();
                                    var oneNews = $.extend(res.extData, {praises: []});
                                    // 获取图片地址数组
                                    oneNews.imagesList = postData.picture_url;
                                    oneNews.hasImage = oneNews.imagesList.length !== 0;
                                    if(article_type != 11){
                                        addOneNews(oneNews);
                                    }
                                    //清空草稿箱
                                    Api.delDraft(function (res) {
                                        if (res.code == 0) {
                                            //清空草稿缓存
                                            draftTitle = draftContent = '';
                                        }
                                    });
                                    //重置投稿项
                                    $frameWriteArticle.find(".game_choose span").text('无').attr({'data-game': 'none'});
                                }
                            });
                        }, function () {
                            $(that).css('pointer-events','');
                        }, '否', '是');
                    }else{
                        Api.postArticle(postData, function (res) {
                            $(that).css('pointer-events','');
                            ui.modal(res.message);
                            $(window).off("scroll.ban");
                            if (res.code === 0) {
                                $frameWriteArticle.addClass('fn_hide');
                                //清空文档
                                ue.execCommand("cleardoc");
                                //清空编辑器视频封面缓存
                                $frameWriteArticle.removeData();
                                var oneNews = $.extend(res.extData, {praises: []});
                                // 获取图片地址数组
                                oneNews.imagesList = postData.picture_url;
                                oneNews.hasImage = oneNews.imagesList.length !== 0;
                                if(article_type != 11){
                                    addOneNews(oneNews);
                                }
                                //清空草稿箱
                                Api.delDraft(function (res) {
                                    if (res.code == 0) {
                                        //清空草稿缓存
                                        draftTitle = draftContent = '';
                                    }
                                });
                                //重置投稿项
                                $frameWriteArticle.find(".game_choose span").text('无').attr({'data-game': 'none'});
                            }
                        });
                    }
                }
            });
        });
        //写文章->保存
        $frameWriteArticle.on("click", ".j-save", function () {
            if($(this).hasClass('disable')){
                return ;
            }
            var root = UE.htmlparser(ue.getContent(), true);
            var imgNodes = root.getNodesByTagName('img');
            var imgs = UE.dom.domUtils.filterNodeList([].slice.call(imgNodes, 0), function (node) {
                return node.getAttr('class') == "uploadimg";
            });
            var picture_url = imgs ? imgs.getAttr('src') : '';
            var videoUrl = root.getNodesByTagName('embed').length ? root.getNodesByTagName('embed')[0].getAttr('src') : '';
            var videoCache = $frameWriteArticle.data();
            var postData = {
                article_title : $frameWriteArticle.find(".j-article_title").val(),
                article_detail: ue.getContent(),
                videoPlayerUrl: videoUrl,
                video_cover   : videoCache[videoUrl]
            };
            /*if(picture_url =='' && videoUrl=='' && $.trim(postData.article_detail) == ''){
             ui.modal("文章内容不能为空");
             return false;
             }*/
            Api.saveDraft(postData, function (res) {
                ui.modal(res.message);
                if (res.code === 0) {
                    $frameWriteArticle.addClass('fn_hide');
                    $(window).off("scroll.ban");
                    ue.execCommand("cleardoc");
                    //缓存草稿
                    draftTitle = postData.article_title, draftContent = postData.article_detail;
                }
            });
        });

        //文章动态->查看全文
        $newsListDIV.on("click", ".j-article_open,.j-article_img,.j-video_img,.j-video_play_btn", function () {
            var _cacheData = $(this).closest(".j-news-module").data();
            var $shortArticle = $(this).closest(".j-article_short");
            var articleHeight = 0;
            //记住当前位置
            $shortArticle.data({scrollTop: $(document).scrollTop()});
            //加载原文
            Api.articleDetail({newid: _cacheData.ori_newid || _cacheData.new_id}, function (res) {
                if (res.code === 0) {
                    $shortArticle.hide().next(".j-article_all").html(res.article.article_detail + '<label class="j-article_close j-article-detail-close" style="cursor:pointer;color:#0095ea;float:right;">收起</label>');
                    //由于html()方法异步，所以这里用两个变量来进行获取，2变量settimeout来获取值，直到与1变量不同得出结果，取正确高度值时，为articleHeight2 || articleHeight
                    /*var $allArticle = $shortArticle.hide().next(".j-article_all");
                     var newsModule = $('.j-article-detail-close').closest('.j-news-module');
                     var moduleIndex = newsModule.index();
                     articleHeight = newsModule.height();
                     var winHeight = $(window).height();
                     var timeout = setTimeout(function(){
                     var articleHeight2 = newsModule.height();
                     if(articleHeight2&&articleHeight2!==articleHeight){
                     clearTimeout(timeout);
                     }
                     var docScrollTop = null;
                     var arcTop = newsModule.offset().top;
                     var elementViewTop = null;
                     $(window).on('scroll.articleScroll'+moduleIndex, function(){
                     dealWithCloseBtn(articleHeight2,winHeight,docScrollTop,arcTop,elementViewTop,newsModule,$allArticle);
                     })
                     },100);*/
                }
            });
        });

        function dealWithCloseBtn(articleHeight2,winHeight,docScrollTop,arcTop,elementViewTop,newsModule,$allArticle){
            docScrollTop = $(document).scrollTop();
            arcTop = newsModule.offset().top;
            elementViewTop = arcTop - docScrollTop;
            if (elementViewTop + articleHeight2 < winHeight){ //当文章底部出现时，隐藏按钮；
                $allArticle.find('.j-article-detail-close').removeClass('j-article-detail-close');
            }else{
                if(elementViewTop + 100 > winHeight){ //文章头部快消失了
                    $allArticle.find('.j-article-detail-close').removeClass('j-article-detail-close');
                }else{
                    if(!$allArticle.hasClass('.j-article-detail-close')){ //文章底部未出现，都显示按钮
                        $allArticle.find('.j-article_close').addClass('j-article-detail-close');
                    }
                }
            }
        }
        //文章动态->收起
        $newsListDIV.on("click", ".j-article_close", function () {
            var $allArticle = $(this).closest(".j-article_all");
            var $shortArticle = $allArticle.prev(".j-article_short");
            var newsModule = $(this).closest('.j-news-module');
            var moduleIndex = newsModule.index();
            $allArticle.html(''), $shortArticle.show();
            $(document).scrollTop($shortArticle.data().scrollTop);
            $(window).off('scroll.articleScroll'+moduleIndex);
        });
        $(document).on("click.article", function (evt) {
            if (!$(evt.target).is(".j-game_choose,.j-game_choose *")) {
                $frameWriteArticle.find(".j-game_list").addClass('f-hide');
            }
        });
        /**
         * 文章标题->输入框提示
         */
        (function(){
            //--------------- 文章标题输入框提示 -----------------//
            $frameWriteArticle.on('focus', '.j-article_title', function (evt) {
                $frameWriteArticle.find(".j-tip5").hide();
            });
            $frameWriteArticle.on('blur', '.j-article_title', function (evt) {
                if ($(this).val() == "") {
                    $frameWriteArticle.find(".j-tip5").show();
                } else {
                    $frameWriteArticle.find(".j-tip5").hide();
                }
            });
            $frameWriteArticle.on('click', '.j-tip5', function (evt) {
                $frameWriteArticle.find(".j-article_title").focus();
            });
            //--------------- 文章标题输入框提示 -----------------//
        }());

        //文章修改相关操作
        //弹窗修改窗口
        $newsListDIV.on('click','.j-edit_news-trigger',function(evt){
            var _that = this;
            if (window.UE) {
                fixArtile(evt, _that);
            }else {
                var config = document.createElement('script');
                var all = document.createElement('script');
                var zhCn = document.createElement('script');
                var dyEmotion = document.createElement('script');
                var videoLink = document.createElement('script');
                config.type = all.type = zhCn.type = dyEmotion.type = videoLink.type = 'text/javascript';
                config.charset = all.charset = zhCn.charset = dyEmotion.charset = videoLink.charset = 'utf-8';
                config.src = "/ueditor/ueditor.config.min.js";
                all.src = "/ueditor/ueditor.all.min.js";
                zhCn.src = "/ueditor/lang/zh-cn/zh-cn.min.js";
                dyEmotion.src = "/ueditor/customize/dyEmotion.min.js";
                videoLink.src = "/ueditor/customize/videoLink.min.js";
                document.body.appendChild(config);
                config.onload = function () {
                    document.body.appendChild(all);
                };
                all.onload = function () {
                    document.body.appendChild(zhCn);
                };
                zhCn.onload = function () {
                    document.body.appendChild(dyEmotion);
                };
                dyEmotion.onload = function () {
                    document.body.appendChild(videoLink);
                };
                videoLink.onload = function () {
                    UE.Editor.prototype._bkGetActionUrl = UE.Editor.prototype.getActionUrl;
                    window.initUEditorAction = function (options) {
                        UE.Editor.prototype.getActionUrl = function (action) {
                            if (action == 'uploadimage' && options.uploadimage) {
                                return options.uploadimage;
                            } else if (action == 'catchimage' && options.uploadscrawl) {
                                return options.uploadscrawl;
                            } else {
                                return this._bkGetActionUrl.call(this, action);
                            }
                        };
                    };
                    var config = {
                        uploadimage: '/dyq/api/article/uploadimg',
                        uploadscrawl: '/dyq/api/article/uploadimg'
                    };
                    initUEditorAction(config);
                    window.ue = UE.getEditor('editor');
                    ue.ready(function() {
                        fixArtile(evt, _that);
                    });
                    // setTimeout(function(){
                    //     fixArtile(evt, _that);
                    // }, 200);
                };
            }
        });
        //弹窗修改窗口
        function fixArtile(evt, _that) {
            $frameWriteArticle.find('.j-article_bottom').addClass('fn_hide');
            $frameWriteArticle.find('.j-fix_bottom').removeClass('fn_hide');

            var $this = $(_that);
            targetModule = $this.closest('.j-news-module');
            var _cacheData = $this.closest('.j-news-module').data() || $this.closest('.j-news_detail-module').data();
            $frameWriteArticle.removeClass('fn_hide');
            ue.ready(function(){
                if (ue.hasContents()) return false;
                //获取文章草稿
                Api.articleDetail({newid:_cacheData.new_id},function (res) {
                    if (res.code == 0) {
                        $frameWriteArticle.data('articleData',_cacheData);
                        $frameWriteArticle.find(".j-article_title").val(draftTitle=res.article.article_title);
                        $frameWriteArticle.find('.j-tip5').hide();
                        ue.setContent(draftContent=res.article.article_detail);
                    }
                });
                var top =$(window).scrollTop();
                $(window).on("scroll.ban",function () {
                    $(window).scrollTop(top);
                });
                ue.addListener('keyup',function(){
                    if(ue.hasContents()){
                        $('.j-save').removeClass('disable');
                    }else{
                        $('.j-save').addClass('disable');
                    }
                });
            });
        }
        //确认修改
        $frameWriteArticle.on("click", ".j-edit", function () {
            var This = this;
            ui.confirm('是否更新已发布的文章？', function () {
                var root = UE.htmlparser(ue.getContent(), true);
                var imgNodes = root.getNodesByTagName('img');
                var imgs = UE.dom.domUtils.filterNodeList([].slice.call(imgNodes, 0), function (node) {
                    return node.getAttr('data-imgType') != "dyFace";
                });
                var _cacheData = $frameWriteArticle.data();
                var picture_url = imgs ? imgs.getAttr('src') : '';
                var videoUrl = root.getNodesByTagName('embed').length ? root.getNodesByTagName('embed')[0].getAttr('src') : '';
                var game = $frameWriteArticle.find(".game_choose span").attr('data-game');          //投稿游戏
                var article_type = $frameWriteArticle.find(".type_choose span").attr('data-game');          //投稿游戏
                var postData = {
                    new_id        : _cacheData['articleData'].new_id,
                    content       : ue.getContentTxt().replace(/[\r\n]/g, '').slice(0, 170),
                    picture_url   : picture_url,
                    source        : "盟友圈",
                    permission    : 0,
                    article_title : $.trim($frameWriteArticle.find(".j-article_title").val()),
                    article_detail: ue.getContent(),
                    video_cover   : _cacheData["coverImgUrl"] || _cacheData['articleData']["coverImgUrl"] || '',
                    game          : game == 'none' ? '' : game,
                    videoPlayerUrl: _cacheData["player"] || _cacheData['articleData']["player"] ||'',
                    videoLongUrl  : _cacheData["longurl"] || _cacheData['articleData']["longurl"] ||'',
                    article_type : 7
                };

                if (picture_url == '' && videoUrl == '' && $.trim(postData.article_detail) == '') {
                    ui.modal("文章内容不能为空");
                    return false;
                }
                $(This).css('pointer-events','none');
                var that = This;
                Api.modifyArticle(postData, function (res) {
                    $(that).css('pointer-events','');

                    $(window).off("scroll.ban");
                    if (res.code === 0) {
                        ui.modal('更新成功');
                        // console.log(res);
                        $frameWriteArticle.addClass('fn_hide');
                        //清空文档
                        ue.execCommand("cleardoc");
                        //清空编辑器视频封面缓存
                        $frameWriteArticle.removeData();
                        var oneNews = $.extend(_cacheData['articleData'],res.article);
                        //获取图片地址数组
                        oneNews.imagesList = postData.picture_url;
                        oneNews.hasImage = oneNews.imagesList.length !== 0;
                        editOneNews(oneNews,targetModule);
                        //清空草稿箱
                        // Api.delDraft(function (res) {
                        //     if (res.code == 0) {
                        //         //清空草稿缓存
                        //         draftTitle = draftContent = '';
                        //     }
                        // });
                        //重置投稿项
                        // $frameWriteArticle.find(".game_choose span").text('无').attr({'data-game': 'none'});
                    }else{
                        ui.modal('更新失败');
                        return
                    }
                });
            }, function () {

            }, '否', '是');


        });

    }());

    function openArtile(evt) {
        $frameWriteArticle.find('.j-article_bottom').removeClass('fn_hide');
        $frameWriteArticle.find('.j-fix_bottom').addClass('fn_hide');
        // recordOperator();
        evt.stopPropagation();
        if(!$videoInsert.is('.f-hide') && !$popVideoInsertFrame.find('input').val()){
            $popVideoInsertFrame.addClass("f-hide");
        }
        //$popVideoInsertFrame.addClass('f-hide');
        //------隐藏动态删除或屏蔽动态------//

        if($(".j-pop-upload").find(".j-img_li").length<=0){
            $(".j-pop-upload").addClass("f_hidden ");
            // uploader.reset();
        }
        if ($("#facebox")) {
            $("#facebox").remove();
        }
        $frameWriteArticle.removeClass('fn_hide');
        ue.ready(function(){
            if (ue.hasContents()){
                $('.j-save').removeClass('disable');
                return false;
            }
            //获取文章草稿
            Api.getDraft(function (res) {
                if (res.code == 0) {
                    $frameWriteArticle.data(res.extData.videoPlayerUrl, res.extData.video_cover);
                    $frameWriteArticle.find(".j-article_title").val(draftTitle = res.extData.article_title);
                    draftTitle && $frameWriteArticle.find('.j-tip5').hide();
                    ue.setContent(draftContent = res.extData.article_detail);
                    if(ue.hasContents()){
                        $('.j-save').removeClass('disable');
                    }else{
                        $('.j-save').addClass('disable');
                    }
                }
                var top =$(window).scrollTop();
                $(window).on("scroll.ban",function () {
                    $(window).scrollTop(top);
                })
            });
            ue.addListener('keyup',function(){
                if(ue.hasContents()){
                    $('.j-save').removeClass('disable');
                }else{
                    $('.j-save').addClass('disable');
                }
            });
        })
    }

    /**
     * 动态发布、评论、分享、点赞等相关操作
     */
    (function() {
        // 个人中心 -> 动态发布
        $('.j-post-news').click(function (evt) {
            if($(this).hasClass('disable')){
                return false;
            }
            // 获取输入框内容
            var content = $newsInput.val().replace(/(^\s*)|(\s*$)/g,'')+' ';
            var pictureurl = $newsInput.data('pictureurl') || [],
                videoInfo = $newsInput.data('videoInfo') || null;
            // 验证为空
            if (content === ' ' && pictureurl.length === 0 && videoInfo === null) {
                $newsInput.emptyInputTips();
                return false;
            }
            //验证字数
            var postNewLength= Number($(this).parent().parent().siblings(".j-words-tip").find(".j-words-count").text());
            if(postNewLength>250){
                ui.modal("动态内容过长，请控制在250字之内");
                return false;
            }
            var nickUserIdMapping = $newsInput.data("nickUserIdMapping");
            if (nickUserIdMapping) {
                for (var i in nickUserIdMapping) {
                    var nick = Object.keys(nickUserIdMapping[i])[0];
                    var userid = nickUserIdMapping[i][nick];
                    content = content.replace(new RegExp(nick+' ', 'g'), userid+' ');
                }
            }

            var postData = {
                "code"      : 0,
                "ownerid"   : dyq.data.account.id,
                "content"   : content == " " ? (pictureurl.length<=0?content="【"+videoInfo.title+"】"+videoInfo.intro:content = "分享图片") : content,
                "pictureurl": pictureurl.join(','),
                "permission": permission,
                "videoTitle": videoInfo && videoInfo.title,
                "videoIntro": videoInfo && videoInfo.intro,
                "videoPlayerUrl": videoInfo && videoInfo.player,
                "videoLongUrl":videoInfo && videoInfo.longurl,
                "video_cover":videoInfo && videoInfo.coverImgUrl
            };

            if (permission === 2) {
                var no_fuid = [];
                for (var i in shieldFriendList) {
                    no_fuid[i] = shieldFriendList[i].userid;
                }
                $.extend(postData, {no_fuid: no_fuid.join(",")});
            }
            var sync_factions = [];
            for (var i in shieldFactionList) {
                sync_factions[i] = shieldFactionList[i].gameId + "_" + shieldFactionList[i].gameServerId + "_" + shieldFactionList[i].factionId;
            }
            if (sync_factions.length > 0) {
                $.extend(postData, {sync_factions: sync_factions.join(",")});
            }
            // uploader.reset();
            // 提交

            Api.getAccount({}, function (res) {
                if (res.code === 0) {
                    if(res.info.ispub == 1){
                        ui.confirm('确定要发布动态到<span style="color:#23A4ED;">'+res.info.user_nick+'</span><br>游戏主页吗', function () {
                            Api.postNews(postData, function (rsp) {
                                shieldFactionList = [];
                                $('.u-downmenu .j-faction-shield').removeClass('z-active');
                                if (rsp.code !== 0) {
                                    ui.modal(rsp.message);
                                    return false;
                                }
                                uploader.reset();
                                var oneNews = rsp.extData;
                                // 获取图片地址数组

                                oneNews.content2 = oneNews.content;
                                oneNews.content = replace_em(oneNews.content);
                                oneNews.pictureurl2 = pictureurl;
                                oneNews.picture_url = rsp.extData.picture_url;
                                oneNews.imagesList = oneNews.picture_url.split(',');
                                oneNews.hasImage = oneNews.imagesList.length !== 0&&oneNews.imagesList[0];
                                oneNews.photoIdArr = oneNews.photoid ? oneNews.photoid.split(',') : null;

                                addOneNews(oneNews, function () {
                                    $newsInput.val('');
                                    $('.j-image_list').find('.j-img_li').remove();
                                    $('.j-pop-upload').addClass("f_hidden ").find('.j-close_upload').trigger('click');
                                    ui.fastTips('发布成功', "index_ml");
                                });
                                // 清除图片、昵称id映射缓存
                                $newsInput.data({'pictureurl': [], 'nickUserIdMapping': []});
                                $('.j-open').trigger("click");
                                //关闭视频上传
                                $popVideoInsertFrame.find('.j-close').trigger('click');
                                //清除localStorage
                                window.localStorage[$.md5(dyq.data.account.id)]="";
                            });
                        }, function () {

                        }, '否', '是');
                    }else{
                        Api.postNews(postData, function (rsp) {
                            shieldFactionList = [];
                            $('.u-downmenu .j-faction-shield').removeClass('z-active');
                            if (rsp.code !== 0) {
                                ui.modal(rsp.message);
                                return false;
                            }
                            uploader.reset();
                            var oneNews = rsp.extData;
                            // 获取图片地址数组

                            oneNews.content2 = oneNews.content;
                            oneNews.content = replace_em(oneNews.content);
                            oneNews.pictureurl2 = pictureurl;
                            oneNews.picture_url = rsp.extData.picture_url;
                            oneNews.imagesList = oneNews.picture_url.split(',');
                            oneNews.hasImage = oneNews.imagesList.length !== 0&&oneNews.imagesList[0];
                            oneNews.photoIdArr = oneNews.photoid ? oneNews.photoid.split(',') : null;

                            addOneNews(oneNews, function () {
                                $newsInput.val('');
                                $('.j-image_list').find('.j-img_li').remove();
                                $('.j-pop-upload').addClass("f_hidden ").find('.j-close_upload').trigger('click');
                                ui.fastTips('发布成功', "index_ml");
                            });
                            // 清除图片、昵称id映射缓存
                            $newsInput.data({'pictureurl': [], 'nickUserIdMapping': []});
                            $('.j-open').trigger("click");
                            //关闭视频上传
                            $popVideoInsertFrame.find('.j-close').trigger('click');
                            //清除localStorage
                            window.localStorage[$.md5(dyq.data.account.id)]="";
                        });
                    }
                }
            });
        });
        //个人中心 -> 更多评论展开
        $newsListDIV.on('click', '.j-expand_more', function () {
            var news=$(this).closest('.j-news-module').data();
            var $flItems = $(this).closest('.j-fl_items'),
                $closeComments = $(this).siblings('.j-close_comments').eq(0);
            var len = $flItems.find('.j-fl_item.fn_hide').length;
            var totallen=news.comment_num-5;
            if($(this).text().indexOf('展开')>-1){
                if (len - 10 <= 0) {
                    $flItems.find('.j-fl_item.fn_hide').removeClass('fn_hide');
                    $(this).addClass('fn_hide');
                } else {
                    $flItems.find('.j-fl_item.fn_hide:gt(' + (len - 11) + ')').removeClass('fn_hide');
                    $(this).text('查看剩余'+(totallen-10)+'条评论 》');
                }
            }else{
                window.open("/zone/personnelcenter/"+news.owner_id+"#"+news.new_id+"#comment");
            }
            $closeComments.removeClass('fn_hide');
        });
        $newsListDIV.on('click', '.j-close_comments', function () {
            var $flItems = $(this).closest('.j-fl_items'),
                $expandMore = $(this).siblings('.j-expand_more').eq(0);
            var len = $flItems.find('.j-fl_item').length;
            $('.j-expand_more').text('展开更多评论 ↓');
            $flItems.find('.j-fl_item:lt(' + (len - 5) + ')').addClass('fn_hide');
            $(this).addClass('fn_hide');
            $expandMore.removeClass('fn_hide');
        });
        //个人中心 -> 屏蔽此人动态
        $newsListDIV.on('click', '.j-hide_user-trigger', function (evt) {
            var $this = $(this);
            var $news = $this.closest('.j-news-module');
            var newsData = $news.data();
            ui.confirmWithTips("确认屏蔽该战友动态吗？",'可在个人设置中解除屏蔽',function(){
                Api.shieldNews({userid: newsData.owner_id}, function (rsp) {
                    if (rsp.code !== 0) {
                        ui.modal('屏蔽失败！请稍候重试。');
                        return false;
                    }
                    ui.fastTips('屏蔽成功', "index_ml");
                    // $news.slideUp(Speed.SLOW, function () {
                    //     loader.loadNews(loader.currentType, 1, true);
                    //     ui.fastTips('已屏蔽', "index_ml");
                    // });
                });
            })
        });

        //个人中心 -> 取消关注
        $newsListDIV.on('click','.j-unfollow-trigger',function(e){
            var news=$(this).closest('.j-news-module').data();
            // recordOperator();
            e.stopPropagation();
            $.ajax({
                url    : '/dyq/api/pubAccount/cancleAttention',
                type   : 'POST',
                data   : {userid: news.owner_id},
                success: function (res) {
                    if (res.code == 0) {
                        // dyq.data.user.isAttention = 0;
                        ui.fastTips(res.message, 'index_ml');
                        setTimeout(function(){
                            location.reload()
                        },1000);
                    } else {
                        ui.fastTips(res.message, 'index_ml');
                    }
                },
                error  : function (err) {
                    ui.fastTips(err, 'pubAccount_top');
                }
            })
        });

        //个人中心 -> 评论框展开
        $newsListDIV.on('focus', '.j-comment-input', function (evt) {
            var $AllOpenCommentFrame = $(".j-comment-frame[data-toggle='open']");
            $AllOpenCommentFrame.each(function () {
                var $commentInput = $(this).find(".j-comment-input");
                if ($commentInput.val() === "") {
                    $commentInput.removeClass("z-active");
                    $(this).attr("data-toggle", "close").find(".j-emotion-at-comment").hide();
                    $commentInput.css({width: "513px"});
                    $(this).find(".j-emotion-trigger,.j-at-trigger").show();
                }
            });
            var $this = $(this);
            var $commentFrame = $this.closest(".j-comment-frame");
            $this.addClass("z-active");
            $commentFrame.attr("data-toggle", "open");
            $commentFrame.find(".j-emotion-trigger,.j-at-trigger").hide();
            $this.css({width: "583px"});
            $commentFrame.find(".j-emotion-at-comment").show();

        });
        //个人中心 -> 评论框收起
        $(document).on('click', function (evt) {
            var $commentFrame = $(".j-comment-frame[data-toggle='open']");
            $commentFrame.each(function () {
                var $commentInput = $(this).find(".j-comment-input");
                if ($commentInput.val() == "" && !$(evt.target).is(".j-comment-frame[data-toggle='open'],.j-comment-frame[data-toggle='open'] *")) {
                    $commentInput.removeClass("z-active");
                    $(this).attr("data-toggle", "close").find(".j-emotion-at-comment").hide();
                    $commentInput.css({width: "513px"});
                    $(this).find(".j-emotion-trigger,.j-at-trigger").show();
                }
            });

            var $replyFrame = $(".j-reply-frame[data-toggle='open']");
            $replyFrame.each(function () {
                var $replyInput = $(this).find(".j-reply-input");
                if ($replyInput.val() == "" && !$(evt.target).is(".j-reply-frame,.j-reply-frame *,.j-reply-toggle,.j-reply-toggle *")) {
                    $(this).attr("data-toggle", "close").hide();
                    clearInterval($(this).timer);
                    if ($(this).closest(".j-news-module").find(".j-reply-frame[data-toggle='open']").length <= 0) {
                        $(this).closest(".j-news-module").find(".j-comment-frame").show();
                    }
                }
            });

        });
        //个人中心 -> 评论框表情触发
        $newsListDIV.on('click', '.j-emotion-trigger', function (evt) {
            var $commentFrame = $(".j-comment-frame[data-toggle='open']");
            $commentFrame.each(function () {
                var $commentInput = $(this).find(".j-comment-input");
                if ($commentInput.val() == "") {
                    $commentInput.removeClass("z-active");
                    $(this).attr("data-toggle", "close").find(".j-emotion-at-comment").hide();
                    $commentInput.css({width: "513px"});
                    $(this).find(".j-emotion-trigger,.j-at-trigger").show();
                }
            });
            var $this = $(this);
            var $commentFrame = $this.closest(".j-comment-frame");
            var $commentInput = $commentFrame.find(".j-comment-input");
            $commentInput.addClass("z-active");
            $commentFrame.attr("data-toggle", "open");
            $commentFrame.find(".j-emotion-trigger,.j-at-trigger").hide();
            $commentInput.css({width: "583px"});
            $commentFrame.find(".j-emotion-at-comment").show();
            $commentFrame.find(".j-comment_emotion").trigger("click");
            // recordOperator();
            evt.stopPropagation();
        });
        //个人中心 -> 评论框AT触发
        $newsListDIV.on('click', '.j-at-trigger', function () {
            var $commentFrame = $(".j-comment-frame[data-toggle='open']");
            $commentFrame.each(function () {
                var $commentInput = $(this).find(".j-comment-input");
                if ($commentInput.val() == "") {
                    $commentInput.removeClass("z-active");
                    $(this).attr("data-toggle", "close").find(".j-emotion-at-comment").hide();
                    $commentInput.css({width: "513px"});
                    $(this).find(".j-emotion-trigger,.j-at-trigger").show();
                }
            });
            var $this = $(this);
            var $commentFrame = $this.closest(".j-comment-frame");
            $commentFrame.find(".j-comment-input").click();
            $commentFrame.find(".j-comment-at-trigger").trigger("click");
        });

        //photoShow删除动态
        $framePhotoShow.on('click','.j-show-del-photo-trigger',function(e){
            var $this = $(this);
            var newid = $this.attr('data-newid');
            var modules=$newsListDIV.find('.j-news-module');
            var data=[];
            for(var i=0,len=modules.length;i<len;i++){
                // data.push(modules.data());
                if(modules.eq(i).data().new_id==newid){
                    modules.eq(i).find('.j-del_news-trigger').trigger('click');
                }
            }

        });

        // 个人中心 -> 删除（动态）
        $newsListDIV.on('click', '.j-del_news-trigger', function (evt) {
            var $this = $(this);
            var $news = $this.closest('.j-news-module');
            var newsData = $news.data();
            ui.confirm('要删除这条动态吗？', function () {
                Api.delNews({newid: newsData.new_id}, function (rsp) {
                    if (rsp.code !== 0) {
                        ui.fastTips('删除失败', "index_ml");
                        return false;
                    }
                    $news.slideUp(Speed.SLOW, function () {
                        /* loader.loadNews(loader.currentType, 1, false);*/
                        $news.remove();
                        $framePhotoShow.html("");
                        if ($newsListDIV.find(".j-news-module").length <= 0) {
                            $newsListDIV.html('<div class="g-box1 g-mb10 s-radius3 j-nothing"><p style="text-align:center;padding: 100px 0 500px 0;font-family: microsoft yahei;">您暂无战友动态，发条动态抢沙发吧</p></div>');
                        }
                        ui.fastTips('删除成功', "index_ml");
                    });
                });
            });
        });
        // 个人中心 -> 删除（评论）
        $newsListDIV.on('click', '.j-del_comment-trigger', function (evt) {
            var $this = $(this);
            var _cid = parseInt($this.attr('data-commentid'));
            var _nid = parseInt($this.attr('data-newid'));
            var _pid = parseInt($this.attr('data-pid'));
            ui.confirm('是否删除评论？', function () {
                Api.delComment({commentid: _cid, newid: _nid, p_id: _pid}, function (rsp) {
                    if (rsp.code !== 0) {
                        ui.fastTips('删除失败', "index_ml");
                        return false;
                    }
                    var $sl = $this.closest('.j-sl_item');
                    var $news = $this.closest('.j-news-module');
                    var newsData = $news.data();
                    if ($sl.length === 0) {
                        // 更新评论数
                        var $commentToggle = $news.find('.j-comment-toggle');
                        updateCommentNumber.apply($commentToggle, [newsData.comment_num - 1]);
                        newsData.comment_num -= 1;
                        $sl = $this.closest('.j-fl_item');
                    }
                    $sl.remove();
                    var position = [];
                    for (var i = 0; i < newsData.comments.length; i++) {
                        if (newsData.comments[i].comment_id == _cid || newsData.comments[i].parentid == _cid) {
                            position.push(i);
                        }
                    }
                    for (var i in position) {
                        newsData.comments.splice(position[i], 1);
                    }
                    ui.fastTips('删除成功', "index_ml");
                });
            });
        });
        // 个人中心 -> 评论（触发）
        $newsListDIV.on('click', '.j-comment-toggle', function (evt) {
            var $this = $(this);
            var $news = $this.closest('.j-news-module');
            $news.find(".j-comment-input").focus();
            // recordOperator();
            evt.stopPropagation();
        });



        // 个人中心 -> 评论
        $newsListDIV.on('click', '.j-comment-submit', function (evt) {
            var $this = $(this);
            var $commentList = $this.closest('.j-comment-list');
            // 获取
            var $input = $commentList.find('.j-comment-input');
            var content =$input.val().replace(/(^\s*)|(\s*$)/g,'') + ' ';
            // 验证优先
            if (content === ' ') {
                $input.emptyInputTips();
                return false;
            }
            //验证字数
            var postNewLength= Number($this.siblings(".j-words-tip").find(".j-words-count").text());
            if(postNewLength>250){
                ui.modal("评论内容过长，请控制在250字之内");
                return false;
            }
            // 当前动态的缓存
            var $news = $this.closest(".j-news-module");
            var newsData = $news.data();
            var nickUserIdMapping = $input.data("nickUserIdMapping");
            if (nickUserIdMapping) {
                for (var i in nickUserIdMapping) {
                    var nick = Object.keys(nickUserIdMapping[i])[0];
                    var userid = nickUserIdMapping[i][nick];
                    content = content.replace(new RegExp(nick+' ', 'g'), userid+' ');
                }
            }
            var postData = {
                "ownerid"       : newsData.owner_id,
                "newid"         : newsData.new_id,
                "bcommentuserid": newsData.owner_id,
                "content"       : content,
                "parentid"      : 0,
                "commentself"   : newsData.owner_id == dyq.data.account.id ? 1 : 0,
                "permission"    : newsData.permission
            };

            if($this.hasClass('disabled')){
                ui.modal('操作过于频繁，请稍后再试！');
                return false;
            }
            $this.addClass('disabled');//防止多次点击

            // Ajax
            Api.postComment(postData, function (rsp) {
                $this.removeClass('disabled');
                switch (rsp.code) {
                    case 0:
                        break;
                    default:
                        ui.modal(rsp.message);
                        return false;
                }
                var oneComment = {
                    "comment_id"       : rsp.extData.comment_id,
                    "new_id"           : postData.newid,
                    "comment_userid"   : dyq.data.account.id,
                    "comment_nick"     : dyq.data.account.nick,
                    "bcomment_userid"  : postData.bcommentuserid,
                    "bcomment_nick"    : newsData.nick, // （使用jQuery缓存）
                    "content"          : replace_em(rsp.extData.content),
                    "p_id"             : postData.parentid,
                    "comment_time"     : ServerTimer.add(dyq.data.serverTime).getTime(),
                    "comment_headPath" : dyq.data.account.avatar,
                    "bcomment_headPath": newsData.headPath // （使用jQuery缓存）
                };
                // $this.closest('.j-news-module').data().firstLevelComments.push(oneComment);
                var $comment = $(template('template-first-level-comment', {commentList: [oneComment]})).css('display', 'none');
                $commentList.find('.j-fl_items').append($comment);
                $comment.slideDown(Speed.NORMAL);

                // 更新评论数
                var $number = $news.find('.j-comment-toggle');
                updateCommentNumber.apply($number, [newsData.comment_num + 1]);
                // 更新缓存
                newsData.comment_num = newsData.comment_num + 1;
                newsData.comments.push($.extend({}, oneComment, {content: rsp.commentcontent, parentid: postData.parentid}));
                $news.data(newsData);
                // 添加到评论列表缓存
                $comment.data(oneComment);
                // 初始化回复框AT
                initializeAt.apply($comment.find('.j-reply-input'), [0, 10]);
                //回复框初始化
                $comment.find(".j-reply_emotion").qqFace({
                    id      : 'facebox',
                    assign_P: 'j-reply-frame',
                    assign_C: 'j-reply-input',
                    path    : '/img/emotion/'	//表情存放的路径
                });
                // 清空
                $input.val('');
                // ui.fastTips('评论成功', "index_ml");
                $(document).trigger('click');
                $(".j-comment-input").blur();
            });
        });

        // 个人中心 -> 回复（触发）
        $newsListDIV.on('click', '.j-reply-toggle', function (evt) {
            var $this = $(this);
            var $firstLevelItem = $this.closest('.j-fl_item');
            var $AllOpenReplyFrame = $(".j-reply-frame[data-toggle='open']").not($firstLevelItem.find('.j-reply-frame')[0]);
            $AllOpenReplyFrame.each(function () {
                if ($(this).find(".j-reply-input").val() === "") {
                    $(this).attr("data-toggle", "close").hide();
                    $(this).closest(".j-news-module").find(".j-comment-frame").show();
                }
            });

            var postData = {
                newid         : $this.attr("data-newid"),
                bcommentuserid: $this.attr("data-ownerid"),
                pid           : $this.attr("data-commentid"),
                parentid      : $this.attr("data-parentid"),
                commentself   : $this.attr("data-ownerid") == dyq.data.account.id ? 1 : 0,
                bcomment_nick : $this.attr("data-nick")
            };

            if ($firstLevelItem.find('.j-reply-frame').attr("data-toggle") != "open") {
                $firstLevelItem.find('.j-reply-frame').data(postData).attr("data-toggle", "open").slideDown(Speed.NORMAL);
            }

            $firstLevelItem.find(".j-tip3").text("回复" + postData.bcomment_nick + ":").show();
            $firstLevelItem.find('.j-reply-input').focus();
            $this.closest(".j-news-module").find(".j-comment-frame").hide();
            var $replyInput = $firstLevelItem.find('.j-reply-input');
            $firstLevelItem.find('.j-reply-frame').timer = setInterval(function () {
                if ($replyInput.val() != "") {
                    $replyInput.closest(".j-reply-frame").find(".j-tip3").hide();
                } else {
                    $replyInput.closest(".j-reply-frame").find(".j-tip3").show();
                }
            }, 10);
        });
        // 个人中心 -> 回复（触发） -> 回复
        $newsListDIV.on('click', '.j-reply_comment-submit', function (evt) {
            var $this = $(this);
            // 获取
            var $new = $this.closest(".j-news-module");
            var $replyFrame = $this.closest('.j-reply-frame');
            var $input = $replyFrame.find('.j-reply-input');
            var content = $input.val().replace(/(^\s*)|(\s*$)/g,'') + ' ';
            var nickUserIdMapping = $input.data("nickUserIdMapping");
            if (nickUserIdMapping) {
                for (var i in nickUserIdMapping) {
                    var nick = Object.keys(nickUserIdMapping[i])[0];
                    var userid = nickUserIdMapping[i][nick];
                    content = content.replace(new RegExp(nick+' ', 'g'), userid+' ');
                }
            }

            // 验证优先
            if (content === ' ') {
                $input.emptyInputTips();
                return false;
            }
            //验证字数
            var postNewLength= Number($(this).parent().siblings(".j-words-tip").find(".j-words-count").text());
            if(postNewLength>250){
                ui.modal("评论内容过长，请控制在250字之内");
                return false;
            }


            // 获取动态的缓存
            var newData = $new.data();
            var commentData = $replyFrame.data();

            var postData = $.extend(commentData, {content: content, ownerid: newData.owner_id, permission: newData.permission});

            if($this.hasClass('disabled')){
                ui.modal('操作过于频繁，请稍后再试！');
                return false;
            }
            $this.addClass('disabled');//防止多次点击

            // Ajax
            Api.postComment(postData, function (rsp) {
                $this.removeClass('disabled');
                switch (rsp.code) {
                    case 0:
                        break;
                    default:
                        ui.modal(rsp.message);
                        return false;
                }
                // 先收起回复框
                $replyFrame.attr({"data-toggle": "close"}).hide();
                $this.closest(".j-news-module").find(".j-comment-frame").show();
                var oneComment = {
                    "comment_id"      : rsp.extData.comment_id,
                    "new_id"          : postData.newid,
                    "comment_userid"  : dyq.data.account.id,
                    "comment_nick"    : dyq.data.account.nick,
                    "bcomment_userid" : postData.bcommentuserid,
                    "bcomment_nick"   : commentData.bcomment_nick,
                    "content"         : replace_em(rsp.extData.content),
                    "p_id"            : postData.pid,
                    "parentid"        : postData.parentid,
                    "comment_time"    : ServerTimer.add(dyq.data.serverTime).getTime(),
                    "comment_headPath": dyq.data.account.avatar,
                    "permission"      : newData.permission
                    /*      "bcomment_headPath": commentData.comment_headPath*/
                };
                var $comment = $(template('template-second-level-comment', {commentList: [oneComment]})).filter('.j-sl_item').css('display', 'none');
                // 添加到评论列表缓存
                $this.closest('.j-fl_item').find(".j-sl_items").append($comment);
                $comment.slideDown(Speed.NORMAL).data(oneComment);

                /* // 更新评论数
                 var $number = $new.find('.j-comment-toggle');
                 updateCommentNumber.apply($number, [newData.comment_num + 1]);
                 // 更新缓存
                 newData.comment_num = newData.comment_num + 1;*/

                //更新缓存
                newData.comments.push($.extend({}, oneComment, {content: rsp.commentcontent}));
                // 初始化回复框AT
                $comment.find('.j-reply-input').nameComplete({
                    source: '/dyq/api/autocomplete?search='
                });
                // 清空
                $input.val('');
                // ui.fastTips('评论成功', "index_ml");
            });
        });

        $forwardFrame.on('click', '.j-forward_confirm', function (evt) {
            var $this = $(this);
            var $forwardFrame = $this.closest(".j-forward_frame");
            var content = $forwardFrame.find(".j-forward_textarea").val().replace(/(^\s*)|(\s*$)/g,'')+ ' ' || "分享";
            var nickUserIdMapping = $forwardFrame.find(".j-forward_textarea").data("nickUserIdMapping");
            if (nickUserIdMapping) {
                for (var i in nickUserIdMapping) {
                    var nick = Object.keys(nickUserIdMapping[i])[0];
                    var userid = nickUserIdMapping[i][nick];
                    content = content.replace(new RegExp(nick+' ', 'g'), userid+' ');
                }
            }
            var newsData = $forwardFrame.data("newsData");

            if(newsData.type==14){
                content += '//@'+newsData.owner_id+' : '+ newsData.content;
            }
            var postData = $.extend($forwardFrame.data("getData"), {content: content});
            $(window).off('scroll.forwardBan');
            if(location.href.indexOf('single')>-1){
                Api.postForward = Api.get('/dyq/api/shareVideo', 'POST'); // 分享动态
                postData.Encrypt = 1;
                postData.video_id = newsData.video_id,
                    postData.type = newsData.video_id ? 3 : '',
                    postData.userid = newsData.user_id,
                    postData.videoPlayerUrl = newsData.videourl,
                    postData.video_cover = newsData.video_image,
                    postData.title = newsData.video_name,
                    postData.introduce = newsData.description
            }
            if($this.hasClass('disabled')){
                ui.modal('操作过于频繁，请稍后再试！');
                return false;
            }
            $this.addClass('disabled');//防止多次点击
            Api.postForward(postData, function (rsp) {
                $this.removeClass('disabled');
                if (rsp.code !== 0) {
                    ui.modal(rsp.message);
                    return false;
                }
                $forwardFrame.html("").addClass('fn_hide');
                window.forwardList = [];//重置
                // 更新分享数
                if (!loader.oneNew) {
                    var $number = $(".j-forward-toggle[data-state='open']").attr("data-state", 'close');
                } else {
                    var $number = $(".j-forward-toggle");
                }
                updateForwardNumber.apply($number, [newsData.forward_num + 1]);
                // 更新缓存
                newsData.forward_num = newsData.forward_num + 1;
                $number.closest(".j-news-module").data(newsData);
                // if (loader.oneNew) {
                //     var forwardData = {
                //         content  : replace_em(rsp.extData.content),
                //         content2 : rsp.extData.content,
                //         new_id   : rsp.extData.new_id,
                //         headPath : dyq.data.account.avatar,
                //         nick     : dyq.data.account.nick,
                //         owner_id : dyq.data.account.id,
                //         post_time: ServerTimer.add(dyq.data.serverTime).getTime()
                //     };
                //     var _html = template('template-forward-list', {forwardList: [forwardData]});
                //     var $forwardItem = $(_html).filter('.j-forward-item').data(forwardData).css('display', 'none');
                //     $newsListDIV.find('.j-forward-list').prepend($forwardItem);
                //     $forwardItem.slideDown(Speed.NORMAL);
                //     ui.fastTips('分享成功', "home_ml");
                // } else {
                // 直接显示动态
                var oneNews = rsp.extData;
                // 获取图片地址数组
                oneNews.imagesList = [];
                oneNews.hasImage = false; // 分享不带图片
                var images = new RegExp("[^,\\s]+", "g");
                if (oneNews.ori_pictureurl) { // 分享的原始动态可能带图片
                    oneNews.imagesList_original = oneNews.ori_pictureurl.match(images) || [];
                } else {
                    oneNews.imagesList_original = [];
                }
                oneNews.hasImage_original = oneNews.imagesList_original.length !== 0;
                oneNews.content2 = oneNews.content;
                oneNews.content = replace_em(oneNews.content);
                addOneNews(oneNews, function () {
                    ui.fastTips('分享成功', "home_ml");
                });
                // }

            });
        });

        //个人中心 -> 原动态 ->点赞
        $newsListDIV.on('click', '.j-praise', function (evt) {
            var $this = $(this);
            //悬浮提示的标志
            $this[0].state = "open";
            // 读取缓存判断是否点过赞
            var $news = $this.closest('.j-news-module');
            var newsData = $news.data();
            var postData = {
                newid        : newsData.ori_newid,
                bpraiseuserid: newsData.ori_ownerid, // 被赞人
                praiseself   : newsData.ori_ownerid === dyq.data.account.id ? 1 : 0 // 判断是否为自己的动态
            };
            if($this.hasClass('disabled')){
                ui.modal('操作过于频繁，请稍后再试！');
                return false;
            }
            $this.addClass('disabled');//防止多次点击
            if ($this[0].praise != "praising") {
                $this[0].praise = "praising";
                Api.like(postData, function (rsp) {
                    $this.removeClass('disabled');
                    if (rsp.code !== 0) {
                        ui.modal(rsp.message);
                        $this[0].praise = "praised";
                        return false;
                    } else {
                        $this[0].praise = "praised";
                    }

                    if (newsData.ori_ispraise) {
                        newsData.ori_ispraise = 0;
                        newsData.ori_priasenum -= 1;
                        $this.removeClass('z-active');
                        // ui.fastTips('已取消赞', "index_ml");
                    } else {
                        newsData.ori_ispraise = 1;
                        newsData.ori_priasenum += 1;
                        $this.addClass('z-active');
                        // ui.fastTips('点赞成功', "index_ml");
                    }
                    updateLikeNumber_2.apply($this, [newsData.ori_priasenum]);
                    Api.getPraisePerson({newid: postData.newid}, function (rsp) {
                        if (!rsp.code) {
                            var $popTip = $this.siblings(".j-poptip");
                            var $popTipTmpl = template("template-pop-tip", rsp);
                            $popTip.html($popTipTmpl);
                            $popTip.css({"left": 484 - Math.round($popTip.width() / 2) + "px"});
                            if (rsp.praiseList.length > 0) {
                                if (!$popTip.is(":visible")) {
                                    $this[0].sto = setTimeout(function () {
                                        if ($this[0].state !== "close") {
                                            $popTip.stop().show().animate({"margin-top": "-78px"}, 200);
                                        }
                                        clearTimeout($this[0].sto);
                                    }, 1000);
                                }
                            } else {
                                $this[0].state = "close";
                                clearTimeout($this[0].sto);
                                $popTip.stop().hide().css({"margin-top": "-108px"});
                            }
                        }
                    });
                });
            }

        });
        //个人中心 -> 人物列表点赞
        $newsListDIV.on('click', '.j-like-trigger2', function (evt) {
            $(this).closest(".j-news-module").find(".j-like-trigger").trigger("click");
        });
        // 个人中心 -> 点赞
        $newsListDIV.on('click', '.j-like-trigger', function (evt) {
            var $this = $(this);
            //悬浮提示的标志
            $this[0].state = "open";
            // 读取缓存判断是否点过赞
            var $news = $this.closest('.j-news-module');
            var newsData = $news.data();
            var _cachePraiseUserListData = $news.find(".j-good_user").data("praises");

            var postData = {
                newid        : newsData.new_id,
                bpraiseuserid: newsData.owner_id, // 被赞人
                praiseself   : newsData.owner_id === dyq.data.account.id ? 1 : 0 // 判断是否为自己的动态
            };

            if($this.hasClass('disabled')){
                ui.modal('操作过于频繁，请稍后再试！');
                return false;
            }
            $this.addClass('disabled');//防止多次点击

            if ($this[0].praise != "praising") {
                $this[0].praise = "praising";
                Api.like(postData, function (rsp) {
                    $this.removeClass('disabled');
                    if (rsp.code !== 0) {
                        ui.modal(rsp.message);
                        $this[0].praise = "praised";
                        return false;
                    } else {
                        $this[0].praise = "praised";
                    }
                    var position = 0;
                    if (_cachePraiseUserListData.ispraise) {
                        for (var i = 0; i < _cachePraiseUserListData.praiseList.length; i++) {
                            if (_cachePraiseUserListData.praiseList[i].userid === dyq.data.account.id) {
                                position = i;
                                break;
                            }
                        }
                        _cachePraiseUserListData.praiseList.splice(i, 1);
                        _cachePraiseUserListData.ispraise = 0;
                        newsData.ispraise = 0;
                        newsData.praise_num -= 1;
                        $this.removeClass('z-active');
                        // ui.fastTips('已取消赞', "index_ml");
                    } else {
                        _cachePraiseUserListData.praiseList.unshift({
                            "userid"  : dyq.data.account.id,
                            "nick"    : dyq.data.account.nick,
                            "headPath": dyq.data.account.avatar
                        });
                        _cachePraiseUserListData.ispraise = 1;
                        newsData.ispraise = 1;
                        newsData.praise_num += 1;
                        $this.addClass('z-active');
                        // ui.fastTips('点赞成功', "index_ml");
                    }
                    updateLikeNumber.apply($this, [newsData.praise_num]);
                    var $praiseUserListTmpl = template("template-gooduser-list", $.extend({new_id: newsData.new_id, owner_id: newsData.owner_id}, _cachePraiseUserListData));
                    $news.find(".j-good_user").html($praiseUserListTmpl).data("praises", _cachePraiseUserListData);
                });
            }
        });
        /**
         * 个人中心动态->评论、回复框提示
         */
        (function(){
            //--------------- 回复框提示 -----------------//
            $newsListDIV.on('click', '.j-tip3', function (evt) {
                $(this).closest(".j-reply-frame").find(".j-reply-input").focus();
            });
            //--------------- 回复框提示 -----------------//

            //--------------- 评论框提示 -----------------//
            $newsListDIV.on('focus', '.j-comment-input', function (evt) {
                $(this).closest(".j-comment-frame").find(".j-tip4").hide();
            });
            $newsListDIV.on('blur', '.j-comment-input', function (evt) {
                if ($(this).val() == "") {
                    $(this).closest(".j-comment-frame").find(".j-tip4").show();
                } else {
                    $(this).closest(".j-comment-frame").find(".j-tip4").hide();
                }
            });
            $newsListDIV.on('click', '.j-tip4', function (evt) {
                $(this).closest(".j-comment-frame").find(".j-comment-input").focus();
            });
            //--------------- 评论框提示 -----------------//
        }());
    }());

    /*======================================动态->图片展示=========================================*/
    /**
     * 动态->图片展示
     */
    (function(){
        // 点击"AT战友"触发AT功能（图片展示的动态评论框下）
        $framePhotoShow.on('click', '.j-comment-at-trigger', function () {
            var $commentInput = $(this).closest(".j-new-comment").find(".j-new-comment-input");
            $commentInput.focus();
            var pos = $commentInput.caret('pos');
            var _val = $commentInput.val();
            $commentInput.val(_val.slice(0, pos) + "@" + _val.slice(pos));
            $commentInput.caret('pos', pos + 1);
        });

        // 点击"AT战友"触发AT功能（图片展示的评论回复框下）
        $framePhotoShow.on('click', '.j-reply-at-trigger', function () {
            var $replyInput = $(this).closest(".j-new-reply").find(".j-new-reply-input");
            $replyInput.focus();
            var pos = $replyInput.caret('pos');
            var _val = $replyInput.val();
            $replyInput.val(_val.slice(0, pos) + "@" + _val.slice(pos));
            $replyInput.caret('pos', pos + 1);
        });
        var comboxPraise = '';
        var picShow = function () {
            var $new = $(this).closest(".j-news-module");
            var isDetail = location.hash.split('#')[1]?true:false;
            comboxPraise = isDetail?$(this).closest('.j-news_detail-module').find('.j-like-trigger'):$(this).closest('.j-news-module').find('.j-like-trigger');
            var _cacheNewData = $new.data();
            /*var minSrc = $(this).attr("src");
             var tmpsrc = minSrc;
             var lastIndex = minSrc.lastIndexOf('/');
             tmpsrc=minSrc.slice(0,lastIndex+1)+'b_'+minSrc.slice(lastIndex+1,minSrc.length);*/
            _cacheNewData.currentPhoto = {
                min: $(this).attr("src"),
                max: $(this).attr("src").replace("b_", ""),
                ismy     : dyq.data.account.id == _cacheNewData.owner_id ? true : false,
                photoid  : $(this).data('photo-id'),
                isdelete : $(this).attr("src").indexOf('pic-delete')>-1 ? true : false,
                photoIndex:$(this).closest('li').index()
            };
            _cacheNewData.isDetail = isDetail;
            /*if(/\b.gif\b/i.addHeadPathPrefix(minSrc)){
             _cacheNewData.currentPhoto.min=$(this).attr("src");
             }*/
            //模版判断是否为游戏主页显示举报按钮
            if(_cacheNewData.ispub!=undefined){
                _cacheNewData.currentPhoto.ispub=_cacheNewData.ispub;
            }else if(dyq.data.ispub!=undefined){
                _cacheNewData.currentPhoto.ispub=dyq.data.ispub;
            }else{
                _cacheNewData.currentPhoto.ispub=0;
            }
            var $photoShowTmpl = template("template-photo-show", _cacheNewData);
            $framePhotoShow.html($photoShowTmpl).find(".m-pop_photo").addClass("zoomIn");

            var $allImageItem = $framePhotoShow.find(".j-image-item");                          //所有小图片
            var _imgItemWidth = $allImageItem.eq(0).outerWidth();                                  //小图片宽度
            $framePhotoShow.find(".j-images-list").width($allImageItem.length * _imgItemWidth);

            window.photoListSlided = false;
            $(window).trigger("resize.albumDetailFrame");

            replaceErrorImage($framePhotoShow);
            imageAdjust({images: $framePhotoShow.find(".j-image-item img"), size: {width: 48, height: 48}});
            imageAdjust({images: $framePhotoShow.find('.j-comment-pic'),size:{width:80,height:80}});
            bigImageStyle({images:$(".j-bigImg_show")});

            //打开相片详情时下面的图片位置调整(如果没有调整)
            if (!window.photoListSlided) {
                setTimeout(window.photoPosAdjust, 500);
            }
            $framePhotoShow.find(".j-current-new-detail").data("newInfo", _cacheNewData);
            var praises = {
                ispraise      : _cacheNewData.ispraise,
                praiseUserList: _cacheNewData.praises
            };
            $framePhotoShow.find(".j-good_user").data("praises", praises);
            // AT初始化
            initializeAt.apply($framePhotoShow.find('.j-new-comment-input'), [0, 10]);
            $framePhotoShow.find('.j-new-reply-input').each(function () {
                initializeAt.apply($(this), [0, 10]);
            });
            // 评论框上的表情初始化
            $framePhotoShow.find(".j-comment_emotion").qqFace({
                id        : 'facebox',
                assign_P  : 'j-new-comment',
                assign_C  : 'j-new-comment-input',
                path      : '/img/emotion/',	//表情存放的路径
                margin_top: -290,
                horn      : false,
                close     : true
            });
            // 回复框上的表情初始化
            var $replyEmotion = $framePhotoShow.find(".j-reply_emotion");
            if ($replyEmotion.length > 0) {
                $replyEmotion.qqFace({
                    id      : 'facebox',
                    assign_P: 'j-new-reply',
                    assign_C: 'j-new-reply-input',
                    path    : '/img/emotion/',	//表情存放的路径
                    rowEmotions:6,
                    colEmotions:6,
                    pageSize:4,
                    smallWindow:true
                });
            }
            var top = $(window).scrollTop();
            $(window).on('scroll.ban',function(){
                $(this).scrollTop(top);
            });
        };
        $newsListDIV.on('click', ".j-image-trigger", picShow);
        //列表里点评论的头像
        $newsListDIV.on('click','.j-comment-pic',function(){
            var index = $(this).attr('data-picIndex');
            $(this).closest('.j-news-module').find('.j-image-trigger').eq(index).trigger('click');
        });


        //按esc关闭图片窗口
        $(document).on('keydown',function(e){
            if(e.keyCode===27){
                $('.j-photo-show-close').trigger('click');
                $('.j-photo-detail-close').trigger('click');
            }
        });
        //图片详情关闭
        $framePhotoShow.on("click", ".j-photo-show-close", function () {
            $framePhotoShow.html("");
            $(window).off('scroll.ban')
        });

        //禁止其他区域响应滚动操作
        // $('.j-frame-photo-show,.j-frame-photo-detail').on('mousewheel','.j-photo-show-close, .j-photo-detail-close, .j-new-comment, .j-pic-comment, .j_model,.wraplist',function(e){
        //     e.preventDefault();
        // });
        // $('.j-frame-photo-show,.j-frame-photo-detail').on('mousewheel','.left,.right',function(e){
        //     e.preventDefault();
        //     e.stopPropagation();
        //     var $this = $(this).closest('.wrapImg');
        //     var delta=0;
        //     if(e.originalEvent.wheelDelta){//IE,OPERA,CHROME
        //         delta=e.originalEvent.wheelDelta/120;
        //     }else if(e.originalEvent.detail){
        //         delta=-e.originalEvent.detail/3;
        //     }
        //     if(delta<0){
        //         $this.scrollTop($this.scrollTop()+100);
        //     }else{
        //         $this.scrollTop($this.scrollTop()-100);
        //     }
        // });
        // //只有评论框响应滚动操作
        // $('.j-frame-photo-show, .j-frame-photo-detail').on('mousewheel','.j-current-new-detail,.j-current-photo-detail,.wrapImg:not(.left,.right)',function(e,triggerEvent){
        //     var $this=$(this);
        //     var delta=0;
        //     if(e.originalEvent){
        //         if(e.originalEvent.wheelDelta){//IE,OPERA,CHROME
        //             delta=e.originalEvent.wheelDelta/120;
        //         }else if(e.originalEvent.detail){
        //             delta=-e.originalEvent.detail/3;
        //         }
        //     }else{
        //         if(triggerEvent.originalEvent.wheelDelta){//IE,OPERA,CHROME
        //             delta=triggerEvent.originalEvent.wheelDelta/120;
        //         }else if(triggerEvent.originalEvent.detail){
        //             delta=-triggerEvent.originalEvent.detail/3;
        //         }
        //     }
        //     if($this.innerHeight()+$this.scrollTop()>=this.scrollHeight){
        //         if(delta<0){
        //             e.preventDefault();
        //             return false;
        //         }
        //     }
        //     if($this.scrollTop()===0){
        //         if(delta>0){
        //             e.preventDefault();
        //             return false;
        //         }
        //
        //     }
        // });

        // 更多
        var hoverMenu = {
            first : false,
            second: true
        };
        //hover弹出举报
        $framePhotoShow.easy2hover({
            selector  : '.j-new-detail-more',
            delayEnter: 300,
            delayLeave: 300,
            enter     : function (evt) {
                $('.j-photo-detail-hover-menu').show();
                hoverMenu.first = false;
                hoverMenu.second = true;
            },
            leave     : function (evt) {
                var $target = $('.j-photo-detail-hover-menu');
                if (hoverMenu.second) {
                    $target.hide();
                }
            }
        });
        $framePhotoShow.easy2hover({
            selector  : '.j-photo-detail-hover-menu',
            delayEnter: 0,
            delayLeave: 350,
            enter     : function (evt) {
                $(this).show();
                hoverMenu.second = false;
                hoverMenu.first = true;
            },
            leave     : function (evt) {
                if (hoverMenu.first) {
                    $(this).hide();
                }
            }
        });
        $framePhotoShow.easy2hover({
            selector:'.j-new-forward',
            delayEnter: 100,
            delayLeave: 250,
            enter     : function(evt){
                $(this).closest('.f-p_relative').find('.j-share-more-menu').removeClass('fn_hide');
                hoverMenu.first = false;
                hoverMenu.second = true;
            },
            leave     : function(evt){
                var target = $(this).closest('.f-p_relative').find('.j-share-more-menu');
                if(hoverMenu.second){
                    target.addClass('fn_hide')
                }
            }
        });
        $framePhotoShow.easy2hover({
            selector:'.j-share-more-menu',
            delayEnter: 0,
            delayLeave: 250,
            enter     : function(evt){
                $(this).removeClass('fn_hide');
                hoverMenu.first = true;
                hoverMenu.second = false;
            },
            leave     : function(evt){
                var target = $(this);
                if(hoverMenu.first){
                    target.addClass('fn_hide')
                }
            }
        });
        $framePhotoDetail.easy2hover({
            selector  : '.j-photo-detail-more',
            delayEnter: 300,
            delayLeave: 300,
            enter     : function (evt) {
                $('.j-photo-detail-hover-menu').show();
                hoverMenu.first = false;
                hoverMenu.second = true;
            },
            leave     : function (evt) {
                var $target = $('.j-photo-detail-hover-menu');
                if (hoverMenu.second) {
                    $target.hide();
                }
            }
        });
        $framePhotoDetail.easy2hover({
            selector  : '.j-photo-detail-hover-menu',
            delayEnter: 0,
            delayLeave: 350,
            enter     : function (evt) {
                $(this).show();
                hoverMenu.second = false;
                hoverMenu.first = true;
            },
            leave     : function (evt) {
                if (hoverMenu.first) {
                    $(this).hide();
                }
            }
        });

        //图片评论->评论(触发)
        $framePhotoShow.on("click", ".j-comment-trigger", function (evt) {
            $(".j-new-comment-input").trigger("focus");
        });

        var newComment = function () {
            var $this = $(this);
            var $newComment = $this.closest(".j-new-comment");
            var content = $.trim($newComment.find(".j-new-comment-input").val());
            var newsModule = comboxPraise.closest('.j-news-module');
            var newsModuleData = newsModule.data();
            if (content == "") {
                $newComment.find(".j-new-comment-input").emptyInputTips();
                return false;
            }
            //验证字数
            var postNewLength= Number($(this).siblings(".j-words-tip").find(".j-words-count").text());
            if(postNewLength>250){
                ui.modal("评论内容过长，请控制在250字之内");
                return false;
            }
            var nickUserIdMapping = $newComment.find(".j-new-comment-input").data("nickUserIdMapping");
            if (nickUserIdMapping) {
                for (var i in nickUserIdMapping) {
                    var nick = Object.keys(nickUserIdMapping[i])[0];
                    var userid = nickUserIdMapping[i][nick];
                    content = content.replace(new RegExp(nick+' ', 'g'), userid+' ');
                }
            }
            var newDetailData = $framePhotoShow.find(".j-current-new-detail").data("newInfo");
            var currentPicUrl = $framePhotoShow.find('.j-bigImg_show').attr('src');
            var curIndex = $framePhotoShow.find('.j-image-item.z-active').index();

            if(currentPicUrl.indexOf('pic-delete')>-1){
                ui.modal('该图片已删除，无法评论');
                return;
            }
            if(currentPicUrl.indexOf('album-delete')>-1){
                ui.modal('该相册已删除，无法评论');
                return;
            }
            if(currentPicUrl.indexOf('pic-gone')>-1){
                ui.modal('该图片加载失败，无法评论');
                return;
            }

            if($framePhotoShow.find('.j-image-item').length>1){
                var postData = {
                    "ownerid"       : newDetailData.owner_id,
                    "newid"         : newDetailData.new_id,
                    "type"          : newDetailData.type===2 ? newDetailData.ori_type : newDetailData.type,
                    "bcommentuserid": newDetailData.owner_id,
                    "content"       : content,
                    "parentid"      : 0,
                    "commentself"   : newDetailData.owner_id == dyq.data.account.id ? 1 : 0,
                    "picture_url"   : currentPicUrl,
                    "picture_index" : curIndex,
                    'photoid'       : $framePhotoShow.find('.j-image-item.z-active').attr('data-photo-id')
                };
            }else{
                var postData = {
                    "ownerid"       : newDetailData.owner_id,
                    "newid"         : newDetailData.new_id,
                    "type"          : newDetailData.type===2 ? newDetailData.ori_type : newDetailData.type,
                    "bcommentuserid": newDetailData.owner_id,
                    "content"       : content,
                    "parentid"      : 0,
                    "commentself"   : newDetailData.owner_id == dyq.data.account.id ? 1 : 0,
                    "picture_url"   : null,
                    "picture_index" : null,
                    'photoid'       : $framePhotoShow.find('.j-image-item.z-active').attr('data-photo-id')
                };
            }

            if($this.hasClass('disabled')){
                ui.modal('操作过于频繁，请稍后再试！');
                return false;
            }
            $this.addClass('disabled');//防止多次点击

            // Ajax
            Api.postComment(postData, function (rsp) {
                $this.removeClass('disabled');
                //ui.modal(rsp.message);
                var comment = {
                    comment_userid  : dyq.data.account.id,
                    comment_headPath: dyq.data.account.avatar,
                    comment_nick    : dyq.data.account.nick,
                    comment_time    : ServerTimer.add(dyq.data.serverTime).getTime(),
                    content         : replace_em(rsp.extData.content),
                    commentid       : rsp.extData.comment_id,
                    picture_url     : rsp.extData.picture_url,
                    picture_index   : curIndex
                };
                //更新相册弹框的模版
                var $oneComment = $(template("template-new-detail-oneComment", comment)).hide();
                $(".j-comment-items").append($oneComment);
                imageAdjust({images: $(".j-comment-items").find('.j-comment-pic'),size:{width:80,height:80}});
                $oneComment.slideDown(Speed.NORMAL);


                //更新缓存
                rsp.extData.content = replace_em(rsp.extData.content);
                newDetailData.comments.push(rsp.extData);
                //计算一级评论的个数
                newDetailData.firstLevelComments = [];
                for (var j in newDetailData.comments) {
                    newDetailData.comments[j].content2 = newDetailData.comments[j].content;
                    // newDetailData.comments[j].content = replace_em(newDetailData.comments[j].content);
                    newDetailData.comments[j].p_id <= 1 && newDetailData.firstLevelComments.push(newDetailData.comments[j]);
                }
                newDetailData.comment_num=newDetailData.firstLevelComments.length;
                newsModule.data(newDetailData);
                //更新动态里的评论数
                updateCommentNumber.call(newsModule.find('.j-comment-toggle'),newDetailData.comment_num);

                //更新动态里的评论模版
                var $comment = $(template('template-all-comment',{news:newDetailData}));
                newsModule.find('.j-fl_items').html($comment);
                imageAdjust({images: newsModule.find('.j-comment-pic'),size:{width:80,height:80}});

                //清空评论框
                $newComment.find(".j-new-comment-input").val("").removeClass("z-active");

                // AT初始化
                initializeAt.apply($oneComment.find('.j-new-reply-input'), [0, 10]);
                // 回复框上的表情初始化
                $oneComment.find(".j-reply_emotion").qqFace({
                    id      : 'facebox',
                    assign_P: 'j-new-reply',
                    assign_C: 'j-new-reply-input',
                    path    : '/img/emotion/',	//表情存放的路径
                    rowEmotions:6,
                    colEmotions:6,
                    pageSize:4,
                    smallWindow:true
                });

                RefreshAtqqFace(newsModule);
            });
        };
        //图片评论->评论
        $framePhotoShow.on("click", ".j-new-comment-submit", newComment);

        var newReplyComment = function () {
            var $this = $(this);
            var $newReply = $this.closest(".j-new-reply");
            var content =$newReply.find(".j-new-reply-input").val().replace(/(^\s*)|(\s*$)/g,'')+ ' ';
            var newsModule = comboxPraise.closest('.j-news-module');
            var newsModuleData = newsModule.data();
            if (content == " ") {
                $newReply.find(".j-new-reply-input").emptyInputTips();
                return false;
            }
            //验证字数
            var postNewLength= Number($(this).siblings(".j-words-tip").find(".j-words-count").text());
            if(postNewLength>250){
                ui.modal("评论内容过长，请控制在250字之内");
                return false;
            }

            var nickUserIdMapping = $newReply.find(".j-new-reply-input").data("nickUserIdMapping");
            if (nickUserIdMapping) {
                for (var i in nickUserIdMapping) {
                    var nick = Object.keys(nickUserIdMapping[i])[0];
                    var userid = nickUserIdMapping[i][nick];
                    content = content.replace(new RegExp(nick+' ', 'g'), userid+' ');
                }
            }
            var newDetailData = $framePhotoShow.find(".j-current-new-detail").data("newInfo");
            var postData = {
                newid         : newDetailData.new_id,
                ownerid       : newDetailData.owner_id,
                bcommentuserid: $this.attr("data-bcommentuserid"),
                content       : content,
                pid           : $this.attr("data-pid"),
                parentid      : $this.attr("data-parentid"),
                commentself   : $this.attr("data-bcommentuserid") == dyq.data.account.id ? 1 : 0
            };

            if($this.hasClass('disabled')){
                ui.modal('操作过于频繁，请稍后再试！');
                return false;
            }
            $this.addClass('disabled');//防止多次点击

            Api.postComment(postData, function (res) {
                $this.removeClass('disabled');
                // ui.modal(res.message);
                if (res.code === 0) {
                    var slComment = {
                        comment_userid : dyq.data.account.id,
                        bcomment_userid: $this.attr("data-bcommentuserid"),
                        comment_nick   : dyq.data.account.nick,
                        comment_time   : ServerTimer.add(dyq.data.serverTime).getTime(),
                        bcomment_nick  : $this.attr("data-bcommentnick"),
                        content        : replace_em(res.extData.content),
                        commentid      : res.extData.comment_id,
                        pid            : $this.attr("data-pid"),
                        parentid       : postData.parentid
                    };
                    //更新弹框里的评论
                    var $sLComment = $(template("template-new-detail-sLComment", slComment)).hide();
                    $this.closest(".j-fl_item").find(".j-sl_items").append($sLComment);
                    $sLComment.slideDown(Speed.NORMAL);
                    $framePhotoShow.find(".j-new-comment").show();

                    //更新缓存
                    res.extData.content = replace_em(res.extData.content);
                    newDetailData.comments.push($.extend(res.extData,slComment));
                    //计算一级评论的个数
                    newDetailData.firstLevelComments = [];
                    for (var j in newDetailData.comments) {
                        newDetailData.comments[j].content2 = newDetailData.comments[j].content;
                        // newDetailData.comments[j].content = replace_em(newDetailData.comments[j].content);
                        newDetailData.comments[j].p_id <= 1 && newDetailData.firstLevelComments.push(newDetailData.comments[j]);
                    }
                    newDetailData.comment_num=newDetailData.firstLevelComments.length;
                    newsModule.data(newDetailData);
                    //更新动态里的评论数
                    //回复不用更新
                    // updateCommentNumber.call(newsModule.find('.j-comment-toggle'),newDetailData.comment_num);

                    //更新动态里的评论模版
                    var $comment = $(template('template-all-comment',{news:newDetailData}));
                    newsModule.find('.j-fl_items').html($comment);
                    imageAdjust({images: newsModule.find('.j-comment-pic'),size:{width:80,height:80}});


                    //清空评论框
                    $newReply.find(".j-new-reply-input").val("").end().slideUp(Speed.NORMAL);

                    RefreshAtqqFace(newsModule);


                }
            });
        };
        //图片评论->回复
        $framePhotoShow.on("click", ".j-new-reply-submit", newReplyComment);

        //图片评论->回复(触发)
        $framePhotoShow.on("click", ".j-reply-trigger", function (evt) {
            var $this = $(this);
            var $firstlevelItem = $this.closest(".j-fl_item");
            $firstlevelItem.siblings(".j-fl_item").find(".j-pic-reply").slideUp(Speed.NORMAL);
            $firstlevelItem.find(".j-new-reply").slideDown(Speed.NORMAL);
            $firstlevelItem.find(".j-new-reply-input").addClass("z-active").focus();
            $framePhotoShow.find(".j-new-comment").hide();
            var $commentItem = $this.closest(".j-sl_item").length > 0 ? $this.closest(".j-sl_item") : $this.closest(".j-fl_item");
            var $commentSumbitBtn = $firstlevelItem.find(".j-new-reply-submit");
            $commentSumbitBtn.attr({
                "data-bcommentuserid": $commentItem.attr("data-userid"),
                "data-pid"           : $commentItem.attr("data-commentid"),
                "data-bcommentnick"  : $commentItem.attr("data-nick"),
                "data-parentid"      : $commentItem.attr("data-parentid")
            });
        });

        //图片评论->删除(触发)
        $framePhotoShow.on("click", ".j-del-trigger", function () {
            var $this = $(this);
            var $delComment = $this.closest(".j-sl_item").length > 0 ? $this.closest(".j-sl_item") : $this.closest(".j-fl_item");
            var newDetailData = $framePhotoShow.find(".j-current-new-detail").data("newInfo");
            var newsModule = comboxPraise.closest('.j-news-module');
            var newsModuleData = newsModule.data();
            var postData = {
                newid    : newDetailData.new_id,
                commentid: $delComment.attr("data-commentid"),
                p_id     : $delComment.attr("data-pid") ? $delComment.attr("data-pid") : 0
            };
            Api.delComment(postData, function (res) {
                // ui.modal(res.message);
                if (res.code === 0) {
                    $delComment.remove();
                    //查找所删评论在评论数组里的位置
                    var index = -1;
                    for(var i=0,len=newDetailData.comments.length;i<len;i++){
                        var tmp = newDetailData.comments[i];
                        if(tmp.comment_id==postData.commentid){
                            index = i;
                        }
                    }

                    //更新缓存
                    newDetailData.comments.splice(index,1);
                    //重新计算一级评论
                    newDetailData.firstLevelComments = [];
                    for (var j in newDetailData.comments) {
                        newDetailData.comments[j].content2 = newDetailData.comments[j].content;
                        newDetailData.comments[j].content = replace_em(newDetailData.comments[j].content);
                        newDetailData.comments[j].p_id <= 1 && newDetailData.firstLevelComments.push(newDetailData.comments[j]);
                    }
                    newDetailData.comment_num=newDetailData.firstLevelComments.length;
                    newsModule.data(newDetailData);

                    //如果删除的是一级评论才更新动态的评论数
                    if(postData.p_id==0){
                        updateCommentNumber.call(newsModule.find('.j-comment-toggle'),newDetailData.comment_num);
                    }

                    //更新动态里的评论模版
                    var $comment = $(template('template-all-comment',{news:newDetailData}));
                    newsModule.find('.j-fl_items').html($comment);
                }
            });
        });

        //评论删除-mouseenter-mouseleave
        $framePhotoShow.on("mouseenter", ".j-item", function () {
            $(this).find(".j-del-trigger").show();
        }).on("mouseleave", ".j-item", function () {
            $(this).find(".j-del-trigger").hide();
        });

        //评论框-focus
        $framePhotoShow.on("focus", ".j-new-comment-input", function () {
            $framePhotoShow.find(".j-new-reply").slideUp(Speed.NORMAL);
            var $this = $(this);
            $this.addClass("z-active");
        });

        $(document).on("click", function (evt) {
            if (!$(evt.target).is(".j-new-comment,.j-new-comment *,.j-comment-trigger,.j-comment-trigger *")) {
                if ($framePhotoShow.find(".j-new-comment-input").val() == "") {
                    $framePhotoShow.find(".j-new-comment-input").removeClass("z-active");
                }
            }
            if (!$(evt.target).is(".j-new-reply,.j-new-reply *,.j-reply-trigger,.j-reply-trigger *")) {
                $framePhotoShow.find(".j-new-reply").slideUp(Speed.NORMAL);
                $framePhotoShow.find(".j-new-comment").show();
            }
        });

        function updateLikeNumber_3(likeNumber, flag) {
            if (flag) {
                this.addClass('z-active');
                this.html('<i class="i-good5"></i>赞(' + likeNumber + ')');
                return this;
            } else {
                this.removeClass('z-active');
                this.html('<i class="i-good5"></i>赞(' + likeNumber + ')');
                return this;
            }
        }
        //图片展示->点赞（触发）
        $framePhotoShow.on("click", ".j-detail-praise-new-trigger,.j-new-like-trigger", function () {
            var $this = $(this);
            var $currentNewDetial = $this.closest(".j-current-new-detail");
            var $goodUserList = $framePhotoShow.find(".j-good_user");
            var _cachePraiseUserListData = $goodUserList.data("praises");
            var newDetailData = $currentNewDetial.data("newInfo");
            var isDetail = location.hash.split("#")[1]?true:false;
            if(isDetail){
                var newsModule = comboxPraise.closest('.j-news_detail-module');
                var newsModuleData = comboxPraise.closest('.j-news_detail-module').data();
            }else{
                var newsModule = comboxPraise.closest('.j-news-module');
                var newsModuleData = comboxPraise.closest('.j-news-module').data();
            }

            var postData = {
                newid        : newDetailData.new_id,
                bpraiseuserid: newDetailData.owner_id, // 被赞人
                praiseself   : newDetailData.owner_id === dyq.data.account.id ? 1 : 0 // 判断是否为自己的动态
            };
            if($this.hasClass('disabled')){
                ui.modal('操作过于频繁，请稍后再试！');
                return false;
            }
            $this.addClass('disabled');//防止多次点击
            Api.like(postData, function (res) {
                $this.removeClass('disabled');
                if (res.code === 0) {
                    var position = 0;
                    if (_cachePraiseUserListData.ispraise) {
                        for (var i = 0; i < _cachePraiseUserListData.praiseUserList.length; i++) {
                            if (_cachePraiseUserListData.praiseUserList[i].userid === dyq.data.account.id) {
                                position = i;
                                break;
                            }
                        }
                        _cachePraiseUserListData.praiseUserList.splice(i, 1);
                        _cachePraiseUserListData.ispraise = 0;
                        newDetailData.ispraise = 0;
                        newDetailData.praise_num -= 1;
                        updateLikeNumber_3.apply(comboxPraise, [newDetailData.praise_num, false]);
                    } else {
                        _cachePraiseUserListData.praiseUserList.unshift({
                            "userid"  : dyq.data.account.id,
                            "nick"    : dyq.data.account.nick,
                            "headPath": dyq.data.account.avatar
                        });
                        _cachePraiseUserListData.ispraise = 1;
                        newDetailData.ispraise = 1;
                        newDetailData.praise_num += 1;
                        updateLikeNumber_3.apply(comboxPraise, [newDetailData.praise_num, true]);
                    }
                    $currentNewDetial.find(".j-detail-praise-new-trigger").toggleClass("z-active");
                    if(isDetail){
                        var $newDetailPraiseListTmpl = template("template-photoshow-detail-praiseList", _cachePraiseUserListData);
                    }else{
                        var $newDetailPraiseListTmpl = template("template-photoshow-praiseList", _cachePraiseUserListData);
                    }
                    $goodUserList.html($newDetailPraiseListTmpl).data("praises", _cachePraiseUserListData);

                    _cachePraiseUserListData.owner_id=newsModuleData.owner_id;
                    _cachePraiseUserListData.new_id=newsModuleData.new_id;
                    _cachePraiseUserListData.praiseList=_cachePraiseUserListData.praiseUserList;

                    //更新j-news-module的点赞数
                    comboxPraise.closest('.j-news-module').data(newsModuleData);

                    if(isDetail){
                        newsModule.find('.j-good_user').replaceWith(template('newslist-detail-praise-box',_cachePraiseUserListData));
                    }else{
                        newsModule.find('.j-good_user').replaceWith(template('newslist-praise-box',_cachePraiseUserListData));
                    }
                    newsModule.find('.j-good_user').data('praises',_cachePraiseUserListData);
                }
                else {
                    ui.modal(res.message);
                }
            });
        });

        var togglePhoto = function () {
            var $this = $(this);
            $this.addClass("z-active").siblings(".j-image-item").removeClass("z-active");
            //做个图片优化，图片没加载出来，显示一个loading的gif
            var bigImgUrl = '/img/loading.gif';
            $(".j-bigImg_show").attr("src", bigImgUrl);
            $(".j-source_pic").attr("href", bigImgUrl);

            var imgObj = new Image();
            imgObj.src = $this.find("img").attr("src").replace("b_", "");
            imgObj.onload=function(){
                $(".j-bigImg_show").attr("src", imgObj.src);
                $(".j-source_pic").attr("href", imgObj.src);
                bigImageStyle({images:$(".j-bigImg_show")});
            };
        };
        //图片展示->点击照片（切换照片详情）
        $framePhotoShow.on("click", ".j-image-item", togglePhoto);
        //图片展示->点击评论里的图片
        $framePhotoShow.on('click','.j-comment-pic',function(){
            var index = $(this).attr('data-picIndex');
            $framePhotoShow.find('.j-image-item').eq(index).trigger("click");
        });


        var photoPrevFlip = function () {
            var $imageItems = $framePhotoShow.find(".j-image-item");
            var $currentImageItem = $imageItems.filter(".z-active");
            var _position = $currentImageItem.index();
            var _len = $imageItems.length;
            var lastPos=Math.floor((_len-1)/15)*15;
            if (_len > 1) {
                if (_position != 0) {
                    $currentImageItem.prev(".j-image-item").trigger("click");
                    var $imagesList = $framePhotoShow.find(".j-images-list");
                    var _newPos = $imageItems.filter(".z-active").index();
                    var _curDivML = parseInt($imagesList.css("margin-left"));
                    var _imgDivWidth = parseInt($framePhotoShow.find(".j-imglist-field").width());
                    var _imgItemWidth = $imageItems.eq(0).outerWidth();
                    var _lenV = Math.floor(_imgDivWidth / _imgItemWidth);
                    if (-1 * (parseInt(_newPos / _lenV)) != (_curDivML / _imgDivWidth)) {
                        $imagesList.stop().animate({"margin-left": -1 * _imgDivWidth * (parseInt(_newPos / _lenV)) + "px"}, Speed.SLOW);

                    }
                    if (_position == 1) {
                        $(this).css("cursor", "");
                    }
                    if(_position<=15){
                        $('.j-prev-row').hide();
                        $('.j-next-row').show();
                    }else if(_position>lastPos){
                        $('.j-prev-row').show();
                        $('.j-next-row').hide();
                    }else{
                        $('.j-prev-row').show();
                        $('.j-next-row').show();
                    }
                }
            }
        };
        var photoNextFlip = function () {
            var $imageItems = $framePhotoShow.find(".j-image-item");
            var $currentImageItem = $imageItems.filter(".z-active");
            var _position = $currentImageItem.index();
            var _len = $imageItems.length;
            var lastPos=Math.floor((_len-1)/15)*15-2;
            if (_len > 1) {
                if (_position != _len - 1) {
                    $currentImageItem.next(".j-image-item").trigger("click");
                    var $imagesList = $framePhotoShow.find(".j-images-list");
                    var _newPos = $imageItems.filter(".z-active").index();
                    var _curDivML = parseInt($imagesList.css("margin-left"));
                    var _imgDivWidth = parseInt($framePhotoShow.find(".j-imglist-field").width());
                    var _imgItemWidth = $imageItems.eq(0).outerWidth();
                    var _lenV = Math.floor(_imgDivWidth / _imgItemWidth);
                    if (-1 * (parseInt(_newPos / _lenV)) != (_curDivML / _imgDivWidth)) {
                        $imagesList.stop().animate({"margin-left": -1 * _imgDivWidth * (parseInt(_newPos / _lenV)) + "px"}, Speed.SLOW);
                    }
                    if (_position == _len - 2) {
                        $(this).css("cursor", "");
                    }
                    if(_position<=13){
                        $('.j-prev-row').hide();
                        $('.j-next-row').show();
                    }else if(_position>lastPos){
                        $('.j-prev-row').show();
                        $('.j-next-row').hide();
                    }else{
                        $('.j-prev-row').show();
                        $('.j-next-row').show();
                    }
                }
            }
        };
        //图片展示->图片单张翻页
        $framePhotoShow.on("click", ".j-slide_prev-trigger", photoPrevFlip);
        $framePhotoShow.on("click", ".j-slide_next-trigger", photoNextFlip);
        $framePhotoShow.on("mouseenter", ".j-slide_next-trigger", function () {
            var $imageItems = $framePhotoShow.find(".j-image-item");
            var $currentImageItem = $imageItems.filter(".z-active");
            var _position = $currentImageItem.index();
            var _len = $imageItems.length;
            if (_position != _len - 1) {
                $(this).css({"cursor": "url('" + dyq.data.publicImgPathPrefix + "/img/icon_next.cur'),auto"});
            }
        });
        $framePhotoShow.on("mouseenter", ".j-slide_prev-trigger", function () {
            var $imageItems = $framePhotoShow.find(".j-image-item");
            var $currentImageItem = $imageItems.filter(".z-active");
            var _position = $currentImageItem.index();
            if (_position != 0) {
                $(this).css({"cursor": "url('" + dyq.data.publicImgPathPrefix + "/img/icon_prev.cur'),auto"});
            }
        });
        var sliding = false;
        var photoPrevRowFlip = function () {
            if (sliding) {
                return false;
            }
            var $this = $(this);
            var $allImageItem = $framePhotoShow.find(".j-image-item");                          //所有小图片
            var _imgItemWidth = $allImageItem.eq(0).outerWidth();                                  //小图片宽度
            var _imgDivWidth = parseInt($framePhotoShow.find(".j-imglist-field").width());      //外层div宽度
            var _lenV = Math.floor(_imgDivWidth / _imgItemWidth);                                     //外层div下小图片个数
            var _moveStep = _lenV * _imgItemWidth;                                                    //每次移动的距离
            var $imagesList = $this.closest(".j-images-wraplist").find(".j-images-list");
            var _curPos = parseInt($imagesList.css("margin-left"));

            if (_curPos < 0) {
                _curPos += _moveStep;
                if (_curPos >= 0) {
                    $this.addClass("none");
                    $this.hide();
                }
                sliding = true;
                $('.j-next-row').show();
                $imagesList.stop().animate({"margin-left": (_curPos > 0 ? 0 : _curPos) + "px"}, Speed.SLOW, function () {
                    sliding = false;
                });
            }
        };
        var photoNextRowFlip = function () {
            if (sliding) {
                return false;
            }
            var $this = $(this);
            var $allImageItem = $framePhotoShow.find(".j-image-item");                          //所有小图片
            var _imgItemNum = $allImageItem.length;                                                 //所有图片数量
            var _imgItemWidth = $allImageItem.eq(0).outerWidth();                                  //小图片宽度
            var _imgListWidth = _imgItemNum * _imgItemWidth;                                          //总图片宽度
            var _imgDivWidth = parseInt($framePhotoShow.find(".j-imglist-field").width());      //外层div宽度
            var _lenV = Math.floor(_imgDivWidth / _imgItemWidth);                                     //外层div下小图片个数
            var _moveStep = _lenV * _imgItemWidth;                                                    //每次移动的距离
            var $imagesList = $(this).closest(".j-images-wraplist").find(".j-images-list");
            var _curPos = parseInt($imagesList.css("margin-left"));
            if (_curPos > -1 * (_imgListWidth - _moveStep)) {
                _curPos -= _moveStep;
                if (_curPos <= -1 * (_imgListWidth - _moveStep)) {
                    $this.addClass("none");
                    $this.hide();
                }
                sliding = true;
                $('.j-prev-row').show();
                $imagesList.stop().animate({"margin-left": _curPos + "px"}, Speed.SLOW, function () {
                    sliding = false;
                });
            }
        };
        //图片展示->图片整排翻页
        $framePhotoShow.on("click", ".j-prev-row", photoPrevRowFlip);
        $framePhotoShow.on("click", ".j-next-row", photoNextRowFlip);
        //图片展示->左右翻页hover
        $framePhotoShow.on("mouseenter", ".j-prev-row", function () {
            var $imagesList = $(this).closest(".j-images-wraplist").find(".j-images-list");
            var _curPos = parseInt($imagesList.css("margin-left"));
            if (_curPos == 0) {
                $(this).addClass("none");
            } else {
                $(this).removeClass("none");
            }
        });
        $framePhotoShow.on("mouseenter", ".j-next-row", function () {
            var $imagesList = $(this).closest(".j-images-wraplist").find(".j-images-list");
            var _curPos = parseInt($imagesList.css("margin-left"));
            var $allImageItem = $framePhotoShow.find(".j-image-item");                          //所有小图片
            var _imgItemNum = $allImageItem.length;                                                 //所有图片数量
            var _imgItemWidth = $allImageItem.eq(0).outerWidth();                                  //小图片宽度
            var _imgListWidth = _imgItemNum * _imgItemWidth;
            var _imgDivWidth = parseInt($framePhotoShow.find(".j-imglist-field").width());
            var _lenV = Math.floor(_imgDivWidth / _imgItemWidth);                                     //外层div下小图片个数
            var _moveStep = _lenV * _imgItemWidth;
            if (_curPos <= -1 * (_imgListWidth - _moveStep)) {
                $(this).addClass("none");
            } else {
                $(this).removeClass("none");
            }
        });

        //图片展示->分享
        var newForward = function (e) {
            var sel = e.data.sel;
            var newDetailData = $framePhotoShow.find(".j-current-new-detail").data("newInfo");
            $newsListDIV.find(".j-news-module").each(function (index, ele) {
                if ($(ele).data().new_id == newDetailData.new_id) {
                    $(ele).find(sel).trigger("click");
                }
            });
        };
        $framePhotoShow.on("click", ".i-myq",{sel:'.j-forward-toggle-click'}, newForward);
        $framePhotoShow.on('click','.i-weibo',{sel:'.j-weibo-trigger'}, newForward);
        $framePhotoShow.on('click','.i-wechat',{sel:'.j-wechat-trigger'}, newForward);
        $framePhotoShow.on('click','.i-zone',{sel:'.j-zone-trigger'}, newForward);
    }());
    /*======================================动态->图片展示=========================================*/

    /*======================================战友上传->照片详情=========================================*/
    /**
     * 战友最近上传->照片详情
     */
    (function(){
        // 点击"AT战友"触发AT功能（图片的评论框下）
        $framePhotoDetail.on('click', '.j-comment-at-trigger', function () {
            var $commentInput = $(this).closest(".j-pic-comment").find(".j-pic-comment-input");
            $commentInput.focus();
            var pos = $commentInput.caret('pos');
            var _val = $commentInput.val();
            $commentInput.val(_val.slice(0, pos) + "@" + _val.slice(pos));
            $commentInput.caret('pos', pos + 1);
        });
        // 点击"AT战友"触发AT功能（图片的回复框下）
        $framePhotoDetail.on('click', '.j-reply-at-trigger', function () {
            var $replyInput = $(this).closest(".j-pic-reply").find(".j-pic-reply-input");
            $replyInput.focus();
            var pos = $replyInput.caret('pos');
            var _val = $replyInput.val();
            $replyInput.val(_val.slice(0, pos) + "@" + _val.slice(pos));
            $replyInput.caret('pos', pos + 1);
        });

        //照片详情
        var requestPhotoDetail = function (data) {
            return $.ajax({
                url     : '/dyq/api/photodetail',
                type    : 'GET',
                dataType: 'json',
                cache   : false,
                data    : data
            });
        };
        //照片列表
        var requestPhotosList = function (data) {
            return $.ajax({
                url     : '/dyq/api/photolist',
                type    : 'GET',
                dataType: 'json',
                cache   : false,
                data    : data
            });
        };
        var rpd = $.Deferred(), rpl = $.Deferred();
        var framePhotoDetail = function () {
            var _cacheFriendPhotoData = $friendUploadBox.data("photoInfo");
            if (_cacheFriendPhotoData.photoid == '') {
                return false;
            }
            var postData_PhotoDetail = {
                albumid: _cacheFriendPhotoData.albumid,
                photoid: _cacheFriendPhotoData.photoid,
                userid : _cacheFriendPhotoData.userid
            };
            var postData_PhotosList = {
                albumid: _cacheFriendPhotoData.albumid,
                userid : _cacheFriendPhotoData.userid
            };
            var _photoDetailData = {};
            requestPhotoDetail(postData_PhotoDetail).done(function (res) {
                if(res.photoInfo){
                    res.photoInfo.headPath=addHeadPathPrefix(res.photoInfo.headPath);
                    if(res.photoInfo.comments.length>0){
                        for(var j=0;j<res.photoInfo.comments.length;j++){
                            if(res.photoInfo.comments[j].bcomment_headPath){
                                res.photoInfo.comments[j].bcomment_headPath=addHeadPathPrefix(res.photoInfo.comments[j].bcomment_headPath);
                            }
                            if(res.photoInfo.comments[j].comment_headPath){
                                res.photoInfo.comments[j].comment_headPath=addHeadPathPrefix( res.photoInfo.comments[j].comment_headPath);
                            }
                        }
                    }
                    if(res.photoInfo.praises.length>0){
                        for(var j=0;j<res.photoInfo.praises.length;j++){
                            res.photoInfo.praises[j].headPath=addHeadPathPrefix(res.photoInfo.praises[j].headPath);
                        }
                    }
                }



                if (res.code === 0) {
                    res.currentPhoto = {
                        userid   : res.photoInfo.userid,
                        nick     : res.photoInfo.nick,
                        photoSrc : res.photoInfo.picture_url,
                        photoType: res.photoInfo.type,
                        photoTime: res.photoInfo.time,
                        albumid  : _cacheFriendPhotoData.albumid,
                        photoid  : _cacheFriendPhotoData.photoid,
                        photoName: res.photoInfo.photoname,
                        ismy     : false
                    };

                    //模版判断是否为游戏主页显示举报按钮
                    if(res.ispub!=undefined){
                        res.currentPhoto.ispub=_cacheFriendPhotoData.ispub;
                    }else if(dyq.data.ispub!=undefined){
                        res.currentPhoto.ispub=dyq.data.ispub;
                    }else{
                        res.currentPhoto.ispub=0;
                    }

                    res.photoSourceMapping = {'1': '动态配图', '2': '真人秀', '3': '游戏分享', '4': '盟友圈','5':'帮派相册','6':'帮派封面相册','7':'帮派社区','8':'默认相册','9':'画册','10':'个人头像'};

                    for (var i = 0; i < res.photoInfo.comments.length; i++) {
                        res.photoInfo.comments[i].content = replace_em(res.photoInfo.comments[i].content || '');
                    }
                    res.photoInfo.introduce = getLinks(res.photoInfo.introduce)[0];
                    $.extend(_photoDetailData, res);
                    rpd.resolve(res);
                }
            }).fail(catchError);
            requestPhotosList(postData_PhotosList).done(function (res) {
                if (res.code === 0) {
                    var _photoList = [];
                    for (var i = 0; i < res.photoList.length; i++) {
                        _photoList.push({
                            albumid: res.photoList[i].albumid,
                            photoid: res.photoList[i].photoid,
                            userid : res.photoList[i].userid,
                            url    : res.photoList[i].picture_url
                        });
                    }
                    res.photoList = _photoList;
                    $.extend(_photoDetailData, res);
                    rpl.resolve(res);
                }
            }).fail(catchError);
            $.when(rpd, rpl).then(function () {
                var $photoDetailTmpl = template("template-photo-detail", _photoDetailData);
                $framePhotoDetail.html($photoDetailTmpl).find(".m-pop_photo").addClass("zoomIn");

                $framePhotoDetail.find('.j-prev-row').hide();//隐藏向前翻箭头

                var $allImageItem = $framePhotoDetail.find(".j-image-item");                          //所有小图片
                var _imgItemWidth = $allImageItem.eq(0).outerWidth();                                  //小图片宽度
                $framePhotoDetail.find(".j-images-list").width($allImageItem.length * _imgItemWidth);

                replaceErrorImage($framePhotoDetail);
                imageAdjust({images: $framePhotoDetail.find(".j-image-item img"), size: {width: 48, height: 48}});
                imageAdjust({images: $framePhotoDetail.find('.j-comment-pic'),size:{width:80,height:80}});
                bigImageStyle({images:$(".j-bigImg_show")});

                window.photoListSlided = false;
                $(window).trigger("resize.albumDetailFrame");
                //打开相片详情时下面的图片位置调整(如果没有调整)
                if (!window.photoListSlided) {
                    setTimeout(window.photoPosAdjust, 500);
                }

                var hoverTitle = '';
                if(_photoDetailData.photoInfo.album_permission==2){
                    hoverTitle =  '该图片仅自己可见，无法分享';
                    ui.title($framePhotoDetail.find('.j-photo-share'),hoverTitle,'inline-block',true);
                }else if(_photoDetailData.photoInfo.album_permission==1&&_photoDetailData.photoInfo.userid!=dyq.data.account.id){
                    hoverTitle = '因为权限限制，该图片无法分享';
                    ui.title($framePhotoDetail.find('.j-photo-share'),hoverTitle,'inline-block',true);
                }


                //缓存数据
                $framePhotoDetail.find(".j-image-item").each(function (index, ele) {
                    $(ele).data("photoInfo", _photoDetailData.photoList[index]);
                });
                $framePhotoDetail.find(".j-current-photo-detail").data("photoInfo", _photoDetailData.currentPhoto);
                var praises = {
                    ispraise      : _photoDetailData.photoInfo.ispraise,
                    praiseUserList: _photoDetailData.photoInfo.praises
                };
                $framePhotoDetail.find(".j-good_user").data("praises", praises);
                // AT初始化
                initializeAt.apply($framePhotoDetail.find('.j-pic-comment-input'), [0, 10]);
                $framePhotoDetail.find('.j-pic-reply-input').each(function () {
                    initializeAt.apply($(this), [0, 10]);
                });
                // 评论框上的表情初始化
                $framePhotoDetail.find(".j-comment_emotion").qqFace({
                    id        : 'facebox',
                    assign_P  : 'j-pic-comment',
                    assign_C  : 'j-pic-comment-input',
                    path      : '/img/emotion/',	//表情存放的路径
                    margin_top: -290,
                    horn      : false,
                    close     : true
                });
                // 回复框上的表情初始化
                var $replyEmotion = $framePhotoDetail.find(".j-reply_emotion");
                if ($replyEmotion.length > 0) {
                    $replyEmotion.qqFace({
                        id      : 'facebox',
                        assign_P: 'j-pic-reply',
                        assign_C: 'j-pic-reply-input',
                        path    : '/img/emotion/',	//表情存放的路径
                        rowEmotions:6,
                        colEmotions:6,
                        pageSize:4,
                        smallWindow:true
                    });
                }
                rpd = $.Deferred();
                rpl = $.Deferred();
                var top = $(window).scrollTop();
                $(window).on('scroll.ban',function(){
                    $(this).scrollTop(top);
                });
            });

        };
        //照片详情打开
        $(document).on("click", ".j-friend-upload-photo", framePhotoDetail);

        //照片详情关闭
        $framePhotoDetail.on("click", ".j-photo-detail-close", function () {
            $framePhotoDetail.html("");
            $(window).off('scroll.ban')
        });
        //照片评论->评论(触发)
        $framePhotoDetail.on("click", ".j-comment-trigger", function (evt) {
            $(".j-pic-comment-input").trigger("focus");
        });

        var photoComment = function () {
            var $this = $(this);
            var $picComment = $this.closest(".j-pic-comment");
            var content = $picComment.find(".j-pic-comment-input").val().replace(/(^\s*)|(\s*$)/g,'')+ ' ';
            if (content == " ") {
                $picComment.find(".j-pic-comment-input").emptyInputTips();
                return false;
            }
            //验证字数
            var postNewLength= Number($(this).siblings(".j-words-tip").find(".j-words-count").text());
            if(postNewLength>250){
                ui.modal("评论内容过长，请控制在250字之内");
                return false;
            }
            var nickUserIdMapping = $picComment.find(".j-pic-comment-input").data("nickUserIdMapping");
            if (nickUserIdMapping) {
                for (var i in nickUserIdMapping) {
                    var nick = Object.keys(nickUserIdMapping[i])[0];
                    var userid = nickUserIdMapping[i][nick];
                    content = content.replace(new RegExp(nick+' ', 'g'), userid+' ');
                }
            }
            var postData = {
                commentType   : 2,
                albumid       : $this.attr("data-album-id"),
                photoid       : $this.attr("data-photo-id"),
                bcommentuserid: $this.attr("data-photo-userid"),
                content       : content,
                pid           : 0
            };
            if($this.hasClass('disabled')){
                ui.modal('操作过于频繁，请稍后再试！');
                return false;
            }
            $this.addClass('disabled');//防止多次点击

            $.ajax({
                url     : '/dyq/api/postcomment',
                type    : 'POST',
                dataType: 'json',
                data    : postData
            }).done(function (res) {
                $this.removeClass('disabled');
                // ui.modal(res.message);
                if (res.code === 0) {
                    var comment = {
                        comment_userid  : dyq.data.account.id,
                        comment_headPath: dyq.data.account.avatar,
                        comment_nick    : dyq.data.account.nick,
                        comment_time    : ServerTimer.add(dyq.data.serverTime).getTime(),
                        content         : replace_em(res.commentcontent || ''),
                        commentid       : res.commentid,
                        photoid         : postData.photoid,
                        albumid         : postData.albumid
                    };
                    var $oneComment = $(template("template-photo-detail-oneComment", comment)).hide();
                    $(".j-comment-items").append($oneComment);
                    $oneComment.slideDown(Speed.NORMAL);
                    //清空评论框
                    $picComment.find(".j-pic-comment-input").val("").removeClass("z-active");

                    // AT初始化
                    initializeAt.apply($oneComment.find('.j-pic-reply-input'), [0, 10]);
                    // 回复框上的表情初始化
                    $framePhotoDetail.find(".j-reply_emotion").qqFace({
                        id      : 'facebox',
                        assign_P: 'j-pic-reply',
                        assign_C: 'j-pic-reply-input',
                        path    : '/img/emotion/',	//表情存放的路径
                        rowEmotions:6,
                        colEmotions:6,
                        pageSize:4,
                        smallWindow:true
                    });
                } else {
                    ui.modal(res.message);
                }
            });
        };
        //照片评论->评论
        $framePhotoDetail.on("click", ".j-pic-comment-submit", photoComment);
        var photoReplyComment = function () {
            var $this = $(this);
            var $picReply = $this.closest(".j-pic-reply");
            var content = $picReply.find(".j-pic-reply-input").val().replace(/(^\s*)|(\s*$)/g,'')+ ' ';
            if (content == " ") {
                $picReply.find(".j-pic-reply-input").emptyInputTips();
                return false;
            }
            //验证字数
            var postNewLength= Number($(this).siblings(".j-words-tip").find(".j-words-count").text());
            if(postNewLength>250){
                ui.modal("评论内容过长，请控制在250字之内");
                return false;
            }
            var nickUserIdMapping = $picReply.find(".j-pic-reply-input").data("nickUserIdMapping");
            if (nickUserIdMapping) {
                for (var i in nickUserIdMapping) {
                    var nick = Object.keys(nickUserIdMapping[i])[0];
                    var userid = nickUserIdMapping[i][nick];
                    content = content.replace(new RegExp(nick+' ', 'g'), userid+' ');
                }
            }
            var postData = {
                commentType   : 2,
                albumid       : $this.attr("data-album-id"),
                photoid       : $this.attr("data-photo-id"),
                bcommentuserid: $this.attr("data-bcommentuserid"),
                content       : content,
                pid           : $this.attr("data-pid"),
                parentid      : $this.attr("data-parentid")
            };
            if($this.hasClass('disabled')){
                ui.modal('操作过于频繁，请稍后再试！');
                return false;
            }
            $this.addClass('disabled');//防止多次点击

            $.ajax({
                url     : '/dyq/api/postcomment',
                type    : 'POST',
                dataType: 'json',
                data    : postData
            }).done(function (res) {
                $this.removeClass('disalbed');
                // ui.modal(res.message);
                if (res.code === 0) {
                    var slComment = {
                        comment_userid : dyq.data.account.id,
                        bcomment_userid: $this.attr("data-bcommentuserid"),
                        comment_nick   : dyq.data.account.nick,
                        comment_time   : ServerTimer.add(dyq.data.serverTime).getTime(),
                        bcomment_nick  : $this.attr("data-bcommentnick"),
                        content        : replace_em(res.commentcontent || ''),
                        commentid      : res.commentid,
                        photoid        : $this.attr("data-photo-id"),
                        parentid       : $this.attr("data-parentid"),
                        pid            : $this.attr("data-pid")
                    };
                    var $sLComment = $(template("template-photo-detail-sLComment", slComment)).hide();
                    $this.closest(".j-fl_item").find(".j-sl_items").append($sLComment);
                    $sLComment.slideDown(Speed.NORMAL);
                    $framePhotoDetail.find(".j-pic-comment").show();
                    //清空评论框
                    $picReply.find(".j-pic-reply-input").val("").end().slideUp(Speed.NORMAL);
                } else {
                    ui.modal(res.message);
                }
            });
        };
        //照片评论->回复
        $framePhotoDetail.on("click", ".j-pic-reply-submit", photoReplyComment);

        //照片评论->回复(触发)
        $framePhotoDetail.on("click", ".j-reply-trigger", function (evt) {
            var $this = $(this);
            var $firstlevelItem = $this.closest(".j-fl_item");
            $firstlevelItem.siblings(".j-fl_item").find(".j-pic-reply").slideUp(Speed.NORMAL);
            $firstlevelItem.find(".j-pic-reply").slideDown(Speed.NORMAL);
            $firstlevelItem.find(".j-pic-reply-input").addClass("z-active").focus();
            $framePhotoDetail.find(".j-pic-comment").hide();
            var $commentItem = $this.closest(".j-sl_item").length > 0 ? $this.closest(".j-sl_item") : $this.closest(".j-fl_item");
            var $commentSumbitBtn = $firstlevelItem.find(".j-pic-reply-submit");
            $commentSumbitBtn.attr({
                "data-bcommentuserid": $commentItem.attr("data-userid"),
                "data-pid"           : $commentItem.attr("data-commentid"),
                "data-bcommentnick"  : $commentItem.attr("data-nick"),
                "data-parentid"      : $commentItem.attr("data-parentid")
            });
        });

        //照片评论->删除(触发)
        $framePhotoDetail.on("click", ".j-del-trigger", function () {
            var $this = $(this);
            var $delComment = $this.closest(".j-sl_item").length > 0 ? $this.closest(".j-sl_item") : $this.closest(".j-fl_item");
            var postData = {
                type     : 2,
                commentid: $delComment.attr("data-commentid"),
                photoid  : $delComment.attr("data-photoid"),
                p_id     : $delComment.attr("data-pid") ? $delComment.attr("data-pid") : 0
            };
            $.ajax({
                url     : '/dyq/api/deletecomments',
                type    : 'POST',
                dataType: 'json',
                data    : postData
            }).done(function (res) {
                ui.fastTips(res.message, "album_ml");
                if (res.code === 0) {
                    $delComment.remove();
                }
            });
        });

        //评论删除-mouseenter-mouseleave
        $framePhotoDetail.on("mouseenter", ".j-item", function () {
            $(this).find(".j-del-trigger").show();
        }).on("mouseleave", ".j-item", function () {
            $(this).find(".j-del-trigger").hide();
        });

        //评论框-focus
        $framePhotoDetail.on("focus", ".j-pic-comment-input", function () {
            $framePhotoDetail.find(".j-pic-reply").slideUp(Speed.NORMAL);
            var $this = $(this);
            $this.addClass("z-active");
        });

        $(document).on("click", function (evt) {
            if (!$(evt.target).is(".j-pic-comment,.j-pic-comment *,.j-comment-trigger,.j-comment-trigger *")) {
                if ($framePhotoDetail.find(".j-pic-comment-input").val() == "") {
                    $framePhotoDetail.find(".j-pic-comment-input").removeClass("z-active");
                }
            }
            if (!$(evt.target).is(".j-pic-reply,.j-pic-reply *,.j-reply-trigger,.j-reply-trigger *")) {
                $framePhotoDetail.find(".j-pic-reply").slideUp(Speed.NORMAL);
                $framePhotoDetail.find(".j-pic-comment").show();
            }
        });

        //照片详情->点赞（触发）
        $framePhotoDetail.on("click", ".j-detail-praise-photo-trigger,.j-photo-like-trigger", function () {
            var $this = $(this);
            var $currentPhotoDetial = $this.closest(".j-current-photo-detail");
            var $goodUserList = $framePhotoDetail.find(".j-good_user");
            var _cachePraiseUserListData = $goodUserList.data("praises");
            var _currentPhotoId = $currentPhotoDetial.data("photoInfo").photoid;
            var _cacheFriendUploadPhotoData = $friendUploadBox.data("photoInfo");
            var postData = {
                photoid      : parseInt(_currentPhotoId),
                praiseType   : 2,
                bpraiseuserid: parseInt($currentPhotoDetial.data("photoInfo").userid)
            };
            if($this.hasClass('disabled')){
                ui.modal('操作过于频繁，请稍后再试！');
                return false;
            }
            $this.addClass('disabled');//防止多次点击

            $.ajax({
                url     : '/dyq/api/praise',
                type    : 'POST',
                dataType: 'json',
                data    : postData,
                cache   : false
            }).done(function (res) {
                $this.removeClass('disalbed');
                // ui.modal(res.message);
                if (res.code === 0) {
                    var position = 0;
                    if (_cachePraiseUserListData.ispraise) {
                        for (var i = 0; i < _cachePraiseUserListData.praiseUserList.length; i++) {
                            if (_cachePraiseUserListData.praiseUserList[i].userid === dyq.data.account.id) {
                                position = i;
                                break;
                            }
                        }
                        _cachePraiseUserListData.praiseUserList.splice(i, 1);
                        _cachePraiseUserListData.ispraise = 0;
                        if (_cacheFriendUploadPhotoData.photoid == _currentPhotoId) {
                            var ispraise = 0;
                            var $praisePhoto = $friendUploadBox.find(".j-praise-photo");
                            var _praiseNum = parseInt($praisePhoto.find(".j-praise-num").text());
                            var _cachePhotoInfo = $friendUploadBox.data("photoInfo");
                            $praisePhoto.toggleClass("z-active");
                            if ($praisePhoto.hasClass("z-active")) {
                                $praisePhoto.find(".j-praise-num").text(++_praiseNum);
                                ispraise = 1;
                            } else {
                                $praisePhoto.find(".j-praise-num").text(--_praiseNum);
                                ispraise = 0;
                            }
                            //改变缓存
                            $.extend(_cachePhotoInfo, {praise_num: _praiseNum, ispraise: ispraise});
                        } else {
                            for (var i = 0; i < photoArr.length; i++) {
                                if (photoArr[i].photoid == _currentPhotoId) {
                                    photoArr[i].praise_num--;
                                    photoArr[i].ispraise = 0;
                                    break;
                                }
                            }
                        }
                    } else {
                        _cachePraiseUserListData.praiseUserList.unshift({
                            "userid"  : dyq.data.account.id,
                            "nick"    : dyq.data.account.nick,
                            "headPath": dyq.data.account.avatar
                        });
                        _cachePraiseUserListData.ispraise = 1;
                        if (_cacheFriendUploadPhotoData.photoid == _currentPhotoId) {
                            var ispraise = 0;
                            var $praisePhoto = $friendUploadBox.find(".j-praise-photo");
                            var _praiseNum = parseInt($praisePhoto.find(".j-praise-num").text());
                            var _cachePhotoInfo = $friendUploadBox.data("photoInfo");
                            $praisePhoto.toggleClass("z-active");
                            if ($praisePhoto.hasClass("z-active")) {
                                $praisePhoto.find(".j-praise-num").text(++_praiseNum);
                                ispraise = 1;
                            } else {
                                $praisePhoto.find(".j-praise-num").text(--_praiseNum);
                                ispraise = 0;
                            }
                            //改变缓存
                            $.extend(_cachePhotoInfo, {praise_num: _praiseNum, ispraise: ispraise});
                        } else {
                            for (var i = 0; i < photoArr.length; i++) {
                                if (photoArr[i].photoid == _currentPhotoId) {
                                    photoArr[i].praise_num++;
                                    photoArr[i].ispraise = 1;
                                    break;
                                }
                            }
                        }
                    }
                    $currentPhotoDetial.find(".j-detail-praise-photo-trigger").toggleClass("z-active");
                    var $photoDetailPraiseListTmpl = template("template-photo-detail-praiseList", _cachePraiseUserListData);
                    $goodUserList.html($photoDetailPraiseListTmpl).data("praises", _cachePraiseUserListData);
                }
            });
        });

        var togglePhotoDetail = function () {
            var $this = $(this);
            var _cachePhotoData = $this.data("photoInfo");
            $this.addClass("z-active").siblings(".j-image-item").removeClass("z-active");
            var postData = {
                albumid: _cachePhotoData.albumid,
                photoid: _cachePhotoData.photoid,
                userid : _cachePhotoData.userid
            };
            $.ajax({
                url     : '/dyq/api/photodetail',
                type    : 'GET',
                dataType: 'json',
                data    : postData
            }).done(function (res) {
                if (res.code === 0) {
                    res.currentPhoto = {
                        userid   : res.photoInfo.userid,
                        nick     : res.photoInfo.nick,
                        photoSrc : res.photoInfo.picture_url,
                        photoType: res.photoInfo.type,
                        photoTime: res.photoInfo.time,
                        albumid  : _cachePhotoData.albumid,
                        photoid  : _cachePhotoData.photoid,
                        photoName: res.photoInfo.photoname,
                        ismy     : false
                    };
                    res.photoSourceMapping = {'1': '动态配图', '2': '真人秀', '3': '游戏分享', '4': '盟友圈','5':'帮派相册','6':'帮派封面相册','7':'帮派社区','8':'默认相册','9':'画册','10':'个人头像'};
                    for (var i = 0; i < res.photoInfo.comments.length; i++) {
                        res.photoInfo.comments[i].content = replace_em(res.photoInfo.comments[i].content);
                    }
                    res.photoInfo.introduce = getLinks(res.photoInfo.introduce)[0];
                    //做个图片优化，图片没加载出来，显示一个loading的gif
                    var bigImgUrl = '/img/loading.gif';
                    $(".j-bigImg_show").attr("src", bigImgUrl);
                    $(".j-source_pic").attr("href", bigImgUrl);

                    var imgObj = new Image();
                    imgObj.src = res.currentPhoto.photoSrc;
                    imgObj.onload=function(){
                        $(".j-bigImg_show").attr("src", imgObj.src);
                        $(".j-source_pic").attr("href", imgObj.src);
                        bigImageStyle({images:$(".j-bigImg_show")});
                    };
                    var $photoDetailContentTmpl = template("template-photo-detail-content", res);
                    var $photoDetailContent = $framePhotoDetail.find(".j-photo-detail-content");
                    $photoDetailContent.html($photoDetailContentTmpl);

                    var hoverTitle = '';
                    if(res.photoInfo.album_permission==2){
                        hoverTitle =  '该图片仅自己可见，无法分享';
                        ui.title($framePhotoDetail.find('.j-photo-share'),hoverTitle,'inline-block',true);
                    }else if(res.photoInfo.album_permission==1&&res.photoInfo.userid!=dyq.data.account.id){
                        hoverTitle = '因为权限限制，该图片无法分享';
                        ui.title($framePhotoDetail.find('.j-photo-share'),hoverTitle,'inline-block',true);
                    }
                    //缓存数据
                    $framePhotoDetail.find(".j-current-photo-detail").data("photoInfo", res.currentPhoto);
                    var praises = {
                        ispraise      : res.photoInfo.ispraise,
                        praiseUserList: res.photoInfo.praises
                    };
                    $framePhotoDetail.find(".j-good_user").data("praises", praises);
                    // AT初始化
                    initializeAt.apply($framePhotoDetail.find('.j-pic-comment-input'), [0, 10]);
                    $framePhotoDetail.find('.j-pic-reply-input').each(function () {
                        initializeAt.apply($(this), [0, 10]);
                    });
                    // 评论框上的表情初始化
                    $framePhotoDetail.find(".j-comment_emotion").qqFace({
                        id        : 'facebox',
                        assign_P  : 'j-pic-comment',
                        assign_C  : 'j-pic-comment-input',
                        path      : '/img/emotion/',	//表情存放的路径
                        margin_top: -290,
                        horn      : false,
                        close     : true
                    });
                    // 回复框上的表情初始化
                    var $replyEmotion = $framePhotoDetail.find(".j-reply_emotion");
                    if ($replyEmotion.length > 0) {
                        $replyEmotion.qqFace({
                            id      : 'facebox',
                            assign_P: 'j-pic-reply',
                            assign_C: 'j-pic-reply-input',
                            path    : '/img/emotion/',	//表情存放的路径
                            rowEmotions:6,
                            colEmotions:6,
                            pageSize:4,
                            smallWindow:true
                        });
                    }
                }
            });
        };
        //照片详情->点击照片（切换照片详情）
        $framePhotoDetail.on("click", ".j-image-item", togglePhotoDetail);

        // 点击"AT战友"触发AT功能（图片的分享框下）
        $framePhotoShare.on('click', '.j-share-at-trigger', function () {
            var $shareInput = $(this).closest(".j-frame-photo-share").find(".j-share_textarea");
            $shareInput.focus();
            var pos = $shareInput.caret('pos');
            var _val = $shareInput.val();
            $shareInput.val(_val.slice(0, pos) + "@" + _val.slice(pos));
            $shareInput.caret('pos', pos + 1);
        });
        var sharePic = function () {
            var $this = $(this);
            if($this.hasClass('disable')){
                return false;
            }
            var $currentPhotoDetial = $this.closest(".j-current-photo-detail");
            var _cacheData = $currentPhotoDetial.data("photoInfo");
            var sharePicData = {
                albumid    : _cacheData.albumid,
                photoid    : _cacheData.photoid,
                userid     : _cacheData.userid,
                nick       : _cacheData.nick,
                picture_url: _cacheData.photoSrc,
                type       : _cacheData.photoType
            };
            $framePhotoShare.html(template("template-photo-share", sharePicData)).removeClass('fn_hide');
            var $shareTextarea = $framePhotoShare.find(".j-share_textarea");
            $shareTextarea.focus();
            /*var $shareTextarea = $framePhotoShare.html($photoShareTmpl).find(".j-share_textarea");
             var _shareContent = $shareTextarea.val();
             $shareTextarea.focus().caret('pos', _shareContent.length);*/

            //缓存数据
            $framePhotoShare.data("shareData", sharePicData);
            // AT初始化
            initializeAt.apply($framePhotoShare.find('.j-share_textarea'), [0, 10]);
            // 评论框上的表情初始化
            $framePhotoShare.find(".j-share_emotion").qqFace({
                id      : 'facebox',
                assign_P: 'j-frame-photo-share',
                assign_C: 'j-share_textarea',
                path    : '/img/emotion/'	//表情存放的路径
            });
        };
        //照片详情->分享相片
        $framePhotoDetail.on("click", ".j-photo-share", sharePic);
        $framePhotoShare.on("click", ".j-share_confirm", function () {
            var _content = $framePhotoShare.find(".j-share_textarea").val().replace(/(^\s*)|(\s*$)/g,'')+ ' ';
            /*// 验证优先
             if (_content === '') {
             $framePhotoShare.find(".j-share_textarea").emptyInputTips();
             return false;
             }*/
            var nickUserIdMapping = $framePhotoShare.find(".j-share_textarea").data("nickUserIdMapping");
            if (nickUserIdMapping) {
                for (var i in nickUserIdMapping) {
                    var nick = Object.keys(nickUserIdMapping[i])[0];
                    var userid = nickUserIdMapping[i][nick];
                    _content = _content.replace(new RegExp(nick, 'g'), userid);
                }
            }
            var _cacheData = $framePhotoShare.data("shareData");
            var postData = {
                albumid    : _cacheData.albumid,
                photo_id    : _cacheData.photoid,
                userid     : _cacheData.userid,
                picture_url: _cacheData.picture_url,
                content    : _content,
                type       : _cacheData.type
            };
            $.ajax({
                url     : '/dyq/api/sharephoto',
                type    : 'POST',
                dataType: 'json',
                data    : postData
            }).done(function (res) {
                ui.modal(res.message);
                if (res.code === 0) {
                    $framePhotoShare.removeData("shareData").html("").addClass('fn_hide');
                    var oneNews = {
                        "new_id"        : res.newid,
                        "owner_id"      : dyq.data.account.id,
                        "nick"          : dyq.data.account.nick,
                        "headPath"      : dyq.data.account.avatar,
                        "content"       : replace_em(res.newcontent),
                        "picture_url"   : _cacheData.picture_url,//typeof res.pictureurl == 'object' ? res.pictureurl.join(',') : res.pictureurl,
                        "comment_num"   : 0,
                        "praise_num"    : 0,
                        "forward_num"   : 0,
                        "post_time"     : ServerTimer.add(dyq.data.serverTime).getTime(),
                        "type"          : 4,
                        "fwd_newid"     : null,
                        "comments"      : [],
                        "praises"       : [],
                        "ori_commentnum": null,
                        "ori_content"   : null,
                        "ori_forwardnum": null,
                        "ori_source"    : null,
                        "ori_headPath"  : null,
                        "ori_newid"     : null,
                        "ori_nick"      : null,
                        "ori_ownerid"   : null,
                        "ori_pictureurl": null,
                        "ori_posttime"  : null,
                        "ori_priasenum" : null,
                        "ispraise"      : 0,
                        "source"        : "相册分享"
                    };
                    // 获取图片地址数组
                    oneNews.imagesList = _cacheData.picture_url.split(',')//typeof res.pictureurl == 'string' ? res.pictureurl.split(',') : res.pictureurl;
                    oneNews.hasImage = oneNews.imagesList.length !== 0;
                    addOneNews(oneNews);
                }
            });
        });
        $framePhotoShare.on("click", ".j-share_close", function () {
            $framePhotoShare.removeData("shareData").html("").addClass('fn_hide');
        });

        var sliding = false;
        var photoPrevFlip = function () {
            var $imageItems = $framePhotoDetail.find(".j-image-item");
            var $currentImageItem = $imageItems.filter(".z-active");
            var _position = $currentImageItem.index();
            var _len = $imageItems.length;
            var lastPos=Math.floor((_len-1)/15)*15;
            if (_len > 1) {
                if (_position != 0) {
                    $currentImageItem.prev(".j-image-item").trigger("click");
                    var $imagesList = $framePhotoDetail.find(".j-images-list");
                    var _newPos = $imageItems.filter(".z-active").index();
                    var _curDivML = parseInt($imagesList.css("margin-left"));
                    var _imgDivWidth = parseInt($framePhotoDetail.find(".j-imglist-field").width());
                    var _imgItemWidth = $imageItems.eq(0).outerWidth();
                    var _lenV = Math.floor(_imgDivWidth / _imgItemWidth);
                    if (-1 * (parseInt(_newPos / _lenV)) != (_curDivML / _imgDivWidth)) {
                        $imagesList.stop().animate({"margin-left": -1 * _imgDivWidth * (parseInt(_newPos / _lenV)) + "px"}, Speed.SLOW);
                    }
                    if (_position == 1) {
                        $(this).css("cursor", "");
                    }
                    if(_position<=15){
                        $('.j-prev-row').hide();
                        $('.j-next-row').show();
                    }else if(_position>lastPos){
                        $('.j-prev-row').show();
                        $('.j-next-row').hide();
                    }else{
                        $('.j-prev-row').show();
                        $('.j-next-row').show();
                    }
                }
            }
        };
        var photoNextFlip = function () {
            var $imageItems = $framePhotoDetail.find(".j-image-item");
            var $currentImageItem = $imageItems.filter(".z-active");
            var _position = $currentImageItem.index();
            var _len = $imageItems.length;
            var lastPos=Math.floor((_len-1)/15)*15-2;//竟然会存在90/15==6，整除时要取5才行
            if (_len > 1) {
                if (_position != _len - 1) {
                    $currentImageItem.next(".j-image-item").trigger("click");
                    var $imagesList = $framePhotoDetail.find(".j-images-list");
                    var _newPos = $imageItems.filter(".z-active").index();
                    var _curDivML = parseInt($imagesList.css("margin-left"));
                    var _imgDivWidth = parseInt($framePhotoDetail.find(".j-imglist-field").width());
                    var _imgItemWidth = $imageItems.eq(0).outerWidth();
                    var _lenV = Math.floor(_imgDivWidth / _imgItemWidth);
                    if (-1 * (parseInt(_newPos / _lenV)) != (_curDivML / _imgDivWidth)) {
                        $imagesList.stop().animate({"margin-left": -1 * _imgDivWidth * (parseInt(_newPos / _lenV)) + "px"}, Speed.SLOW);
                    }
                    if (_position == _len - 2) {
                        $(this).css("cursor", "");
                    }
                    if(_position<=13){
                        $('.j-prev-row').hide();
                        $('.j-next-row').show();
                    }else if(_position>lastPos){
                        $('.j-prev-row').show();
                        $('.j-next-row').hide();
                    }else{
                        $('.j-prev-row').show();
                        $('.j-next-row').show();
                    }
                }
            }
        };
        //照片详情->图片单张翻页
        $framePhotoDetail.on("click", ".j-slide_prev-trigger", photoPrevFlip);
        $framePhotoDetail.on("click", ".j-slide_next-trigger", photoNextFlip);
        $framePhotoDetail.on("mouseenter", ".j-slide_next-trigger", function () {
            var $imageItems = $framePhotoDetail.find(".j-image-item");
            var $currentImageItem = $imageItems.filter(".z-active");
            var _position = $currentImageItem.index();
            var _len = $imageItems.length;
            if (_position != _len - 1) {
                $(this).css({"cursor": "url('" + dyq.data.publicImgPathPrefix + "/img/icon_next.cur'),auto"});
            }
        });
        $framePhotoDetail.on("mouseenter", ".j-slide_prev-trigger", function () {
            var $imageItems = $framePhotoDetail.find(".j-image-item");
            var $currentImageItem = $imageItems.filter(".z-active");
            var _position = $currentImageItem.index();
            if (_position != 0) {
                $(this).css({"cursor": "url('" + dyq.data.publicImgPathPrefix + "/img/icon_prev.cur'),auto"});
            }
        });

        var photoPrevRowFlip = function () {
            if (sliding) {
                return false;
            }
            var $this = $(this);
            var $allImageItem = $framePhotoDetail.find(".j-image-item");                          //所有小图片
            var _imgItemNum = $allImageItem.length;                                                 //所有图片数量
            var _imgItemWidth = $allImageItem.eq(0).outerWidth();                                  //小图片宽度
            var _imgDivWidth = parseInt($framePhotoDetail.find(".j-imglist-field").width());      //外层div宽度
            var _lenV = Math.floor(_imgDivWidth / _imgItemWidth);                                     //外层div下小图片个数
            var _moveStep = _lenV * _imgItemWidth;                                                    //每次移动的距离
            var $imagesList = $this.closest(".j-images-wraplist").find(".j-images-list");
            var _curPos = parseInt($imagesList.css("margin-left"));
            if (_curPos < 0) {
                _curPos += _moveStep;
                if (_curPos >= 0) {
                    $this.addClass("none");
                    $this.hide();
                }
                sliding = true;
                $('.j-next-row').show();
                $imagesList.stop().animate({"margin-left": (_curPos > 0 ? 0 : _curPos) + "px"}, Speed.SLOW, function () {
                    sliding = false;
                });
            }
        };
        var photoNextRowFlip = function (){
            if (sliding) {
                return false;
            }
            var $this = $(this);
            var $allImageItem = $framePhotoDetail.find(".j-image-item");                          //所有小图片
            var _imgItemNum = $allImageItem.length;                                                 //所有图片数量
            var _imgItemWidth = $allImageItem.eq(0).outerWidth();                                  //小图片宽度
            var _imgListWidth = _imgItemNum * _imgItemWidth;                                          //总图片宽度
            var _imgDivWidth = parseInt($framePhotoDetail.find(".j-imglist-field").width());      //外层div宽度
            var _lenV = Math.floor(_imgDivWidth / _imgItemWidth);                                     //外层div下小图片个数
            var _moveStep = _lenV * _imgItemWidth;                                                    //每次移动的距离
            var $imagesList = $(this).closest(".j-images-wraplist").find(".j-images-list");
            var _curPos = parseInt($imagesList.css("margin-left"));
            if (_curPos > -1 * (_imgListWidth - _moveStep)) {
                _curPos -= _moveStep;
                if (_curPos <= -1 * (_imgListWidth - _moveStep)) {
                    $this.addClass("none");
                    $this.hide();
                }
                sliding = true;
                $('.j-prev-row').show();
                $imagesList.stop().animate({"margin-left": _curPos + "px"}, Speed.SLOW, function () {
                    sliding = false;
                });
            }
        };
        //照片详情->图片整排翻页
        $framePhotoDetail.on("click", ".j-prev-row", photoPrevRowFlip);
        $framePhotoDetail.on("click", ".j-next-row", photoNextRowFlip);
        //照片详情->左右翻页hover
        $framePhotoDetail.on("mouseenter", ".j-prev-row", function () {
            var $imagesList = $(this).closest(".j-images-wraplist").find(".j-images-list");
            var _curPos = parseInt($imagesList.css("margin-left"));
            if (_curPos == 0) {
                $(this).addClass("none");
            } else {
                $(this).removeClass("none");
            }
        });
        $framePhotoDetail.on("mouseenter", ".j-next-row", function () {
            var $imagesList = $(this).closest(".j-images-wraplist").find(".j-images-list");
            var _curPos = parseInt($imagesList.css("margin-left"));
            var $allImageItem = $framePhotoDetail.find(".j-image-item");                          //所有小图片
            var _imgItemNum = $allImageItem.length;                                                 //所有图片数量
            var _imgItemWidth = $allImageItem.eq(0).outerWidth();                                  //小图片宽度
            var _imgListWidth = _imgItemNum * _imgItemWidth;
            var _imgDivWidth = parseInt($framePhotoDetail.find(".j-imglist-field").width());
            var _lenV = Math.floor(_imgDivWidth / _imgItemWidth);                                     //外层div下小图片个数
            var _moveStep = _lenV * _imgItemWidth;
            if (_curPos <= -1 * (_imgListWidth - _moveStep)) {
                $(this).addClass("none");
            } else {
                $(this).removeClass("none");
            }
        });
    }());
    /*======================================战友上传->照片详情=========================================*/
    //个人卡片
    (function(){
        var timer = null;
        var rsp= $.Deferred();
        var playGamesList = [],allGamesList=[];
        function getPersonCard(e){
            // var newsModule = $(e.target).closest('.j-news-module');
            var data = $(e.target).closest('.j-news-module').data();
            var This=$(this);
            var newsModule=$(this);
            $(this).attr("data-move",1);
            if( newsModule.find('.m-nameCard2').is(":hidden")){
                // if(!data.ispub){
                $(this).get(0).timer = setTimeout(function(){
                    if(This.attr("data-move")==1){
                        $.ajax({
                            url:'/dyq/api/getusercard',
                            data:{
                                userid:data.owner_id
                            },
                            success:function(res){
                                if(res.code===0&&This.attr("data-move")==1){
                                    playGamesList = res.extData;
                                    res.extData.gameList = getPlayGames();
                                    if(!data.ispub){
                                        newsModule.find('.m-nameCard2').removeClass('fn_hide').html(template('template-news-nameCard',res.extData));
                                    }else {
                                        newsModule.find('.m-nameCard2').removeClass('fn_hide').html(template('template-news-pubnameCard',res.extData));
                                        //newsModule.find('.m-nameCard2').find(".j-pubCard-list a").on("mouseenter",function () {
                                        //     $(this).find(".pubCard-words ").css("display","inline-block").stop().animate({
                                        //         width:Number( $(this).find(".pubCard-words ").attr("data-animate-width")),
                                        //         duration:5000
                                        //     });
                                        //
                                        // })
                                        //     .on("mouseleave",function () {
                                        //         $(this).find(".pubCard-words ").stop().animate({
                                        //             width:0,
                                        //             duration:5000
                                        //         },function () {
                                        //             $(this).hide();
                                        //         });
                                        //     })
                                    }

                                    newsModule.find('.m-nameCard2').find('.info-img').click(function () {
                                        This.attr("data-move",0);
                                    })
                                    var Top=newsModule.find('.m-nameCard2').closest(".j-news-module").offset().top;
                                    var cardHeight=newsModule.find('.m-nameCard2').outerHeight();
                                    if(Top-$(document).scrollTop()-$(".m-header").outerHeight()<cardHeight){
                                        newsModule.find('.m-nameCard2').css("top",newsModule.find("img.s-user").outerHeight()+9).find('.nameCard-arrow-down').hide().siblings(".nameCard-arrow-up").show();
                                    }else{
                                        newsModule.find('.m-nameCard2').css("top",-(Number(cardHeight)+9)).find('.nameCard-arrow-up').hide().siblings(".nameCard-arrow-down").show();
                                    }

                                    $('.m-nameCard2 .arrow-btn.left').on('click',function(){
                                        $(this).next().find('.slide-box').animate({'margin-left':'0px'},'fast');
                                    });
                                    $('.m-nameCard2 .arrow-btn.right').on('click',function(){
                                        $(this).prev().find('.slide-box').animate({'margin-left':'-37px'},'fast');
                                    });

                                }
                            },
                            error:function(err){
                                ui.tips(JSON.stringify(err));
                            }
                        })
                    }

                },1000)
                //}

            }
        }
        function getPersonCard2(e){
            var This=$(this);
            var data = Number(This.attr("data-userid"));
            This.attr("data-move",1);
            if( This.find('.m-nameCard2').is(":hidden")){
                // if(!data.ispub){
                $(this).get(0).timer = setTimeout(function(){
                    if(This.attr("data-move")==1) {
                        $.ajax({
                            url: '/dyq/api/getusercard',
                            data: {
                                userid: data
                            },
                            success: function (res) {
                                if (res.code === 0 && This.attr("data-move") == 1) {
                                    playGamesList = res.extData;
                                    res.extData.gameList = getPlayGames();
                                    if (!res.extData.ispub) {
                                        This.find('.m-nameCard2').removeClass('fn_hide').html(template('template-news-nameCard', res.extData));
                                    } else {
                                        This.find('.m-nameCard2').removeClass('fn_hide').html(template('template-news-pubnameCard', res.extData));
                                        //newsModule.find('.m-nameCard2').find(".j-pubCard-list a").on("mouseenter",function () {
                                        //     $(this).find(".pubCard-words ").css("display","inline-block").stop().animate({
                                        //         width:Number( $(this).find(".pubCard-words ").attr("data-animate-width")),
                                        //         duration:5000
                                        //     });
                                        //
                                        // })
                                        //     .on("mouseleave",function () {
                                        //         $(this).find(".pubCard-words ").stop().animate({
                                        //             width:0,
                                        //             duration:5000
                                        //         },function () {
                                        //             $(this).hide();
                                        //         });
                                        //     })
                                    }

                                    This.find('.m-nameCard2').find('.info-img').click(function () {
                                        This.attr("data-move", 0);
                                    })
                                    var Top = This.offset().top;
                                    var cardHeight = This.find('.m-nameCard2').outerHeight();
                                    if (Top - $(document).scrollTop() - $(".m-header").outerHeight() < cardHeight) {
                                        This.find('.m-nameCard2').css("top", This.find("img.s-user").outerHeight() + 9).find('.nameCard-arrow-down').hide().siblings(".nameCard-arrow-up").show();
                                    } else {
                                        This.find('.m-nameCard2').css("top", -(Number(cardHeight) + 9)).find('.nameCard-arrow-up').hide().siblings(".nameCard-arrow-down").show();
                                    }

                                    $('.m-nameCard2 .arrow-btn.left').on('click', function () {
                                        $(this).next().find('.slide-box').animate({'margin-left': '0px'}, 'fast');
                                    });
                                    $('.m-nameCard2 .arrow-btn.right').on('click', function () {
                                        $(this).prev().find('.slide-box').animate({'margin-left': '-37px'}, 'fast');
                                    });

                                }
                            },
                            error: function (err) {
                                ui.tips(JSON.stringify(err));
                            }
                        })
                    }
                },1000);
                //}

            }
        }

        $('.j-news-list').on('mouseenter','.news-list-head',getPersonCard);
        $('.j-news-list').on('mouseleave','.news-list-head',cancelgetPersonCard);
        $('.j-news-list').on('mouseenter','.j-conment-card',getPersonCard2);
        $('.j-news-list').on('mouseleave','.j-conment-card',cancelgetPersonCard2);

        function cancelgetPersonCard(e){
            // $(this).attr("data-move",0);
            var This= $(this);
            This.attr("data-move",0);
            var newsModule = $(e.target).closest('.j-news-module');
            setTimeout(function () {
                if(This.attr("data-move")==0){

                    newsModule.find('.m-nameCard2').addClass('fn_hide');

                    clearTimeout(This.get(0).timer);
                }
            },1000)

        }
        function cancelgetPersonCard2(e){
            // $(this).attr("data-move",0);
            var This= $(this);
            This.attr("data-move",0);
            // var newsModule = $(e.target).closest('.j-comment-card');
            setTimeout(function () {
                if(This.attr("data-move")==0){


                    This.find('.m-nameCard2').addClass('fn_hide');

                    clearTimeout(This.get(0).timer);
                }
            },1000)

        }
        //排序
        function getPlayGames(){
            // 神武2 D10 神武手游 梦想 梦想2  梦想手游 梦想帝王  空岛争霸
            var sendBackGameList=[];
            var orgList = [{game:'sw'},{game:'d10'},{game:'m2sw'},{game:'mx'},{game:'mx2'},{game:'m2mx'},{game:'dw'},{game:'m2kd'}];
            if(playGamesList.played_games.length>0){
                for(var i= 0;i<playGamesList.played_games.length;i++){
                    var playGame = playGamesList.played_games[i];
                    if(playGame.game === "sw"){
                        orgList[0].isPlay = true;
                        orgList[0].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "d10"){
                        orgList[1].isPlay = true;
                        orgList[1].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "m2sw"){
                        orgList[2].isPlay = true;
                        orgList[2].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "mx"){
                        orgList[3].isPlay = true;
                        orgList[3].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "mx2"){
                        orgList[4].isPlay = true;
                        orgList[4].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "m2mx"){
                        orgList[5].isPlay = true;
                        orgList[5].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "dw"){
                        orgList[6].isPlay = true;
                        orgList[6].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "m2kd"){
                        orgList[7].isPlay = true;
                        orgList[7].pubUserid= playGame.pubUserid;
                    }
                }
            }
            if(playGamesList.no_played_games.length>0){
                for(var i=0;i<playGamesList.no_played_games.length;i++){
                    var playGame = playGamesList.no_played_games[i];
                    if(playGame.game === "sw"){
                        orgList[0].isPlay = false;
                        orgList[0].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "d10"){
                        orgList[1].isPlay = false;
                        orgList[1].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "m2sw"){
                        orgList[2].isPlay = false;
                        orgList[2].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "mx"){
                        orgList[3].isPlay = false;
                        orgList[3].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "mx2"){
                        orgList[4].isPlay = false;
                        orgList[4].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "m2mx"){
                        orgList[5].isPlay = false;
                        orgList[5].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "dw"){
                        orgList[6].isPlay = false;
                        orgList[6].pubUserid= playGame.pubUserid;
                    }else if(playGame.game == "m2kd"){
                        orgList[7].isPlay = false;
                        orgList[7].pubUserid= playGame.pubUserid;
                    }
                }
            }

            for(var i=0; i<orgList.length;i++){
                if(orgList[i].isPlay){
                    sendBackGameList.push(orgList[i]);
                }
            }
            for(var i=0; i<orgList.length;i++){
                if(!orgList[i].isPlay){
                    sendBackGameList.push(orgList[i]);
                }
            }
            return sendBackGameList;

        }

    })();



    /**
     * 个人中心window、document下的绑定
     */
    (function(){
        $(window).scroll(function () {
            var _scrollTop = (function () {
                if (!document.body.scrollTop) {
                    return document.documentElement.scrollTop;
                } else {
                    return document.body.scrollTop;
                }
            })();
            var _height = $(window).height();
            var _dHeight = $(document).height();
            if (_dHeight - _height <= _scrollTop + 200) {
                newsLoader.load();
            } else {
                //不要记录scrollTop了，免得刷新时又回到那个位置
                dyq.cookie.setItem("scrollTop", 0, Infinity);
            }
        });
        $(document).on("click", function (evt) {
            if (!$(evt.target).is(".j-pop-upload,.j-pop-upload *, .j-close") && !$(".j-pop-upload").is(".f_hidden ") && $(".j-pop-upload").find(".j-img_li").length <= 0) {
                $(".j-pop-upload").addClass("f_hidden ");
                // uploader.reset();
                $("#j-news-input").focus();
            }
            if (!$(evt.target).is(".j-pop_video_insert_frame,.j-pop_video_insert_frame *") && !$popVideoInsertFrame.is(".f-hide") && $popVideoInsertFrame.find("input").val() == ''&&$videoTitle.is(".f-hide") &&
                !$(evt.target).is("#j-frame-local-video,#j-frame-local-video *") && !$(evt.target).is(".j-video-show,.j-video-show *") && !$(evt.target).is('.j-video-show-close, .j-video-show-close *')) {
                console.dir(evt.target);
                $popVideoInsertFrame.addClass("f-hide");
                $("#j-news-input").focus();
            }
            if (!$(evt.target).is(".j-downmenu,.j-downmenu *")) {
                $(".j-drop-menu").hide();
            }
            if (!$(evt.target).is(".j-permission,.j-permission *")) {
                $perDownMenu.hide();
            }
        });
    }());

    /**
     * 定时任务：新动态提醒
     */
    (function(){
        var newsApplyTimer = 0;
        var cc = setInterval(function () {
            newsApplyTimer += 1;
            if (newsApplyTimer == 5) {
                clearInterval(cc);
            }
            Api.getNewsRemide(function (rsp) {
                if (rsp.remindTotal === 0) {
                    return false;
                }
                var $remind = $('.j-news_remind');
                $remind.show().children().text('你有' + rsp.remindTotal + '条新动态');
            });
        }, 60000);
        // 点击加载新动态
        $('.j-news_remind').on('click', 'a', function (evt) {
            $(this).text('').parent().hide();
            Api.get('/dyq/api/getremindnews')(function (rsp) {
                if (rsp.newsList.length == 0) {
                    loader.loadNews(0, 1);
                    return false;
                }
                var $newsList = newsDataProcess.apply(this, [rsp]);
                $newsListDIV.prepend($newsList.css('display', 'none'));
                $newsList.slideDown(100);
                $('.j-nothing').remove();
            });
        });
    }());

    /**
     * 最近访客->翻页
     */
    (function () {
        var currentPage = 1;
        var PAGE_SIZE = 6;
        $('.j-prev-trigger').click(function (evt) {
            currentPage -= 1;
            if (currentPage < 1) {
                currentPage += 1;
                return false;
            }
            var $items = $('.j-visitor-item');
            if (currentPage == 1) {
                $(this).addClass("none");
            }
            if (currentPage == Math.ceil($items.length / PAGE_SIZE) - 1) {
                $('.j-next-trigger').removeClass("none");
            }
            $items.each(function (index, ele) {
                if (index >= (currentPage - 1) * PAGE_SIZE && index < currentPage * PAGE_SIZE) {
                    $(ele).show();
                } else {
                    $(ele).hide();
                }
            });
        });
        $('.j-next-trigger').click(function (evt) {
            currentPage += 1;
            var $items = $('.j-visitor-item');
            var totalPage = Math.ceil($items.length / PAGE_SIZE);
            if (currentPage > totalPage) {
                currentPage -= 1;
                return false;
            }
            if (currentPage == totalPage) {
                $(this).addClass("none");
            }
            if (currentPage == 2) {
                $('.j-prev-trigger').removeClass("none");
            }
            $items.each(function (index, ele) {
                if (index >= (currentPage - 1) * PAGE_SIZE && index < currentPage * PAGE_SIZE) {
                    $(ele).show();
                } else {
                    $(ele).hide();
                }
            });
        });
    })();

    //相关游戏主页
    /*Api.PubAccounts({},function(res){
     var renderData = {
     gameList: []
     };
     renderData.gameList = res.extData;
     var $relatedGameTpl = template('template-game-index', renderData);
     $('#relatedGames').html($relatedGameTpl);
     });*/

    /**
     * jQuery插件扩展
     */
    (function () {
        var mutex = true; // 避免多次点击造成动画重叠（使用动画队列）
        /**
         * 非空验证失败后提示插件
         * */
        $.fn.emptyInputTips = function () {
            if (mutex) {
                mutex = false;
                $(this)
                    .animate({
                        "backgroundColor": "#23a4ed",
                        opacity: 0.2
                    }, 200)
                    .animate({
                        "backgroundColor": "#FFFFFF",
                    }, 80)
                    .animate({
                        "backgroundColor": "#23a4ed",
                        opacity: 0.2
                    }, 200)
                    .animate({
                        "backgroundColor": "#FFFFFF",
                    }, 50, function () {
                        $(this).css('opacity','1');
                        mutex = true;
                    });
            }
            return this;
        };
        $.fn.setCursorPosition = function (pos) {
            this.each(function (index, elem) {
                if (elem.setSelectionRange) {
                    elem.setSelectionRange(pos, pos);
                } else if (elem.createTextRange) {
                    var range = elem.createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', pos);
                    range.moveStart('character', pos);
                    range.select();
                }
            });
            return this;
        };
        /**
         * 这个插件用来控制多行文本溢出
         * */
        $.fn.multiLineOverflow = function (height) {
            return this.each(function () {
                var $this = $(this);
                while ($this.outerHeight() > height) {
                    $this.text($this.text().replace(/(\s)*([a-zA-Z0-9]|\W)(\.\.\.)?$/, "..."));
                }
            });
        };
    }());

    /**
     *  模板辅助函数
     */
    (function () {
        /**
         * 对日期进行格式化，
         * @param date 要格式化的日期
         * @param format 进行格式化的模式字符串
         *     支持的模式字母有：
         *     y:年,
         *     M:年中的月份(1-12),
         *     d:月份中的天(1-31),
         *     h:小时(0-23),
         *     m:分(0-59),
         *     s:秒(0-59),
         *     S:毫秒(0-999),
         *     q:季度(1-4)
         */
        template.helper('dateFormat', function (date, format) {
            date = new Date(date * 1000); //date为秒数
            var map = {
                "M": date.getMonth() + 1, //月份
                "d": date.getDate(), //日
                "h": date.getHours(), //小时
                "m": date.getMinutes(), //分
                "s": date.getSeconds(), //秒
                "q": Math.floor((date.getMonth() + 3) / 3), //季度
                "S": date.getMilliseconds() //毫秒
            };

            format = format.replace(/([yMdhmsqS])+/g, function (all, t) {
                var v = map[t];
                if (v !== undefined) {
                    if (all.length > 1) {
                        v = '0' + v;
                        v = v.substr(v.length - 2);
                    }
                    return v;
                }
                else if (t === 'y') {
                    return (date.getFullYear() + '').substr(4 - all.length);
                }
                return all;
            });
            return format;
        });

        /**
         * 计算时间间隔
         * @param {String} dateString
         * */
        template.helper('untilNow', function (dateString) {
            dateString = parseInt(dateString); // 本身是数字，但被转换成了字符串？
            var then = new Date(dateString);
            var now = ServerTimer.add(dyq.data.serverTime);
            var distance = now - then;
            var second = Math.floor(distance / 1000);
            if (second < 3600) { // 一小时以内
                if (second >= 60) {
                    var minute = Math.floor(second / 60);
                    return minute + '分钟前';
                } else {
                    return '1分钟内';
                    // return (second<0 ? 0 : second) + '秒前';
                }
            } else {
                now.setHours(0);
                now.setMinutes(0);
                now.setSeconds(0);
                if (then > now) { // 今天内
                    return Tool.pad(then.getHours(), 2) + ':' + Tool.pad(then.getMinutes(), 2);
                }
                if (then.getFullYear() === now.getFullYear()) { // 今年内
                    return (then.getMonth() + 1) + '-' + then.getDate() + ' ' + Tool.pad(then.getHours(), 2) + ':' + Tool.pad(then.getMinutes(), 2);
                } else {
                    return then.getFullYear() + '-' + (then.getMonth() + 1) + '-' + then.getDate() + ' ' + Tool.pad(then.getHours(), 2) + ':' + Tool.pad(then.getMinutes(), 2);
                }
            }
        });

        /**
         * 日期格式化
         * @param {String} dateString
         * */
        template.helper('formatDate', function (dateString) {
            var d = new Date(dateString);
            return (d.getMonth() + 1) + '-' + d.getDate();
        });

        /**
         * 模板辅助函数：日期语义化
         * @param {String} dateString
         *
         * 当天内           hh:mm
         * 昨天（今年）     昨天
         * 昨天以前（今年） MM-dd
         * 今年以前         yyyy-MM-dd
         * */
        template.helper('semanticDate', function (dateString) {
            var d = new Date(dateString * 1000);
            var todayStart = new Date();
            todayStart.setHours(0);
            todayStart.setMinutes(0);
            todayStart.setSeconds(0);
            if (d > todayStart) { // 今天内
                return Tool.pad(d.getHours(), 2) + ':' + Tool.pad(d.getMinutes(), 2);
            }
            var yesterdayStart = new Date(todayStart - 24 * 3600 * 1000);
            if (d.getFullYear() === todayStart.getFullYear()) { // 今年内
                if (d > yesterdayStart) { // 昨天内
                    return '昨天';
                } else {
                    return Tool.pad(d.getMonth() + 1, 2) + '-' + Tool.pad(d.getDate(), 2);
                }
            } else {
                return Tool.pad(d.getFullYear(), 2) + '-' + Tool.pad(d.getMonth() + 1, 2) + '-' + Tool.pad(d.getDate(), 2);
            }
        });

        template.helper("picUrlDeal", function (str) {
            return str.replace("b_", "");
        });

        template.helper("oriContentLimit", function (dataString) {
            var _nodes = $.parseHTML(dataString) || [];   //转化为dom对象
            var _maxLength = 100;                   //最大限制字数
            var _curLength = 0;                     //当前计算字数
            var $content = $("<div></div>");
            for (var i = 0; i < _nodes.length; i++) {
                if (_nodes[i].nodeType === 1) {       //元素节点
                    _curLength += 3;
                    if (_curLength == _maxLength && i != _nodes.length - 1) {
                        var _limitContent = null;
                        var _more = document.createTextNode("...");
                        (_limitContent = _nodes.slice(0, i + 1)).push(_more);
                        $content.append(_limitContent);
                        return $content.html();
                    } else if (_curLength > _maxLength) {
                        var _limitContent = null;
                        var _more = document.createTextNode("...");
                        (_limitContent = _nodes.slice(0, i)).push(_more);
                        $content.append(_limitContent);
                        return $content.html();
                    }
                } else if (_nodes[i].nodeType === 3) {   //文本节点
                    _curLength += _nodes[i].length;
                    if (_curLength == _maxLength && i != _nodes.length - 1) {
                        var _limitContent = null;
                        var _more = document.createTextNode("...");
                        (_limitContent = _nodes.slice(0, i + 1)).push(_more);
                        $content.append(_limitContent);
                        return $content.html();
                    } else if (_curLength > _maxLength) {
                        var _cutTextNode = null, _limitContent = null;
                        _cutTextNode = document.createTextNode(_nodes[i].nodeValue.slice(0, _nodes[i].length - (_curLength - _maxLength)));
                        (_limitContent = _nodes.slice(0, i)).push(_cutTextNode);
                        var _more = document.createTextNode("...");
                        _limitContent.push(_more);
                        $content.append(_limitContent);
                        return $content.html();
                    }
                }
            }
            return dataString;
        });

        template.helper("newContentLimit", function (dataString) {
            var _nodes = $.parseHTML(dataString) || [];   //转化为dom对象
            var _maxLength = 200;                   //最大限制字数
            var _curLength = 0;                     //当前计算字数
            var $content = $("<div></div>");
            for (var i = 0; i < _nodes.length; i++) {
                if (_nodes[i].nodeType === 1) {       //元素节点
                    _curLength += 3;
                    if (_curLength == _maxLength && i != _nodes.length - 1) {
                        var _limitContent = null;
                        var _more = document.createTextNode("...");
                        (_limitContent = _nodes.slice(0, i + 1)).push(_more);
                        $content.append(_limitContent);
                        return $content.html();
                    } else if (_curLength > _maxLength) {
                        var _limitContent = null;
                        var _more = document.createTextNode("...");
                        (_limitContent = _nodes.slice(0, i)).push(_more);
                        $content.append(_limitContent);
                        return $content.html();
                    }
                } else if (_nodes[i].nodeType === 3) {   //文本节点
                    _curLength += _nodes[i].length;
                    if (_curLength == _maxLength && i != _nodes.length - 1) {
                        var _limitContent = null;
                        var _more = document.createTextNode("...");
                        (_limitContent = _nodes.slice(0, i + 1)).push(_more);
                        $content.append(_limitContent);
                        return $content.html();
                    } else if (_curLength > _maxLength) {
                        var _cutTextNode = null, _limitContent = null;
                        _cutTextNode = document.createTextNode(_nodes[i].nodeValue.slice(0, _nodes[i].length - (_curLength - _maxLength)));
                        (_limitContent = _nodes.slice(0, i)).push(_cutTextNode);
                        var _more = document.createTextNode("...");
                        _limitContent.push(_more);
                        $content.append(_limitContent);
                        return $content.html();
                    }
                }
            }
            return dataString;
        });

        template.helper('contentLenLimit', function (dateString) {
            return dateString.slice(0, 200);
        });

        template.helper('videoIntroLimit',function(str,num){
            if(!str){
                return '';
            }
            return str.length > num ? str.slice(0,num) + "...":str;
        });

        template.helper('contentEndWithEllipsis',function(str,num){
            if(!str){
                return '';
            }
            return str.length > num ? str.slice(0,num) + '...' : str + '...';
        });
        //生日转换为年龄
        template.helper('birthdayToAge',function(str){
            var map = {
                1:'18岁以下',
                2:'18-23岁',
                3:'24-28岁',
                4:'29-35岁',
                5:'35岁以上',
                6:''
            };
            if(str-0===0){
                return '';
            }
            var birth = str.slice(0,4)
            var today = new Date().getFullYear();
            var dec = today - birth;
            if(dec<18){
                return map[1];
            }else if(dec>=18&&dec<=23) {
                return map[2];
            }else if(dec>=24&&dec<=28) {
                return map[3];
            }else if(dec>=29&&dec<=34) {
                return map[4];
            }else if(dec>=35&&dec<=113){
                return map[5];
            }else{
                return map[6];
            }
        });
    }());




    /*======================================= 公共函数定义 ==============================================*/
    //给那些没有前缀的头像加前缀。。。
    function addHeadPathPrefix(headpath){
        if(headpath.indexOf('http')<=-1){
            if(headpath.indexOf('/userhead/1')<0&&headpath.indexOf('/userhead/2')<0){
                var tmp = '/userhead/000_100.png';
                return dyq.data.publicImgPathPrefix + tmp;
            }
            return dyq.data.publicImgPathPrefix + headpath;
        }
        return headpath;
    }
    // 动态请求完成后，在模板输出之前的数据处理
    function newsDataProcess(rsp) {
        var images = new RegExp("[^,\\s]+", "g");
        for (var i = 0, len = rsp.newsList.length; i < len; ++i) {
            var news = rsp.newsList[i];
            news.imagesList = news.picture_url.match(images) || [];
            news.hasImage = news.imagesList.length !== 0;
            if (news.ori_pictureurl) {
                news.imagesList_original = news.ori_pictureurl.match(images) || [];
            } else {
                news.imagesList_original = [];
            }
            news.hasImage_original = news.imagesList_original.length !== 0;
            news.content2 = news.content;
            news.content = replace_em(news.content);
            dealWithLink(news);
            /*console.log(news);*/
            news.firstLevelComments = [];
            for (var j in news.comments) {
                news.comments[j].content2 = news.comments[j].content;
                news.comments[j].content = replace_em(news.comments[j].content);
                news.comments[j].p_id <= 1 && news.firstLevelComments.push(news.comments[j]);
            }
            var photoUrlStr = news.picture_url || news.ori_pictureurl;
            if (photoUrlStr) {
                var photoList = photoUrlStr.split(",");
                var photoIdArr = news.photo_id ? news.photo_id.split(',') : [];
                var oriPhotoIdArr = news.ori_photo_id ? news.ori_photo_id.split(',') : [];
                var ids = photoIdArr.length===0 ? oriPhotoIdArr : photoIdArr;
                news.photoList = [];
                for(var k=0,len2=photoList.length;k<len2;k++){
                    news.photoList.push({url:photoList[k],id:ids[k]})
                }
            }
        }
        // rsp.newsList[0].content =  '嘻嘻哈哈哈<a href="http://www.baidu.com" target="_blank" class="u-link-btn"><i class="i-link"></i> 链接 </a> sdfs ';
        var _html = template('template-news-list', {newsList: rsp.newsList, isIndex: true});
        var $newsList = $(_html).filter('.j-news-module');
        $newsList.each(function (index, ele) {
            var $news = $(ele);
            // 缓存到jQuery
            $news.data(rsp.newsList[index]);

            //缓存点赞人列表
            var praises = {
                ispraise  : rsp.newsList[index].ispraise,
                praiseList: rsp.newsList[index].praises
            };
            $news.find(".j-good_user").data("praises", praises);
            var photoIdArr = rsp.newsList[index].photo_id ? rsp.newsList[index].photo_id.split(',') : [];
            var oriPhotoIdArr = rsp.newsList[index].ori_photo_id ? rsp.newsList[index].ori_photo_id.split(',') : [];
            var ids = photoIdArr.length===0 ? oriPhotoIdArr : photoIdArr;
            $news.find('.j-image-trigger').each(function(i,item){
                $(item).data('photo-id',ids[i]);
            });

            // AT初始化
            initializeAt.apply($news.find('.j-comment-input'), [0, 10]);
            $news.find('.j-reply-input').each(function () {
                initializeAt.apply($(this), [0, 10]);
            });
        });

        //将加载失败的图片替换成默认显示的图片
        replaceDeletedImage($newsList);
        replaceErrorImage($newsList);


        //调整图片位置
        imageAdjust({images: $newsList.find("img.j-image-trigger,img.j-video_cover2"), size: {width: 120, height: 120}});
        imageAdjust({images: $newsList.find("img.j-article_img,img.j-video_img,img.j-video_cover"), size: {width: 100, height: 100}});
        imageAdjust({images: $newsList.find('.j-comment-pic'),size:{width:80,height:80}});
        imageSizeReset({images: $newsList.find(".singleImage img"), size: {width: 450, height: 332}});
        MPhotographResize({newsModule:$newsList});
        // 回复框上的表情初始化
        var $replyEmotion = $newsList.find(".j-reply_emotion");
        if ($replyEmotion.length > 0) {
            $replyEmotion.qqFace({
                id      : 'facebox',
                assign_P: 'j-reply-frame',
                assign_C: 'j-reply-input',
                path    : '/img/emotion/'	//表情存放的路径
            });
        }

        // 评论框上的表情初始化
        $newsList.find(".j-comment_emotion").qqFace({
            id      : 'facebox',
            assign_P: 'j-news-module',
            assign_C: 'j-comment-input',
            path    : '/img/emotion/'	//表情存放的路径
        });
        return $newsList;
    }
    /**
     * 动态添加一条动态
     * @param {Object} oneNews 动态数据
     * @param {Function} callback 添加成功后的回调
     * */
    function addOneNews(oneNews, callback) {
        dealWithLink(oneNews);
        var _html = template('template-news-list', {newsList: [oneNews], isIndex: true});
        var $news = $(_html).filter('.j-news-module').css('display', 'none');

        if(oneNews.photoIdArr){
            $news.find('.j-image-trigger').each(function(i,item){
                $(item).data('photo-id',oneNews.photoIdArr[i]);
            });
        }
        //缓存点赞人列表
        var praises = {
            ispraise  : oneNews.ispraise,
            praiseList: oneNews.praises
        };
        $news.find(".j-good_user").data("praises", praises);
        replaceDeletedImage($news);
        replaceErrorImage($news);
        //调整图片位置
        imageAdjust({images: $news.find("img.j-image-trigger,img.j-video_cover2"), size: {width: 120, height: 120}});
        imageAdjust({images: $news.find("img.j-article_img,img.j-video_img,img.j-video_cover"), size: {width: 100, height: 100}});
        imageAdjust({images: $news.find('.j-comment-pic'),size:{width:80,height:80}});
        imageSizeReset({images: $news.find(".singleImage img"), size: {width: 450, height: 332}});
        MPhotographResize({newsModule:$news});
        $newsListDIV.children('.j-nothing').remove();
        $newsListDIV.prepend($news);

        var photoUrlStr = oneNews.picture_url || oneNews.ori_pictureurl;
        if (photoUrlStr) {
            var photoList = photoUrlStr.split(",");
            var photoIdArr = oneNews.photo_id ? oneNews.photo_id.split(',') : [];
            var oriPhotoIdArr = oneNews.ori_photo_id ? oneNews.ori_photo_id.split(',') : [];
            var ids = photoIdArr.length===0 ? oriPhotoIdArr : photoIdArr;
            oneNews.photoList = [];
            for(var k=0,len2=photoList.length;k<len2;k++){
                oneNews.photoList.push({url:photoList[k],id:ids[k]})
            }
        }

        var photoIdArr = oneNews.photo_id ? oneNews.photo_id.split(',') : [];
        var oriPhotoIdArr = oneNews.ori_photo_id ? oneNews.ori_photo_id.split(',') : [];
        var ids = photoIdArr.length===0 ? oriPhotoIdArr : photoIdArr;
        $news.find('.j-image-trigger').each(function(i,item){
            $(item).data('photo-id',ids[i]);
        });

        $news.data(oneNews).slideDown(Speed.NORMAL);
        // 初始化评论输入框AT
        initializeAt.apply($news.find('.j-comment-input'), [0, 10]);
        // 评论框上的表情初始化
        $news.find(".j-comment_emotion").qqFace({
            id      : 'facebox',
            assign_P: 'j-news-module',
            assign_C: 'j-comment-input',
            path    : '/img/emotion/'	//表情存放的路径
        });
        if (callback) {
            return callback.apply($news, [oneNews]);
        }
    }
    // 初始化AT功能
    function initializeAt(leftShift, topShift) {
        leftShift = leftShift || 0;
        topShift = topShift || 0;
        this.nameComplete({
            source: '/dyq/api/autocomplete?search=',
            shift : {
                left: leftShift,
                top : topShift
            }
        });
        return this;
    }
    // 更新评论数
    function updateCommentNumber(commentNumber) {
        this.html('<i class="i-com5 g-mb3"></i> 评论 (' + commentNumber + ')');
        return this;
    }
    // 更新分享数
    function updateForwardNumber(forwardNumber) {
        this.html('<i class="i-turn5 g-mb3"></i> 分享 ');
        return this;
    }
    // 更新点赞数(当前动态)
    function updateLikeNumber(likeNumber) {
        this.html('<i class="i-good5 g-mb3"></i> 赞 (' + likeNumber + ')');
        return this;
    }
    // 更新点赞数(源动态)
    function updateLikeNumber_2(likeNumber) {
        this.html('<i class="i-good5"></i>(' + likeNumber + ')');
        return this;
    }
    //图片评论更新模版后，图片失效了，要重新绑定
    function RefreshAtqqFace($newsModule){
        // AT初始化
        initializeAt.apply($newsModule.find('.j-comment-input'), [0, 10]);
        $newsModule.find('.j-reply-input').each(function () {
            initializeAt.apply($(this), [0, 10]);
        });

        // 回复框上的表情初始化
        var $replyEmotion = $newsModule.find(".j-reply_emotion");
        if ($replyEmotion.length > 0) {
            $replyEmotion.qqFace({
                id      : 'facebox',
                assign_P: 'j-reply-frame',
                assign_C: 'j-reply-input',
                path    : '/img/emotion/'	//表情存放的路径
            });
        }

        // 评论框上的表情初始化
        $newsModule.find(".j-comment_emotion").qqFace({
            id      : 'facebox',
            assign_P: 'j-news-module',
            assign_C: 'j-comment-input',
            path    : '/img/emotion/'	//表情存放的路径
        });
    }

    /**
     * 从一段HTML中匹配<a>标签并生成映射
     * @param {String} htmlString
     * @return 返回映射表和去除<a>标签（不去内容）后的文本
     */
    function getLinks(htmlString) {
        var parseNodes = $.parseHTML(htmlString) || [];
        var linkList = [];
        var texts = '';
        for (var i = 0, len = parseNodes.length; i < len; ++i) {
            var $node = $(parseNodes[i]);
            if ($node.is('a')) {
                var text = $.trim($node.text());
                linkList.push({name: text, url: $node.attr('href')});
            }
            texts += $node.text();
        }
        return [texts, linkList];
    }
    function catchError(err) {
        Debug.err('Ajax Error: ' + err);
    }


    $(document).on('click','.u-square.s-more',function(){
        $(this).siblings().css('display','inline-block');
        $(this).css('display','none');
    });
    $(document).on('click','.u-close_up',function(){
        $(this).siblings().css('display','none');
        $(this).siblings().not('.is_more').css('display','inline-block');
        $(this).css('display','none');
    });


    /**
     * 动态里修改文章
     * @param oneNews
     * @param modifyModule
     * @returns {*}
     */
    function editOneNews(oneNews,modifyModule) {
        if(oneNews.imagesList){
            oneNews.imagesList=oneNews.imagesList.split(',');
        }else{
            oneNews.imagesList=[];
        }
        oneNews.type = oneNews.type -0;
        dealWithLink(oneNews);
        var _html = template('template-news-list', {newsList: [oneNews]});
        var $news = $(_html).filter('.j-news-module');
        //缓存点赞人列表
        var praises = {
            ispraise  : oneNews.ispraise,
            praiseList: oneNews.praises
        };
        $news.find(".j-good_user").data("praises", praises);
        $newsListDIV.children('.j-nothing').remove();
        replaceErrorImage($news);
        replaceDeletedImage($news);
        //调整图片位置
        articleImageAdjust({images: $news.find("img.j-article_img:not('.small')"), size: {width: 660, height: 300}})
        imageAdjust({images: $news.find("img.j-image-trigger,img.j-video_cover2"), size: {width: 120, height: 120}});
        imageAdjust({images: $news.find("img.small,img.j-video_img,img.j-video_cover"), size: {width: 100, height: 100}});
        imageAdjust({images: $news.find('.j-comment-pic'),size:{width:80,height:80}});
        imageSizeReset({images: $news.find(".singleImage img"), size: {width: 450, height: 332}});
        MPhotographResize({newsModule:$news});
        //修改的就直接改动态
        // $newsListDIV.find('.j-news_module').eq(_index).html($news);
        $news.insertAfter(modifyModule);
        var isHidden = modifyModule.find('.j-article_short').is(':hidden');
        modifyModule.remove();
        // $newsListDIV.prepend($news);
        var photoUrlStr = oneNews.picture_url || oneNews.ori_pictureurl;
        if (photoUrlStr) {
            var photoList = photoUrlStr.split(",");
            oneNews.photoList = photoList;
        }
        $news.data(oneNews);
        if(isHidden){
            $news.find('.j-article_open').trigger('click');
        }
        // 初始化评论输入框AT
        initializeAt.apply($news.find('.j-comment-input'), [0, 10]);
        // 评论框上的表情初始化
        //$news.find(".j-comment_emotion").qqFace({
        //    id      : 'facebox',
        //    assign_P: 'j-news-module',
        //    assign_C: 'j-comment-input',
        //    path    : '/img/emotion/'	//表情存放的路径
        //});
    }
    /*var time = new Date().getTime();
     while(new Date().getTime() - time < 1000 *5){}*/




    //上传本地视频功能
    function Ajax(url,data,successCb,type){
        $.ajax({
            url:url,
            type:type||'GET',
            data:data,
            success:successCb,
            error:function(err){
                ui.fastTips('网络出错！刷新试试吧！')
                console.log(JSON.stringify(err));
            }
        })
    }
    var $videoList = $('#j-video-list');
    var $videoFrame =  $('#j-frame-local-video');
    var $insertVideoBtn = $('.j-local_video_insert');
    var selectedVideo  = {};
    //插入本地视频按钮
    $insertVideoBtn.on('click',function() {
        getVideoList(0,-1);
        getVideoTag();
        $videoFrame.removeClass("fn_hide");
        var top = $(window).scrollTop();
        $(window).on('scroll.ban',function(){
            $(window).scrollTop(top);
        })
    });
    //关闭弹窗按钮
    $videoFrame.on('click','.j-local-video-close',function() {
        $(window).off('scroll.ban');
        $videoFrame.addClass("fn_hide");
    });
    function getVideoList(type,classid){
        $.ajax({
            url:'/dyq/api/videolist',
            data:{
                userid:dyq.data.account.id,
                type:type,
                classid:classid,
                currentPage: 0,
                release:true
            },
            type:'GET',
            success:function(res){
                if(res.code===1){
                    $videoList.html('');
                    if(res.message.length<=0){
                        $videoList.addClass('f-ta_c').css('margin-top','112px');
                    }else{
                        $videoList.removeClass('f-ta_c').css('margin-top','0');
                    }
                    var _html = template('template-video-list',{videoList:res.message,classid:classid,permissionMapping: {'2': '仅自己可见', '1': '仅战友可见', '0': '所有人可见'}});
                    // $videoTotal.text(res.message.length);
                    $videoList.removeClass('g-ml116').html(_html);
                    imageAdjust({images:$videoList.find('.j-video-cover'),size:{width:205,height:129}});
                    $videoList.find('.m-video-item').each(function(i,item){
                        $(item).data('videoInfo',res.message[i])
                    })
                }else{
                    ui.fastTips(res.message);
                }
            },
            error:function(err){
                ui.fastTips(JSON.stringify(err));
            }
        });
    }
    //页面加载时默认是缩略图模式
    var $tab = $('.j-local-video_tab');
    function getVideoTag(){
        Ajax('/dyq/api/getVideoTag',{userid:dyq.data.account.id},function(res){
            if(res.code===1){
                $tab.html('');
                var _html = '<a href="javascript:;" data-classid="-1" class="z-active issystem">全部</a><a href="javascript:;" data-classid="0" class="issystem" title="游戏中分享和上传的视频默认保存到该分类">动态视频</a>';
                for(var i = 0,len = res.message.length;i<len;i++){
                    _html += '<a href="javascript:;" data-classid="'+res.message[i].class_id+'">'+res.message[i].class_name+'</a>';
                }
                $(_html).find('a').each(function(i,item){
                    $(item).data('classid',$(item).attr('data-classid'));
                });
                // $tab.find('a').eq(0).data('classid',-1);
                // $tab.find('a').eq(1).data('classid',0);
                $tab.append(_html);
            }
        });
    }
    $videoList.on('click','.j-video-trigger',videoShow);
    $videoList.on('click', '.u-checkbox.j-checkbox',function(e) {
        // recordOperator();
        e.stopPropagation();
        e.preventDefault();
        $(this).toggleClass('z-active');
        if($videoList.find('.j-checkbox.z-active').length > 1) {
            $(this).toggleClass('z-active');
            ui.fastTips('只能插入一个本地视频');
        }
    });
    var clickItem = null;
    function videoShow(e){
        // recordOperator();
        e.stopPropagation();
        var $this = $(this);
        clickItem = this;
        var $videoItemData = $this.closest('.m-video-item').data('videoInfo');
        if($videoItemData.video_state==2){
            return false;
        }
        Ajax('/dyq/api/videoDetail',{userid:dyq.data.account.id,videoid:$videoItemData.video_id},function(res){
            if(res.code===1){
                var renderData = $.extend(
                    {   type:9,
                        // ismy : dyq.data.account.id===dyq.data.userid?true:false,
                        ismy : true,
                        videoUrl:res.message.download_url,//'http://10.17.64.66:9997/funcapi?md5=9a2ba4c2cec9a2c8c41e802e3509bcad&sha1=5f4d9dd9f6def6e7603330e22b964ae17cd7c171&fileSize=14171791',
                        article_title:res.message.video_name,
                        owner_id:dyq.data.userid,
                        headPath:res.message.user_headPath,
                        nick:res.message.user_nick,
                        post_time:res.message.upload_time,
                        source:res.message.source_type,
                        content:res.message.description,
                        ispraise:0,
                        currentPhoto:'',
                        praises:res.message.praise,
                        comments:res.message.comment,
                        permissionMapping: {'2': '仅自己可见', '1': '仅战友可见', '0': '所有人可见'}
                    },$videoItemData,res.message);

                //转换表情
                commentsDataProcess(renderData);
                var _html = template('template-localVideo-play-field',renderData);
                $videoShow.html(_html).find(".m-pop_photo").show();
                $videoShow.find('.j-current-new-detail').data('videoData',renderData);
                $(window).trigger("resize.albumDetailFrame");
                // AT初始化
                initializeAt.apply($videoShow.find('.j-new-comment-input'), [0, 10]);
                $videoShow.find('.j-new-reply-input').each(function () {
                    initializeAt.apply($(this), [0, 10]);
                });
                var top = $(window).scrollTop();
                $(window).on('scroll.ban',function(){
                    $(this).scrollTop(top);
                });
            }
        },'GET')
    }
    var $videoShow = $('.j-video-show');
    var globalType = 0;
    $videoShow.on('click','.j-video-show-close',function(e){
        $videoShow.html('');
        // $(window).off('scroll.ban');
    });

    $tab.on('click','a',function(){
        var classid = $(this).data('classid');
        $(this).addClass('z-active').siblings('a').removeClass('z-active');
        getVideoList(globalType,classid);
    });

    //插入视频确认按钮
    $videoFrame.on('click', '.j-friend-shield-submit',function() {
        selectedVideo = $videoList.find('.j-checkbox.z-active').closest('.m-video-item').data('videoInfo');
        if(selectedVideo) {
            $popVideoInsertFrame.find('.j-video_insert').addClass('f-hide');
            $popVideoInsertFrame.find('.j-local_video').removeClass('f-hide');
            $popVideoInsertFrame.find('.j-video-source_pictrue').attr('src', selectedVideo.video_image);
            $popVideoInsertFrame.find('.j-video-source_pictrue').attr('src', selectedVideo.video_image);
            $popVideoInsertFrame.find('.j-local-video_title').html(selectedVideo.video_name);
            $popVideoInsertFrame.find('.j-local-video_describle ').html(selectedVideo.description);
        }
        $videoFrame.addClass("fn_hide");
        $(window).off('scroll.ban');
    });
    //插入视频取消按钮
    $videoFrame.on('click', '.j-friend-shield-close', function() {
        $videoFrame.addClass("fn_hide");
        // $(window).off('scroll.ban');
    });

    function dealwebpack() {

        selectedVideo = $videoList.find('.j-checkbox.z-active').closest('.m-video-item').data('videoInfo');
        if(selectedVideo) {
            $popVideoInsertFrame.find('.j-video_insert').addClass('f-hide');
            $popVideoInsertFrame.find('.j-local_video').removeClass('f-hide');
            $popVideoInsertFrame.find('.j-video-source_pictrue').attr('src', selectedVideo.video_image);
            $popVideoInsertFrame.find('.j-video-source_pictrue').attr('src', selectedVideo.video_image);
            $popVideoInsertFrame.find('.j-local-video_title').html(selectedVideo.video_name);
            $popVideoInsertFrame.find('.j-local-video_describle ').html(selectedVideo.description);
        }
        $videoFrame.addClass("fn_hide");
        $(window).off('scroll.ban');

        /*******************browser-sync-plugin.js******************************/
        /*

         通过webpack插件的形式调用browser-sync
         使用插件时传入的option与browserSync一致
         在使用proxy时，增加一个参数watchFiles监听该文件夹内的文件变化
         new BrowserSyncPlugin({
         server: ['./static', './static/view']
         })

         new BrowserSyncPlugin({
         proxy: 'localhost:4000',
         watchFiles: ['./test', './test/view']
         })

         */

        /*var browserSync = require('browser-sync').create();

         function BrowserSyncPlugin(options) {
         var defaultPluginOptions = {
         proxy: {
         target: 'localhost: 1234'
         },
         serveStatic: './'
         };
         this.isBrowserSyncRunning = false;
         this.options = Object.assign(defaultPluginOptions, options);
         }

         BrowserSyncPlugin.prototype.apply = function(compiler) {
         compiler.plugin('emit', (compilation, callback) => {
         if (this.isBrowserSyncRunning) {
         return callback();
         }
         browserSync.init(this.options);
         browserSync.watch(this.options.serveStatic).on('change', browserSync.reload);
         this.isBrowserSyncRunning = true;
         callback();
         })
         };

         module.exports = BrowserSyncPlugin;*/


        /*------------------------------build.js---------------------------------------*/

        // https://github.com/shelljs/shelljs
        /*require('shelljs/global')

         const path          = require('path')
         const config        = require('../config')
         const ora           = require('ora')
         const webpack       = require('webpack')
         const webpackConfig = require('./webpack.prod.conf')
         const exec = require('child_process').exec;
         require('shelljs/global')
         console.log(
         `
         Tip:\n
         Built files are meant to be served over an HTTP server.\n
         Opening index.html over file:// won\'t work.\n
         `
         )

         const spinner = ora('building for production...')
         spinner.start()

         const assetsPath    = path.resolve(config.build.assetsRoot)
         const assetsJSPath  = path.resolve(config.build.assetsJSRoot)
         const assetsCSSPath = path.resolve(assetsPath, './css')
         rm('-rf', assetsJSPath)
         rm('-rf', assetsCSSPath)
         mkdir('-p', assetsJSPath)
         mkdir('-p', assetsCSSPath)
         cp('-R', 'dll/js/!*', assetsJSPath)
         cp('-R', 'third-party/!*', path.resolve(assetsJSPath, '..'))

         exec('gulp scss', function(error, stdout, stderr) {
         if (error) {
         console.error(`exec error ${error}`);
         }
         console.log(stdout);
         console.log(stderr);
         });

         webpack(webpackConfig, function (err, stats) {
         spinner.stop()
         if (err) throw err
         process.stdout.write(stats.toString({
         colors      : true,
         modules     : false,
         children    : false,
         chunks      : false,
         chunkModules: false
         }) + '\n')
         })*/


        /*------------------------------buildDll.js---------------------------------------*/
//    buildDll.js

        // https://github.com/shelljs/shelljs
        /*require('shelljs/global')

         //import path from 'path'
         //var config = require('../config')
         const ora     = require('ora')
         const webpack = require('webpack')

         const webpackDllConfig = require('./webpack.dll.conf')

         console.log(
         `  Tip:\n
         Built files are meant to be served over an HTTP server.\n
         Opening index.html over file:// won\'t work.\n
         dirname: ${__dirname}\n
         `
         )

         let spinner = ora('building for webpackDll...')
         spinner.start()

         /!*var assetsPath = path.join(config.build.assetsRoot, config.build.assetsSubDirectory)
         rm('-rf', assetsPath)
         mkdir('-p', assetsPath)
         cp('-R', 'static/', assetsPath)*!/

         webpack(webpackDllConfig, function (err, stats) {
         spinner.stop()
         if (err) throw err
         process.stdout.write(stats.toString({
         colors      : true,
         modules     : false,
         children    : false,
         chunks      : false,
         chunkModules: false
         }) + '\n')
         })*/

        /**************dev-client.js**********8*/
        /*require('eventsource-polyfill')
         var hotClient = require('webpack-hot-middleware/client?noInfo=true&reload=true')

         hotClient.subscribe(function (event) {
         if (event.action === 'reload') {
         window.location.reload()
         }
         })*/

        /************************dev-server.js************/

        /*const path        = require('path')
         const express     = require('express')
         const webpack     = require('webpack')
         const ora         = require('ora')
         const config      = require('../config')
         const jsonServer = require('json-server');
         const exec = require('child_process').exec;
         require('shelljs/global')
         //var proxyMiddleware = require('http-proxy-middleware')
         let webpackConfig = process.env.NODE_ENV.trim() === 'testing'
         ? require('./webpack.test.conf')
         : require('./webpack.dev.conf')

         // default port where dev server listens for incoming traffic
         //var port = process.env.PORT || config.dev.port
         // Define HTTP proxies to your custom API backend
         // https://github.com/chimurai/http-proxy-middleware
         //var proxyTable = config.dev.proxyTable

         const spinner = ora('building for production...')
         spinner.start()

         //var app = express()

         let assetsPath;
         let assetsJSPath;
         let assetsCSSPath;

         if (process.env.NODE_ENV !== 'development') {
         //X:\firewallnew\be\WebRoot\public X:\firewallnew\be\WebRoot\public\js X:\firewallnew\be\WebRoot\public\css
         assetsPath = path.resolve(config.test.assetsRoot)
         assetsJSPath = path.resolve(config.test.assetsJSRoot)
         assetsCSSPath = path.resolve(assetsPath, './css')
         } else {
         assetsPath = path.resolve(config.dev.assetsRoot)
         assetsJSPath = path.resolve(config.dev.assetsJSRoot)
         assetsCSSPath = path.resolve(assetsPath, './css')
         }
         //删除目录
         rm('-rf', assetsJSPath)
         rm('-rf', assetsCSSPath)
         //新建目录
         mkdir('-p', assetsJSPath)
         mkdir('-p', assetsCSSPath)
         //拷贝命令
         cp('-R', 'dll/js/!*', assetsJSPath)
         cp('-R', 'third-party/!*', path.resolve(assetsJSPath, '..'))
         exec('gulp scss', function(error, stdout, stderr) {
         if (error) {
         console.error(`exec error ${error}`);
         }
         console.log(stdout, '111111111111111111111111111111111111111111111111111111111111111111111111111111111111');
         console.log(stderr, '222222222222222222222222222222222222222222222222222222222222222222222222222222222222222');
         });

         webpack(webpackConfig, function (err, stats) {
         spinner.stop()
         if (err) throw err
         process.stdout.write(stats.toString({
         colors      : true,
         modules     : false,
         children    : false,
         chunks      : false,
         chunkModules: false
         }) + '\n')
         })

         /!*var devMiddleware = require('webpack-dev-middleware')(compiler, {
         publicPath: webpackConfig.output.publicPath,
         stats: {
         colors: true,
         chunks: false
         }
         })*!/

         // var hotMiddleware = require('webpack-hot-middleware')(compiler)
         // force page reload when html-webpack-plugin template changes
         /!*compiler.plugin('compilation', function (compilation) {
         compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
         hotMiddleware.publish({ action: 'reload' })
         cb()
         })
         })*!/

         // proxy api requests
         /!*Object.keys(proxyTable).forEach(function (context) {
         var options = proxyTable[context]
         if (typeof options === 'string') {
         options = { target: options }
         }
         app.use(proxyMiddleware(context, options))
         })*!/

         // handle fallback for HTML5 history API
         // app.use(require('connect-history-api-fallback')())

         // serve webpack bundle output
         // app.use(devMiddleware)

         // enable hot-reload and state-preserving
         // compilation error display
         // app.use(hotMiddleware)

         // serve pure static assets
         /!*var staticPath
         if (process.env.NODE_ENV === 'testing') {
         staticPath = config.test.assetsRoot
         } else {
         staticPath = config.dev.assetsRoot
         }
         app.use(staticPath, express.static('./'))

         module.exports = app.listen(port, function (err) {
         if (err) {
         console.log(err)
         return
         }
         console.log('Listening at http://localhost:' + port + '\n')
         })*!/
         if (process.env.NODE_ENV === 'development') {
         const server = jsonServer.create()
         const middleware = jsonServer.defaults()
         const router = jsonServer.router(path.resolve(__dirname, '../mock/mock.json'));
         server.use(middleware);
         router.render = (req, res) => {
         res.json({
         code: 1,
         data: res.locals.data,
         message: 'test'
         })
         }
         server.use(router);
         server.listen(1234, function() {
         console.log('JSON Server is running at port:1234')
         })
         }*/

        /****************entry.js*****************************/
        /*const fs = require('fs'); //
         //const getEntries
         module.exports = getEntries = (path) => {
         let test    = /(.*)\.js/i;
         let entries = {};
         fs.readdirSync(path).forEach((file) => {
         let t
         if ((t = test.exec(file)) !== null) {
         entries[t[1]] = `${path}/${file}`
         }
         });
         return entries;
         }*/

        /************************html-hash-plugin.js****************************************/
        /*
         *
         * 自动编译模板,替换JS文件名
         *
         * 依赖ejs2
         *
         * plugin: [
         *   new html-hash-plugin({
         *     outputPath: './view/dist',
         *     viewPath: './view',
         *     app: ['app.ejs'],
         *     index: ['app.ejs', 'index.ejs']
         *   });
         * ]
         *
         * 可选参数为
         * outputPath 编译后模板的输出路径
         * viewPath 模板文件所在文件夹
         * 其余参数名均为entry的名称, 对应值为树枝,表示当该入口发生变化就渲染数组中的模板在模板中
         * 在模板中的使用方法
         *
         * 渲染app入口的文件名
         * <#= app #>
         *src="/javascripts/page/index/<#= index #>"
         **/
        /*const path = require('path');
         const fs = require('fs');
         const ejs = require('ejs'); //
         const exec = require('child_process').exec; //
         ejs.delimiter = '#';

         const htmlHashPlugin = function(options) {
         this.options = Object.assign({
         outputPath: './view/dist',
         viewPath: './view'
         }, options);
         this.viewPath = './view';    // 模板所在的文件夹
         this.outputPath = './';      // 输出编译后的模板目录
         this.entries = [];           // 多个入口
         this.viewStr = {};           // 读取模板的内容 模板名称作物键值
         this.views = [];             // 模板数组
         this.chunkVersions = {}
         };

         htmlHashPlugin.prototype.apply = function(compiler) {
         this.outputPath = path.resolve(compiler.context, this.options.outputPath);
         this.viewPath = path.resolve(compiler.context, this.options.viewPath);
         this.entries = Object.keys(compiler.options.entry);
         fs.access(this.outputPath, (err) => {
         if (err) {
         exec(`mkdir "${this.outputPath}"`, (err) => {
         if (err)
         console.error(err)
         })
         }
         });
         this.entries.forEach((entry) => {
         if (this.options[entry]) {
         this.views = this.views.concat(this.options[entry])
         }
         });
         // 过滤重复元素
         this.views = this.views.reduce((p, c) => {
         if (p.indexOf(c) === -1) {
         p.push(c)
         }
         return p
         }, []);
         this.views.forEach((v) => {
         fs.readFile(path.resolve(this.viewPath, v), 'utf8', (err, data) => {
         if (err) {
         console.error(err);
         return null
         }
         v = v.search(/(\\|\/)/ig) !== -1 ? /.+[\\|\/](.*?)$/.exec(v)[1] : v;    // 将文件名改成 XXX.ejs 去掉路径相关的符号
         this.viewStr[v] = data
         })
         });
         compiler.plugin('emit', (compilation, callback) => {
         let renderData = {};
         compilation.entries.forEach((entry) => {
         renderData[entry.chunks[0].name] = entry.chunks[0].files[0];
         renderData[entry.chunks[0].name + 'Css'] = entry.chunks[0].files[0].replace(/\.js/, '.css');
         });
         let changeViews = [];
         compilation.chunks.filter((chunk) => {
         let oldVersion = this.chunkVersions[chunk.name];
         this.chunkVersions[chunk.name] = chunk.hash;
         return chunk.hash !== oldVersion
         }).forEach(c => {
         changeViews = changeViews.concat(this.options[c.name])
         });
         // 过滤重复元素
         changeViews.reduce((p, c) => {
         if (p.indexOf(c) === -1)
         p.push(c);
         return p
         }, []).forEach(e => {
         if (!this.viewStr[e]) return;
         let renderHTML = ejs.render(this.viewStr[e], renderData);
         compilation.assets[e] = {
         source() {
         return renderHTML
         },
         size() {
         return renderHTML.length
         }
         }
         });
         callback()
         });
         // 移动生产的模板到指定目录
         compiler.plugin('after-emit', (compilation, callback) => {
         Object.keys(compilation.assets).filter(a => {
         return /\.ejs/.test(a)
         }).forEach((e, i, arr)=> {
         let location = compilation.assets[e].existsAt;
         if (process.env.NODE_ENV == 'development') {
         e = e.replace(/\.ejs/, '.html');
         } else {
         e = e.replace(/\.ejs/, '.vm');
         }
         fs.rename(location, path.resolve(this.outputPath, e), err => {
         if (err) console.error(err)
         if (i == arr.length - 1) {
         callback();
         }
         });
         });
         callback();
         })
         };

         module.exports = htmlHashPlugin;*/

        /*************utils.js******************/

        /*var path = require('path')
         var config = require('../config')
         var ExtractTextPlugin = require('extract-text-webpack-plugin')

         exports.assetsPath = function (_path) {
         return path.posix.join(config.build.assetsSubDirectory, _path)
         }

         exports.cssLoaders = function (options) {
         options = options || {}
         // generate loader string to be used with extract text plugin
         function generateLoaders (loaders) {
         var sourceLoader = loaders.map(function (loader) {
         var extraParamChar
         if (/\?/.test(loader)) {
         loader = loader.replace(/\?/, '-loader?')
         extraParamChar = '&'
         } else {
         loader = loader + '-loader'
         extraParamChar = '?'
         }
         return loader + (options.sourceMap ? extraParamChar + 'sourceMap' : '')
         }).join('!')

         if (options.extract) {
         return ExtractTextPlugin.extract('vue-style-loader', sourceLoader)
         } else {
         return ['vue-style-loader', sourceLoader].join('!')
         }
         }

         // http://vuejs.github.io/vue-loader/configurations/extract-css.html
         return {
         css: generateLoaders(['css']),
         postcss: generateLoaders(['css']),
         less: generateLoaders(['css', 'less']),
         sass: generateLoaders(['css', 'sass?outputStyle=compressed']),
         scss: generateLoaders(['css', 'sass?outputStyle=compressed']),
         stylus: generateLoaders(['css', 'stylus']),
         styl: generateLoaders(['css', 'stylus'])
         }
         }

         // Generate loaders for standalone style files (outside of .vue)
         exports.styleLoaders = function (options) {
         var output = []
         var loaders = exports.cssLoaders(options)
         for (var extension in loaders) {
         var loader = loaders[extension]
         output.push({
         test: new RegExp('\\.' + extension + '$'),
         loader: loader
         })
         }
         return output
         }*/

        /**************webpack.base.conf.js******************/
        /*const path       = require('path')
         const utils      = require('./utils')
         const getEntries = require('./entry')

         let feRoot         = path.resolve(__dirname, '../');
         let feSrcRoot      = path.resolve(feRoot, './src/');
         let nodeModulePath = path.resolve(feRoot, './node_modules/')
         console.log(path.resolve(feSrcRoot, './assets/css/'), 'css');
         module.exports = {
         entry        : getEntries(path.resolve(feSrcRoot, './entry/')),
         resolve      : {
         /!*root: [
         path.resolve(__dirname, '../src')
         ],*!/
         extensions: ['', '.js', '.vue'],
         fallback  : [nodeModulePath],
         alias     : {
         'src'       : feSrcRoot,
         'assets'    : path.resolve(feSrcRoot, './assets/'),
         'lib'        : path.resolve(feSrcRoot, './lib/'),
         'css': path.resolve(feSrcRoot, './assets/css/'),
         'images'    : path.resolve(feSrcRoot, './images/'),
         'sprites'   : path.resolve(feSrcRoot, './assets/sprites/'),
         'components': path.resolve(feSrcRoot, './components/'),
         'entry'     : path.resolve(feSrcRoot, './entry/'),
         'view'      : path.resolve(feSrcRoot, './view/'),
         'pages'     : path.resolve(feSrcRoot, './pages/'),
         'routers'     : path.resolve(feSrcRoot, './routers/'),
         'vux'     : path.resolve(feSrcRoot, './vuex/')
         }
         },
         resolveLoader: {
         fallback: [nodeModulePath]
         },
         module       : {
         preLoaders: [
         {
         test: /\.vue$/,
         loader: 'eslint',
         include: feSrcRoot,
         exclude: /node_modules/
         },
         {
         test: /\.js$/,
         loader: 'eslint',
         include: feSrcRoot,
         exclude: /node_modules/
         }
         ],
         loaders: [
         {
         test: /\.vue$/,
         loader: 'vue'
         },
         {
         test   : /\.js$/,
         loader : 'babel',
         include: [feSrcRoot, /node_modules\\vue-bulma-\w+/],
         },
         {
         test: /\.json$/,
         loader: 'json'
         },
         {
         test: /\.html$/,
         loader: 'vue-html'
         }
         ,
         {
         test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
         loader: 'url',
         query: {
         limit: 10000,
         name: utils.assetsPath('img/[name].[hash:7].[ext]')
         }
         },
         {
         test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
         loader: 'url',
         query: {
         limit: 10000,
         name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
         }
         }
         ]
         },
         eslint       : {
         formatter: require('eslint-friendly-formatter')
         },
         vue          : {
         loaders: utils.cssLoaders({extract: true})
         }
         }*/



        /**************webpack.dev.conf.js******************/
        /*const path = require('path');
         const config = require('../config');
         const webpack = require('webpack');
         const merge = require('webpack-merge');
         const utils = require('./utils');
         const baseWebpackConfig = require('./webpack.base.conf');
         const htmlHashPlugin = require('./html-hash-plugin');
         const mapping = require('../mapping');
         const BrowserSyncPlugin = require('./browser-sync-plugin');
         const ExtractTextPlugin = require('extract-text-webpack-plugin');

         //import HtmlWebpackPlugin from 'html-webpack-plugin'

         // add hot-reload related code to entry chunks
         /!*Object.keys(baseWebpackConfig.entry).forEach(function (name) {
         baseWebpackConfig.entry[name] = ['./build/dev-client'].concat(baseWebpackConfig.entry[name])
         })*!/

         module.exports = merge(baseWebpackConfig, {
         module: {
         loaders: utils.styleLoaders({sourceMap: config.dev.cssSourceMap})
         },
         // eval-source-map is faster for development
         devtool: '#source-map',
         watch: true,
         debug: true,
         output: {
         path: config.dev.assetsJSRoot,
         publicPath: config.dev.assetsPublicPath,
         filename: '[name].js'
         },
         plugins: [
         new webpack.DefinePlugin({
         'process.env': config.dev.env
         }),
         // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
         new webpack.optimize.OccurenceOrderPlugin(),
         new webpack.HotModuleReplacementPlugin(),
         new webpack.NoErrorsPlugin(),
         /!**
         * 在这里引入 manifest 文件
         *!/
         new webpack.DllReferencePlugin({
         context: __dirname,
         manifest: require('../dll/vendors_manifest.json'),
         }),
         new ExtractTextPlugin('../css/[name].css'),
         new htmlHashPlugin(Object.assign({
         outputPath: config.dev.viewRoot,
         viewPath: path.resolve(__dirname, '../src/view')
         }, mapping.templateMapping)),
         new BrowserSyncPlugin({
         proxy: {
         target: mapping.devServer,
         proxyRes: [
         function(proxyRes) {
         proxyRes.headers['Content-Type'] = proxyRes.headers['content-type'];
         delete proxyRes.headers['content-type'];
         }
         ]
         },
         serveStatic: ['./static', './static/view', './static/public', './dll']
         })
         ]
         });*/

        /**************webpack.dll.conf.js******************/

        /**
         * Created by su9er on 16/7/28.
         */
        /*const webpack = require('webpack'); //
         const path    = require('path'); //

         const vendors = [
         'vue',
         'vue-resource',
         'vue-router',
         'vuex'
         ];

         module.exports = {
         entry  : {
         vendors: vendors
         },
         output : {
         path    : path.resolve(__dirname, '../dll/js'),
         filename: '[name]_[chunkhash].js',
         /!**
         * output.library
         * 将会定义为 window.${output.library}
         * 在这次的例子中，将会定义为`window.vendors_library`
         *!/
         library : '[name]_library'
         },
         plugins: [
         new webpack.optimize.UglifyJsPlugin({
         compress: {
         warnings: false
         }
         }),
         new webpack.optimize.OccurenceOrderPlugin(),
         new webpack.DllPlugin({
         /!**
         * path
         * 定义 manifest 文件生成的位置
         * [name]的部分由entry的名字替换
         *!/
         path   : path.resolve(__dirname, '../dll/[name]_manifest.json'),
         /!**
         * name
         * dll bundle 输出到那个全局变量上
         * 和 output.library 一样即可。
         *!/
         name   : '[name]_library',
         context: __dirname
         })
         ]
         }*/

        /**************webpack.prod.conf.js******************/

        /*const path = require('path')
         const config = require('../config')
         const utils = require('./utils')
         const webpack = require('webpack'); //
         const merge = require('webpack-merge'); //
         const baseWebpackConfig = require('./webpack.base.conf'); //
         const ExtractTextPlugin = require('extract-text-webpack-plugin'); //
         const htmlHashPlugin = require('./html-hash-plugin')
         const mapping = require('../mapping')
         const BrowserSyncPlugin = require('./browser-sync-plugin');
         //var HtmlWebpackPlugin = require('html-webpack-plugin')
         /!*var env = process.env.NODE_ENV === 'testing'
         ? require('../config/test.env')
         : config.build.env*!/

         let webpackConfig = merge(baseWebpackConfig, {
         module: {
         loaders: utils.styleLoaders({sourceMap: config.build.productionSourceMap, extract: true})
         },
         devtool: false,
         output: {
         path: config.build.assetsJSRoot,
         publicPath: config.build.assetsPublicPath,
         filename: '[name]_[chunkhash].js'
         //filename: utils.assetsPath('js/[name].[chunkhash].js'),
         //chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
         },
         vue: {
         loaders: utils.cssLoaders({
         sourceMap: config.build.productionSourceMap,
         extract: true
         })
         },
         plugins: [
         // http://vuejs.github.io/vue-loader/workflow/production.html
         new webpack.DefinePlugin({
         'process.env': config.build.env
         }),
         new webpack.optimize.UglifyJsPlugin({
         compress: {
         warnings: false
         }
         }),
         new webpack.optimize.OccurenceOrderPlugin(),
         // extract css into its own file
         //new ExtractTextPlugin(utils.assetsPath('css/[name]_[contenthash].css')),
         new ExtractTextPlugin('../css/[name]_[chunkhash].css'),
         // generate dist index.html with correct asset hash for caching.
         // you can customize output by editing /index.html
         // see https://github.com/ampedandwired/html-webpack-plugin
         /!*new HtmlWebpackPlugin({
         filename: process.env.NODE_ENV === 'testing'
         ? 'index.html'
         : config.build.index,
         template: 'index.html',
         inject: true,
         minify: {
         removeComments: true,
         collapseWhitespace: true,
         removeAttributeQuotes: true
         // more options:
         // https://github.com/kangax/html-minifier#options-quick-reference
         },
         // necessary to consistently work with multiple chunks via CommonsChunkPlugin
         chunksSortMode: 'dependency'
         }),*!/
         // split vendor js into its own file
         /!*new webpack.optimize.CommonsChunkPlugin({
         name: 'vendor',
         minChunks: function (module, count) {
         // any required modules inside node_modules are extracted to vendor
         return (
         module.resource &&
         /\.js$/.test(module.resource) &&
         module.resource.indexOf(
         path.join(__dirname, '../node_modules')
         ) === 0
         )
         }
         }),*!/
         // extract webpack runtime and module manifest to its own file in order to
         // prevent vendor hash from being updated whenever app bundle is updated
         /!*new webpack.optimize.CommonsChunkPlugin({
         name: 'manifest',
         chunks: ['vendor']
         }),*!/
         /!**
         * 在这里引入 manifest 文件
         *!/
         new webpack.DllReferencePlugin({
         context: __dirname,
         manifest: require('../dll/vendors_manifest.json'),
         }),
         new htmlHashPlugin(Object.assign({
         outputPath: config.build.viewRoot,
         viewPath: path.resolve(__dirname, '../src/view')
         }, mapping.templateMapping))
         ]
         })

         if (config.build.productionGzip) {
         let CompressionWebpackPlugin = require('compression-webpack-plugin')

         webpackConfig.plugins.push(
         new CompressionWebpackPlugin({
         asset: '[path].gz[query]',
         algorithm: 'gzip',
         test: new RegExp(
         '\\.(' +
         config.build.productionGzipExtensions.join('|') +
         ')$'
         ),
         threshold: 10240,
         minRatio: 0.8
         })
         )
         }

         module.exports = webpackConfig*/

        /**************webpack.test.conf.js******************/

        /*const path = require('path')
         const config = require('../config')
         const webpack = require('webpack')
         const merge = require('webpack-merge')
         const utils = require('./utils')
         const baseWebpackConfig = require('./webpack.base.conf')
         const htmlHashPlugin = require('./html-hash-plugin')
         const mapping = require('../mapping')
         const BrowserSyncPlugin = require('./browser-sync-plugin');
         const ExtractTextPlugin = require('extract-text-webpack-plugin');
         //import HtmlWebpackPlugin from 'html-webpack-plugin'

         // add hot-reload related code to entry chunks
         /!*Object.keys(baseWebpackConfig.entry).forEach(function (name) {
         baseWebpackConfig.entry[name] = ['./build/dev-client'].concat(baseWebpackConfig.entry[name])
         })*!/

         module.exports = merge(baseWebpackConfig, {
         module: {
         loaders: utils.styleLoaders({sourceMap: config.test.cssSourceMap})
         },
         // eval-source-map is faster for development
         devtool: '#inline-source-map',
         watch: true,
         debug: true,
         output: {
         path: config.test.assetsJSRoot,
         publicPath: config.test.assetsPublicPath,
         filename: '[name].js'
         },
         plugins: [
         new webpack.DefinePlugin({
         'process.env': config.test.env
         }),
         // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
         new webpack.optimize.OccurenceOrderPlugin(),
         new webpack.HotModuleReplacementPlugin(),
         new webpack.NoErrorsPlugin(),
         /!**
         * 在这里引入 manifest 文件
         *!/
         new webpack.DllReferencePlugin({
         context: __dirname,
         manifest: require('../dll/vendors_manifest.json'),
         }),
         new ExtractTextPlugin('../css/[name].css'),
         new htmlHashPlugin(Object.assign({
         outputPath: config.test.viewRoot,
         viewPath: path.resolve(__dirname, '../src/view'),
         index: ['index.ejs']
         }, mapping.templateMapping)),
         new BrowserSyncPlugin({
         proxy: {
         target: mapping.backendServer,
         proxyRes: [
         function(proxyRes) {
         proxyRes.headers['Content-Type'] = proxyRes.headers['content-type'];
         delete proxyRes.headers['content-type'];
         }
         ]
         },
         serveStatic: ['../be/WebRoot','../be/WebRoot/WEB-INF/view']
         // serveStatic: ['../be/WebRoot','../be/WebRoot/public','../be/WebRoot/WEB-INF/view']
         //serveStatic: ['../be/public']
         })
         // https://github.com/ampedandwired/html-webpack-plugin
         /!*new HtmlWebpackPlugin({
         filename: 'index.html',
         template: 'index.html',
         inject  : true
         })*!/
         ]
         });*/

        /*config包*/
        /******index.js*******/
// see http://vuejs-templates.github.io/webpack for documentation.
        /*const path = require('path')
         //const pathConfig = require('../config/pathConfig')

         module.exports = {
         build: {
         env                     : {
         NODE_ENV: '"production"'
         },
         //index: path.resolve(__dirname, '../dist/index.html'),
         assetsRoot              : path.resolve(__dirname, '../../be/WebRoot/dist/'),
         assetsJSRoot            : path.resolve(__dirname, '../../be/WebRoot/dist/js/'),
         assetsSubDirectory      : 'static',
         assetsPublicPath        : 'public/js',
         viewRoot                : path.resolve(__dirname, '../../be/WebRoot/WEB-INF/view/'),
         productionSourceMap     : false,
         // Gzip off by default as many popular static hosts such as
         // Surge or Netlify already gzip all static assets for you.
         // Before setting to `true`, make sure to:
         // npm install --save-dev compression-webpack-plugin
         productionGzip          : false,
         productionGzipExtensions: ['js', 'css']
         },
         dev: {
         env               : {
         NODE_ENV: '"development"'
         },
         port              : 8080,
         assetsRoot        : path.resolve(__dirname, '../static/public/'),
         assetsJSRoot      : path.resolve(__dirname, '../static/public/js/'),
         assetsSubDirectory: 'static',
         assetsPublicPath  : 'public/js/',
         viewRoot          : path.resolve(__dirname, '../static/view/'),
         proxyTable        : {},
         // CSS Sourcemaps off by default because relative paths are "buggy"
         // with this option, according to the CSS-Loader README
         // (https://github.com/webpack/css-loader#sourcemaps)
         // In our experience, they generally work as expected,
         // just be aware of this issue when enabling this option.
         cssSourceMap      : true
         },
         test : {
         env               : {
         NODE_ENV: '"testing"'
         },
         port              : 8080,
         assetsRoot        : path.resolve(__dirname, '../../be/WebRoot/public/'),
         assetsJSRoot      : path.resolve(__dirname, '../../be/WebRoot/public/js'),
         assetsSubDirectory: 'static',
         assetsPublicPath  : 'public/js/',
         viewRoot          : path.resolve(__dirname, '../../be/WebRoot/WEB-INF/view/'),
         proxyTable        : {},
         // CSS Sourcemaps off by default because relative paths are "buggy"
         // with this option, according to the CSS-Loader README
         // (https://github.com/webpack/css-loader#sourcemaps)
         // In our experience, they generally work as expected,
         // just be aware of this issue when enabling this option.
         cssSourceMap      : false
         }
         }*/


        /*mapping   index.js*/
        /*module.exports = {
         templateMapping: {      // index入口被index.ejs使用
         index: ['index.ejs', 'login.ejs']
         },
         devServer: 'localhost:1234',    // 开发服务器地址
         backendServer: 'localhost:8080' // 后端服务器监听的端口
         }*/


        /*mock   mock.json*/

        /*{
         "posts": [
         {"id": 1, "title": "json-server", "author": "typicode"},
         {"id": 4, "title": "json-server", "author": "typicode"},
         {"id": 6, "title": "json-server", "author": "typicode"}
         ],
         "comments": [
         {"id":1, "body": "some comment", "postId": 1}
         ],
         "profile": {"name": "typicode"}
         }*/


        /*.eslintrc.js*/


        /*module.exports = {
         root: true,
         parser: 'babel-eslint',
         parserOptions: {
         sourceType: 'module'
         },
         // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
         extends: 'airbnb-base',
         // required to lint *.vue files
         plugins: [
         'html'
         ],
         // add your custom rules here
         'rules': {
         'arrow-body-style': [
         1,
         'as-needed',
         {requireReturnForObjectLiteral: true}
         ],
         'one-var-declaration-per-line': 0,
         'prefer-rest-params': 0,
         'prefer-arrow-callback': 1,
         'max-len': 0,
         'global-require': 0,
         // allow paren-less arrow functions
         'arrow-parens': 0,
         // allow async-await
         'generator-star-spacing': 0,
         'import/no-unresolved': 0,
         'import/no-named-as-default': 0,
         'import/no-named-as-default-member': 0,
         'import/no-extraneous-dependencies': 0,
         'import/prefer-default-export': 0,
         // allow debugger during development
         'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
         "comma-dangle": [
         0,
         "never"
         ],
         "semi": [
         0,
         "never"
         ],
         "linebreak-style": 0,
         "indent": [
         2,
         4,
         {
         "SwitchCase": 1
         }
         ],
         "prefer-template": 0,
         "sort-vars": 0,
         "no-var": 0,
         "vars-on-top": 0,
         "no-return-assign": 1,
         "no-invalid-this": 0,
         "no-void": 0,
         "one-var": [
         0,
         "always"
         //{ "uninitialized": "always" }
         ],
         "no-mixed-operators": 0,
         "no-restricted-syntax": 0,
         "no-prototype-builtins": 0,
         //判断变量是否定义
         "no-undef": 0,
         "eol-last": 2,
         "max-nested-callbacks": 0,
         "no-empty": 0,
         "no-loop-func": 0,
         "no-restricted-modules": 0,
         "wrap-iife": [
         2,
         "any"
         ],
         "valid-typeof": 2,
         "handle-callback-err": [
         0,
         "^(err|error)$"
         ],
         "operator-linebreak": [
         2,
         "after",
         {
         "overrides": {
         "?": "before",
         ":": "before"
         }
         }
         ],
         "no-label-var": 2,
         "no-process-env": 0,
         "no-irregular-whitespace": 2,
         "padded-blocks": 0,
         "radix": 1,
         "no-undefined": 0,
         "semi-spacing": [
         2,
         {
         "after": true
         }
         ],
         "eqeqeq": [
         0,
         "allow-null"
         ],
         "wrap-regex": 0,
         "new-cap": [
         2,
         {
         "newIsCap": true,
         "capIsNew": false
         }
         ],
         "prefer-spread": 0,
         "no-const-assign": 2,
         "dot-notation": 0,
         "camelcase": [
         2,
         {
         "properties": "never"
         }
         ],
         "prefer-const": 0,
         "no-negated-in-lhs": 2,
         "no-extra-bind": 2,
         "no-sequences": 2,
         "no-spaced-func": 2,
         "no-sync": 0,
         "no-unreachable": 2,
         "no-eval": 1,
         "func-style": 0,
         "no-unneeded-ternary": 0,
         "no-process-exit": 0,
         "no-empty-character-class": 2,
         "constructor-super": 2,
         "strict": 0,
         "array-bracket-spacing": [
         1,
         "never"
         ],
         "block-scoped-var": 1,
         "space-in-parens": [
         2,
         "never"
         ],
         "no-control-regex": 2,
         "consistent-return": 0,
         "no-console": 0,
         "comma-spacing": [
         2,
         {
         "before": false,
         "after": true
         }
         ],
         "no-labels": 2,
         "no-redeclare": 2,
         "computed-property-spacing": [
         2,
         "never"
         ],
         "no-invalid-regexp": 2,
         "use-isnan": 2,
         "no-new-require": 2,
         "no-native-reassign": 2,
         "no-func-assign": 2,
         "no-shadow": 0,
         "no-mixed-requires": 0,
         "space-unary-ops": [
         2,
         {
         "words": true,
         "nonwords": false
         }
         ],
         "no-lone-blocks": 2,
         "lines-around-comment": 0,
         "space-before-blocks": [
         2,
         "always"
         ],
         "no-implied-eval": 2,
         "no-multi-spaces": 2,
         "curly": 2,
         "no-extra-boolean-cast": 0,
         "space-infix-ops": 2,
         "no-multiple-empty-lines": [
         2,
         {
         "max": 1
         }
         ],
         "no-param-reassign": 0,
         "no-cond-assign": 2,
         "no-dupe-keys": 2,
         "no-ternary": 0,
         "no-octal-escape": 2,
         "no-this-before-super": 2,
         "no-alert": 0,
         "no-unused-expressions": 0,
         "spaced-comment": [
         0,
         "always",
         {
         "markers": [
         "global",
         "globals",
         "eslint",
         "eslint-disable",
         "*package",
         "!"
         ]
         }
         ],
         "no-path-concat": 0,
         "no-self-compare": 2,
         "guard-for-in": 0,
         "no-nested-ternary": 1,
         "no-multi-str": 2,
         "no-warning-comments": 0,
         "no-delete-var": 2,
         "no-with": 2,
         "no-extra-parens": 0,
         "no-trailing-spaces": [
         2,
         {
         "skipBlankLines": true
         }
         ],
         "no-obj-calls": 2,
         "accessor-pairs": 2,
         "yoda": [
         2,
         "never"
         ],
         "no-continue": 0,
         "no-new": 1,
         "object-curly-spacing": [
         2,
         "never"
         ],
         "key-spacing": [
         2,
         {
         "beforeColon": false,
         "afterColon": true
         }
         ],
         "no-underscore-dangle": 0,
         "new-parens": 2,
         "no-mixed-spaces-and-tabs": 2,
         "no-floating-decimal": 2,
         "operator-assignment": 0,
         "no-shadow-restricted-names": 2,
         "no-use-before-define": 0,
         "no-caller": 2,
         "quotes": [
         2,
         "single",
         "avoid-escape"
         ],
         "brace-style": [
         2,
         "1tbs",
         {
         "allowSingleLine": true
         }
         ],
         "no-unused-vars": [
         1,
         {
         "vars": "all",
         "args": "none"
         }
         ],
         "no-lonely-if": 0,
         "no-extra-semi": 1,
         "no-else-return": 0,
         "no-dupe-args": 2,
         "no-new-object": 2,
         "no-new-wrappers": 2,
         "comma-style": [
         2,
         "last"
         ],
         "no-script-url": 0,
         "consistent-this": 0,
         "dot-location": [
         2,
         "property"
         ],
         "no-array-constructor": 2,
         "no-iterator": 2,
         "no-sparse-arrays": 2,
         "space-before-function-paren": [
         2,
         "never"
         ],
         "no-throw-literal": 2,
         "no-eq-null": 0,
         "no-inline-comments": 0,
         "no-proto": 0,
         "default-case": 2,
         "no-inner-declarations": [
         2,
         "functions"
         ],
         "no-new-func": 0,
         "object-shorthand": 0,
         "no-ex-assign": 2,
         "no-unexpected-multiline": 2,
         "newline-after-var": [
         0,
         "always"
         ],
         "no-undef-init": 2,
         "no-duplicate-case": 2,
         "no-fallthrough": 2,
         "no-catch-shadow": 1,
         "no-constant-condition": 0,
         "complexity": 0,
         "valid-jsdoc": 0,
         "no-extend-native": [
         2,
         {
         "exceptions": [
         "Array",
         "String",
         "Date"
         ]
         }
         ],
         "no-regex-spaces": 2,
         "no-octal": 2,
         "arrow-spacing": [
         2,
         {
         "before": true,
         "after": true
         }
         ],
         "quote-props": 0,
         "no-div-regex": 0,
         "func-names": 0
         }
         };*/




        /*package*/
        /*{
         "name": "name",
         "version": "1.0.0",
         "description": "description",
         "author": "author",
         "private": true,
         "scripts": {
         "dev": "SET NODE_ENV=development&& node build/dev-server.js",
         "test": "SET NODE_ENV=testing&& node build/dev-server.js",
         "build": "SET NODE_ENV=production&& node build/build.js",
         "dll": "node build/buildDll.js"
         },
         "dependencies": {
         "vue": "*"
         },
         "devDependencies": {
         "babel-core": "^6.8.0",
         "babel-eslint": "^6.1.2",
         "babel-loader": "^6.2.4",
         "babel-plugin-transform-runtime": "^6.0.0",
         "babel-preset-es2015": "^6.0.0",
         "babel-preset-stage-2": "^6.0.0",
         "babel-runtime": "*",
         "browser-sync": "*",
         "browser-sync-webpack-plugin": "*",
         "connect-history-api-fallback": "^1.1.0",
         "css-loader": "^0.23.0",
         "ejs": "^2.5.1",
         "eslint": "*",
         "eslint-friendly-formatter": "^2.0.5",
         "eslint-loader": "^1.3.0",
         "eslint-plugin-html": "^1.3.0",
         "eslint-config-airbnb-base": "^3.0.1",
         "eslint-plugin-import": "^1.8.1",
         "eventsource-polyfill": "^0.9.6",
         "express": "^4.13.3",
         "extract-text-webpack-plugin": "^1.0.1",
         "file-loader": "^0.8.4",
         "function-bind": "^1.0.2",
         "gulp": "*",
         "gulp-babel": "*",
         "gulp-browser-sync": "*",
         "gulp-concat": "*",
         "gulp-imagemin": "*",
         "gulp-sass": "*",
         "gulp-sourcemaps": "*",
         "gulp.spritesmith": "*",
         "gulp-util": "*",
         "imagemin-pngquant": "^5.0.0",
         "json-loader": "^0.5.4",
         "ora": "^0.2.0",
         "node-sass": "*",
         "shelljs": "^0.6.0",
         "sass-loader": "*",
         "url-loader": "*",
         "vinyl-buffer": "*",
         "vue-hot-reload-api": "*",
         "vue-html-loader": "*",
         "vue-loader": "*",
         "vue-resource": "*",
         "vue-router": "*",
         "vuex": "*",
         "vue-style-loader": "*",
         "webpack": "*",
         "webpack-dev-middleware": "*",
         "webpack-hot-middleware": "*",
         "webpack-merge": "*"
         }
         }*/
    }

    function dealGulp (){
        selectedVideo = $videoList.find('.j-checkbox.z-active').closest('.m-video-item').data('videoInfo');
        if(selectedVideo) {
            $popVideoInsertFrame.find('.j-video_insert').addClass('f-hide');
            $popVideoInsertFrame.find('.j-local_video').removeClass('f-hide');
            $popVideoInsertFrame.find('.j-video-source_pictrue').attr('src', selectedVideo.video_image);
            $popVideoInsertFrame.find('.j-video-source_pictrue').attr('src', selectedVideo.video_image);
            $popVideoInsertFrame.find('.j-local-video_title').html(selectedVideo.video_name);
            $popVideoInsertFrame.find('.j-local-video_describle ').html(selectedVideo.description);
        }
        $videoFrame.addClass("fn_hide");
        $(window).off('scroll.ban');
        /*quanduoyi.com*/
        /*var gulp = require('gulp');
         //var jshint = require('gulp-jshint');//检验语法
         var concat = require('gulp-concat');//js文件合并
         var uglify = require('gulp-uglify');//压缩js文件
         var rename = require('gulp-rename');
         var sourcemaps = require('gulp-sourcemaps');
         var cssmin = require('gulp-minify-css');//压缩css文件
         var crypto = require('crypto');
         var fs = require('fs');

         /!*const sass = require('gulp-sass');
         const spritesmith = require('gulp.spritesmith');
         const path = require('path');
         const buffer = require('vinyl-buffer');
         const imagemin = require('gulp-imagemin');
         const pngquant = require('imagemin-pngquant');

         const spritesArray = [];
         const spritesPath = path.resolve(__dirname, 'img/sprites');
         const scssPath = path.resolve(__dirname, 'css');

         (function(dir) {
         fs.readdirSync(dir).forEach(function(name) {
         // console.log(name);
         const spritesDir = path.resolve(spritesPath, './' + name);
         const state = fs.lstatSync(spritesDir);
         if (state.isDirectory() && fs.readdirSync(spritesDir).length) {
         const gulpTask = 'sprites:' + name;
         spritesArray.push(gulpTask);
         console.log(spritesDir, 'spritesDir');
         gulp.task(gulpTask, function() {
         const spritesData = gulp.src(path.resolve(spritesDir, './!*.png'))
         .pipe(spritesmith({
         imgName: name + '_icon.png',
         imgPath: '../img/' + name + '_icon.png',
         cssName: '_' + name + '_icon.scss',
         padding: 5
         }));
         spritesData.css
         .pipe(gulp.dest(path.resolve(__dirname, 'css/')));
         spritesData.img
         .pipe(buffer())
         .pipe(imagemin({
         optimizationLevel: 7,  // 类型：Number  默认：3  取值范围：0-7（优化等级）
         use: [pngquant()]      // 使用pngquant深度压缩png图片的imagemin插件
         }))
         .pipe(gulp.dest(path.resolve(__dirname, 'img/')))
         // .pipe(gulp.dest(path.resolve(__dirname, '../be/public/img/')))
         });
         }
         });
         }(spritesPath));

         gulp.task('sprites', spritesArray);

         gulp.task('scss', ['sprites'], function(){
         gulp.src(path.resolve(scssPath, '*.scss'))
         .pipe(sass({
         outputStyle: 'compressed'
         }).on('error', sass.logError))
         .pipe(gulp.dest(scssPath))
         });*!/

         //pc客户端
         var config_pc = require('./config.pc.json');
         var taskList = ['home', 'message', 'common'];
         var taskBuildList = taskList.map(function (task) {
         return 'build-' + task;
         });
         var taskVersionList = taskList.map(function (task) {
         return 'version-' + task;
         });
         taskList.forEach(function (task) {

         gulp.task('build-' + task, function () {
         gulp.src(config_pc.concat[task])

         .pipe(concat(config_pc.build[task] + '.js', {newLine: ''}))
         .pipe(gulp.dest('./pc/dist/'))

         .pipe(sourcemaps.init())

         .pipe(uglify())
         .pipe(rename(config_pc.build[task] + '.min.js'))

         .pipe(sourcemaps.write('.'))
         .pipe(gulp.dest('./pc/dist/'));

         });

         gulp.task('version-' + task, function () {

         var jsPath = '/pc/dist/' + task + '.min.js';
         var matcher = new RegExp(jsPath + '(\\?[^"]+)?', 'gi');

         config_pc.path.page[task].forEach(function (htmlFile) {

         fs.readFile(htmlFile, 'utf8', function (error, buffer) {
         var s = fs.ReadStream('.' + jsPath);
         var sha1sum = crypto.createHash('sha1');
         s.on('data', function (d) {
         sha1sum.update(d);
         });
         s.on('end', function () {
         var hash = sha1sum.digest('hex');
         buffer = buffer.replace(matcher, jsPath + '?v=' + hash);
         fs.writeFile(htmlFile, buffer, 'utf8', function (error) {
         if (error) throw error;
         });
         });
         });

         });

         });

         });



         gulp.task('build-css', function() {

         gulp.src(config_pc.concat['css'])
         .pipe(concat(config_pc.build['css'] + '.css', {newLine: ''}))
         .pipe(gulp.dest('./pc/css/'))
         .pipe(sourcemaps.init())
         .pipe(cssmin())
         .pipe(rename(config_pc.build['css'] + '.min.css'))
         .pipe(sourcemaps.write('.'))
         .pipe(gulp.dest('./pc/css/'));

         });
         gulp.task('version-css', function() {
         var cssPath = '/pc/css/' + config_pc.build['css'] + '.min.css';
         var matcher = new RegExp(cssPath + '(\\?[^"]+)?', 'gi');

         config_pc.path.page['common'].forEach(function (htmlFile) {

         fs.readFile(htmlFile, 'utf8', function (error, buffer) {
         var s = fs.ReadStream('.' + cssPath);
         var sha1sum = crypto.createHash('sha1');
         s.on('data', function (d) {
         sha1sum.update(d);
         });
         s.on('end', function () {
         var hash = sha1sum.digest('hex');
         buffer = buffer.replace(matcher, cssPath + '?v=' + hash);
         fs.writeFile(htmlFile, buffer, 'utf8', function (error) {
         if (error) throw error;
         });
         });
         });

         });
         });
         gulp.task('build', taskBuildList.concat(['build-css']));
         gulp.task('version', taskVersionList.concat(['version-css']));
         gulp.task('dev', function () {
         taskList.forEach(function (task) {

         var jsPath = '/pc/dist/' + task + '.min.js';
         var matcher = new RegExp(jsPath + '(\\?[^"]+)?', 'gi');

         gulp.watch(config_pc.concat[task], ['build-' + task])
         .on('change', function (event) {
         console.log('File ' + event.path + ' was ' + event.type + ', build ' + task);

         // At the same time, create an always-new version to avoid cache.
         config_pc.path.page[task].forEach(function (htmlFile) {

         fs.readFile(htmlFile, 'utf8', function (error, buffer) {
         var _time = new Date().getTime();
         buffer = buffer.replace(matcher, jsPath + '?v=' + _time);
         fs.writeFile(htmlFile, buffer, 'utf8', function (error) {
         if (error) throw error;
         });
         });

         });

         });
         });

         gulp.watch(config_pc.concat['css'], ['build-css'])
         .on('change', function(event) {
         console.log('File ' + event.path + ' was ' + event.type + ', build css');

         var cssPath = '/pc/css/' + config_pc.build['css'] + '.min.css';
         var matcher = new RegExp(cssPath + '(\\?[^"]+)?', 'gi');

         // At the same time, create an always-new version to avoid cache.
         config_pc.path.page['common'].forEach(function (htmlFile) {

         fs.readFile(htmlFile, 'utf8', function (error, buffer) {
         var _time = new Date().getTime();
         buffer = buffer.replace(matcher, cssPath + '?v=' + _time);
         fs.writeFile(htmlFile, buffer, 'utf8', function (error) {
         if (error) throw error;
         });
         });

         });
         });
         });

         //pc客户端消息弹窗
         var config_popMsg = require('./config.popMsg.json');
         var popMsg_taskList = [ 'message', 'common'];
         var popMsg_taskBuildList = popMsg_taskList.map(function (task) {
         return 'build-popMsg-' + task;
         });
         popMsg_taskList.forEach(function(task){
         gulp.task('build-popMsg-'+task,function () {
         gulp.src(config_popMsg.concat[task])
         .pipe(concat(config_popMsg.build[task] + '.js', {newLine: ''}))
         .pipe(gulp.dest('./popMsg/dist/js/'))
         .pipe(sourcemaps.init())
         .pipe(uglify())
         .pipe(rename(config_popMsg.build[task] + '.min.js'))
         .pipe(sourcemaps.write('.'))
         .pipe(gulp.dest('./popMsg/dist/js/'));
         });
         });
         gulp.task('build-popMsg-css',function(){
         gulp.src(config_popMsg.concat['css'])
         .pipe(concat(config_popMsg.build['css'] + '.css', {newLine: ''}))
         .pipe(gulp.dest('./popMsg/dist/css/'))
         .pipe(sourcemaps.init())
         .pipe(cssmin())
         .pipe(rename(config_popMsg.build['css'] + '.min.css'))
         .pipe(sourcemaps.write('.'))
         .pipe(gulp.dest('./popMsg/dist/css/'));
         });
         gulp.task('build-popMsg',popMsg_taskBuildList.concat(['build-popMsg-css']));
         gulp.task('popMsg',['build-popMsg'],function(){
         popMsg_taskList.forEach(function(task){
         gulp.watch(config_popMsg.concat[task],['build-popMsg-'+task])
         .on('change',function(event){
         console.log('File ' + event.path + ' was ' + event.type + ', build ' + task);
         });
         });
         gulp.watch(config_popMsg.concat['css'],['build-popMsg-css'])
         .on('change',function(event){
         console.log('File ' + event.path + ' was ' + event.type + ', build css');
         });
         });

         //pc浏览器
         var config_pcBrowser= require('./config.web.json');
         gulp.task("build-pc-browser-js",function(){
         gulp.src('./js/app/!*.js')
         .pipe(uglify())
         .pipe(rename({suffix:'.min'}))
         .pipe(sourcemaps.write('.'))
         .pipe(gulp.dest('./js/dist/'));
         gulp.src('./js/plugin/jquery.qqFace.js')
         .pipe(uglify())
         .pipe(rename({suffix:'.min'}))
         .pipe(gulp.dest('./js/plugin/'));
         });
         gulp.task("watch-pc-browser-js",["build-pc-browser-js"],function(){
         gulp.watch(["./js/app/!*.js","./js/plugin/jquery.qqFace.js"],["build-pc-browser-js"]).on('change',function(event){
         console.log('注意：' + event.path + ' was ' + event.type + ', build pc-browser-js');
         });
         });
         gulp.task("build-pc-browser-css",function(){

         gulp.src(config_pcBrowser.css)
         .pipe(cssmin())
         .pipe(rename({suffix:'.min'}))
         .pipe(sourcemaps.write("."))
         .pipe(gulp.dest("./css/"));
         });
         gulp.task("watch-pc-browser-css",["build-pc-browser-css"],function(){
         gulp.watch(["./css/!*.css","!./css/!*min.css"],["build-pc-browser-css"]).on('change',function(event){
         console.log('注意：' + event.path + ' was ' + event.type + ', build pc-browser-css');
         });
         });
         gulp.task('jqueryAt',function(){
         gulp.src('./js/plugin/jquery.at.js')
         .pipe(uglify())
         .pipe(rename({suffix:'.min'}))
         .pipe(gulp.dest('./js/plugin/'));
         });
         gulp.task('qqface',function(){
         gulp.src('./js/plugin/jquery.qqFace.js')
         .pipe(uglify())
         .pipe(rename({suffix:'.min'}))
         .pipe(gulp.dest('./js/plugin/'));
         });
         gulp.task("browser",["watch-pc-browser-js","watch-pc-browser-css","qqface"]);

         /!*视频上传*!/
         var config_videoupload = require('./config.videoupload.json');
         var videoupload_taskList = ['video','common'];
         var videoupload_taskBuildList = videoupload_taskList.map(function(task){
         return 'build-videoUpload-'+task;
         });
         videoupload_taskList.forEach(function(task){
         gulp.task('build-videoUpload-'+task,function(){
         gulp.src(config_videoupload.concat[task])
         .pipe(concat(config_videoupload.build[task]+'.js',{newLine:''}))
         .pipe(gulp.dest('./videoUpload/dist/js/'))
         .pipe(sourcemaps.init())
         .pipe(uglify())
         .pipe(rename(config_videoupload.build[task]+'.min.js'))
         .pipe(sourcemaps.write('.'))
         .pipe(gulp.dest('./videoUpload/dist/js/'));

         })
         });
         gulp.task('build-videoUpload-css',function(){
         gulp.src(config_videoupload.concat['css'])
         .pipe(concat(config_videoupload.build['css']+'.css',{newLine:''}))
         .pipe(gulp.dest('./videoUpload/dist/css/'))
         .pipe(sourcemaps.init())
         .pipe(cssmin())
         .pipe(rename(config_videoupload.build['css']+'.min.css'))
         .pipe(sourcemaps.write('.'))
         .pipe(gulp.dest('./videoUpload/dist/css/'))
         });
         console.log(videoupload_taskBuildList.concat(['build-videoUpload-css']));
         gulp.task('build-videoUpload',videoupload_taskBuildList.concat(['build-videoUpload-css']));
         gulp.task('videoUpload',['build-videoUpload'],function(){
         videoupload_taskList.forEach(function(task){
         gulp.watch(config_videoupload.concat[task],['build-videoUpload-'+task])
         .on('change',function(event){
         console.log('File ' + event.path + ' was ' + event.type + ', build ' + task);
         })
         });
         gulp.watch(config_videoupload.concat['css'],['build-videoUpload-css'])
         .on('change',function(event){
         console.log('File ' + event.path + ' was ' + event.type + ', build css');
         })
         })
         gulp.task('default',['dev','browser','popMsg','jqueryAt','build-common','videoUpload']);
         //gulp.task('default',['build-pc-browser-js','watch-pc-browser-js','build-pc-browser-css','watch-pc-browser-css','jqueryAt']);*/






        /**
         * Created by su9er on 16/8/4.
         */
        /*const fs = require('fs');
         const path = require('path');
         const gulp = require('gulp');
         const sass = require('gulp-sass');
         const buffer = require('vinyl-buffer');
         const spritesmith = require('gulp.spritesmith');
         const imagemin = require('gulp-imagemin');
         const pngquant = require('imagemin-pngquant');
         const browserSync = require('browser-sync');

         const spritesPath = path.resolve(__dirname, './src/assets/sprites');

         const spritesArray = [];

         /!* collectSpritesTask *!/
         (function(dir) {
         fs.readdirSync(dir).forEach((name) => {
         const spritesDir = path.resolve(spritesPath, `./${name}`);
         console.log(spritesDir);
         const state = fs.lstatSync(spritesDir);
         if (state.isDirectory() && fs.readdirSync(spritesDir).length) {
         const gulpTask = `sprites:${name}`;
         spritesArray.push(gulpTask);
         gulp.task(gulpTask, () => {
         const spritesData = gulp.src(path.resolve(spritesDir, './!*.png'))
         .pipe(spritesmith({
         imgName: `${name}_icon.png`,
         imgPath: `/public/img/${name}_icon.png`,
         cssName: `_${name}_icon.scss`
         }));
         spritesData.css
         .pipe(gulp.dest(path.resolve(__dirname, './src/assets/css/')));
         spritesData.img
         .pipe(buffer())
         .pipe(imagemin({
         optimizationLevel: 7,  // 类型：Number  默认：3  取值范围：0-7（优化等级）
         use: [pngquant()]      // 使用pngquant深度压缩png图片的imagemin插件
         }))
         .pipe(gulp.dest(path.resolve(__dirname, './static/public/img/')))
         .pipe(gulp.dest(path.resolve(__dirname, '../be/WebRoot/public/img/')))
         .pipe(gulp.dest(path.resolve(__dirname, '../be/WebRoot/dist/img/')))
         });
         }
         });
         }(spritesPath));

         gulp.task('sprites', spritesArray);

         /!*
         * scss:single 不依赖图片的合并
         * *!/
         gulp.task('scss:single', () => {
         gulp.src(path.resolve(spritesPath, '../css/!*.scss'))
         .pipe(sass({
         outputStyle: 'compressed'
         }).on('error', sass.logError))
         .pipe(gulp.dest(path.resolve(__dirname, './static/public/css/')))
         .pipe(gulp.dest(path.resolve(__dirname, '../be/WebRoot/public/css/')))
         .pipe(gulp.dest(path.resolve(__dirname, '../be/WebRoot/dist/css/')))
         });
         gulp.task('watch:scss', () => {
         gulp.watch('./src/assets/css/!*.scss', ['scss:single']);
         });

         gulp.task('scss', ['sprites'], () => {
         gulp.src(path.resolve(spritesPath, '../css/!*.scss'))
         .pipe(sass({
         outputStyle: 'compressed'
         }).on('error', sass.logError))
         .pipe(gulp.dest(path.resolve(__dirname, './static/public/css/')))
         .pipe(gulp.dest(path.resolve(__dirname, '../be/WebRoot/public/css/')))
         .pipe(gulp.dest(path.resolve(__dirname, '../be/WebRoot/dist/css/')))
         });

         gulp.task('img', () => {
         gulp.src(path.resolve(__dirname, './src/assets/img/!*.png'))
         .pipe(buffer())
         .pipe(imagemin({
         optimizationLevel: 7,  // 类型：Number  默认：3  取值范围：0-7（优化等级）
         use: [pngquant()]      // 使用pngquant深度压缩png图片的imagemin插件
         }))
         .pipe(gulp.dest(path.resolve(__dirname, './static/public/img/')))
         .pipe(gulp.dest(path.resolve(__dirname, '../be/WebRoot/public/img/')))
         .pipe(gulp.dest(path.resolve(__dirname, '../be/WebRoot/dist/img/')))
         });

         gulp.task('default', ['sprites', 'scss']);*/


    }


    function dealwidth() {

    }




    /**
     * 转换表情
     * @param rsp
     */
    function commentsDataProcess(rsp){
        var news = rsp;
        for (var j in news.comment) {
            news.comment[j].content2 = news.comment[j].content;
            news.comment[j].content = replace_em(news.comment[j].content);
        }
    }

    template.helper('contentLenLimit', function (dateString) {
        return dateString.slice(0, 250);
    });

    template.helper('getStrLen', function (dateString) {
        return dateString.length;
    });

    template.helper("newContentLimit", function (dataString) {
        var _nodes = $.parseHTML(dataString) || [];   //转化为dom对象
        var _maxLength = 200;                   //最大限制字数
        var _curLength = 0;                     //当前计算字数
        var $content = $("<div></div>");
        for (var i = 0; i < _nodes.length; i++) {
            if (_nodes[i].nodeType === 1) {       //元素节点
                _curLength += 3;
                if (_curLength == _maxLength && i != _nodes.length - 1) {
                    var _limitContent = null;
                    var _more = document.createTextNode("...");
                    (_limitContent = _nodes.slice(0, i + 1)).push(_more);
                    $content.append(_limitContent);
                    return $content.html();
                } else if (_curLength > _maxLength) {
                    var _limitContent = null;
                    var _more = document.createTextNode("...");
                    (_limitContent = _nodes.slice(0, i)).push(_more);
                    $content.append(_limitContent);
                    return $content.html();
                }
            } else if (_nodes[i].nodeType === 3) {   //文本节点
                _curLength += _nodes[i].length;
                if (_curLength == _maxLength && i != _nodes.length - 1) {
                    var _limitContent = null;
                    var _more = document.createTextNode("...");
                    (_limitContent = _nodes.slice(0, i + 1)).push(_more);
                    $content.append(_limitContent);
                    return $content.html();
                } else if (_curLength > _maxLength) {
                    var _cutTextNode = null, _limitContent = null;
                    _cutTextNode = document.createTextNode(_nodes[i].nodeValue.slice(0, _nodes[i].length - (_curLength - _maxLength)));
                    (_limitContent = _nodes.slice(0, i)).push(_cutTextNode);
                    var _more = document.createTextNode("...");
                    _limitContent.push(_more);
                    $content.append(_limitContent);
                    return $content.html();
                }
            }
        }
        return dataString;
    });

    /*======================================= 公共函数定义 ==============================================*/
});
