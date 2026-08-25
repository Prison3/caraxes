# 供应商每日订单系统

Web / Android 客户端向服务端上报每日供应商订单（日期、店铺、供应商、单日总价）。

## Android

用 Android Studio 打开 `android/` 目录同步 Gradle 后运行。

- 默认 API：`http://10.0.2.2:8000/`（模拟器访问本机后端）
- 真机：登录页「服务器设置」填写电脑局域网 IP，例如 `192.168.1.8:8000`
- 默认账号：`admin` / `admin123`；店长用户名=店铺名、密码 `12345`
- 管理员密码可登录任意账号：用户名填目标账号，密码填管理员密码

功能与 Web 对齐：店长可录入/查询，管理员可查询/管理/成本/用户；「我的」双方都有。认证使用 Session Cookie（`caraxes_session`）。

发布 APK：

```bash
./scripts/build_release_apk.sh
```

默认编译 release 并上传到 `root@S1:/root/caraxes/server/downloads/`。仅本地构建可设 `CARAXES_UPLOAD=0`。

- 安装包：`http://127.0.0.1:8000/download/caraxes.apk`
- 版本信息：`http://127.0.0.1:8000/api/app/info`

App 启动和「我的」页会检查更新；新版本可直接下载安装。

## 服务端

### 环境

- Python 3.10+
- MongoDB 6+（默认连接 `mongodb://127.0.0.1:27017`，库名 `caraxes`）

可通过环境变量覆盖：

- `MONGODB_URI`：MongoDB 连接串
- `MONGODB_DB`：数据库名

### 安装与启动

```bash
# 确保本地 MongoDB 已启动，例如：
# sudo systemctl start mongod

cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

服务地址：`http://0.0.0.0:8000`  
Web 提交页：`http://127.0.0.1:8000/`  
接口文档：`http://127.0.0.1:8000/docs`

### 数据模型

| 字段 | 说明 |
|------|------|
| `order_no` | 订单编号（日期精确到时分秒，如 `20260806143025`） |
| `order_date` | 订单日期（业务日，用于筛选） |
| `shop_name` | 店铺名（阳光花城 / 十字街 / 碧水龙城店） |
| `supplier_name` | 供应商名（蔬菜） |
| `daily_total` | 单日总金额（浮点数） |

同一天、同一店铺、同一供应商可有多笔订单；录入时仅在日期、店铺、供应商、金额完全一致时提示重复。

### API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/orders` | 新增订单 |
| `GET` | `/api/orders` | 列表（可选 `order_date`、`shop_name`、`supplier_name`） |
| `GET` | `/api/orders/{id}` | 详情 |
| `PUT` | `/api/orders/{id}` | 更新 |
| `DELETE` | `/api/orders/{id}` | 删除 |
| `GET` | `/api/shops` | 店铺列表 |
| `POST` | `/api/shops` | 添加店铺 `{"name":"阳光花城"}` |
| `DELETE` | `/api/shops/{id}` | 删除店铺 |
| `GET` | `/api/suppliers` | 供应商列表 |
| `POST` | `/api/suppliers` | 添加供应商 `{"name":"蔬菜"}` |
| `DELETE` | `/api/suppliers/{id}` | 删除供应商 |
| `GET` | `/api/costs` | 成本汇总（管理员；可按店铺/供应商筛选；`period=day|month` 返回日/月柱状 `buckets`） |
| `POST` | `/api/users` | 添加店长 |
| `PUT` | `/api/users/{id}` | 更新店长用户名/密码/店铺 |
| `PUT` | `/api/users/{id}/disabled` | 启用/禁用店长 |
| `POST` | `/api/users/{id}/login` | 管理员切换登录到该店长 |
| `POST` | `/api/auth/return-admin` | 从店长身份返回原管理员 |
| `DELETE` | `/api/users/{id}` | 删除店长 |
| `GET` | `/health` | 健康检查 |

#### 新增示例

```bash
curl -X POST http://127.0.0.1:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "order_date": "2026-08-05",
    "shop_name": "城东店",
    "supplier_name": "华东果蔬",
    "daily_total": 1280.50
  }'
```
