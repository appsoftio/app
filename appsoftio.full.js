/**
 * @function Frontend JS Tool Package
 * @author Zero
 * @Version V-1.0
 */
$(function(){
	(function(window){
		'use strict'
		var Tool = {
			confirm: function( msg, fn ){
				layer.confirm(msg, {
					btn: ['确定','取消']
				}, function(index){
					layer.close(index);
					if( typeof fn === 'function' ) fn();
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
					type: 'POST',
					url: url,
					data: data,
					dataType: 'json',
					success: function(d){
						fn(d);
					},
					error: function(){layer.msg('操作失败！', {icon: 2});},
					complete: function(){layer.close(loading);}
				});
			},
			getOS: function(){
				var userAgent = navigator.userAgent || navigator.vendor || window.opera;
				if (/windows phone/i.test(userAgent)) return "wp";
				if (/android/i.test(userAgent)) return "android";
				if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return "ios";
				return "unknown";
			},
			getEvent: function(){
				var os = Tool.getOS();
				switch(os){
					case 'ios':
						return 'click'; break;
					default:
						return 'click'; break;
				}
			},
			reload: function(){
				location.reload();
			},
			redirect: function(url){
				location.href = url;
			}
		};

		var evnt = Tool.getEvent(),
			J = function(){
				this.init();
			};

		J.prototype = {
			constructor: J.prototype.constructor,
			init: function(){
				this.ajaxPostDelete( '.ajaxPostDelete' );
				this.ajaxMassDelete( '.ajaxMassDelete' );
				this.autoSelect();
				this.switchStatus( '.switchStatus' );
				this.deletePublicImage( '.deletePublicImage' );
				this.resetStudentPassword( '.reset_student_password' );
			},
			ajaxPostDelete: function( objClassName ){
				$(objClassName).each(function(){
					$(this).off(evnt).on(evnt, function(){
						var url = $(this).attr('url'),
							csrf = $(this).attr('csrf'),
							data_msg = $(this).attr('data-msg') ? $(this).attr('data-msg') : '确定要删除吗？',
							redirect = $(this).attr('redirect');
						Tool.confirm(data_msg, function(){
							Tool.request( url, {
								'_method': "delete",
								'_token': csrf
							}, function( data ){
								if( data.status ){
									layer.msg(data['message'], {icon: 1});
									if(redirect){
										Tool.redirect(redirect);
									}else{
										Tool.reload();
									}
								} else {
									layer.msg(data['message'], {icon: 0});
								}
							} );
						});
					});
				});
			},
			ajaxMassDelete: function ( objClassName ) {
				$(objClassName).off(evnt).on(evnt, function () {
					var url = $(this).attr('url'),
						csrf = $(this).attr('csrf'),
						data_msg = $(this).attr('data-msg') ? $(this).attr('data-msg') : '确定要执行批量删除操作吗？',
						checkboxes = $('input[name=ids]:checked'),
						ids = '';
					$(checkboxes).each(function () {
						if(!ids){
							ids = $(this).val();
						}else{
							ids = ids + ',' + $(this).val();
						}
					});
					if (!ids){
						layer.alert('请选择要删除的项！');
						return;
					}
					url = url.substring(0, url.length - 5) + ids;
					Tool.confirm(data_msg, function(){
						Tool.request(url, {
							'_method': "delete",
							'_token': csrf
						}, function(data){
							if( data.status ){
								layer.msg(data['message'], {icon: 1});
								Tool.reload();
							} else {
								layer.msg(data['message'], {icon: 0});
							}
						});
					});
				});
			},
			autoSelect: function(){
				var selectAll = $('#selectAll'),
					ids = $('input[name=ids]');
				selectAll.on(evnt, function () {
					var checked = $(this).prop('checked') ? true : false;
					$(ids).each(function () {
						$(this).prop('checked', checked);
					})
				});
				$(ids).each(function () {
					$(this).on(evnt, function () {
						selectAll.prop('checked', $('input[name=ids]:checked').length == $('input[name=ids]').length);
					});
				});
			},
			switchStatus: function ( objClassName ) {
				$(objClassName).off( evnt ).on( evnt, function () {
					var btn = $(this),
						url = btn.attr('url'),
						csrf = btn.attr('csrf'),
						status = btn.hasClass('btn-success') ? 0 : 1;
					Tool.confirm(status == 0 ? '确定要禁用吗？' : '确定要启用吗？', function () {
						Tool.request(url, {
							'_token': csrf,
							'status': status
						}, function(data){
							if( data.status ){
								if(status == 0){
									btn.removeClass('btn-success').addClass('btn-danger').find('span').html('禁用');
								}else{
									btn.removeClass('btn-danger').addClass('btn-success').find('span').html('启用');
								}
							} else {
								layer.msg('状态修改失败！', {icon: 0});
							}
						});
					});
				});
			},
			deletePublicImage: function (obj) {
				$(obj).each(function () {
					var btn = $(this);
					btn.parent().on('mouseover', function () {
						btn.css('display', 'block');
					}).on('mouseout', function () {
						btn.css('display', 'none');
					});
					
					btn.off( evnt ).on(evnt, function () {
						var url = btn.attr('url'),
							csrf = btn.attr('csrf');
						Tool.confirm('确定要删除该图片吗？', function () {
							Tool.request(url, {
								'_token': csrf
							}, function ( data ) {
								if( data.status ){
									layer.msg(data.message, {icon: 1});
									btn.parent().fadeOut();
								} else {
									layer.msg(data.message, {icon: 0});
								}
							})
						});
					})
				})
			},
			resetStudentPassword: function (obj) {
				$(obj).each(function () {
					var btn = $(this);
					btn.off( evnt ).on(evnt, function () {
						var url = btn.attr('url'),
							csrf = btn.attr('csrf');
						Tool.confirm('密码将重置为身份证后六位，如果身份证号码为空，则重置为 123456 。确定要重置吗？', function () {
							Tool.request(url, {
								'_token': csrf
							}, function (data) {
								if( data.status ){
									layer.msg(data.message, {icon: 1});
									btn.parent().fadeOut();
								} else {
									layer.msg(data.message, {icon: 0});
								}
							})
						})
					})
				});
			}
		};
		window.J = new J();
	})(window);
	console.log('good!');
});
