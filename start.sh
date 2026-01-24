#!/bin/bash

# 图片水印去除工具 - 一键更新启动脚本

cd "$(dirname "$0")"

echo "=== 拉取最新代码 ==="
git pull origin main

echo "=== 检查系统依赖 ==="
if ! dpkg -l | grep -q python3-venv; then
    echo "安装 python3-venv..."
    apt update && apt install -y python3-venv python3-pip
fi

echo "=== 设置虚拟环境 ==="
# 如果venv损坏则删除重建
if [ -d "venv" ] && [ ! -f "venv/bin/activate" ]; then
    echo "虚拟环境损坏，重新创建..."
    rm -rf venv
fi

if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "=== 安装/更新依赖 ==="
pip install -r requirements.txt -q

echo "=== 启动服务 ==="
echo "服务地址: http://0.0.0.0:5001"
python3 app.py
