#!/bin/bash
# 简化版启动脚本

# 激活虚拟环境（如果存在）
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 读取端口（默认 1153）
PORT=${PORT:-1153}

# 使用 gunicorn + eventlet 启动
echo "🚀 启动 LINE Rich Menu Editor 于 127.0.0.1:${PORT}"
gunicorn -k eventlet -w 1 -b 127.0.0.1:${PORT} app:app

