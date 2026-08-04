# 项目简述
**项目中文名：我是项目经理**
**项目英文名：opencode-impm-cn**
**项目缩写：impm**
**项目内容：一个opencode的插件，实现传统瀑布开发流程，包括完整的文档流程，详细的开发设计和测试流程**
**项目的核心要求：项目需要严格按照核心工作流**

# 文档名词解析
| 文档缩写 | 文档名称 | 中文名称 | 说明 |
| :--: | :--: | :--: | :-- |
|URS|User Requirement Specification|用户需求说明书|业务目标、用户角色、业务场景、功能需求（高层）、非功能需求（高层）、约束条件、假设与依赖|
|PRD|Product Requirement Document|产品需求文档|产品背景、目标用户、功能清单、详细功能描述、业务流程图、页面原型、数据需求、验收标准、版本规划、附录（术语表、参考文档。|
|SAD|System Architecture Design|系统架构设计|设计目标与约束、技术栈选型及理由、系统上下文图、容器图、组件图、部署架构图、安全架构、性能架构、数据流图、架构决策记录|
|DBD|Database Design Document|数据库设计文档|设计目标、数据库选型、ER图（Mermaid）、逻辑模型、物理模型、表结构定义、索引设计、视图/存储过程/触发器设计、数据字典、备份恢复策略、安全策略|
|API|API Design Document|接口设计文档|接口清单、接口版本策略、认证鉴权机制、通用错误码定义、接口详细定义（URL/Method/Header/Body/Response）、状态码映射、限流策略、示例代码|
|LLD|Low-Level Design Document|详细设计文档|模块概述、类图（Mermaid）、时序图（Mermaid）、状态图、核心算法伪代码/流程图、接口实现细节、数据结构定义、异常处理策略、日志规范、性能优化点、单元测试策略|
|TestCase|Test Case Document|测试用例|用例ID、用例名称、所属模块、优先级、前置条件、测试步骤、预期结果、测试数据、关联需求ID、测试类型（功能/接口/性能/安全）|

# 项目组织结构形式
项目中的skills，commands和agents先放在assets目录下。
等安装到项目或全局时，复制到对应的.opencode目录下。
skills下有一个template目录，为模板目录，存放skills需要生成文件的模版。

# 项目核心内容
1. 项目包括一组agent，每个agent对应现实传统瀑布式开发项目组的一个成员。其中PM为主agent，其他均为subagent。
2. 整个项目以PM agent作为调度核心，根据预设的瀑布开发流程。调用不同的subagent执行不同的技能（skill），完成传统瀑布式开发的全流程。
3. 瀑布式开发的每一个步骤都做成opencode的skill。有一组几十个skill构成。
4. 每个skill对应一个command，方便单步执行。
5. 有一个总skill /impm 负责全流程执行。
6. 根据skill command和agent的总体情况，考虑将部分功能以ts插件的形式写成代码。
7. 要整体考虑提高AI的服从性，让AI严格按照流程顺序执行，不并行，不跳过，不乱序执行。

# IMPM的项目组成员-Agents
## 需要实现的Agent列表
传统项目组中的每一个成员都定义为一个agent  其中PM为普通agent，其他为subagent。
| agent | 英文名称 | 中文名称 | 角色职责 |
|-----|-----|-----|-----|
| PM | Project Manager | 项目经理 | 作为主控agnet，不做具体事务，指派别的subagent执行具体事务。 |
| BA | Business Analyst | 业务分析师 | 负责收集需求URS，并将模糊的业务诉求转化为清晰、可验收、可追踪的PRD。 |
| SA | System Architect | 系统架构师 | 负责系统架构设计、项目结构搭建和技术决策。编写SAD。你决定系统的骨架和血脉。|
| TL | Tech Lead | 技术负责人 | 负责详细设计和任务清单生成。|
| DBA | Database Architect | 数据库架构设计师 | 你是一位资深数据库架构设计师（Database Architect），精通业务建模、关系型数据库、NoSQL、分布式数据库和性能优化。|
| TE | Test Engineer | 测试工程师 | 负责测试用例，测试函数，自动化测试脚本的编写。|
| SCM | Software Configuration Management | 软件配置工程师 | 负责版本管理，变更管理，发布管理。|
| DW | Document Writer | 文档编写 | 负责各类通用技术文档的编写。|
| CS | Code Searcher | 本地代码查询 | 按要求查询本地的代码。|
| WS | Web Searcher | 网络查询 | 按要求查询相关的官方文档，应用案例，技术资料。|
| SSE | Senior Software Engineer | 高级软件工程师 | 有丰富的经验，能处理有复杂业务逻辑的需求。|
| FEE | Front-End Engineer | 前端工程师 | 有丰富的前端经验，能设计出符合现代美感的前端页面。|
| BEE | Back-End Engineer | 后端工程师 | 有丰富的后端经验，接口规划与开发经验。|

## Agent里需要定义的东西
1. 符合Opencode标准的头部信息。
2. 角色：Agent列表中角色的详细描述。
3. 核心能力：Agent列表中角色的主要工作能力，能处理哪些工作。
4. 思维方式：Agent列表中角色在工作中需要考虑哪些方面的问题。
5. 工作规范：Agent列表中角色在工作中需要哪些处理规范，能做什么，不能做什么。
6. 输入产出：Agent列表中角色在工作中接收哪些材料，输出哪些材料。

## Agents的存放地点
1. 项目中，将上述一组Agent放入 assets/agents
2. 安装时，将agents放入.opencode/agents中。如果项目安装，就放在项目目录下的.opencode/agents。如果是全局安装，就放在全局配置的目录下。


# IMPM的核心工作流
核心工作流主要包括4个阶段
## 1. IMPM项目初始化阶段
根据当前项目文档和代码，反推必要信息，依次执行初始化任务，实现项目初始化。
### a) 判断是否已经初始化
- Skill：impm-init-isinit
- agent：PM
- 处理内容：1、判断是否存在docs/project.md和docs/sad.md,如果两个文件都存在，则表示已初始化，直接跳过初始化阶段。2、判断当前项目是否有实质性的编码或项目结构。如果没有表示是一个空项目，后续初始化按空项目来做。3、如果有表示是一个存量项目，需要通过文档和代码反推补全所有文档和设计和测试内容。
### b) git初始化
- Skill：impm-init-git
- agent：SCM
- 处理内容：1、判断当前项目目录是否在git管理内。如果没有纳入git的管理，就纳入git的管理。2、根据程操作系统，程序开发各种语言和各种开发工具要求，清理一个git排除文件。3、最后做一次提交。
### c) project初始化
- Skill：impm-init-project
- agent：SA
- 处理内容：1、读取模板目录（技能所在目录的上级目录下的TEMPLATE目录）下的PROJECT-TEMPLATE.MD模板文件。2、根据项目目前的文档和代码情况生成dosc/project.md。3、如果项目是新建项目或者当前文档代码不能覆盖project.md的内容，或者有其他不明白的情况，通过对话向用户提问。
### d) 版本初始化
- Skill：impm-init-version
- agent：SA
- 处理内容：在docs下新建一个目录: {项目英文缩写}-v0.0.1。项目英文缩写在project.md中获取。

### e) 用户需求说明书初始化
- Skill：impm-init-urs
- agent：BA
- 处理内容：
  1、从模板目录下读取URS-TEMPLATE.MD模板文件
  2、根据当前项目的代码和文档，反推用户需求说明书，按模版文件格式填写。
  3、将反推的需求说明书存放到  docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-urs-v0.0.1.md。如果项目是一个空项目，就写入一个空的MD。
  4、将docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-urs-v0.0.1.md复制到docs/{项目英文缩写}-urs.md。
  
  
### f) 项目需求文档初始化
- Skill：impm-init-prd
- agent：BA
- 处理内容：
  1、从模板目录下读取PRD-TEMPLATE.MD模板文件
  2、根据当前当前项目的代码和文档，以及USR文档反推项目需求文档，按模版文件格式填写。
  3、将反推的需求说明书存放到  docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-prd-v0.0.1.md。如果项目是一个空项目，就写入一个空的MD。
  4、将docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-prd-v0.0.1.md复制到docs/{项目英文缩写}-prd.md。

### g) 架构设计初始化
- Skill：impm-init-sad
- agent：SA
- 处理内容：
  1、从模板目录下读取SAD-TEMPLATE.MD模板文件
  2、根据当前当前项目的代码和文档，以及之前生成的PRD文档反推架构设计文档，按模版文件格式填写。
  3、将反推的架构设计文档存放到 docs/{项目英文缩写}-sad.md。如果项目是一个空项目，就写入一个空的MD。

### h) 数据库设计初始化
- Skill：impm-init-dbd
- agent：DBA
- 处理内容：
  1、根据project.md和sad判断当前项目是否需要数据库，以及数据库的具体产品和版本。如果无需使用数据库，则跳过数据库设计初始化。
  2、从模板目录下读取DBD-TEMPLATE.MD模板文件
  3、根据当前当前项目的代码和文档，以及之前生成的PRD和SAD文档反推数据库设计文档，按模版文件格式填写。同时反推项目初始化的sql语句。
  4、将反推的数据库设计文档存放到  docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-dbd-v0.0.1.md 和 docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-dbd-v0.0.1.sql。如果项目是一个空项目，就写入一个空的MD和一个空sql。
  5、将docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-dbd-v0.0.1.md复制到docs/{项目英文缩写}-dbd.md。将docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-dbd-v0.0.1.sql复制到docs/{项目英文缩写}-dbd.sql。

### i) API接口设计初始化
- Skill：impm-init-api
- agent：SA
- 处理内容：
  1、根据project.md和sad判断当前项目是否是存在前后端，或者是接口对接的项目，当前项目是否需要设计接口。如果无需接口，则跳过接口设计初始化。
  2、从模板目录下读取API-TEMPLATE.MD模板文件
  3、根据当前当前项目的代码和文档，以及之前生成的PRD和SAD文档反推接口设计文档。
  4、将反推的API接口设计文档存放到  docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-api-v0.0.1.md。 如果项目是一个空项目，就写入一个空的MD。
  5、将docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-api-v0.0.1.md复制到docs/{项目英文缩写}-api.md。
### j) 详细设计初始化
- Skill：impm-init-lld
- agent：TL
- 处理内容：
  1、从模板目录下读取LLD-TEMPLATE.MD模板文件
  2、根据当前当前项目的代码和文档，以及之前生成的PRD和SAD文档反推详细设计文档。
  3、将反推的详细设计文档存放到  docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-lld-v0.0.1.md。 如果项目是一个空项目，就写入一个空的MD。
  4、将docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-lld-v0.0.1.md复制到docs/{项目英文缩写}-lld.md。

### k) 测试用例，测试函数与自动化测试脚本初始化
- Skill：impm-init-testcase
- agent：TE
- 处理内容：
  1、从模板目录下读取TESTCASE-TEMPLATE.MD模板文件
  2、根据当前当前项目的代码和文档，以及之前生成的PRD和LLD文档确定测试用例。
  3、将测试用例文档存放到  docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-testcase-v0.0.1.md。 如果项目是一个空项目，就写入一个空的MD。
  4、将docs/{项目英文缩写}-v0.0.1/ {项目英文缩写}-testcase-v0.0.1.md复制到docs/{项目英文缩写}-testcase.md。
  5、根据测试用例文档中的每一个用例，完成测试函数编写。
  6、根据完成的测试函数以及预期的输入输出和结果值，生自动化测试脚本。

### l) 提交初始化内容
- Skill：impm-init-commit
- agent：SCM
- 处理内容：
  将所有内容提交到git，comment内容为：{项目英文缩写}-v0.0.1-初始化impm项目

## 2. 需求分析整理阶段
### a) 生成版本
- Skill：impm-version-create
- agent：SCM
- 处理内容：
  1、首先确定版本号：如果本次用户对话提交的内容，或者内容提到的文档里有版本号，就直接用这个版本号。如果都没有提及版本号，取docs/下所有的版本目录，版本目录格式类似{项目英文缩写}-v{x.y.z} x.y.z是版本号。取最大的版本号，然后在z的值基础上+1，将x.y.z+1 作为新的当前版本号。
  2、先在git上拉取最新的代码，然后在git上创建一个新的分支：{项目英文缩写}-v{当前版本号}，并切换到该分支。
  3、创建项目版本目录：docs/{项目英文缩写}-v{当前版本号}
  4、创建版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。文件内容为一个表格，有3列：步骤序号，步骤名称，步骤状态。增加第一行：步骤序号：1，步骤名称：impm-version-create，步骤状态：已完成。

### b) 生成USR需求文档
- Skill：impm-urs-create
- agent：BA
- 处理内容：
  1、从模板目录下读取URS-TEMPLATE.MD模板文件
  2、根据用户的输入，以及用户输入中提到的文件，按照模板文件的格式生成用户需求说明书。
  3、将用户需求说明书存放到版本文件的目录：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-urs-v{当前版本号}.md。
  4、版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-urs-create，步骤状态：已完成。

### c) 生成PRD需求文档
- Skill：impm-urs-create
- agent：BA
- 处理内容：
  1、从模板目录下读取PRD-TEMPLATE.MD模板文件
  2、根据用户的输入，以及用户输入中提到的文件，按照模板文件的格式生成用户需求说明书。
  3、将用户需求说明书存放到版本文件的目录：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-prd-v{当前版本号}.md。
    4、版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-prd-create，步骤状态：已完成。

### d) 更新SAD系统架构设计
- Skill：impm-sad-update
- agent：SA
- 处理内容：
  1、从模板目录下读取SAD-TEMPLATE.MD模板文件
  2、查看 docs/{项目英文缩写}-sad.md是否是空文件：
  3、如果是空文件，则根据本次对话内容和本次对话涉及到的参考文件，套用SAD模版格式，完成系统架构设计的初稿。覆盖 docs/{项目英文缩写}-sad.md。
  4、如果不是空文件，则判断在当前版本的需求（URS和PRD）下，系统架构设计是否需要修改。
  5、如果无需修改，版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-sad-create，步骤状态：无需修改。然后退出当前步骤，继续后续步骤。
  6、如果需要修改，直接修改在docs/{项目英文缩写}-sad.md上。
  7、版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-sad-create，步骤状态：已完成。

### e) 生成DBD数据库设计
- Skill：impm-dbd-create
- agent：DBA
- 处理内容：
1. 从模板目录下读取DBD-TEMPLATE.MD模板文件。
2. 查看 docs/{项目英文缩写}-dbd.md是否存在，如果不存在，则说明当前项目无需数据库。版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-dbd-create，步骤状态：无需数据库。然后跳过此步骤，继续后续步骤。
3. 根据SAD和当前版本的PRD，参考现有数据库设计:docs/{项目英文缩写}-dbd.md（可能为空）,套用DBD模版格式，完成当前版本的数据库设计：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-dbd-v{当前版本号}.md。
4. 根据当前的数据库设计，完成数据库脚本：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-dbd-v{当前版本号}.sql。
5. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-dbd-create，步骤状态：已完成。

### f) 生成API接口设计文档
- Skill：impm-api-create
- agent：TL
- 处理内容：
  1、从模板目录下读取API-TEMPLATE.MD模板文件。
  2、查看 docs/{项目英文缩写}-api.md是否存在，如果不存在，则说明当前项目无需创建api接口，版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-api-create，步骤状态：无需接口。然后跳过此步骤，继续后续步骤。
  3、根据SAD和当前版本的PRD，参考现有api设计:docs/{项目英文缩写}-api.md（可能为空）,套用API模版格式，完成当前版本的新增API设计：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-api-v{当前版本号}.md。
  4、版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-api-create，步骤状态：已完成。

### g) 生成LLD详细设计文档
- Skill：impm-lld-create
- agent：TL
- 处理内容：
  1、从模板目录下读取LLD-TEMPLATE.MD模板文件。
  2、根据SAD和当前版本的PRD，参考现有详细设计:docs/{项目英文缩写}-lld.md（可能为空）,套用lld模版格式，完成当前版本的新增需求的详细设计：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-lld-v{当前版本号}.md。
  3、版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-lld-create，步骤状态：已完成。

### h) 生成task.json任务清单文档
- Skill：impm-task-create
- agent：TL
- 处理内容：
  1、从模板目录下读取TASK-TEMPLATE.json模板文件。
  2、根据SAD和当前版本的PRD和当前版本的LLD，使用模版中的json格式，完成当前版本的任务清单：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-task-v{当前版本号}.json。
  3、版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-create，步骤状态：已完成。

### i) 需求分析阶段内容提交
- Skill：impm-analysis-commit
- agent：SCM
- 处理内容：将需求分析整理阶段生成的这些文件和目录都提交到git上。

## 3. 编码开发阶段

### a) 编码开发主流程
- Skill：impm-coding
- agent：PM
- 处理内容：
  1. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-coding，步骤状态：执行中。
  2. 读取 docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-task-v{当前版本号}.json中的所有状态不为已完成的任务清单。
  3. 所有任务严格按照上下游顺序，循环依次执行后续所有步骤。不并行执行，不乱序执行，不合并执行。
  4. 前任务完成所有编码任务后执行下一个任务，直至所有任务完成。
  5. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-coding，步骤状态：已完成。


### b) task任务编码
- Skill：impm-task-coding
- agent：PM
- 处理内容：
1. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding，步骤状态：{任务编号}-执行中。
2. 启动TL subagent执行impm-task-coding-context技能，收集需求上下文
3. 启动CS subagent执行impm-task-coding-cs技能，查询现有代码
4. 启动WS subagent执行impm-task-coding-ws技能，查询网络资料
5. 启动DBA subagent执行impm-task-coding-dbd技能，编写数据库设计
6. 判断是否为分前后端项目且为后端任务，如是则启动BE subagent执行impm-task-coding-api技能设计接口；否则跳过
7. 启动TE subagent执行impm-task-coding-testcase技能，编写测试用例
8. 根据任务类型启动FE/BE/DE subagent执行impm-task-coding-code技能

9. 启动TE subagent执行impm-task-coding-writetest技能，执行单元测试和接口测试自动化脚本的编写。
10. 启动TE subagent执行impm-task-coding-runtest技能，执行测试。如测试失败，回退到第一步重新收集信息并编码；连续失败达上限则中止
11. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding，步骤状态：{任务编号}-已完成。

### c) 整理需求上下文
- Skill：impm-task-coding-context
- agent：TL
- 处理内容：
1. 接收当前的版本号和任务编号。
2. 根据版本号定位task文件：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-task-v{当前版本号}.json
3. 根据任务号，获取json中对应的任务内容。
4. 根据json内容中的userStoryId获取当前版本的prd（docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-prd-v{当前版本号}.md）中的userstory的相关内容。
5. 从 docs/{项目英文缩写}-sad.md，dosc/project.md 等文件中读取与当前任务有关联的内容。
6. 将所有收集到的相关需求信息合并后写入：docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/context.md。如果目录不存在，就创建目录。
7. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-context，步骤状态：{任务编号}-已完成。

### d) 本地代码查询
- Skill：impm-task-coding-cs
- agent：CS
- 处理内容：
1. 接收当前的版本号和任务编号。
2. 根据版本号和任务编号定位context文件：docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/context.md
3. 读取docs/project.md中的项目地图，找到可能与目前开发任务相关的现有源代码文件和工具类。
4. 在本地代码中查询与当前需求相关的部分内容。
5. 将所有收集到的相关需求信息合并后写入：docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/cs.md。如果目录不存在，就创建目录。
6. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-cs，步骤状态：{任务编号}-已完成。


### e) 网络资料查询
- Skill：impm-task-coding-ws
- agent：WS
- 处理内容：
1. 接收当前的版本号和任务编号。根据版本号和任务编号定位context和CS文件：
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/context.md
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/cs.md
2. 根据上述文件内容，判断当前任务中，需要使用哪些三方的中间件，包或者sdk。
3. 在网络上查询这些包的官方文档，使用方法和样例。
4. 在查询和收集时，需要关注当前项目使用的版本号和所查询的资料的版本号是否兼容。
5. 同时在网络上查询与收集与当前任务相关的资料。
6. 将查询到的内容分析，合并，汇总后放入：docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/ws.md
7. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-ws，步骤状态：{任务编号}-已完成。

### f）当前文档数据库设计文档和数据库脚本
- Skill：impm-task-coding-dbd
- agent：DBA
- 处理内容：
1. 接收当前的版本号和任务编号。
2.  查看 docs/{项目英文缩写}-dbd.md是否存在，如果不存在，则说明当前项目无需数据库。版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-dbd，步骤状态：{任务编号}-无需数据库。然后结束此步骤，继续后续步骤。
3. 根据版本号和任务编号读取下列文件：
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/context.md，
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/cs.md
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/ws.md
4. 读取数据库设计文件：
   docs/{项目英文缩写}-dbd.md
   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-dbd-v{当前版本号}.md
5. 根据当前任务的context.md,cs.md,ws.md，判断数据库设计是否需要变更，如果不需要变更，版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-dbd，步骤状态：{任务编号}-数据库设计无需修改。然后结束此步骤，继续后续步骤。
6. 如果需要修改，则先修改：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-dbd-v{当前版本号}.md,然后同步修改：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-dbd-v{当前版本号}.sql
7. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-dbd，步骤状态：{任务编号}-数据库设计已更新。

### g）当前任务API设计文档
- Skill：impm-task-coding-api
- agent：TL
- 处理内容：
1. 接收当前的版本号和任务编号。
2.  查看 docs/{项目英文缩写}-api.md是否存在，如果不存在，则说明当前项目无需API。版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-api，步骤状态：{任务编号}-无需API。然后结束此步骤，继续后续步骤。
3. 根据版本号和任务编号读取下列文件：
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/context.md，
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/cs.md
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/ws.md
4. 读取API设计文件：
   docs/{项目英文缩写}-api.md
   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-api-v{当前版本号}.md
5. 根据当前任务的context.md,cs.md,ws.md，判断API设计是否需要变更，如果不需要变更，版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-api，步骤状态：{任务编号}-API设计无需修改。然后结束此步骤，继续后续步骤。
6. 如果需要修改，则修改：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-api-v{当前版本号}.md这个版本的接口设计文档。
7. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-api，步骤状态：{任务编号}-API设计已更新。

### h）编写测试用例
- Skill：impm-task-coding-testcase
- agent：TE
- 处理内容：
1. 接收当前的版本号和任务编号。
2. 根据版本号和任务编号读取下列文件：
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/context.md，
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/cs.md
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/ws.md
3. 读取数据库设计文件（如果文件不存在，就不读取）：
   docs/{项目英文缩写}-dbd.md
   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-dbd-v{当前版本号}.md
4. 读取API设计文件(如果文件不存在就不读取)：
   docs/{项目英文缩写}-api.md
   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-api-v{当前版本号}.md
5. 读取此前的测试用例(如果文件不存在就不读取)：
   docs/{项目英文缩写}-testcase.md 
   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-testcase-v{当前版本号}.md
6. 根据当前任务需求，参考当前版本的测试用例，套用模板目录下TESTCASE-TEMPLATE.MD模板文件，创建当前任务的测试用例：docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/testcase.md。
7. 测试用例中应包含测试类型：单元测试，接口测试，功能测试，UI测试。
8. 要分别检查不同测试类型的测试覆盖率，及时修正测试用例文件，尽量提高覆盖率，避免漏测。
9. 根据当前任务的测试用例，对比并更新docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-testcase-v{当前版本号}.md中与之不同的测试用例。
10. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-testcase，步骤状态：{任务编号}-已完成。

### i）实现编码
- Skill：impm-task-coding-code
- agent：SSE，FEE，BEE
- 处理内容：
1. 接收当前的版本号和任务编号。
2. 根据版本号和任务编号读取下列文件：
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/context.md，
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/cs.md
   docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/ws.md
3. 根据需求内容判断，如果是包含前后端的后端业务需求，启用BEE subagent，如果是包含前后端的前端业务需求，启用FEE subagent，如果不是包含前后端业务的需求，启用SSE subagent。
4. 读取数据库设计文件（如果文件不存在，就不读取）：
   docs/{项目英文缩写}-dbd.md
   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-dbd-v{当前版本号}.md
   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-dbd-v{当前版本号}.sql
5. 读取API设计文件(如果文件不存在就不读取)：
   docs/{项目英文缩写}-api.md
   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-api-v{当前版本号}.md
6. 读取测试用例：docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/testcase.md
7. 使用上一步启用的agent，完成编码。编码过程中如果需要，也可以读取 docs/{项目英文缩写}-sad.md、docs/project.md,也可以调用cs，ws获取更多现有代码信息和相关资料。
8. 根据上述文件内容编写代码，编码力求简洁，逻辑清晰，函数和文件大小适中，避免超长函数和超长代码文件。
9. 编写完成后，先检查一下代码是否有明显的格式，语法问题。函数和文件的功能划分是否合适，结构是否清晰，可读性高。
10. 再检查代码是否覆盖了参考上下文中所有的需求。
11. 最后检查代码逻辑上是否有漏洞和问题。
12. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-code，步骤状态：{任务编号}-已完成。

### j）编写测试函数和自动化测试脚本
- Skill：impm-task-coding-writetest
- agent：TE
- 处理内容：
1. 接收当前的版本号和任务编号。
2. 根据版本号和任务编号读取当前任务的测试用例：docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/testcase.md，按测试类型分别编写:
a) 单元测试：按当前开发语言，直接按开发语言的习惯和常用的测试插件，编写单元测试函数。
b) 接口测试：用python语言编写接口测试脚本。放入scripts/API-TEST/{项目英文缩写}-api-test-v{当前版本号}.py。每个测试脚本用统一的入口。
c) 功能与UI测试；在docs/{项目英文缩写}-v{当前版本号}/ 目录下新增：{项目英文缩写}-ui-test-record-v{当前版本号}.md。里面列清楚。
3. 根据完成的测试函数和脚本，在testcase.md中标注对应的函数位置或者脚本位置。
4. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-writetest，步骤状态：{任务编号}-已完成。


### k）运行测试
- Skill：impm-task-coding-runtest
- agent：TE
- 处理内容：
1. 接收当前的版本号和任务编号。
2. 根据版本号和任务编号读取当前任务的测试用例：docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/testcase.md。
3. 根据当前任务的测试用例，找到对应的测试函数和测试脚本，并执行测试脚本。
4. 每一个测试完成后，更新当前任务的测试用例的测试通过情况。
5. 全部测试完成后，如果其中有部分测试失败，则把报错信息加入上下文，然后跳回步骤i重新实现编码。
6. 如果全部测试都成功，表明当前任务编码已成功完成。
7. 将当前任务的测试用例docs/{项目英文缩写}-v{当前版本号}/task_{当前任务编号}/testcase.md 合并，更新到当前版本的测试用例：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-testcase-v{当前版本号}.md。
8. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-runtest，步骤状态：{任务编号}-已完成。



### l）git提交版本
- Skill：impm-task-coding-gitcommit
- agent：SCM
- 处理内容：
1. 接收当前的版本号和任务编号。
2. 将当前所有的修改提交到git上，git comment为:{项目英文缩写}-v{当前版本号}-{当前任务编号}
3. 将task.json上，当前任务的状态改为已完成。
4. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-task-coding-gitcommit，步骤状态：{任务编号}-已完成。
5. 提交完成后，回到b步骤，获取并执行下一个task，直到所有task都完成。

## 4.回归测试和版本文档整理
### a）执行回归测试
- Skill：impm-regression-test
- agent：TE
- 处理内容：
1. 将当前版本的docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-testcase-v{当前版本号}.md合并到主测试用例：docs/testcase.md
2. 根据当前所用的开发语言和测试插件，全量运行单元测试。
3. 将单元测试的结果写入：docs/{项目英文缩写}-v{当前版本号}/regression-unit-test.md。
4. 运行所有在scripts/API-TEST/目录下的测试脚本，并将测试结果写入：docs/{项目英文缩写}-v{当前版本号}/regression-api-test.md。
5. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-regression-test，步骤状态：已完成。

### b）代码备注
- Skill：impm-coding-comment
- agent：TW
- 处理内容：
1. 本次版本更新的所有代码（通过当前分支的所有git修改记录综合判断），添加备注。
2. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-coding-comment，步骤状态：已完成。

### c）代码审核
- Skill：impm-coding-review
- agent：TL
- 处理内容：
1. 发现代码中的问题，而非修复它们。只输出审核意见，不修改任何文件
2. 发现安全漏洞（注入、越权、硬编码密钥、敏感信息泄露）
3. 识别性能陷阱（N+1 查询、内存泄漏、不必要的循环、大数据量全表扫描）
4. 检查代码质量（重复代码、过长函数、命名混乱、缺乏注释）
5. 验证架构合规性（分层是否清晰、是否违反依赖方向、是否绕过已定义的接口）
6. 确认测试覆盖（关键路径是否有测试、边界条件是否覆盖）
7. 读取模版目录下的代码审核报告模版：
8. 写入：docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-review.md。
9. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-coding-review，步骤状态：已完成。

### d）更新project.md的项目地图
- Skill：impm-project-update
- agent：SA
- 处理内容：
  根据当前项目下的源代码目录，更新项目地图部分。
  版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-project-update，步骤状态：已完成。

   
### d）将当前版本的所有文档合并到项目主文档
- Skill：impm-doc-merge
- agent：TW
- 处理内容：
1.   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-urs-v{当前版本号}.md合并到docs/{项目英文缩写}-urs.md，如果目标文件不存在，就先创建。
2.   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-prd-v{当前版本号}.md合并到docs/{项目英文缩写}-prd.md，如果目标文件不存在，就先创建。
3.   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-api-v{当前版本号}.md合并到docs/{项目英文缩写}-api.md，如果目标文件不存在，就先创建。
4.   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-dbd-v{当前版本号}.md合并到docs/{项目英文缩写}-dbd.md，如果目标文件不存在，就先创建。
5.   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-dbd-v{当前版本号}.sql合并到docs/{项目英文缩写}-dbd.sql，如果目标文件不存在，就先创建。
6.   docs/{项目英文缩写}-v{当前版本号}/ {项目英文缩写}-lld-v{当前版本号}.md合并到docs/{项目英文缩写}-lld.md，如果目标文件不存在，就先创建。
7.   版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-doc-merge，步骤状态：已完成。

### e）更新readme.md,agent.md
- Skill：impm-doc-update
- agent：TW
- 处理内容：
1.   在根目录下创建和更新：readme.md，agent.md。
2.   版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-doc-update，步骤状态：已完成。
  
### f）更新编译部署方案
- Skill：impm-deploy-update
- agent：TW
- 处理内容：
  1. 创建或者更新：deploy/build.md
  2. 创建或者更新：deploy/deploy.md
  3. 如果生成编译和部署脚本，放置在deploy目录下（如果可行）
  4. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-deploy-update，步骤状态：已完成。

### g）合并主分支并提交。
- Skill：impm-git-merge
- agent：VCA
- - 处理内容：
切换到主分支
1. git merge --squash {当前分支名称}
2. 版本进度文件：docs/{项目英文缩写}-v{当前版本号}/version_progress.md。增加第一行：步骤序号：前一序号+1，步骤名称：impm-git-merge，步骤状态：已完成。
  
## skills
项目的上述的每个步骤都定义为一个opencode的skill

## commands
每个skill都对应一个command。
另外定义几个command
1.  /impm  自动执行4个阶段的所有步骤。
2.  /impm-init 执行项目初始化阶段的所有步骤。
3.  /impm-docs 执行需求分析整理阶段的所有步骤。
4.  /impm-coding 执行需求分析整理阶段的所有步骤。
5.  /impm-finish 执行回归测试和版本文档整理阶段的所有步骤。

## plugins
1. 根据上述需求，自行决定将哪些通用功能集成到ts写成的插件里。
2. 这个项目要求严格按照设计的流程依次处理，不跳过，不乱序执行，不产生幻觉。看看能否通过插件用TS写成的代码代替部分AI处理，提高流程命令的遵从度。