/*
im@sparql <https://sparql.crssnky.xyz/imas/> へのアクセスを補助するオブジェクト
ファイルを読み込み、解析されたら生成されている。
*/
var imsprql = imsprql || {
	prefixes : new Map(), //接頭辞の設定はこれを直接操作すればOK
	__selectNames : new Set(),
	__whereTriples : new Set(),
	__lastsub : "",
	__filterString : "",
	__endpoint : "https://sparql.crssnky.xyz/spql/imas/query?query=",

	//SELECTの列追加・削除・全削除
	setSelect(...names){
		for( const n of names ){ this.__selectNames.add(n); }
		return this;
	},
	deleteSelect(name){ return this.__selectNames.delete(name); },
	clearSelect(){ this.__selectNames.clear(); },

	//WHEREの全削除・列追加・主語固定追加 //Subject主語;Predicate述語;Object目的語
	clearWhere(){ this.__whereTriples.clear(); },
	addWhereSPO(su,pr,ob){
		this.__lastsub = su;
		this.__whereTriples.add( [su,pr,ob] );
		return this;
	},
	andPO(pr,ob){
		this.addWhereSPO(this.__lastsub,pr,ob);
		return this;
	},

	//FILTERの設定・削除
	setFilter(str){ this.__filterString = ""+str; },
	clearFilter(){ this.__filterString = ""; },

	//(非同期)クエリ実行
	async execute(){
		//組み立てて
		let k, v, qPrefix = "";
		for( [k,v] of this.prefixes.entries() ){
			qPrefix += `PREFIX ${k}: <${v}> `;
		}
		let qSelect = "SELECT";
		for ( v of this.__selectNames.values() ) {
			qSelect += " "+v;
		}
		let qWhere = " ";
		for ( v of this.__whereTriples.values() ) {
			qWhere += v.join(" ")+". ";
		}
		let url = this.__endpoint + encodeURIComponent(
			qPrefix + qSelect +" WHERE {"+qWhere+(
				this.__filterString.length>0 ? ("FILTER "+this.__filterString) : ""
			)+"}"
		);
		//送信
		try {
			k = await fetch( url );
			v = await k.json();
		} catch (e) {
			console.error(e+" <"+url+">");
			return null;
		}
		//返信を成型してreturn
		return v["results"]["bindings"];
	}
};