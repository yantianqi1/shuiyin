#!/bin/bash

# 图片水印去除工具 - 一键更新启动脚本 (PM2 保活)

cd "$(dirname "$0")"

echo "=== 拉取最新代码 ==="
git pull origin main

echo "=== 检查系统依赖 ==="
if ! dpkg -l | grep -q python3-venv; then
    echo "安装 python3-venv..."
    apt update && apt install -y python3-venv python3-pip
fi

# OpenCV 系统依赖
if ! dpkg -l | grep -q libgl1; then
    echo "安装 OpenCV 依赖..."
    apt install -y libgl1 libglib2.0-0
fi

# 安装 Node.js 和 PM2
if ! command -v pm2 &> /dev/null; then
    echo "安装 PM2..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
    fi
    npm install -g pm2
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

echo "=== 使用 PM2 启动服务 ==="
# 停止旧进程（如果存在）
pm2 delete shuiyin 2>/dev/null || true

# 启动新进程
pm2 start venv/bin/python3 --name shuiyin -- app.py

# 保存 PM2 进程列表并设置开机自启
pm2 save
pm2 startup 2>/dev/null || true

echo ""
echo "=== 服务已启动 ==="
echo "服务地址: http://0.0.0.0:5001"
echo ""
echo "PM2 常用命令:"
echo "  pm2 status      - 查看状态"
echo "  pm2 logs shuiyin - 查看日志"
echo "  pm2 restart shuiyin - 重启服务"
echo "  pm2 stop shuiyin - 停止服务"
