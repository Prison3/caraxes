# 龙厨当家 · Android 客户端

用 Android Studio 打开本目录（`android/`）同步 Gradle 后运行。

默认 API：`http://8.146.225.19:8000/`

本机或模拟器请在登录页「服务器设置」填写，例如 `10.0.2.2:8000`。

默认账号：`admin` / `admin123`（管理员），店长用户名=店铺名、密码 `12345`。

管理员底部导航：查询、管理、成本、用户、我的。店长：录入、查询、我的。

发布：

```bash
../scripts/build_release_apk.sh
```

安装包下载：`/download/caraxes.apk`；版本接口：`/api/app/info`。
