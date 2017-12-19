# Starlight API から情報を取り出してみる (Javascript)

Starlight Database https://starlight.kirara.ca/ に付属しているAPIを利用して情報を取り出してみる

## 英語読むのめんどい人向けoverview

### 基本

GETメソッドでfetchして、JSON文字列で返ってくる。なので、レスポンスをオブジェクトに戻してあーだこーだする。……以下これを**返答オブジェクト**と呼ぶ。

返答オブジェクトは、
* 成功時は .result プロパティを持つ。それは配列(Array)である。
* 失敗時は .error プロパティを持つ。それは文字列(String)である。

### 全体を見るための流れ

最初のアクセスポイントは `GET /api/v1/list/char_t` 。アイドル一覧が入手できる。

以下のようなオブジェクトの配列が返ってくる。
```
{"chara_id": 101,
 "conventional": "Shimamura Uzuki",
 "kanji_spaced": "島村 卯月",
 "kana_spaced": "しまむら うづき",
 "cards": [100001, 100075, 100255, 100293, 100447],
 "ref": "/api/v1/char_t/101"}
```

そのままだと情報量が多いので `?keys=${カンマ区切りで欲しい情報名を記述}` オプションをつけて問い合わせると軽くなる。  
どうせ詳細を問い合わせるのだから `?keys=chara_id,cards` で十分。  
あるいはデバッグ用の可読性を上げるために `,kanji_spaced` を追記してもよい。

アイドル詳細を得るなら、返答オブジェクトを剥いて単純なchara_idの配列にし、 `GET /api/v1/char_t/${chara_id}` で詳細を持ってくるとよさげ。(ぶっちゃけ、返答オブジェクト.ref に対してもう一度fetchでもおｋ)

カード情報を得るなら 返答オブジェクト.cards をさらに個別に分けて `GET /api/v1/card_t/${card_id}` に問い合わせ。

## 声の情報をどーにかして持ってくる(オープンソースならではのちょいズル手法含む)

声の有無は `char_t/${chara_id}` 返答オブジェクトのvoiceプロパティが invert(空文字列である) で判定

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
    0x000065 -> object_id (101 in decimal)
    0x04     -> use
    0x0d     -> index
```

```
//タイトルコールだけ見たいので、変化するのはobject_idのみ。
const id2vo = idolid => (idolid ^ 0x1042fc).toString(16)+"10442d16ab.mp3";
```
