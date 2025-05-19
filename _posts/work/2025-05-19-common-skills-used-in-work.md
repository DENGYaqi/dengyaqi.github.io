---
title: 工作中常用的工程写法
date: 2025-05-19 10:00:00 +0800
categories: [Leetcode]
tags: [leetcode]
description: 代码技巧
pin: true
---

### ① 栈 / 队列相关技巧（10 个）

1. `minStack.push(Integer.MAX_VALUE);` 用于统一最小值比较逻辑
2. `maxStack.push(Integer.MIN_VALUE);` 用于最大值逻辑
3. 使用 dummy node（伪头结点）统一链表插入逻辑
4. 队列先放一个 `null` 哨兵元素，标志一轮结束（常见于 BFS）
5. `Deque.addLast(null)` 作为哨兵结点
6. `Queue.offer(dummyNode)` 用于层序遍历开头
7. `栈.push(Integer.MIN_VALUE + 1)` 保证后续任何值都比它大
8. `Deque<Node> path = new LinkedList<>(); path.push(null);` 用于路径标记
9. 初始化优先队列时 `Comparator.comparingInt((x) -> 0)` 防止空值比较报错
10. 使用 `Collections.emptyList()` 代替 null

---

### ② 数组/矩阵处理技巧（15 个）

11. 初始化数组元素为 `Integer.MAX_VALUE`，用于最小值 DP 比较
12. 初始化为 `-1` 表示“未访问”或“尚未计算”
13. 用 `0x3f3f3f3f` 初始化数组表示“很大”（CP 比赛常用）
14. 初始化为 `false` 表示未标记
15. `visited[i][j] = true` 代替判断逻辑
16. 前后加一圈边界，比如 `int[rows + 2][cols + 2]`，省去边界判断
17. 用 `Boolean[][] memo = new Boolean[n][m];` 来做记忆化搜索
18. DP 初始时 `dp[0] = 1`，防止所有方案都为 0
19. `dp[i][j] = dp[i-1][j] + dp[i][j-1]`，前提是初始化边界行列为 1
20. 前缀和数组 `sum[0] = 0` 作为起始
21. 滑动窗口中使用 `left = 0` 起始保证不越界
22. 用 `Map.put("", 0)` 来初始化空串状态
23. 使用 `Object[][]` 初始化为 `null`，统一处理
24. 使用 `Arrays.fill()` 统一初始化值
25. 二维数组初始化后第一行/列单独填值作为基础状态

---

### ③ HashMap / Set 相关技巧（10 个）

26. `map.getOrDefault(key, 0)` 避免 null 判断
27. 初始化时使用 `HashMap<K, List<V>> map = new HashMap<>()` 并预填空列表
28. `set.contains(x)` 前加 `set.add(x)` 来避免重复（集合去重）
29. 使用 `defaultdict`（Python）/ Guava 的 `Multimap` 实现 key 多值存储
30. 初始化 `frequencyMap.put(x, 0)`，然后直接加
31. 避免 `NullPointerException`：先 put 后 get
32. 初始化 `Map<String, Object>` 为 JSON 空对象
33. `TreeMap.put(Integer.MIN_VALUE, value)` 做边界下限
34. `TreeSet.add(Integer.MAX_VALUE)` 占上界
35. `HashMap.putIfAbsent(key, new ArrayList<>())`，防止 get 到 null

---

### ④ 链表与树结构技巧（10 个）

36. 使用 dummy head（哨兵头）统一插入/删除逻辑
37. 使用 `while (cur.next != null)` 代替 `while (cur != null && cur.next != null)`
38. 在叶子节点放一个 `null` 标记，用于层序遍历
39. `root.left = dummyNode` 防止空指针
40. 在前序/中序遍历中初始化一个栈顶部为根节点
41. 树的递归处理：返回一个特殊节点表示“空”
42. BST 初始化时插入 `Integer.MIN_VALUE` / `Integer.MAX_VALUE` 作为界限
43. AVL 树空节点高度为 -1 或 0
44. 用 `parent = new TreeNode(-1)` 初始化作为统一父节点
45. 平衡树中哨兵节点 root.left/right 指向自身防止 null 判断

---

### ⑤ 动态规划 / 状态转移技巧（10 个）

46. 初始化状态 dp\[0]\[0] = true/1
47. 状态转移时默认值设置为 false / Integer.MAX\_VALUE
48. 滚动数组优化：用 `prev[]` 和 `cur[]` 分别保存状态
49. 在状态转移前将不可能的值初始化为 -1
50. 初始转移时设置 base case，如 `dp[0] = 1`
51. 填充边界状态减少分支判断
52. 使用 dummy 状态简化边界初始化
53. `memo.put(state, result)` 即使 result 为 0，也要标记已处理
54. DP 状态转移时初始化为“不可达”状态：如 `99999999`
55. 从 `i=1` 开始循环，使 `i-1` 不越界

---

### ⑥ 多线程 / 并发相关技巧（10 个）

56. 使用 volatile + 初始化值防止指令重排
57. `AtomicInteger(0)` 初始化后可统一 `incrementAndGet`
58. `CountDownLatch(1)` 起初拦住主线程
59. `ThreadLocal` 初始化默认值
60. `synchronized(this)` 中初始值必须提前设置
61. `ConcurrentHashMap.computeIfAbsent()` 避免多线程并发 put
62. 初始化对象后立刻用 `final` 保证可见性
63. 使用双重检查锁实现延迟初始化
64. `ThreadPoolExecutor` 默认线程数设置成 CPU 核心数
65. 响应式编程中使用 `CompletableFuture.completedFuture(null)` 作为默认返回

---

### ⑦ 算法类问题常用技巧（15 个）

66. 滑动窗口用 `left = 0; right = 0` 起始点统一
67. 二分查找使用 `left = 0, right = n`，或者 `n-1`，看闭区间情况
68. 最短路径初始化为 `Integer.MAX_VALUE`
69. 最长路径初始化为 `Integer.MIN_VALUE`
70. BFS 用 `dist[i][j] = -1` 表示未访问
71. DFS 中使用 `visited[][] = false`
72. 回溯中初始化 path 为 `new ArrayList<>()`
73. 快速幂中 base = 1
74. 扫描线算法初始状态为 0
75. 单调栈初始时压入 -1 作为“虚拟栈底”
76. 判断栈空时先压入特殊符号避免 if
77. 合并区间前对区间按左边界排序
78. 并查集初始化 `parent[i] = i`
79. Dijkstra 中起始点距离为 0，其他点为无穷大
80. Prim 算法中初始化最小边权为最大值

---

### ⑧ Java 工程实践/代码风格技巧（10 个）

81. Optional 初始化为 `Optional.empty()`，避免 null
82. 使用 `Collections.emptyList()` 避免返回 null
83. `List<String> list = new ArrayList<>(Collections.nCopies(n, ""));`
84. 抽象类中使用默认模板方法，避免子类遗漏初始化
85. 使用 `Enum.UNKNOWN` 表示默认值
86. 配置类中设置默认值：`@Value("${xx:default}")`
87. 配置读取失败默认用 `Map.getOrDefault`
88. 使用常量定义默认值，如 `DEFAULT_TIMEOUT = 5000`
89. 响应体中预设 success=true，失败时再改
90. 异常处理统一返回默认结构体，避免 null pointer

---

### ⑨ 其他零散技巧（10 个）

91. 游戏开发中初始化 HP/MP = max
92. 画图/网格中初始化背景色为白
93. 二维图初始化 `int[][] grid = new int[rows][cols]`，填 0 表示空地
94. 电商库存系统中，商品数量初始化为 0
95. 消息队列系统初始化偏移量为 -1
96. 数据分析中初始平均值为 0.0
97. 金额类系统中默认初始为 BigDecimal.ZERO
98. 密码系统中默认值为空字符串，而非 null
99. 日志系统默认级别设为 INFO
100. 文件处理时默认打开方式为只读
