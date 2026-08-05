# 供应商每日订单系统

Android App 向服务端上报每日供应商订单（日期、店铺名、供应商名、单日总价）。

## 服务端

### 环境

- Python 3.10+

### 安装与启动

```bash
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
| `order_date` | 订单日期 |
| `shop_name` | 店铺名（阳光花城 / 十字街 / 碧水龙城店） |
| `supplier_name` | 供应商名（蔬菜） |
| `daily_total` | 单日总金额（浮点数） |

同一天、同一店铺、同一供应商只能有一条记录。

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
