---
article: false
toc: true
---

# Git 命令教程

菜鸟教程：https://www.runoob.com/git/git-tutorial.html

Git 是一个分布式版本控制系统，它能帮助你跟踪代码的修改、协作开发、管理项目历史。理解 Git 的关键在于理解它如何管理文件在不同区域之间的状态。

## Git 的四大区域概念

在深入操作之前，我们先来理解 Git 管理文件的四个核心区域：

1.  **工作区 (Working Directory)**：
    你实际进行编码和文件操作的地方。

2.  **暂存区 (Staging Area / Index)**：
    一个轻量级的文件，记录了你下次提交（commit）时要包含哪些文件的哪些修改。你可以把工作区的修改“选择性地”添加到暂存区。

3.  **本地仓库 (Local Repository)**：
    了没的 `.git` 目录，存储了所有提交过的版本历史。暂存区的修改会提交到本地仓库。

4.  **远程仓库 (Remote Repository)**：
    托管在网络上的仓库（如 GitHub, GitLab, Gitee），用于团队协作和备份。本地仓库的提交可以推送到远程仓库。

**文件流转路径**：
工作区 (修改) -> 暂存区 (选择性添加) -> 本地仓库 (提交) -> 远程仓库 (推送)

理解这四个区域及其流转是理解 Git 命令的基础。

---

## Git 各种操作详解

下面我们将 Git 的常用操作分为几大类进行解释。

### 一、初始化与配置 (Setup & Initialization)

在你开始使用 Git 进行版本控制之前，需要进行一些基本的设置。

1.  **配置用户信息 (`git config`)**
    在使用 Git 前，需要设置你的用户名和邮箱。这些信息会作为“作者签名”记录在你的每次提交中，方便团队成员知道是谁做了哪些修改。

    ```bash
    git config --global user.name "你的名字"   # 设置全局用户名，例如 "Zhang San"
    git config --global user.email "你的邮箱" # 设置全局邮箱，例如 "zhangsan@example.com"
    
    # 查看所有 Git 配置
    git config --list
    
    # 查看某个特定配置
    git config user.name
    ```
    `--global` 表示全局配置，对你电脑上所有 Git 仓库都有效。如果你想为某个特定项目使用不同的用户名/邮箱，可以在该项目目录下不加 `--global` 再次运行 `git config` 命令。

2.  **设置默认分支名 (Git 2.28+ 推荐)**
    新版 Git 推荐使用 `main` 作为默认分支名，而不是 `master`。

    ```bash
    git config --global init.defaultBranch main
    ```

3.  **配置默认文本编辑器 (可选)**
    当你需要输入较长的提交信息或解决合并冲突时，Git 会调用默认的文本编辑器。你可以配置自己喜欢的编辑器。

    ```bash
    git config --global core.editor "vim"   # 设置为 Vim
    git config --global core.editor "code --wait" # 设置为 VS Code (需要将 code 添加到 PATH)
    ```

4.  **初始化新仓库 (`git init`)**
    在一个现有项目目录中创建一个新的 Git 仓库。这会把你的项目变成一个可被 Git 管理的仓库。执行后，会在当前目录下生成一个隐藏的 `.git` 文件夹，这就是你的本地仓库。

    ```bash
    cd /path/to/your/project # 进入你的项目目录
    git init                 # 初始化 Git 仓库
    ```

5.  **克隆远程仓库 (`git clone`)**
    从远程仓库（如 GitHub、GitLab、Gitee）下载一个完整的 Git 仓库到本地。这是你参与现有项目或获取开源项目代码的常用方式。

    ```bash
    git clone <远程仓库URL> [本地目录名]
    # 示例：
    git clone https://github.com/octocat/Spoon-Knife.git my-spoon-knife
    ```
    如果 `[本地目录名]` 不指定，Git 会默认使用远程仓库名作为本地目录名。克隆后，Git 会自动为你设置好远程仓库的地址（通常命名为 `origin`）。

6.  **忽略文件 (`.gitignore`)**
    在项目开发中，有些文件（如编译生成的文件、日志文件、IDE 配置文件、依赖包等）不应该被 Git 跟踪和提交。`.gitignore` 文件就是用来告诉 Git 哪些文件或目录应该被忽略。

    在你的项目根目录下创建一个名为 `.gitignore` 的文本文件，然后将要忽略的文件或目录模式写入其中。

    ```
    # 这是一个 .gitignore 文件的示例内容
    
    # 忽略所有 .log 结尾的文件
    *.log
    
    # 忽略 build 目录
    /build/
    
    # 忽略 node_modules 目录（常见的依赖包目录）
    node_modules/
    
    # 忽略所有以 .bak 结尾的文件
    *.bak
    
    # 忽略特定的文件
    my_secret_config.txt
    
    # 但不忽略 /build/important.txt 文件（即使 /build/ 被忽略了）
    !/build/important.txt 
    ```
    **注意**：`.gitignore` 文件只对**未被 Git 跟踪**的文件有效。如果某个文件已经被 Git 跟踪了，即使你把它写入 `.gitignore`，Git 也仍然会跟踪它。你需要先从 Git 仓库中移除它（`git rm --cached <文件名>`），然后再提交。

### 二、日常工作流 (Daily Workflow - 本地操作)

这是你每天与 Git 交互最频繁的部分，涉及在工作区、暂存区和本地仓库之间的文件流转。

1.  **查看状态 (`git status`)**
    这是你最常用的 Git 命令之一，它能清晰地告诉你当前工作区和暂存区的状态，包括：
    *   哪些文件被修改了（`modified`）但未暂存。
    *   哪些文件已暂存（`new file` 或 `modified`）。
    *   哪些文件是新创建的但未被 Git 跟踪（`untracked`）。
    *   你当前所在的分支。

    ```bash
    git status
    # 简洁模式显示状态 (常用)
    git status -s 
    # M 文件名：已修改但未暂存
    # A 文件名：已暂存的新文件
    # ?? 文件名：未跟踪的新文件
    ```

2.  **添加文件到暂存区 (`git add`)**
    将工作区的修改（新建、修改、删除）添加到暂存区，准备提交。你可以选择性地添加部分修改，这有助于你创建更专注、更清晰的提交。

    ```bash
    git add <文件名>           # 添加指定文件到暂存区
    git add .                 # 添加当前目录下所有“新文件”和“已修改文件”到暂存区
    git add -u                # 添加所有“已跟踪文件”的修改和删除到暂存区，但不包括新文件
    git add -A                # 添加所有修改（包括新建、修改、删除）到暂存区，等同于 git add . 和 git add -u 的组合
    
    # 示例：
    git add index.html style.css # 添加这两个文件
    git add .                    # 添加所有改变
    ```

3.  **提交到本地仓库 (`git commit`)**
    将暂存区的修改提交到本地仓库，形成一个新的版本历史。每次提交都应该是一个逻辑上完整的单元，并附带一个清晰、简洁的提交信息，说明本次提交的目的和内容。

    ```bash
    git commit -m "你的提交信息" # 最常用，直接在命令行输入提交信息
    # 示例：
    git commit -m "feat: 添加用户登录功能"
    
    # 如果想同时跳过暂存区，直接提交所有已跟踪文件的修改（但不包括新建文件）
    # 相当于 git add -u 然后 git commit
    git commit -am "你的提交信息" 
    
    # 修改上一次提交（慎用！尤其在已推送到远程后）
    # 这会替换掉上一次提交，而不是新增一次提交。
    # 仅在本地且未推送时使用，用于补充或修正上一次提交的内容或信息。
    git commit --amend -m "新的提交信息" 
    # 或者只修改信息，不修改内容
    git commit --amend --no-edit
    ```
    **提交信息规范（推荐）**：
    *   **标题行**：简洁说明本次提交的目的（不超过50字）。
    *   **空一行**：标题和正文之间空一行。
    *   **正文**：详细说明修改了什么、为什么修改、解决了什么问题。
    *   **常用前缀**：
        *   `feat`: 新功能 (feature)
        *   `fix`: Bug 修复 (bug fix)
        *   `docs`: 文档变更 (documentation)
        *   `style`: 代码格式（不影响代码运行的变动，如空格、分号等）
        *   `refactor`: 代码重构（不包括新功能或 Bug 修复）
        *   `perf`: 性能优化 (performance)
        *   `test`: 测试相关 (testing)
        *   `build`: 构建过程或辅助工具的变动
        *   `ci`: CI 配置、脚本文件等变动
        *   `chore`: 其他不修改 src 或 test 文件的提交

4.  **查看差异 (`git diff`)**
    比较文件在不同状态间的差异，帮助你回顾和确认修改。

    ```bash
    git diff                      # 比较工作区与暂存区的差异 (未暂存的修改)
    git diff --cached             # 比较暂存区与上次提交（HEAD）的差异 (已暂存的修改)
    git diff HEAD                 # 比较工作区与上次提交（HEAD）的差异 (所有本地修改)
    git diff <commit-id1> <commit-id2> <文件名> # 比较两次提交之间某个文件的差异
    git diff <分支名1> <分支名2>     # 比较两个分支之间的差异
    
    # 简洁显示差异统计
    git diff --stat
    ```
    **HEAD**：在 Git 中，`HEAD` 是一个特殊的指针，它总是指向你当前所在分支的最新提交。你可以把它想象成你当前“版本历史”的最新位置。

5.  **查看提交历史 (`git log`)**
    查看本地仓库的提交历史，了解项目的发展轨迹。

    ```bash
    git log                       # 查看所有提交历史，按时间倒序排列
    git log --oneline             # 简洁显示，每条提交一行，只显示 commit ID 和提交信息
    git log --graph --oneline     # 以图形方式显示分支合并历史 (非常有用！)
    git log -p                    # 显示每次提交的详细内容（包括 diff）
    git log --author="你的名字"   # 按作者筛选提交
    git log --since="2 weeks ago" # 查看最近两周的提交
    git log --grep="feat"         # 搜索提交信息中包含特定字符串的提交
    git log --pretty=format:"%h %an %ar %s" # 自定义输出格式
    # %h: 提交的简短哈希值
    # %an: 作者名字
    # %ar: 作者日期 (相对时间)
    # %s: 提交信息
    ```

6.  **删除文件 (`git rm`)**
    从工作区和暂存区中删除文件，并标记为待提交。

    ```bash
    git rm <文件名>               # 删除文件并添加到暂存区（下次提交时会从仓库中删除）
    git rm --cached <文件名>      # 只从暂存区和本地仓库删除，保留工作区文件（使其变为未跟踪状态）
    ```

7.  **移动/重命名文件 (`git mv`)**
    移动或重命名文件，并自动添加到暂存区。

    ```bash
    git mv <旧文件名> <新文件名>
    # 示例：
    git mv old_component.js new_component.js
    ```

### 三、分支管理 (Branch Management)

分支是 Git 的核心功能之一，它允许你在不影响主线开发（如 `main` 或 `master` 分支）的情况下，独立地进行新功能开发、bug 修复或实验性尝试。每个分支都代表着项目历史的一个独立发展路线。

1.  **查看分支 (`git branch`)**

    ```bash
    git branch                    # 列出所有本地分支，当前分支会用 `*` 标记
    git branch -r                 # 列出所有远程分支
    git branch -a                 # 列出所有本地和远程分支
    git branch -vv                # 列出本地分支及其对应的远程跟踪分支
    ```

2.  **创建分支 (`git branch <新分支名>`)**
    基于当前所在的分支创建一个新的分支。新分支会继承当前分支的所有提交历史。

    ```bash
    git branch feature/new-login  # 基于当前分支创建一个名为 `feature/new-login` 的新分支
    ```

3.  **切换分支 (`git checkout` 或 `git switch`)**
    切换到指定分支，你的工作区文件会随之更新到该分支的最新状态。
    *   `git checkout` 历史悠久，功能多杂，容易混淆（既能切换分支，又能恢复文件）。
    *   `git switch` 是 Git 2.23+ 引入的新命令，专门用于切换分支，语义更清晰，**推荐使用**。

    ```bash
    # 使用 git checkout (旧但仍常用)
    git checkout feature/new-login  # 切换到现有分支
    git checkout -b bugfix/fix-bug  # 创建并切换到新分支（相当于 git branch bugfix/fix-bug; git checkout bugfix/fix-bug）
    git checkout <commit-id>        # 切换到某个历史提交（进入“分离头指针”状态，不建议在此状态下直接开发，因为提交后分支不会自动跟踪）
    
    # 使用 git switch (推荐)
    git switch feature/new-login    # 切换到现有分支
    git switch -c bugfix/fix-bug    # 创建并切换到新分支
    ```

4.  **删除分支 (`git branch -d`)**
    删除一个已合并到当前分支的分支。

    ```bash
    git branch -d feature/new-login # 删除已合并的分支
    git branch -D feature/new-login # 强制删除（即使未合并，慎用！）
    ```

5.  **合并分支 (`git merge`)**
    将一个分支的修改合并到当前分支。这是将不同开发路线上的代码整合在一起的主要方式。

    ```bash
    # 假设你在 `main` 分支，想把 `feature/new-login` 的修改合并进来
    git checkout main               # 首先切换到接收修改的分支
    git merge feature/new-login     # 将 `feature/new-login` 合并到 `main`
    ```
    *   **合并类型**：
        *   **快进合并 (Fast-forward Merge)**：如果目标分支在你的特性分支创建后没有新的提交，Git 会直接把目标分支的指针移动到特性分支的最新提交，不产生新的合并提交。
        *   **三方合并 (Three-way Merge)**：如果目标分支在你创建特性分支后有新的提交，Git 会找到两个分支的共同祖先，然后将两个分支的修改整合在一起，生成一个新的“合并提交”。
    *   **冲突解决 (Conflict Resolution)**：
        如果两个分支对同一个文件的同一部分进行了不同的修改，Git 无法自动合并，就会产生冲突。
        1.  Git 会提示你哪些文件有冲突。
        2.  打开冲突文件，你会看到类似这样的标记：
            ```
            <<<<<<< HEAD
            // 当前分支的代码
            =======
            // 另一个分支的代码
            >>>>>>> feature/new-login
            ```
        3.  手动编辑文件，保留你想要的代码，删除 `<<<<<<<`、`=======`、`>>>>>>>` 这些标记。
        4.  解决完所有冲突文件后，`git add <冲突文件>` 将其标记为已解决。
        5.  最后，`git commit -m "Merge branch feature/new-login"` 完成合并提交。
    *   **取消合并**：`git merge --abort` 可以取消正在进行的合并操作。

6.  **变基 (`git rebase`)**
    变基是另一种合并分支的方式，它会将你的提交“移动”到目标分支的最新提交之后，使提交历史保持线性、整洁。它不是创建新的合并提交，而是重写了你的提交历史。
    *   **适用场景**：将特性分支的修改应用到主分支的最新版本，保持整洁的提交历史。
    *   **重要警告**：**不要对已经推送到远程仓库并与他人共享的分支进行变基！** 变基会改写历史，如果其他人基于旧历史进行了开发，再进行同步时会造成巨大的混乱。只在本地私有分支上使用变基。

    ```bash
    # 假设你在 `feature/new-login` 分支，想把它的提交变基到 `main` 分支的最新状态
    git checkout feature/new-login  # 切换到要变基的分支
    git rebase main                 # 将当前分支的提交“放到” main 分支的最新提交之后
    
    # 如果有冲突，解决冲突后使用：
    git add <冲突文件>
    git rebase --continue           # 继续变基过程
    # 取消变基：
    git rebase --abort
    ```

7.  **挑选提交 (`git cherry-pick`)**
    `cherry-pick` 可以将某个分支上的单个或多个提交，应用到当前分支上，而不是合并整个分支。这在只想引入某个 Bug 修复或特定功能，而不合并整个功能分支时非常有用。

    ```bash
    # 假设你想把 `bugfix/critical` 分支上的某个提交 (commit-id) 应用到当前分支
    git cherry-pick <commit-id>
    ```

### 四、远程协作 (Remote Operations)

与远程仓库进行交互，实现团队协作和代码备份。

1.  **管理远程仓库 (`git remote`)**
    远程仓库通常被命名为 `origin`（当你克隆仓库时自动创建）。

    ```bash
    git remote                    # 列出所有远程仓库名
    git remote -v                 # 列出所有远程仓库名及其URL
    git remote add upstream <URL> # 添加一个名为 `upstream` 的远程仓库（常用于上游开源项目）
    git remote rm origin          # 删除名为 `origin` 的远程仓库
    git remote rename origin upstream # 重命名远程仓库 `origin` 为 `upstream`
    ```

2.  **从远程拉取 (`git fetch` & `git pull`)**
    从远程仓库获取最新代码。

    *   **`git fetch`**: 从远程仓库下载最新的提交和分支信息，但**不**自动合并到你当前的工作分支。它只会更新你的远程跟踪分支（例如 `origin/main`）。
        *   **优点**：安全，你可以先查看远程的修改，再决定如何合并。
        *   **场景**：想看看远程仓库有什么新东西，但不想立即合并到我的本地代码。

        ```bash
        git fetch origin              # 从 `origin` 远程仓库下载最新数据
        git fetch origin main         # 只下载 `origin` 仓库的 `main` 分支数据
        
        # 下载后，你可以通过 git log main..origin/main 来查看本地 main 分支和远程 origin/main 分支之间的差异
        ```

    *   **`git pull`**: `git fetch` 和 `git merge` 的组合。它会从远程仓库下载最新修改，并尝试自动合并到你当前的工作分支。
        *   **优点**：一步到位，快速同步。
        *   **缺点**：如果远程有冲突，会直接在你的当前分支上引发合并冲突。
        *   **场景**：确定远程分支没有和你的本地分支冲突，或者你希望立即合并。

        ```bash
        git pull origin main          # 从 `origin` 仓库的 `main` 分支拉取并合并到当前分支
        
        # 推荐做法：先 `git fetch`，然后 `git diff HEAD origin/main` 查看差异，再手动 `git merge origin/main` 或 `git rebase origin/main`。
        ```

3.  **推送到远程 (`git push`)**
    将本地仓库的提交推送到远程仓库，分享你的修改给团队或备份你的代码。

    ```bash
    git push origin main          # 将本地 `main` 分支推送到 `origin` 远程仓库的 `main` 分支
    
    # 第一次推送新分支时，需要设置上游分支（`upstream`），这样以后就可以直接 `git push` 了
    git push -u origin feature/new-login 
    # 或
    git push --set-upstream origin feature/new-login
    # 之后，在该分支上就可以直接使用 `git push`
    
    # 推送所有本地分支到远程 (不常用)
    git push --all origin
    
    # 删除远程分支
    git push origin --delete <远程分支名>
    # 示例：
    git push origin --delete feature/old-login
    
    # 强制推送（慎用！会覆盖远程历史，可能导致他人丢失代码！）
    # 仅在确定你完全了解后果，且远程仓库没有其他人使用时才使用。
    git push -f origin main 
    ```

### 五、撤销操作 (Undoing Things)

Git 提供了多种方式来撤销或修改你的操作，但有些命令会改写历史，需要谨慎使用。

1.  **撤销工作区修改 (`git restore` 或 `git checkout`)**
    当你修改了文件，但还没 `git add` 到暂存区，突然发现改错了，想恢复到上次提交或暂存时的状态。
    *   **`git restore` (推荐)**：Git 2.23+ 引入，专门用于恢复文件，语义更清晰。

        ```bash
        git restore <文件名>          # 撤销工作区中某个文件的所有修改，恢复到暂存区或上次提交的状态
        git restore .                 # 撤销工作区所有“未暂存”文件的修改
        ```

    *   **`git checkout -- <文件名>` (旧方式)**：

        ```bash
        git checkout -- <文件名>
        ```

2.  **取消暂存 (`git restore --staged` 或 `git reset HEAD`)**
    当你已经 `git add` 了文件到暂存区，但还没 `git commit`，突然发现不应该提交这些修改，想把它们从暂存区移回工作区。

    ```bash
    # 使用 git restore (推荐)
    git restore --staged <文件名> # 将暂存区中的文件移回工作区，保留工作区中的修改
    
    # 使用 git reset HEAD (旧方式)
    git reset HEAD <文件名>       # 效果同上
    ```

3.  **回退提交 (`git reset` 或 `git revert`)**
    这两种命令都用于“撤销”已提交的修改，但方式和影响完全不同。

    *   **`git reset`**: 移动 `HEAD` 指针，改变分支指向。它会**改写历史**，因此**不建议在已推送到远程的共享分支上使用**。
        *   **`--soft`**：`HEAD` 指针移动，但保留工作区和暂存区的修改。你可以在回退后重新提交。
        *   **`--mixed`**（默认）：`HEAD` 指针移动，暂存区清空，工作区保留修改。你需要重新 `git add` 和 `git commit`。
        *   **`--hard`**：`HEAD` 指针移动，暂存区和工作区都回到指定提交的状态。**慎用！会彻底丢失未提交的修改！**

        ```bash
        # 回退到上一个版本（HEAD^ 表示上一个提交）
        git reset HEAD^ --soft    # 移动 HEAD，保留修改在暂存区和工作区
        git reset HEAD^ --mixed   # 移动 HEAD，清空暂存区，保留修改在工作区 (默认)
        git reset HEAD^ --hard    # 移动 HEAD，清除暂存区和工作区所有修改 (危险！)
        
        # 回退到指定 commit-id
        git reset <commit-id> --hard
        ```
        **场景**：你刚提交了一个错误，还没推送到远程，想彻底抹掉这个提交。

    *   **`git revert`**: 创建一个新的提交来撤销之前的提交。它**不会改写历史**，而是通过一个“反向提交”来抵消之前的修改。
        *   **优点**：安全，因为它保留了完整的历史记录。
        *   **场景**：你已经将错误的提交推送到远程，并与他人共享，此时应该使用 `git revert`。

        ```bash
        git revert <commit-id>        # 创建一个新的提交，撤销指定提交的修改
        ```
        **示例**：你提交了一个 `A`，然后又提交了一个 `B`。如果你 `git revert B`，Git 会创建一个 `B'` 提交，`B'` 的内容是撤销 `B` 的修改，历史会变成 `A -> B -> B'`。

4.  **找回丢失的提交 (`git reflog`)**
    `git reflog` 是 Git 的“安全网”或“时光机”。它记录了你所有操作的引用日志，包括分支切换、提交、回退、变基等。即使你使用 `git reset --hard` 删除了某个提交，只要它还在 `reflog` 中，你就可以找回来。

    ```bash
    git reflog                    # 查看所有 HEAD 的移动历史
    
    # 示例：
    # 假设你执行了 `git reset HEAD^ --hard` 丢失了最新的提交
    # 通过 `git reflog` 找到那个丢失提交之前的 `HEAD` 状态，例如 `HEAD@{1}` 或某个 commit ID
    git reset HEAD@{1} --hard     # 恢复到上一次操作前的状态
    ```
    **记住**：`git reflog` 是你的救命稻草，它能找回几乎所有你以为丢失的提交。

### 六、暂存工作 (Stashing)

当你正在一个分支上工作，但工作还没完成，又需要临时切换到另一个分支处理紧急事务时，可以使用 `git stash` 暂存当前未提交的修改，让工作区变得干净。

1.  **暂存修改 (`git stash`)**
    将工作区和暂存区中所有未提交的修改暂时存储起来，让你的工作区回到上次提交时的干净状态。

    ```bash
    git stash save "我的临时修改"     # 暂存工作区和暂存区的修改，并附带消息
    git stash                     # 默认暂存，不带消息
    ```

2.  **查看暂存列表 (`git stash list`)**
    查看所有已暂存的修改列表。

    ```bash
    git stash list
    # 示例输出：
    # stash@{0}: On main: 我的临时修改
    # stash@{1}: On feature/new: WIP on feature/new: 0a1b2c3 Add new feature
    ```

3.  **查看暂存内容 (`git stash show`)**
    查看某个暂存的具体内容，默认显示最近的暂存。

    ```bash
    git stash show                # 显示最近暂存的修改文件列表
    git stash show -p             # 显示最近暂存的详细差异 (diff)
    git stash show -p stash@{1}   # 显示指定暂存的详细差异
    ```

4.  **应用暂存 (`git stash apply` / `git stash pop`)**
    将暂存的修改应用回当前工作区。

    *   **`git stash apply`**: 应用最近的暂存（或指定暂存），但**保留**在暂存列表中。

        ```bash
        git stash apply               # 应用最近的暂存 (stash@{0})
        git stash apply stash@{1}     # 应用指定暂存
        ```

    *   **`git stash pop`**: 应用最近的暂存，并从暂存列表中**删除**。

        ```bash
        git stash pop                 # 应用最近的暂存并删除
        ```

5.  **删除暂存 (`git stash drop` / `git stash clear`)**

    ```bash
    git stash drop stash@{1}      # 删除指定暂存
    git stash clear               # 删除所有暂存
    ```

6.  **从暂存创建分支 (`git stash branch`)**
    当你暂存了一些修改，后来决定这些修改应该在一个新的分支上进行时，可以使用这个命令。它会创建一个新分支，切换到该分支，然后应用暂存的修改，并删除该暂存。

    ```bash
    git stash branch new-feature-branch stash@{0}
    ```

### 七、标签管理 (Tagging)

标签用于标记项目中的重要里程碑，如版本发布（v1.0.0）。标签是不可移动的，一旦创建就固定指向某个提交。

1.  **创建标签 (`git tag`)**

    ```bash
    git tag v1.0.0                # 创建轻量标签（lightweight tag），只是一个指向特定提交的指针
    git tag -a v1.0.0 -m "Release version 1.0.0" # 创建附注标签（annotated tag），包含作者、日期、消息等额外信息，并存储在 Git 数据库中
    git tag -a v1.0.0 <commit-id> # 为指定提交创建标签
    ```

2.  **查看标签 (`git tag`)**

    ```bash
    git tag                       # 列出所有标签
    git tag -l "v1.*"             # 搜索符合模式的标签
    ```

3.  **推送标签 (`git push --tags`)**
    标签默认不推送到远程仓库，需要手动推送。

    ```bash
    git push origin v1.0.0        # 推送指定标签到远程
    git push origin --tags        # 推送所有本地标签到远程
    ```

4.  **删除标签 (`git tag -d`)**

    ```bash
    git tag -d v1.0.0             # 删除本地标签
    git push origin :refs/tags/v1.0.0 # 删除远程标签
    ```

### 八、实用小技巧 & 常见问题 (Tips & Tricks)

1.  **查看帮助 (`git help <command>`)**
    如果你忘记了某个命令的具体用法，Git 内置了非常详细的帮助文档。

    ```bash
    git help commit               # 查看 `git commit` 命令的帮助文档
    git commit --help             # 效果同上
    ```

2.  **配置别名 (`git alias`)**
    为常用或复杂的 Git 命令设置别名，可以大大提高效率。

    ```bash
    git config --global alias.co checkout  # 设置 `git co` 为 `git checkout`
    git config --global alias.br branch    # 设置 `git br` 为 `git branch`
    git config --global alias.st status    # 设置 `git st` 为 `git status`
    git config --global alias.ci commit    # 设置 `git ci` 为 `git commit`
    git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit" # 一个复杂的 log 别名
    ```
    配置后，你就可以使用 `git co` 替代 `git checkout`，`git st` 替代 `git status` 等。

3.  **查看某行代码是谁写的 (`git blame`)**
    当你看到某行代码感到疑惑时，`git blame` 可以告诉你这行代码是哪个提交引入的，以及是谁在什么时候引入的。

    ```bash
    git blame <文件名>
    # 示例：
    git blame index.js
    ```

4.  **在历史记录中搜索内容 (`git grep`)**
    `git grep` 可以在 Git 仓库的任何提交历史中搜索特定的内容，比普通的 `grep` 更强大，因为它能搜索版本库而不是仅仅工作区。

    ```bash
    git grep "搜索内容"              # 在工作区已跟踪文件中搜索
    git grep "搜索内容" HEAD^      # 在上一个提交中搜索
    git grep -e "内容1" --or -e "内容2" # 搜索包含内容1或内容2的文件
    ```

---

## 总结与最佳实践

Git 是一个非常强大且灵活的工具，掌握它能极大地提升你的开发效率和团队协作能力。

*   **理解四大区域**：工作区、暂存区、本地仓库、远程仓库是理解 Git 命令的基石。
*   **频繁提交**：小步快跑，每次完成一个独立的小功能、修复一个 Bug 或完成一个逻辑单元就提交。这样即使出错，回溯和恢复也更容易。
*   **清晰的提交信息**：使用有意义、简洁明了的提交信息，遵循团队或社区的规范。好的提交信息是未来追溯问题、理解代码变更的关键。
*   **善用分支**：为每个新功能、Bug 修复或实验性尝试创建独立的分支。保持 `main`（或 `master`）分支的稳定和可发布状态。
*   **谨慎使用 `reset --hard` 和 `rebase`**：它们会改写历史，在已推送到远程并与他人共享的分支上使用会导致严重问题。除非你完全了解其后果，否则避免在共享分支上使用。
*   **定期 `git pull` / `git fetch`**：在开始工作前，先同步远程仓库的最新代码，避免不必要的冲突。推荐先 `fetch` 再手动 `merge` 或 `rebase`。
*   **解决冲突**：掌握冲突解决技巧是团队协作的关键一环。不要害怕冲突，理解它并解决它。
*   **多用 `git status` 和 `git diff`**：在 `git add` 和 `git commit` 之前，多用这两个命令检查你的修改。
*   **利用 `git reflog`**：这是你的后悔药，几乎可以找回任何你以为丢失的提交。

Git 的学习曲线可能有点陡峭，但只要多加练习，理解其核心概念，并养成良好的使用习惯，你就能熟练运用它来管理你的代码，并享受版本控制带来的便利！