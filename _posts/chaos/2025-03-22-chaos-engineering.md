---
title: 混沌工程-容灾能力测试实战
date: 2025-03-22 10:00:00 +0800
categories: [Chaos Enginneering]
tags: [chaos enginneering]
description: 发现问题能力训练实战
pin: true
---

# 项目介绍
本项目为简单的混沌工程搭建，为测试各种系统可能发生的灾害，提前做好准备以备不时之需，可以在面对各种灾害的时候找到应对策略去发现问题。本文会针对常见的流量洪峰、JVM OOM、依赖服务、资源竞争、数据不一致、配置错误等问题进行开发和测试发现。如果从未试过搭建类似工程，建议花1天亲自动手搭建走一次流程。

## JVM OOM
最常见的情况有堆内存溢出、元空间溢出、栈溢出、nio操作等。OOM不一定会终止程序，原因如下：

- OOM属于Error，而Error默认不会被捕获（除非你主动捕获），但这并不意味着 JVM 必然终止。
- 如果 OOM 错误只发生在某个线程中，而没有影响到整个应用的核心线程（如 main 线程），那么其他线程仍可能继续运行。
- 在多线程环境中，如果 OOM 错误发生在子线程内而没有向上层传递，那么整个应用程序并不会感知这个致命错误，从而继续运行其他线程。

### 堆内存溢出`java.lang.OutOfMemoryError: Java heap space`
堆内存溢出应该是最常见的，可能因为内存泄漏或者真的不够。比如创建大量对象不释放，或者有大对象无法被回收。

```java
// 示例代码：通过无限添加对象到集合中触发堆溢出
public class HeapOOM {
    public static void main(String[] args) {
        List<Object> list = new ArrayList<>();
        while (true) {
            list.add(new byte[1024 * 1024]); // 每次分配1MB
        }
    }
}
```

1. MAT(内存快照)

MAT(Memory Analyzer Tool)是 Eclipse Foundation 开发的 Java 堆转储分析工具，用于分析 Java Heap Dump（堆转储文件），找出内存泄漏、高内存占用对象，并帮助优化 JVM 内存管理。

在JVM启动参数中添加 自动生成堆转储 的配置，即使程序立即崩溃，也能在退出前保存内存快照：

```bash
-Xms512m
-Xmx2g
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=./heapdump.hprof
```

`-XX:+HeapDumpOnOutOfMemoryError`：OOM时自动生成堆转储。

`-XX:HeapDumpPath`：指定转储文件路径。

即使程序瞬间崩溃，仍会生成`heapdump.hprof`，使用MAT分析即可定位问题。

注意：如果在启动时配置了 JVM 堆内存参数，例如设置了过低的最大堆内存 (-Xmx) 或最小堆内存 (-Xms)，即使删除了触发内存溢出的代码，JVM 仍然可能因为内存限制而报堆内存溢出错误。所以不需要就不设置。

![MAT文件分析](/assets/img/chaos/MAT文件分析.png){: width="400" height="400" }
_MAT文件分析_

一般在idea使用需要插件，或者eclipse下载MAT工具，或者通过visual vm打开该heapdump.hprof文件也可以看到。

分析Biggest Objects : 

- byte[]（大数组）: 如果 byte[] 对象占用了大量内存，可能是因为某些大文件被加载到内存中，或者缓存未及时清理。
- java.util.HashMap$Node（大 Map）: 如果 HashMap 或其他集合类（如 ArrayList）占用了大量内存，可能是因为缓存或数据结构没有正确清理，导致对象堆积。
- 自定义类（如 MyService）: 自定义对象（如 MyService）占用大量内存可能是因为该类实例化了大量对象或持有过多的引用，导致无法被垃圾回收。

2. Visual VM :

修改代码降低对象分配频率，让内存增长变慢，便于观察：

```java
list.add(new byte[1024 * 1024]); // 每次分配1MB
Thread.sleep(100); // 每次分配后休眠100毫秒
```

通过VisualVM监控堆内存使用情况，可以看到堆内存一直增长到溢出。

![VisualVM分析](/assets/img/chaos/VisualVM分析.png){: width="400" height="400" }
_VisualVM分析_

### 元空间溢出`java.lang.OutOfMemoryError: Metaspace`

1. 存储结构

元空间内主要存放类结构信息、方法信息、字段信息、常量池()、注解等。

此外，还可能包括方法字节码、静态变量（在Java 8之后，静态变量被移到堆中，但需要确认是否正确）以及一些JIT优化信息。需要验证这些信息的准确性，比如静态变量是否真的在堆中，避免错误。

2. 造成原因并模拟

造成的主要原因是动态生成大量类(如反射、CGLIB代理)，又或者元空间(Metaspace)配置过小。

```java
// 示例代码：通过CGLIB动态生成类触发元空间溢出
public class MetaspaceOOM {
    public static void main(String[] args) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(OOMObject.class);
        enhancer.setUseCache(false); // 禁用缓存，强制生成新类
        enhancer.setCallback((MethodInterceptor) (obj, method, args1, proxy) -> proxy.invokeSuper(obj, args1));
        while (true) {
            enhancer.create();
        }
    }
    static class OOMObject {}
}
```

可以通过设置参数提前触发 

```bash
-XX:MaxMetaspaceSize=10m  # 限制元空间为10MB
```

![元空间溢出](/assets/img/chaos/元空间溢出.png){: width="400" height="400" }
_元空间溢出_

3. 修复方法

如果是线上环境，可以做几手准备，首先使用`-XX:MaxMetaspaceSize=256m`参数增加元空间大小，其次在 VisualVM 的 “Classes” 选项卡中可以看到当前加载的类数量以及它们所属的 ClassLoader。如果发现某个 ClassLoader 的实例数量异常高，并且对应的类不断累积，可能就是泄漏的症状。

同时在 “Monitor” 或 “Sampler” 中观察内存使用情况也能提供参考。

### 栈溢出`java.lang.StackOverflowError`

1. 存储结构

每个线程都有自己独立的栈空间，每次方法调用都会在该栈中创建一个栈帧（Stack Frame）。栈帧的存放结构主要包括局部变量表(方法的参数和局部变量)、操作数栈(暂存操作数和中间计算结果)、动态链接(保存了方法调用时所需的信息)、返回地址(记录当前方法执行完成后，应该返回到哪个位置继续执行，下一条指令)。

1. 造成原因并模拟

主要是因为递归调用过深、线程栈空间不足（如创建过多线程）。

```java
// 示例代码：无限递归触发栈溢出
public class StackOverflow {
    public static void main(String[] args) {
        stackOverflow();
    }
    private static void stackOverflow() {
        stackOverflow(); // 无限递归
    }
}
```

调整参数触发

```bash
-Xss160k # 设置线程栈大小为160KB
```

可以通过选择 Threads 选项卡，查看线程的调用情况。如果程序发生了 栈溢出（StackOverflowError），通常会出现某些线程不断重复相同的调用栈（递归调用）。点击 Thread Dump（线程转储） 按钮，可以获取当前线程的堆栈快照。

也可以生成 Heap Dump 并分析切换到 Monitor 选项卡，查看 CPU 使用率和线程行为。点击 Heap Dump 按钮，生成堆转储文件（.hprof）。在 VisualVM 中打开 Heap Dump，并查看 java.lang.StackOverflowError 相关的异常对象。

![栈溢出_Monitor查看](/assets/img/chaos/栈溢出_Monitor查看.png){: width="400" height="400" }
_Monitor查看_

![栈溢出_Thread查看](/assets/img/chaos/栈溢出_Thread查看.png){: width="400" height="400" }
_Thread查看_

3. 修复方法

理解了溢出原因，修复可以通过查看是否终止条件不够严格，又或者使用尾递归优化，减少栈帧占用，又或者可以通过`-Xxx16m`设置线程栈空间。

### 直接内存溢出`java.lang.OutOfMemoryError: Direct buffer memory`

1. 造成原因并模拟

主要因为频繁使用NIO的ByteBuffer.allocateDirect()分配直接内存。还有未及时释放直接内存（如未调用Cleaner释放）。

```java
// 示例代码：无限分配直接内存
public class DirectMemoryOOM {
    public static void main(String[] args) throws Exception {
        List<ByteBuffer> list = new ArrayList<>();
        while (true) {
            list.add(ByteBuffer.allocateDirect(1024 * 1024)); // 每次分配1MB
        }
    }
}
```

设置参数触发

```bash
-XX:MaxDirectMemorySize=10m # 限制直接内存为10MB
```

![直接内存溢出](/assets/img/chaos/直接内存溢出.png){: width="400" height="400" }
_直接内存溢出_

直接内存溢出可以在VisualVM查看 Metaspace 和 Native Memory

1) 打开 VisualVM，连接到目标 JVM 进程
2) 切换到 Monitor

   - 选项卡关注 Heap 和 Metaspace 使用情况
   - 如果 Heap 未满，但仍然发生 OOM，可能是 直接内存溢出

3) 切换到 Threads 选项卡

   - 如果线程大量阻塞在 DirectByteBuffer 相关方法，可能是直接内存泄漏

4) 打开 Sampler（采样器）

   - 选择 "Memory"，然后点击 "Heap Dump"，分析 DirectByteBuffer 对象

![直接内存泄漏_元空间查看](/assets/img/chaos/直接内存泄漏_元空间查看.png){: width="400" height="400" }
_元空间查看_

![直接内存溢出_采样器](/assets/img/chaos/直接内存溢出_采样器.png){: width="400" height="400" }
_采样器_

2. 修复方法

- 检查代码中是否及时释放直接内存（如显式调用System.gc()或Cleaner）。
- 调整直接内存大小（-XX:MaxDirectMemorySize）。

### 线程数溢出`java.lang.OutOfMemoryError: unable to create new native thread`

1. 造成原因并模拟

注意：线程数量超出系统限制，导致系统资源耗尽。会导致系统重启，请勿随意使用。或者使用`ulimit -u 1000  # 限制最大线程数为 1000`限制最大线程数。

```java
// 示例代码：无限创建线程
public class ThreadOOM {
    public static void main(String[] args) {
        while (true) {
            new Thread(() -> {
                try { Thread.sleep(Integer.MAX_VALUE); } catch (Exception e) {}
            }).start();
        }
    }
}
```

2. 修复方法

- 优化代码，使用线程池替代独立线程。
- 调整系统线程数限制（ulimit -u）。

## 流量洪峰

### JMeter 下载

在这里使用的测试工具主要是jmeter，所以使用前先下载一个。

官网下载[JMeter](https://jmeter.apache.org/download_jmeter.cgi)，我一般解压到`/usr/local`，解压完成后进入`/usr/local/bin`文件，使用命令`sh jmeter`打开jmeter。

汉化 : 

(仅对本次打开有效)打开后选择Options --> Choose Language --> Chinese。

(永久有效)或者修改`/bin/jmeter.properties`中`language=zh_CN`，保存并重启。

### 新增测试接口

新建一个REST接口Controller暴露一个 GET 接口 /api/test/trafficpeak。每个请求执行时，会模拟一定的业务处理（这里以休眠 50 毫秒为例）。你可以根据实际场景修改模拟逻辑。
```
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TrafficPeakController {

    @GetMapping("/api/test/trafficpeak")
    public ResponseEntity<String> testTrafficPeak() {
        try {
            // 模拟业务处理（例如 50 毫秒的耗时操作）
            Thread.sleep(50);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(500).body("Internal Error");
        }
        return ResponseEntity.ok("Processed by thread " + Thread.currentThread().getName());
    }
}
```

配置（可选）：线程池调整

如果你希望在高并发场景下更好地控制线程资源，可以通过配置线程池来管理任务执行。以下提供一个基于 Spring 的线程池配置示例，在这种场景下可配合异步调用使用，但对 JMeter 直接调用 HTTP 接口的场景，默认线程池也可以满足需求。

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class ThreadPoolConfig {

    @Bean
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(50);      // 核心线程数，根据实际情况调整
        executor.setMaxPoolSize(200);      // 最大线程数
        executor.setQueueCapacity(1000);   // 队列容量
        executor.setThreadNamePrefix("Test-");
        executor.initialize();
        return executor;
    }
}
```

可以通过`http://localhost:8080/api/test/trafficpeak`查看是否启动成功

### 使用JMeter测试
继续

