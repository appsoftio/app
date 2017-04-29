$(function(){ (function(window){
	var lands = [],	//DOM集合
		nests = [],	//对象集合
		currentAction = 0, // 1:建造    2：增养     3：饲养     4：收获      5： 刷新
		timers = [],
		beep = (function(){
			return $('#beep')[ 0 ] || (function(){
				var au = document.createElement( 'audio' );
				$(au).attr( { 'src': '/Public/Home/images/beep.mp3', 'id': 'beep' } )
					 .css( 'display', 'none' )
					 .appendTo($('body'));
				return au;
			})();
		})(),
		Nest = function( userId, nestId, nestType, nestValue, nestStatus, growStage,
		openTime, feedTime, harvestTime, stealStatus, stealTime ){
			this.userId = userId;
			this.nestId = nestId;
			this.nestType = nestType;
			this.nestValue = nestValue;
			this.nestStatus = nestStatus;
			this.growStage = growStage;
			this.openTime = openTime;
			this.feedTime = feedTime;
			this.harvestTime = harvestTime;
			this.stealStatus = stealStatus;
			this.stealTime = stealTime;
		},
		J = {
		init: function(){
			lands = $('.farm-floor').find( '.land' );
			lands.each( function(){
				nests.push( new Nest.prototype.constructor( 
					$(this).attr( 'user-id' ),
					$(this).attr( 'nest-id' ),
					$(this).attr( 'nest-type' ),
					$(this).attr( 'nest-value' ),
					$(this).attr( 'nest-status' ),
					$(this).attr( 'grow-stage' )
				) );
				$(this).on(evnt, function(){
					J.play();
					//找窝
					var nest = J.findNest( $(this).attr('nest-id') );
					if( !nest ){
						layer.alert('没找到窝！！', {icon: 0});
						return;
					}
					//提示窝价值的信息
					if( currentAction == 0 ){
						nest.say();
						return;
					}
					switch( currentAction ){
						case 1:
							nest.build(); break;
						case 2:
							nest.addFeed(); break;
						case 3:
							nest.feed(); break;
						case 4:
							nest.harvest(); break;
						default:
							layer.alert('请重试！！！', {icon: 0}); break;
					}
					currentAction = 0;
				});
			});
			return this;
		},
		bind: function(){
			$('.farm-tool .build').bind(evnt, function(){
				J.play();
				currentAction = currentAction == 1 ? 0 : 1;
			});
			$('.farm-tool .addFeed').bind(evnt, function(){
				J.play();
				currentAction = currentAction == 2 ? 0 : 2;
			});
			$('.farm-tool .feed').bind(evnt, function(){
				J.play();
				currentAction = currentAction == 3 ? 0 : 3;
			});
			$('.farm-tool .harvest').bind(evnt, function(){
				J.play();
				currentAction = currentAction == 4 ? 0 : 4;
			});
			$('.farm-tool .refresh').bind(evnt, function(){
				J.play();
				document.location.reload();
			});
			return this;
		},
		findNest: function( nestId ){
			for( var i = 0; i < nests.length; i++ ){
				if( nests[ i ].nestId == nestId ){
					return nests[ i ];
				}
			}
			return null;
		},
		findLand: function( nestId ){
			for( var i = 0; i < lands.length; i++ ){
				if( $(lands[ i ]).attr( 'nest-id' ) == nestId ){
					return lands[ i ];
				}
			}
			return null;
		},
		confirm: function( msg, fn ){
			var o = this;
			layer.confirm(msg, {
				btn: ['确定','取消']
			}, function(index){
				layer.close(index);
				if( typeof fn === 'function' ) fn( o );
			}, function(){
				//
			});
		},
		prompt: function( title, objRegExp, fn ){
			var o = this;
			layer.prompt({
                title: title,
                formType: 0
            }, function ( value, index ) {
            	if(!objRegExp.test( value )){
            		layer.msg('输入有误，请重新输入！', {icon: 0});
            	}else{
            		layer.close(index);
            		o.feedValue = value;
            		fn( o );
            	}
            });
		},
		request: function( url, data, fn ){
			var loading = layer.load(1, {shade: [0.3, '#000'], content:''});
			$.ajax({
				type: "POST",
				url:url,
				data:data,
				dataType:'json',
				success: function(d){
					fn(d);
				},
				error: function(){layer.msg('页面加载失败！', {icon: 2});},
				complete: function(){layer.close(loading);}
			});
		},
		push: {
			apply: function( target, els ){
				els = els.length ? els : [ els ];
				var j = target.length,
					i = 0;
				while( ( target[ j++ ] = els[ i++ ] ) ){};
				target.length = j - 1;
			}
		},
		play: function(){
			if( beep.nodeName.toUpperCase() == 'AUDIO' ){
				beep.currentTime = 0;
				beep.play();
			}
		},
		getOS: function(){
			var userAgent = navigator.userAgent || navigator.vendor || window.opera;
			if (/windows phone/i.test(userAgent)) return "wp";
			if (/android/i.test(userAgent)) return "android";
			if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return "ios";
			return "unknown";
		},
		getEvent: function(){
				var os = J.getOS();
				switch(os){
					case 'ios':
					return 'tap'; break;
					default:
					return 'click'; break;
				}
			}
		},
		evnt  = (function(){
			return J.getEvent();
		})();
	Nest.prototype = {
		reload: function(){
			var o = this;
			J.request( '/Index/reload', {
				'userId': o.userId,
				'nestId': o.nestId
			}, function( data ){
				if(data.status){
					var gameInfo = data.game_info;
					var nestInfo = data.nest_info;
					//更新鹿窝对象
					o.nestStatus = nestInfo.nest_status;
					o.nestValue = nestInfo.nest_value;
					o.growStage = nestInfo.grow_stage;
					//游戏信息
					if( gameInfo ){
						$('.farm-information #data_total').html(gameInfo.total);
						$('.farm-information #data_deer_food').html(gameInfo.deer_food);
						$('.farm-information #data_guard').html(gameInfo.guard);
						$('.farm-information #data_deer_kid').html(gameInfo.deer_kid);
						$('.farm-information #data_feed').html(gameInfo.feed);
						$('.farm-information #data_dog').html(gameInfo.dog);
						$('.farm-information #data_stock').html(gameInfo.stock);
						$('.farm-information #data_total_profit').html(gameInfo.total_profit);
					}
					//更新鹿窝信息
					if( nestInfo ){
						//修改鹿的样式
						o.updateNest( o.growStage );
						//修改我的价值
						var land = J.findLand( o.nestId );
						if( land ) $($(land).find('.beans')[ 0 ]).html( o.nestValue );
					}
				}
			} );
		},
		say: function(){
			for(var i = 0; i < 15; i++){
				if(timers[i]) clearTimeout(timers[i]);
			}
			timers.length = 0;
			
			var o = this;
			$(lands).each(function( i, v ){
				var bean = $(v).find('.beans')[0];
				if($(v).attr('nest-id') == o.nestId){
					$(bean).css('display','block');
					var timer = setTimeout(function(){
						$(bean).css('display','none');
					}, 2000);
					timers[i] = timer;
				}else{
					$(bean).css('display','none');
				}
			});
		},
		build: function(){
			J.confirm.call( this, '确定要建造鹿舍吗？', function( o ){
				J.request( '/Index/build', {
					'userId': o.userId,
					'nestId': o.nestId
				}, function( data ){
					if( !data.status ){
						layer.msg(data.info, {icon: 0});
					} else {
						layer.msg(data.info, {icon: 1});
						o.reload();
					}
				} );
			} );
		},
		addFeed: function(){
			J.prompt.call( this, '请输入增养数量：', /^[0-9]+(\.[0-9]{1,5})?$/, function( o ){
				J.request( '/Index/addFeed', {
					'userId': o.userId,
					'nestId': o.nestId,
					'feedValue': o.feedValue
				}, function( data ){
					if( !data.status ){
						layer.msg(data.info, {icon: 0});
					} else {
						layer.msg(data.info, {icon: 1});
						o.reload();
					}
				} );
			} );
		},
		feed: function(){
			J.confirm.call( this, '确定要饲养吗？', function( o ){
				J.request( '/Index/feed', {
					'userId': o.userId,
					'nestId': o.nestId
				}, function( data ){
					if( !data.status ){
						layer.msg(data.info, {icon: 0});
					} else {
						layer.msg(data.info, {icon: 1});
						o.reload();
					}
				} );
			} );
		},
		harvest: function(){
			J.confirm.call( this, '确定要收获了吗？', function( o ){
				J.request( '/Index/harvest', {
					'userId': o.userId,
					'nestId': o.nestId
				}, function( data ){
					if( !data.status ){
						layer.msg(data.info, {icon: 0});
					} else {
						layer.msg(data.info, {icon: 1});
						o.reload();
					}
				} );
			} );
		},
		updateNest: function( styleId ){
			for( var i = 0; i < lands.length; i++ ){
				if( Number(this.nestId) == (i + 1) ){
					$(lands[ i ]).find('.tree').attr('lever', 'tree_lever_'+ styleId);
					$(lands[ i ]).find('.tree').css('display', 'block');
					break;
				}
			}
		},
		constructor: Nest.prototype.constructor
	};
	J.init().bind();
})(window);});
