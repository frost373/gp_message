@echo off
chcp 65001 >nul
title 江南007 消息转发器 (QQ单聊模式)

echo ====================================================
echo.
echo           江南007 课程消息转发器 - 一键启动
echo.
echo ====================================================
echo.

echo [1/2] 正在检查环境依赖...
call npm install --no-fund --no-audit --silent
if %errorlevel% neq 0 (
    echo.
    echo ❌ 依赖安装失败，请检查是否正确安装了 Node.js！
    echo 下载 Node.js: https://nodejs.org/zh-cn/
    echo.
    pause
    exit /b
)
echo ✅ 环境检查通过！
echo.

echo [2/2] 正在启动转发服务...
echo.
node index.js

echo.
echo ====================================================
echo ⚠️ 转发服务已退出。
echo ====================================================
pause
