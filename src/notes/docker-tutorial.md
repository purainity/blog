---
article: false
toc: true
---

# Docker 命令教程

菜鸟教程：https://www.runoob.com/docker/docker-tutorial.html

Docker 是一个开源的应用容器引擎，它让开发者可以打包他们的应用以及依赖包到一个可移植的容器中，然后发布到任何流行的 Linux 机器或 Windows 机器上，也可以实现虚拟化。理解 Docker 的关键在于理解它如何将应用程序及其运行环境隔离、打包和运行。

## Docker 的核心概念

在深入操作之前，我们先来理解 Docker 管理应用程序的几个核心概念：

1.  **Dockerfile (定义文件)**：
    一个文本文件，包含了构建 Docker 镜像所需的所有指令。你可以把它看作是应用程序及其环境的“食谱”或“蓝图”。

2.  **Docker Image (镜像)**：
    一个轻量级、可执行的独立软件包，包含了运行应用程序所需的所有内容：代码、运行时、系统工具、系统库和设置。镜像是只读的，可以理解为程序的“类”或“模板”。

3.  **Docker Container (容器)**：
    镜像的运行实例。容器是相互隔离的，拥有自己的文件系统、网络接口和进程空间。你可以把容器想象成一个运行中的、高度隔离的虚拟机，但它更轻量、启动更快。

4.  **Docker Registry (仓库)**：
    用于存储和分发 Docker 镜像的服务。最常用的是 Docker Hub，它是一个公共仓库，你也可以搭建私有仓库。

**Docker 的生命周期流转路径**：
Dockerfile (编写应用环境) -> Docker Image (构建、打包应用) -> Docker Registry (存储、分享镜像) -> Docker Container (运行应用实例)

理解这些核心概念及其流转是理解 Docker 命令的基础。

---

## Docker 各种操作详解

下面我们将 Docker 的常用操作分为几大类进行解释。

### 一、环境准备与配置 (Setup & Configuration)

在你开始使用 Docker 进行容器化部署之前，需要进行一些基本的检查和了解。

1.  **检查 Docker 版本 (`docker version`)**
    确认 Docker 是否已正确安装，并查看客户端和守护进程的版本信息。

    ```bash
    docker version
    ```

2.  **查看 Docker 系统信息 (`docker info`)**
    显示 Docker 守护进程的详细信息，包括容器数量、镜像数量、存储驱动、日志驱动等。

    ```bash
    docker info
    ```

3.  **Docker 守护进程 (Daemon)**
    Docker 守护进程 (`dockerd`) 是 Docker 引擎的核心组件，它运行在宿主机上，负责构建、运行和管理 Docker 容器。你无需直接操作它，但了解其存在有助于理解 Docker 的工作原理。

### 二、镜像管理 (Image Management)

镜像是 Docker 容器的基础，本节涵盖了镜像的构建、拉取、查看和删除。

1.  **构建镜像 (`docker build`)**
    根据 `Dockerfile` 文件构建一个新的 Docker 镜像。这是将你的应用程序打包成可运行容器的第一步。

    ```bash
    # 在包含 Dockerfile 的目录中执行
    docker build -t <镜像名>:<标签> .
    # -t: 为构建的镜像指定名称和标签 (tag)，通常标签是版本号
    # .: 表示 Dockerfile 所在的上下文路径，即当前目录
    
    # 示例：构建一个名为 my-web-app，标签为 1.0 的镜像
    docker build -t my-web-app:1.0 .
    
    # 如果 Dockerfile 不在当前目录，或文件名不是 Dockerfile
    docker build -f /path/to/my/Dockerfile -t my-app:latest .
    ```
    **Dockerfile 基础结构 (示例)**：
    ```dockerfile
    # 使用官方 Ubuntu 镜像作为基础镜像
    FROM ubuntu:22.04
    
    # 设置工作目录
    WORKDIR /app
    
    # 将当前目录下的所有文件复制到容器的 /app 目录
    COPY . /app
    
    # 安装依赖 (以 Node.js 为例)
    RUN apt-get update && apt-get install -y nodejs npm
    
    # 暴露端口
    EXPOSE 3000
    
    # 定义容器启动时执行的命令
    CMD ["node", "app.js"]
    ```
    *   `FROM`: 指定基础镜像。
    *   `WORKDIR`: 设置工作目录。
    *   `COPY`: 复制文件到镜像。
    *   `RUN`: 在镜像构建时执行命令（如安装软件）。
    *   `EXPOSE`: 声明容器运行时会监听的端口。
    *   `CMD`: 容器启动时默认执行的命令。

2.  **拉取镜像 (`docker pull`)**
    从 Docker Registry（默认为 Docker Hub）下载一个镜像到本地。

    ```bash
    docker pull <镜像名>:<标签>
    # 示例：
    docker pull ubuntu:latest     # 拉取最新版 Ubuntu 镜像
    docker pull nginx             # 默认拉取 latest 标签
    ```

3.  **查看本地镜像 (`docker images` / `docker image ls`)**
    列出所有已下载或构建的本地镜像。

    ```bash
    docker images
    # 或
    docker image ls
    
    # 过滤特定镜像
    docker images ubuntu
    # 过滤悬空镜像 (没有被任何标签引用的镜像)
    docker images -f "dangling=true"
    ```

4.  **删除镜像 (`docker rmi` / `docker image rm`)**
    删除一个或多个本地镜像。如果镜像正在被容器使用，需要先删除容器。

    ```bash
    docker rmi <镜像ID或镜像名:标签>
    # 示例：
    docker rmi my-web-app:1.0
    docker rmi a1b2c3d4e5f6 # 使用镜像ID
    
    # 强制删除正在被使用的镜像 (慎用！)
    docker rmi -f <镜像ID或镜像名:标签>
    
    # 删除所有未被使用的镜像 (清理)
    docker image prune -a
    ```

5.  **为镜像打标签 (`docker tag`)**
    为本地镜像添加一个新的标签，通常用于将镜像推送到不同的仓库或版本管理。

    ```bash
    docker tag <源镜像名:源标签> <目标镜像名:目标标签>
    # 示例：将本地的 my-web-app:1.0 标记为用于推送 Docker Hub 的格式
    docker tag my-web-app:1.0 your_dockerhub_username/my-web-app:1.0
    ```

### 三、容器管理 (Container Management)

容器是 Docker 运行应用程序的实例，本节涵盖了容器的运行、停止、删除和交互。

1.  **运行容器 (`docker run`)**
    基于一个镜像启动一个新的容器。这是最常用也是最重要的 Docker 命令之一。

    ```bash
    docker run [OPTIONS] <镜像名>:<标签> [COMMAND] [ARG...]
    
    # 常用选项：
    # -d, --detach: 后台运行容器，并打印容器ID
    # -p, --publish: 端口映射，宿主机端口:容器端口
    # --name: 为容器指定一个名称，方便识别和管理
    # -v, --volume: 挂载卷或绑定挂载，用于数据持久化
    # -it: 交互式运行，-i 保持标准输入打开，-t 分配一个伪终端
    # --rm: 容器退出后自动删除
    # --network: 指定容器连接的网络
    # --env, -e: 设置环境变量
    # --restart: 指定容器的重启策略 (e.g., always, on-failure)
    
    # 示例：
    # 以后台模式运行 Nginx 容器，并将宿主机的 80 端口映射到容器的 80 端口，命名为 my-nginx
    docker run -d -p 80:80 --name my-nginx nginx:latest
    
    # 交互式运行一个 Ubuntu 容器，进入其 bash 终端
    docker run -it ubuntu:latest bash
    
    # 运行一个容器，并挂载本地目录 /app 到容器的 /usr/src/app
    docker run -d -p 3000:3000 -v /path/to/your/local/app:/usr/src/app --name my-node-app my-web-app:1.0
    
    # 运行后自动删除的容器
    docker run --rm hello-world
    ```

2.  **查看运行中的容器 (`docker ps`)**
    列出所有正在运行的容器。

    ```bash
    docker ps
    # 或
    docker container ls
    
    # 查看所有容器 (包括已停止的)
    docker ps -a
    
    # 只显示容器ID
    docker ps -q
    ```

3.  **启动/停止/重启容器 (`docker start`/`stop`/`restart`)**
    控制已创建但未运行或正在运行的容器。

    ```bash
    docker start <容器ID或容器名>
    docker stop <容器ID或容器名>
    docker restart <容器ID或容器名>
    
    # 示例：
    docker start my-nginx
    docker stop my-nginx
    
    # 停止所有运行中的容器
    docker stop $(docker ps -aq)
    ```

4.  **删除容器 (`docker rm`)**
    删除一个或多个已停止的容器。

    ```bash
    docker rm <容器ID或容器名>
    # 示例：
    docker rm my-nginx
    
    # 强制删除运行中的容器 (慎用！)
    docker rm -f <容器ID或容器名>
    
    # 删除所有已停止的容器 (清理)
    docker container prune
    # 或
    docker rm $(docker ps -aq --filter "status=exited")
    ```

5.  **进入运行中的容器 (`docker exec`)**
    在运行中的容器内执行命令，常用于调试。

    ```bash
    docker exec -it <容器ID或容器名> <命令> [参数...]
    # 示例：进入 my-nginx 容器的 bash 终端
    docker exec -it my-nginx bash
    
    # 在 my-nginx 容器中查看文件列表
    docker exec my-nginx ls -l /etc/nginx
    ```

6.  **查看容器日志 (`docker logs`)**
    获取容器的日志输出。

    ```bash
    docker logs <容器ID或容器名>
    # 示例：
    docker logs my-nginx
    
    # 实时跟踪日志输出
    docker logs -f my-nginx
    
    # 查看最近的 100 行日志
    docker logs --tail 100 my-nginx
    ```

7.  **查看容器详细信息 (`docker inspect`)**
    获取容器的底层信息，包括 IP 地址、端口映射、挂载点等。

    ```bash
    docker inspect <容器ID或容器名>
    # 示例：查看 my-nginx 的 IP 地址
    docker inspect -f '{{.NetworkSettings.IPAddress}}' my-nginx
    ```

8.  **从容器复制文件 (`docker cp`)**
    在宿主机和容器之间复制文件或目录。

    ```bash
    # 从容器复制到宿主机
    docker cp <容器ID或容器名>:<容器路径> <宿主机路径>
    # 示例：
    docker cp my-nginx:/etc/nginx/nginx.conf .
    
    # 从宿主机复制到容器
    docker cp <宿主机路径> <容器ID或容器名>:<容器路径>
    # 示例：
    docker cp ./new_nginx.conf my-nginx:/etc/nginx/nginx.conf
    ```

### 四、数据管理 (Data Management)

容器是短暂的，当容器被删除时，其内部的数据也会丢失。为了实现数据持久化，Docker 提供了两种主要方式：卷 (Volumes) 和绑定挂载 (Bind Mounts)。

1.  **卷 (Volumes)**
    Docker 管理宿主机文件系统的一部分，是 Docker 推荐的数据持久化方式。

    ```bash
    # 创建一个命名卷
    docker volume create <卷名>
    # 示例：
    docker volume create my-data
    
    # 列出所有卷
    docker volume ls
    
    # 查看卷的详细信息
    docker volume inspect <卷名>
    
    # 运行容器并挂载卷
    docker run -d -p 80:80 --name my-nginx -v my-data:/usr/share/nginx/html nginx:latest
    # 宿主机上的 /var/lib/docker/volumes/my-data/_data 会映射到容器的 /usr/share/nginx/html
    
    # 删除卷 (只有当卷没有被任何容器使用时才能删除)
    docker volume rm <卷名>
    
    # 删除所有未使用的卷
    docker volume prune
    ```

2.  **绑定挂载 (Bind Mounts)**
    直接将宿主机文件系统上的任意目录或文件挂载到容器中。

    ```bash
    # 运行容器并绑定挂载本地目录
    docker run -d -p 80:80 --name my-nginx -v /path/on/host/data:/usr/share/nginx/html nginx:latest
    # 宿主机上的 /path/on/host/data 目录会直接映射到容器的 /usr/share/nginx/html
    ```
    **卷与绑定挂载的区别**：
    *   **卷**：由 Docker 管理，更适合 Docker 生态系统，跨平台兼容性更好，更易备份和迁移。
    *   **绑定挂载**：直接依赖宿主机文件系统结构，更灵活，但可能存在安全和可移植性问题。

### 五、网络管理 (Network Management)

Docker 容器可以通过网络相互通信，也可以与外部世界通信。Docker 提供了多种网络驱动。

1.  **查看网络 (`docker network ls`)**
    列出所有可用的 Docker 网络。

    ```bash
    docker network ls
    # 默认有 bridge, host, none 三种网络模式
    ```

2.  **创建自定义网络 (`docker network create`)**
    创建用户自定义的桥接网络，隔离容器并方便容器间通过名称进行通信。

    ```bash
    docker network create <网络名>
    # 示例：
    docker network create my-app-network
    
    # 运行容器并连接到自定义网络
    docker run -d --name db --network my-app-network postgres
    docker run -d --name app --network my-app-network -p 80:80 my-app:latest
    # 在 app 容器中，可以通过 db 名称直接访问 postgres 容器
    ```

3.  **连接/断开容器到网络 (`docker network connect`/`disconnect`)**
    将一个已运行的容器连接或断开到指定网络。

    ```bash
    docker network connect <网络名> <容器ID或容器名>
    docker network disconnect <网络名> <容器ID或容器名>
    ```

4.  **删除网络 (`docker network rm`)**
    删除一个或多个自定义网络。

    ```bash
    docker network rm <网络名>
    # 删除所有未使用的网络
    docker network prune
    ```

### 六、仓库操作 (Registry Operations)

与 Docker Registry 交互，进行镜像的上传和下载。

1.  **登录 Docker Registry (`docker login`)**
    登录到 Docker Hub 或私有 Registry，以便推送和拉取私有镜像。

    ```bash
    docker login [Registry URL]
    # 默认登录 Docker Hub (无需指定 URL)
    docker login
    # 登录私有 Registry
    docker login registry.example.com
    ```

2.  **推送镜像 (`docker push`)**
    将本地镜像推送到 Docker Registry，分享给他人或作为备份。

    ```bash
    docker push <镜像名>:<标签>
    # 示例：
    # 确保镜像已打好标签，格式为 your_dockerhub_username/repo_name:tag
    docker push your_dockerhub_username/my-web-app:1.0
    ```

3.  **登出 Docker Registry (`docker logout`)**
    从 Docker Registry 登出。

    ```bash
    docker logout [Registry URL]
    ```

### 七、多容器编排 (Multi-Container Orchestration - Docker Compose)

对于包含多个服务（如 Web 应用、数据库、缓存）的复杂应用，手动管理多个容器会很繁琐。Docker Compose 允许你使用 YAML 文件定义和运行多容器 Docker 应用程序。

1.  **`docker-compose.yml` 文件**
    定义应用程序的服务、网络和卷。

    ```yaml
    # docker-compose.yml 示例
    version: '3.8'
    services:
      web:
        build: . # 从当前目录的 Dockerfile 构建
        ports:
          - "80:80"
        volumes:
          - .:/app
        depends_on:
          - db
      db:
        image: postgres:13
        environment:
          POSTGRES_DB: mydatabase
          POSTGRES_USER: user
          POSTGRES_PASSWORD: password
        volumes:
          - db-data:/var/lib/postgresql/data
    
    volumes:
      db-data:
    ```

2.  **启动/停止应用 (`docker-compose up`/`down`)**
    在 `docker-compose.yml` 文件所在的目录执行命令。

    ```bash
    # 启动所有服务 (后台运行)
    docker-compose up -d
    
    # 停止并删除所有服务、网络和卷
    docker-compose down
    
    # 构建服务镜像 (如果 Dockerfile 有更新)
    docker-compose build
    
    # 查看服务状态
    docker-compose ps
    
    # 在指定服务中执行命令
    docker-compose exec web bash