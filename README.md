# Quiz Buzzer Online — Serverless Edition
Node.js / Express / Socket.IO 不要の静的版です。

- `index.html` を開くだけでも動作可能（ネット接続は必要）
- GitHub Pages / Netlify / Cloudflare Pagesなどの静的ホスティングに配置可能
- Excel / CSVをブラウザで読み込み
- PeerJSでホストと参加者をP2P接続
- 早押し、正解/誤答、得点、上がり/飛び、音声読み上げ、SPACE早押し

## 注意
「完全にサーバーゼロ」でインターネット上の知らない端末同士を自動接続するのは、WebRTCの初期シグナリングが必要なため困難です。この版は自前サーバーを不要にし、PeerJSの公開シグナリングを利用しています。大会データ本体はホストのブラウザが保持します。
