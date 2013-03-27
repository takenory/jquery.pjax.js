/*
 * 
 * pjax
 * 
 * ---
 * @Copyright(c) 2012, falsandtru
 * @license MIT  http://opensource.org/licenses/mit-license.php  http://sourceforge.jp/projects/opensource/wiki/licenses%2FMIT_license
 * @version 1.4.5
 * @updated 2013/03/28
 * @author falsandtru  http://fat.main.jp/  http://sa-kusaku.sakura.ne.jp/
 * ---
 * Note: 
 * 
 * ---
 * Example:
 * @jquery 1.7.2
 * 
 * $.pjax( { area : 'div.pjax:not(.no-pjax)' } ) ;
 *
 * or
 *
 * $( 'div.pjaxLinkArea' ).pjax(
 * {
 * 	area : 'div.pjax:not(.no-pjax)' ,
 * 	link : 'a.pjaxLinks' ,
 * 	scrollTop : null ,
 * 	scrollLeft : null ,
 * 	callback : callback ,
 * 	callbacks :
 * 	{
 * 		ajax :
 * 		{
 * 			beforeSend : function( arg , XMLHttpRequest ){ XMLHttpRequest.overrideMimeType( 'text/html;charset=UTF-8' ) ; }
 * 			error : error
 * 		}
 * 	}
 * 	wait : 100
 * }) ;
 *
 * function callback()
 * {
 * 	if( window._gaq ){ _gaq.push( ['_trackPageview'] ) ; }
 * }
 *
 * function error( arg , XMLHttpRequest )
 * {
 * 	alert( 'pjax cancel.\n' + XMLHttpRequest.status + ' ' + XMLHttpRequest.statusText ) ;
 * }
 * 
 */

( function( $ )
{
	
	jQuery.fn.pjax	= pjax ;
	jQuery.pjax			= pjax ;
	
	function pjax( options )
	{
		if( typeof this === 'function' ){ return arguments.callee.apply( jQuery( document ) , arguments ) ; }
		if( !supportPushState() ){ return this ; }
		
		var
		defaults=
		{
			gns : 'pjax' ,
			ns : undefined ,
			area : undefined ,
			link : 'a:not([target])[href^="/"]' ,
			form : undefined ,
			scrollTop : 0 ,
			scrollLeft : 0 ,
			ajax : {} ,
			callback : function(){} ,
			callbacks :
			{
				ajax : {} ,
				update : {}
			} ,
			parameter : undefined ,
			wait : 0 ,
			fallback : true
		} ,
		settings = jQuery.extend( true , {} , defaults , options ) ;
		
		jQuery.extend
		(
			true ,
			settings ,
			{
				nss :
				{
					click : [ 'click' , settings.gns + ( settings.ns === undefined ? '' : ':' + settings.ns ) ].join( '.' ) ,
					submit : [ 'submit' , settings.gns + ( settings.ns === undefined ? '' : ':' + settings.ns ) ].join( '.' ) ,
					popstate : [ 'popstate' , settings.gns + ( settings.ns === undefined ? '' : ':' + settings.ns ) ].join( '.' )
				}
			}
		) ;
		
		switch( true )
		{
			case settings.form !== undefined :
				jQuery( this )
				.undelegate( settings.form , settings.nss.submit )
				.delegate( settings.form , settings.nss.submit , settings , function( event )
				{
					var
					path = jQuery( event.target ).prop( 'action' ).replace( /^.+\/\/[^\/]+/ , '' ) ;
					
					ajax.apply( this , [ event , path ,  location.pathname === path ? false : true , event.data ] ) ;
					
					event.preventDefault() ;
				} ) ;
				break ;
				
			case settings.link !== undefined :
				jQuery( this )
				.undelegate( settings.link , settings.nss.click )
				.delegate( settings.link , settings.nss.click , settings , function( event )
				{
					if( event.which>1 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ){ return this ; }
					if( location.protocol !== this.protocol || location.host !== this.host ){ return this ; }
					if( location.pathname === this.pathname && location.search === this.search && location.hash !== this.hash ){ return this ; }
					if( location.pathname + location.search + location.hash === this.pathname + this.search + this.hash ){ event.preventDefault() ; return this ; }
					
					ajax.apply( this , [ event , this.href , true , event.data ] ) ;
					
					event.preventDefault() ;
				} ) ;
				break ;
		}
		
		setTimeout( function()
		{
			jQuery( window )
			.unbind( settings.nss.popstate )
			.bind( settings.nss.popstate , settings , function( event )
			{
				ajax.apply( this , [ event , location.href , false , event.data ] ) ;
			} ) ;
		} , 100 ) ;
		
		/* function */
		
		function supportPushState()
		{
			return ( 'pushState' in window.history ) && ( window.history[ 'pushState' ] !== null ) ;
		}
		
		function ajax( event , url , register , settings )
		{
			var
			data ,
			dataType ,
			XMLHttpRequest ,
			textStatus ,
			errorThrown ,
			title ,
			context = this ,
			query = [] ,
			request = {} ,
			callbacks =
			{
				beforeSend : function( arg1 )
				{
					XMLHttpRequest = arg1 ;
					
					fire( settings.callbacks.ajax.beforeSend , context , [ event , settings.parameter , XMLHttpRequest ] ) ;
				} ,
				dataFilter : function( arg1 , arg2 )
				{
					data = arg1 ;
					dataType = arg2 ;
					
					return fire( settings.callbacks.ajax.dataFilter , context , [ event , settings.parameter , data , dataType ] ) ;
				} ,
				complete : function( arg1 , arg2 )
				{
					XMLHttpRequest = arg1 ;
					textStatus = arg2 ;
					
					fire( settings.callbacks.ajax.complete , context , [ event , settings.parameter , XMLHttpRequest , textStatus ] ) ;
				}
			} ;
			
			for( var i in callbacks )
			{
				if( i in settings.callbacks.ajax ){ continue ; }
				delete callbacks[ i ] ;
			}
			
			if( event.type.toLowerCase() === 'submit' )
			{
				jQuery( event.target ).find( 'input[name] , textarea[name]' ).each( function( index , element ){ request[ element.name ] = element.value ; } ) ;
				
				jQuery.extend
				(
					true ,
					settings ,
					{
						ajax :
						{
							type : jQuery( event.target ).prop( 'method' ).toUpperCase() ,
							data : request
						}
					}
				) ;
				
				url = url.replace( /\?[\S]*/ , '' )
				for( var i in request ){ query.push( encodeURI( i + '=' + request[ i ] ) ) ; }
				if( settings.ajax.type === 'GET' ){ url += '?' + query.join( '&' ) ; }
			}
			
			fire( settings.callbacks.before , context , [ event , settings.parameter ] ) ;
			
			switch(jQuery().jquery)
			{
				case '1.0':
				case '1.0.4':
				case '1.1.0':
				case '1.1.2':
				case '1.1.3':
				case '1.1.4':
				case '1.2':
				case '1.2.3':
				case '1.2.6':
				case '1.3':
				case '1.4':
				case '1.4.1':
				case '1.4.2':
				case '1.4.3':
				case '1.4.4':
				case '1.5':
				jQuery.ajax
				(
					jQuery.extend
					(
						true ,
						{} ,
						settings.ajax ,
						callbacks ,
						{
							url : url ,
							success : function( arg1 , arg2 , arg3 )
							{
								data = arg1 ;
								dataType = arg2 ;
								XMLHttpRequest = arg3 ;
								
								fire( settings.callbacks.ajax.success , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] ) ;
								
				if(XMLHttpRequest.status===200)
				{
					try
					{
						if( XMLHttpRequest.getResponseHeader( 'Content-Type' ).indexOf( 'text/html' ) === -1 ){ throw null ; }
						
						var
						title = jQuery( data ).filter( 'title' ).text() ,
						areas = settings.area.split( ',' ) ,
						scrollX = settings.scrollLeft === null ? jQuery( window ).scrollLeft() : parseInt( settings.scrollLeft ) ,
						scrollY = settings.scrollTop === null ? jQuery( window ).scrollTop() : parseInt( settings.scrollTop ) ,
						len1 = jQuery( settings.area ).length ,
						len2 = jQuery( settings.area , data ).length ;
						
						if( len1 === len2 )
						{
							register ? history.pushState( null , window.opera || ( 'userAgent' in window && userAgent.indexOf( 'opera' ) !== -1 ) ? title : document.title , url ) : null ;
							
							document.title = title ;
							for( var i = 0 ; i < areas.length ; i++ ){ jQuery( areas[ i ] ).html( jQuery( areas[ i ] , data ).html() ) ; }
							
							register && event.type === 'click' ? window.scrollTo( scrollX , scrollY ) : null ;
							
							fire( settings.callbacks.update.success , context , [ event , settings.parameter , data , dataType ] ) ;
							fire( settings.callback , context , [ event , settings.parameter , data , dataType ] ) ;
						}
						else
						{
							fire( settings.callbacks.update.error , context , [ event , settings.parameter , data , dataType ] ) ;
							settings.fallback ? fallback( context , false ) : null ;
						}
					}
					catch( err )
					{
						fire( settings.callbacks.update.error , context , [ event , settings.parameter , data , dataType ] ) ;
						settings.fallback ? fallback( context , false ) : null ;
					}
					
					fire( settings.callbacks.update.complete , context , [ event , settings.parameter , data , dataType ] ) ;
				}
							} ,
							error : function( arg1 , arg2 , arg3 )
							{
								XMLHttpRequest = arg1 ;
								textStatus = arg2 ;
								errorThrown = arg3 ;
								
								fire( settings.callbacks.ajax.error , context , [ event , settings.parameter , XMLHttpRequest , textStatus , errorThrown ] ) ;
								settings.fallback ? fallback( context , true ) : null ;
							}
						}
					)
				)
				
					fire( settings.callbacks.after , context, [ event , settings.parameter ] ) ;
				
				return ;
			}
			
			jQuery
			.when
			(
				wait( settings.wait ) ,
				jQuery.ajax
				(
					jQuery.extend
					(
						true ,
						{} ,
						settings.ajax ,
						callbacks ,
						{
							url : url ,
							success : function( arg1 , arg2 , arg3 )
							{
								data = arg1 ;
								dataType = arg2 ;
								XMLHttpRequest = arg3 ;
								
								fire( settings.callbacks.ajax.success , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] ) ;
							} ,
							error : function( arg1 , arg2 , arg3 )
							{
								XMLHttpRequest = arg1 ;
								textStatus = arg2 ;
								errorThrown = arg3 ;
								
								fire( settings.callbacks.ajax.error , context , [ event , settings.parameter , XMLHttpRequest , textStatus , errorThrown ] ) ;
								settings.fallback ? fallback( context , true ) : null ;
							}
						}
					)
				)
			)
			.done
			(
				function()
				{
					try
					{
						if( XMLHttpRequest.getResponseHeader( 'Content-Type' ).indexOf( 'text/html' ) === -1 ){ throw null ; }
						
						var
						title = jQuery( data ).filter( 'title' ).text() ,
						areas = settings.area.split( ',' ) ,
						scrollX = settings.scrollLeft === null ? jQuery( window ).scrollLeft() : parseInt( settings.scrollLeft ) ,
						scrollY = settings.scrollTop === null ? jQuery( window ).scrollTop() : parseInt( settings.scrollTop ) ,
						len1 = jQuery( settings.area ).length ,
						len2 = jQuery( settings.area , data ).length ;
						
						if( len1 === len2 )
						{
							register ? history.pushState( null , window.opera || ( 'userAgent' in window && userAgent.indexOf( 'opera' ) !== -1 ) ? title : document.title , url ) : null ;
							
							document.title = title ;
							for( var i = 0 ; i < areas.length ; i++ ){ jQuery( areas[ i ] ).html( jQuery( areas[ i ] , data ).html() ) ; }
							
							register && event.type === 'click' ? window.scrollTo( scrollX , scrollY ) : null ;
							
							fire( settings.callbacks.update.success , context , [ event , settings.parameter , data , dataType ] ) ;
							fire( settings.callback , context , [ event , settings.parameter , data , dataType ] ) ;
						}
						else
						{
							fire( settings.callbacks.update.error , context , [ event , settings.parameter , data , dataType ] ) ;
							settings.fallback ? fallback( context , false ) : null ;
						}
					}
					catch( err )
					{
						fire( settings.callbacks.update.error , context , [ event , settings.parameter , data , dataType ] ) ;
						settings.fallback ? fallback( context , false ) : null ;
					}
					
					fire( settings.callbacks.update.complete , context , [ event , settings.parameter , data , dataType ] ) ;
				}
			)
			.fail()
			.always
			(
				function()
				{
					fire( settings.callbacks.after , context, [ event , settings.parameter ] ) ;
				}
			)
		}
		
		function wait( ms )
		{
			if( !ms ){ return }
			
			var dfd = jQuery.Deferred() ;
			setTimeout( function()
			{
				dfd.resolve() ;
			} , ms ) ;
			return dfd.promise() ;
		}
		
		function fire( fn , context , args )
		{
			if( typeof fn === 'function' ){ return fn.apply( context , args ) ; }
		}
		
		function fallback( context , reload )
		{
			if( context.href !== undefined )
			{
				location = context.href ;
			}
			else if( reload )
			{
				location.reload() ;
			}
		}
		
		
		/* return */
		
		return this ;
	}
} )( jQuery )