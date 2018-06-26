/**
 * cachey - 特定型のファイルをキャッシュしてくれる子。命名はキャシー・グラハムから。(Cathy X cache)
 * Promise版IndexedDB https://github.com/jakearchibald/idb を使う。
 * オススメは script defer src="https://cdn.rawgit.com/jakearchibald/idb/master/lib/idb.js" の直後にこれをdeferで読み込む。
 */
var cachey = cachey || {
	/**
	 * @type{IDBDatabase} 開かれたデータベース
	 */
	dbOpened : null,
	/**
	 * @type{String} エラーメッセージ
	 */
	strDbErr : "",
	/**
	 * 非同期の初期化関数
	 * @return{Promise<Boolean>} Promise<初期化の成否>
	 */
	async asyncInit(){
		return await self.idb.open( nameIDB, 1, upgradeDB=>{
			//****DB更新時処理****
			switch (upgradeDB.oldVersion) {
				case 0:
					upgradeDB.createObjectStore("mp3"); //音声用ストア
					upgradeDB.createObjectStore("png"); //画像用ストア
			} //breakを使わないことで、版を飛ばした時でも流れ落ちるように処理できる
		} ).then( r=>{cachey.dbOpened=r;return true}
		).catch( r=>{cachey.strDbErr=r.toString();return false} );
	},
	/**
	 * まずDBに要求し、無ければFetchで取得して登録する。非同期関数。
	 * @param {String} href URL文字列
	 */
	async requestOrFetch( href ){
		let storenm, storeky, valStored = null;
		//HREFからストア名とキーを割り出す。ストア名は拡張子、キーはドメインの後ろ～拡張子の前。
		//挙動的には、ホストドメインが変わってもディレクトリ構造が同じなら同じものとみなす。
		(a=>{
			storenm=a.pop();
			storeky=a.join(".");
		})( (new gURL(href)).pathname.split(".") );
		let isEnableIDB = cachey.dbOpened !== null;
		//↓↓DBから取り出し↓↓
		if(isEnableIDB){
			//対応したオブジェクトストアがありますか？
			if( !cachey.dbOpened.objectStoreNames.contains(storenm) ){
				console.warn(`${href} の拡張子 ${storenm} はIDB登録外です`);
				isEnableIDB = false; //indexedDBが使えない時と同じ処理をする
			}else{
				//console.log(`${storenm}/${storeky} -toRead`);
				const romTxn = cachey.dbOpened.transaction(storenm); //第二引数なし=readonly
				const romStore = romTxn.objectStore(storenm);
				valStored = await romStore.get(storeky);
				await romTxn.complete; //文字通り、上記トランザクションが完了するまで一時待機
			}
		}
		if(valStored){
			//console.log(`${storenm}/${storeky} -fineRead`);
		}else{
			//↓↓DBから取り出せなかった。hrefから要求↓↓
			//console.log(`${storenm}/${storeky} -isNotThere`);
			const rspnsfch = await self.fetch(href);
			switch( storenm ){ //拡張子ごとにどう解決するか違う
				case "mp3":
					valStored = await rspnsfch.arrayBuffer();
					break;
				case "png":
					valStored = await rspnsfch.blob();
					break;
			}
			//↓↓DBが有効かつ要求完了時、DBに登録↓↓
			if(isEnableIDB && valStored){
				//console.log(`${storenm}/${storeky} -gotStream`);
				const rawTxn = database.transaction(storenm,"readwrite");
				const rawStore = rawTxn.objectStore(storenm);
				await rawStore.put(valStored,storeky).then(
					//()=>{ console.log(`${storenm}/${storeky} -finePut`); }
				)
				await rawTxn.complete;
			}
		}
		return valStored;
	},
};
