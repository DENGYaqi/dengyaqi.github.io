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
最常见的情况有堆内存溢出、元空间溢出、栈溢出、nio操作等。

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

