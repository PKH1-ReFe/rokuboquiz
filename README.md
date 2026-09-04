# Quiz Buzzer Online - Serverless

## 今回の修正
CSV/Excelの読み込みを強化しました。

- `問題,答え` の見出し付きCSV
- 見出しなしの `問題,答え`
- 先頭に空行や空列があるCSV
- `問題文,正解` / `question,answer` などの列名
- ジャンル・得点列の自動認識
- UTF-8 / BOM付きCSV
- Excel `.xlsx` / `.xls`

CSVを選択して「読み込む」を押してください。

## 公開
このフォルダをGitHub Pagesなどの静的ホスティングに置けば利用できます。
