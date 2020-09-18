# qiita-node




```console
Usage:
$ npx ts-node src/index.ts xxx         -> コンソール出力のみ(xxx はQiitaのアクセストークン)
$ npx ts-node src/index.ts xxx true    -> trueで、ElasticsearchへPOSTする。(index名はデフォルトの tick_qiita に、都度新規追加
$ npx ts-node src/index.ts xxx true qiita  -> さらに引数指定で、index名を独自のモノにできる。この例だと qiita というindexでにPOST (記事ID_YYYYMMDD をIDとしてすでに存在する場合は上書き更新)
$ npx ts-node src/index.ts xxx false qiita 5  -> デフォルトだと最大 100x4 件Qiitaから記事取得をおこなうが、引数指定で n x 4件 (この例だとn=5) だけQiitaから検索する
```


