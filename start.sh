#!/bin/bash
# 快速啟動腳本

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}LINE Rich Menu Editor - 啟動中...${NC}"
echo -e "${GREEN}========================================${NC}"

# 檢查虛擬環境
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}未找到虛擬環境，正在建立...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# 檢查資料庫
if [ ! -f "database.db" ]; then
    echo -e "${YELLOW}未找到資料庫，正在初始化...${NC}"
    python db.py
fi

# 啟動應用
echo -e "${GREEN}✓ 環境準備完成${NC}"
echo -e "${GREEN}✓ 啟動應用於 Port ${PORT:-1153}${NC}"
echo -e "${YELLOW}按 Ctrl+C 停止應用${NC}"
echo ""

python app.py

