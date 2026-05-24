# 文枢 - 云服务器部署指南

## 服务器要求

- Ubuntu 20.04+ / CentOS 7+
- Node.js 20+
- 1 核 2G 以上（推荐 2 核 4G）
- 开放端口：80、443（如需 HTTPS）

---

## 一、安装 Node.js 20

```bash
# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# CentOS
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git
```

---

## 二、克隆项目

```bash
cd /opt
git clone <你的仓库地址> wenshu
cd wenshu
```

---

## 三、安装依赖

```bash
cd server && npm install
cd ../client && npm install
```

---

## 四、配置环境变量

编辑 `server/.env`，修改以下配置：

```env
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET="<生成一个随机字符串>"
JWT_REFRESH_SECRET="<生成另一个随机字符串>"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="30d"
PORT=3001
NODE_ENV=production
AI_PROVIDER=deepseek
AI_API_KEY=<你的DeepSeek API Key>
AI_MODEL=deepseek-chat
```

生成随机密钥：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 五、初始化数据库

```bash
cd server
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

---

## 六、构建前端

```bash
cd client
npx vite build
```

---

## 七、启动服务

### 方式一：PM2（推荐，自带进程守护）

```bash
npm install -g pm2
cd /opt/wenshu/server
pm2 start "npx tsx src/index.ts" --name wenshu --cwd /opt/wenshu/server
pm2 save
pm2 startup  # 设置开机自启
```

常用命令：
```bash
pm2 status        # 查看状态
pm2 logs wenshu   # 查看日志
pm2 restart wenshu # 重启
```

### 方式二：直接运行（临时）

```bash
cd /opt/wenshu/server
NODE_ENV=production npx tsx src/index.ts &
```

---

## 八、配置 Nginx 反向代理（可选但推荐）

```bash
sudo apt install -y nginx
```

创建 `/etc/nginx/sites-available/wenshu`：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用：
```bash
sudo ln -s /etc/nginx/sites-available/wenshu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 九、配置 HTTPS（可选）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

---

## 十、更新部署

```bash
cd /opt/wenshu
git pull
cd client && npm install && npx vite build
cd ../server && npm install && npx prisma migrate deploy
pm2 restart wenshu
```

---

## 架构说明

```
用户 → Nginx(80/443) → Express(3001)
                          ├── /api/*  → 后端接口
                          └── /*      → 前端静态文件 (client/dist)
```

生产模式下 Express 同时服务 API 和前端静态文件，无需额外配置。
