# Starlight API から情報を取り出してみる (Javascript)

Starlight Database https://starlight.kirara.ca/ に付属しているAPIを利用して情報を取り出してみる

## 英語読むのめんどい人向け概要

HTTPでアクセスポイントに要求 (ほとんどはGETメソッド) すると、JSONフォーマットの文字列で返答がある。

JavaScriptでは標準で、JSON文字列とObject型が相互変換できる。なのでObject型にしてからあーだこーだする。……以下これを**返答オブジェクト**と呼ぶ。

返答オブジェクトは、
* 成功時は .result プロパティを持つ。それは配列(Array)である。
* 失敗時は .error プロパティを持つ。それは文字列(String)である。

## このJavaScriptでやってること

### 全体を見るための流れ

最初のアクセスポイントは `GET /api/v1/list/char_t` 。アイドル一覧が入手できる。

成功なら、以下のようなオブジェクト**の配列**が返ってくる。
```
{"chara_id": 101,
 "conventional": "Shimamura Uzuki",
 "kanji_spaced": "島村 卯月",
 "kana_spaced": "しまむら うづき",
 "cards": [100001, 100075, 100255, 100293, 100447],
 "ref": "/api/v1/char_t/101"}
```

そのままだと情報量が多いので `?keys=${カンマ区切りで欲しい情報名を記述}` オプションをつけて要求すると軽くなる。  
どうせ詳細を要求するのだから `?keys=chara_id[,cards]` で十分。  
あるいはデバッグ用の可読性を上げるために `,kanji_spaced` を追記してもよい。

アイドル詳細を得るなら…………
* 返答オブジェクトを剥いて単純な配列にして、巡回しながら必要に応じて `GET /api/v1/char_t/${chara_id}` で詳細を要求する。(返答オブジェクト.ref に対してもう一度GETでもおｋ)
* 返答オブジェクトを加工して `chara_id` をカンマ区切りで並べ、 `GET /api/v1/char_t/${Comma_Separated_char_ID_String}` でまとめて要求する。

カード情報を得るなら、返答オブジェクト.cards を…………
* さらに個別に分けて `GET /api/v1/card_t/${cards[index]}` に要求。
* カンマ区切りで並べて `GET /api/v1/card_t/${Comma_Separated_Cards_ID_String}` に要求。

## 声の情報をどーにかして持ってくる(オープンソースならではのちょいズル手法含む)

CVの有無は `char_t/${chara_id}` 返答オブジェクトのvoiceプロパティが空文字列かどうかで判定

タイトルコール音声のありかは問い合わせられないので、githubのソースコードからごにょごにょ

```
/webui/partials/va_table_partial.html
↓
{% for id, usage, index, voice, text, override_utype in starlight.data.va_data(current_va_id) %}
webutil.audio(id, usage, index)
↓
/webutil.py → def audio(object_id, use, index):
```

```
a = (object_id << 40) | ((use & 0xFF) << 24) | ((index & 0xFF) << 16) | 0x11AB
# make everything 8 bytes long for reasons
a &= 0xFFFFFFFFFFFFFFFF
a ^= 0x1042FC1040200700
basename = hex(a)[2:]

return "va2/{0}.mp3".format(basename)
```

```
va2/10429910442d16ab.mp3 <- しまむーのタイトルコール

    10429910442d16ab
xor 1042FC1040200700
--------------------
    00006500040d11ab
fmt oooooo00uuii11ab
then...
    0x000065 -> object_id (十進数なら101)
    0x04     -> use
    0x0d     -> index
```

```
//タイトルコールだけ見たいので、変化するのはobject_idのみ。
const id2vo = idolid => (idolid ^ 0x1042fc).toString(16)+"10442d16ab.mp3";
//ちなみに「名前」は "10442216ab.mp3" (use=4,index=2) になる
```
