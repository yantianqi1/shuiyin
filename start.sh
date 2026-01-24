#!/bin/bash

# 图片水印去除工具 - 一键更新启动脚本

cd "$(dirname "$0")"

echo "=== 拉取最新代码 ==="
git pull origin main

echo "=== 设置虚拟环境 ==="
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "=== 安装/更新依赖 ==="
pip install -r requirements.txt -q

echo "=== 启动服务 ==="
echo "服务地址: http://localhost:5001"
python app.py
