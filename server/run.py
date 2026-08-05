#!/usr/bin/env python3
"""启动服务: python run.py [-p PORT]"""

import argparse

import uvicorn

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="启动龙厨当家供应商管理系统")
    parser.add_argument("-p", "--port", type=int, default=8000, help="监听端口（默认 8000）")
    args = parser.parse_args()
    uvicorn.run("app.main:app", host="0.0.0.0", port=args.port, reload=True)
