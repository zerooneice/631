2027 上体大考研抽题 · iPhone PWA 免费版

一、免费部署（推荐 GitHub Pages）
1. 登录 github.com，创建一个 Public 仓库，例如 exam-quiz-2027。
2. 把本文件夹内的内容（index.html、三个学科 html、manifest.webmanifest、sw.js、icons 文件夹）上传到仓库根目录。注意不是把整个 ZIP 上传进去。
3. 仓库 Settings → Pages → Build and deployment → Source：Deploy from a branch。
4. Branch 选择 main，Folder 选择 /(root)，点 Save。
5. 部署成功后网站地址通常是 https://你的用户名.github.io/exam-quiz-2027/ 。具体以 Pages 页面的地址为准。

二、iPhone 安装
1. 使用 Safari 打开部署的网址，保持联网完成第一次加载。
2. 点击底部分享按钮 → 添加到主屏幕 → 添加。
3. 从桌面图标打开。首次联机打开并缓存页面后，可离线抽题。

三、重要提示
- 无需购买 Apple 开发者账号、域名，也无需支付应用商店费用。
- GitHub Pages 免费发布的是公开站点：HTML 内置的三科题目可被他人访问。不要把个人答案笔记写入要上传的 HTML！
- 学习进度、生题库与答案笔记只保存在此设备的浏览器存储中，不会自动云端同步。
- 定期用「导出背诵进度」备份；不同设备请手动导出、导入。清除网站数据或删除网页 App 可能导致本地数据丢失。
- 不要用文件 App 的 file:// 预览来判断 PWA 是否可安装；PWA 必须通过 HTTPS 网址访问。
- 更新版本后需重新上传文件；若设备仍显示旧内容，可等待缓存更新、重新打开，必要时清理旧缓存（记得先导出笔记）。
