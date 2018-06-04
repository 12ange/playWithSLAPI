/*
Starlight Database < https://starlight.kirara.ca/ > へのアクセスを補助するオブジェクト
ファイルを読み込み、解析されたら生成されている。

.connect()
	[非同期]通常接続
.connectTo( ホスト(protocol://domain 形式) )
	[非同期]接続先強制指定接続
.requestPath( _path )
*/
var sldb = sldb || {
	URL : window.URL || window.webkitURL,
	//pseudo-private variables
	__hostsDefault : ["https://starlight.kirara.ca/"], //公開されたホストが増えたら追記
	__hostConnected : "",
	__listChar : [],
	__pnameOK : "result",
	__pnameNG : "error",

	//エンドポイントへのパス生成
	__createApiPath(path1,path2="",srch=""){
		let str="/api/v1/"+path1;
		if(path2.length){ str += "/"+path2; }
		if(srch.length){ str += "?"+srch; }
		return str;
	},
	getPathListChar(param=""){
		return this.__createApiPath("list","char_t",param);
	},
	getPathCharDetail(...ids){
		return this.__createApiPath("char_t",ids.join());
	},
	getPathCardDetail(...ids){
		return this.__createApiPath("card_t",ids.join());
	},
	//接続-自動
	async connect(){
		for(let h of this.__hostsDefault){
			if( await this.connectTo(h) ){break;}
		}
		return this.isConnected;
	},
	//接続-接続先指定
	async connectTo( _host ){
		//api実装のチェック＆基底データ取得
		let [flag, retobj] = await this.fetchAndStrip( new this.URL( this.getPathListChar(), _host ) );

		if( flag ){
			this.__hostConnected = _host;
			this.__listChar = retobj;
		}else{
			console.error(retobj);
		}
		return flag;
	},
	//問い合わせて返答をJSONからnativeObjectに - 返し値は長さ2の配列[<bool>,<object|string|error>]
	async fetchAndStrip( url ){
		let r,o,b,d;
		try {
			r = await fetch( url.href );
			o = await r.json();
			b = o.hasOwnProperty(this.__pnameOK);
			if( b ){
				d = o[this.__pnameOK];
			}else if( o.hasOwnProperty(this.__pnameNG) ){ //success fetch with error message
				d = o[this.__pnameNG];
			}else{
				d = "unknown error";
			}
		} catch (e) {
			b = false;
			d = e;			
		}
		return [b,d];
	},
	//接続できている？
	get hostConnected(){ return this.__hostConnected; },
	get isConnected(){ return this.__hostConnected !== ""; },
	//接続に成功した場合の基底データ
	get listChar(){ return this.isConnected ? this.__listChar : [] ; },

	//要求
	async __requestPath( _path ){
		if( !this.isConnected ){ return null; }
		return await this.fetchAndStrip( new this.URL( _path,this.hostConnected ) );
	},
	async requestCharDetail(...ids){
		let [flag, retobj] = await this.__requestPath( this.getPathCharDetail(...ids) );
		if(flag){
			return retobj;
		}else{
			console.error(retobj);
			return null;
		}
	},
	async requestCardDetail(...ids){
		let [flag, retobj] =  await this.__requestPath( this.getPathCardDetail(...ids) );
		if(flag){
			return retobj;
		}else{
			console.error(retobj);
			return null;
		}
	},
};
