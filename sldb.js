/*
Starlight Database < https://starlight.kirara.ca/ > へのアクセスを補助するオブジェクト
ファイルを読み込み、解析されたら生成されている。

.connect()
	[非同期]通常接続
.connectTo( ホスト(protocol://domain 形式) )
	[非同期]接続先強制指定接続
.hostConnected
	[プロパティ]成功した接続先
.isConnected
	[プロパティ]接続成功フラグ
.info
	[プロパティ]接続情報
.request{ Char | Card }{ Detail( ...IDの羅列 ) | List( [パラメータ/省略可] ) }
	[非同期]各種情報の取得
*/
var sldb = sldb || {
	URL : window.URL || window.webkitURL,
	//pseudo-private variables
	__hostsDefault : ["https://starlight.kirara.ca/"], //公開されたホストが増えたら追記
	__hostConnected : "",
	__infoMessage : "",
	__pnameOK : "result",
	__pnameNG : "error",
	__modeList : "list",
	__typeChar : "char_t",
	__typeCard : "card_t",

	//エンドポイントへのパス生成
	__createApiPath(path1,path2="",srch=""){
		let str="/api/v1/"+path1;
		if(path2.length){str += "/"+path2}
		if( srch.length){str += "?"+srch }
		return str;
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
		//api実装のチェック＆SSDBバージョン情報取得
		let r,o,s,b;
		try {
			r = await fetch( new this.URL( this.__createApiPath("info"), _host ) );
			o = await r.json();
			s = o["truth_version"];
			b = true;
		} catch (e) {
			s = `${e}`;
			b = false;
		}
		//b=try~catchの成否, s=b?バージョンコード:エラーメッセージ
		this.__hostConnected = b ? _host : "";
		this.__infoMessage = s;
		return b;
	},
	//問い合わせて返答をJSONからnativeObjectに - 返し値は長さ2の配列[<bool>,<object|string|error>]
	async __fetchAndStrip( _path ){
		if( !this.isConnected ){
			return [false,"not connected"]; //未接続ですよ
		}
		let r,o,b,d,u = new this.URL( _path,this.hostConnected );
		try {
			r = await fetch( u );
			o = await r.json();
			b = o.hasOwnProperty(this.__pnameOK);
			if( b ){
				d = o[this.__pnameOK];
			}else if( o.hasOwnProperty(this.__pnameNG) ){ //通信成功・エラーメッセージ取得のパターン
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
	get hostConnected(){ return this.__hostConnected },
	get isConnected(){ return this.hostConnected !== "" },
	//接続情報
	get info(){ return this.__infoMessage },
	//パスから要求
	async __requestPath( _path ){
		let [flag, retobj] = await this.__fetchAndStrip( _path );
		if(flag){
			return retobj;
		}else{
			console.error(`failed fetchAndStrip( ${_path} ) => ${retobj}`);
			return null;
		}
	},
	//(非同期関数)各種情報の取得
	async requestCharList(param=""){
		return await this.__requestPath(
			this.__createApiPath(this.__modeList,this.__typeChar,param)
		);
	},
	async requestCardList(param=""){
		return await this.__requestPath(
			this.__createApiPath(this.__modeList,this.__typeCard,param)
		);
	},
	async requestCharDetail(...ids){
		return await this.__requestPath(
			this.__createApiPath(this.__typeChar,ids.join())
		);
	},
	async requestCardDetail(...ids){
		return await this.__requestPath(
			this.__createApiPath(this.__typeCard,ids.join())
		);
	},
};
