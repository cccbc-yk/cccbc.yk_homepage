🌍 EveryoneMemories

EveryoneMemories は、写真をアップロードすると AIが画像を解析し、仮想の思い出を生成するWebアプリケーションです。
スマートフォンから QRコードを使って簡単に写真をアップロードすることができます。

📸 概要

このアプリでは以下の機能を提供します。

📱 QRコードによるスマホアップロード

🧠 AIによる画像認識

🌍 思い出マップ

🎞 人生タイムライン

✨ モダンなWeb UI

スマートフォンで撮影した写真をアップロードすると、AIが内容を解析し、
その写真に基づいた「仮想の思い出ストーリー」を生成します。

🛠 使用技術
Frontend

TypeScript

HTML / CSS

Backend

Node.js

Express

AI

TensorFlow.js (MobileNet)

その他

QRコード生成

Leaflet (地図表示)

📂 プロジェクト構成
EveryoneMemories
│
├ server.js
├ index.html
├ style.css
├ main.ts
│
├ modules
│  ├ ai.ts
│  ├ map.ts
│  ├ timeline.ts
│  ├ qr.ts
│
└ uploads
🚀 セットアップ
1. リポジトリをクローン
git clone https://github.com/your-username/EveryoneMemories.git
2. フォルダへ移動
cd EveryoneMemories
3. 必要ライブラリをインストール
npm install
4. サーバー起動
node server.js
5. ブラウザでアクセス
http://localhost:3000
📱 スマホからの利用

PC画面に表示された QRコード を読み取る

スマホのブラウザでアップロードページが開く

写真を選択して送信

アップロードされた画像は uploadsフォルダ に保存されます。

💡 今後の予定

📍 写真のEXIF情報から位置を取得

🌎 3D思い出マップ

🤖 AIによるストーリー生成の高度化

🎬 思い出スライドショー生成
