---
title: 大厂高频Java面试60问-源码级
date: 2024-09-03 10:00:00 +0800
categories: [Java Interview]
tags: [java interview]
description: Java面试
pin: true
---

# Java源码级巧答面试60问

## ArrayList

ArrayList就是数组列表，底层是数组Object[] elementData。ArrayList在装载基本数据类型时，实际装载的是对应的包装类。

- ArrayList:查找和访问元素的速度快，新增、删除的速度慢。线程不安全，使用频率高。
- LinkedList:查找和访问元素的速度慢，新增、删除的速度快。

实际开发中有以下几种场景:

- 频繁增删:使用LinkedList，但是涉及到频繁增删的场景不多 
- 追求线程安全:使用Vector。
- 普通的用来查询:使用ArrayList，使用的场景最多。

根据数据结构的特性，三者难以全包含，只能在相互之间做取舍。

### 问题：ArrayList底层是数组，那是怎么实现不断扩容的?

添加新元素的时候才会涉及扩容

- 使用无参构造创建ArrayList

  使用ArrayList空参的构造器创建集合时，数组并没有创建。当集合中添加第一个元素时，数组被创建，初始化容量为10.

- 使用有参构造创建ArrayList

  有参构造创建时，如果指定了容量则会创建出指定容量大小的数组。如果指定容量为0，则无参构造一样。

### 问题: ArrayList1.7之前和1.7及以后的区别?

### 问题：为什么ArrayList增删比较慢，增删是如何做的？

### 问题： ArrayList插入和删除数据一定慢吗？

### 问题： ArrayList如何删除数据？

### 问题: ArrayList适合做队列吗?

### 问题：数组适合做队列吗？

### 问题： ArrayList和LinkedList两者的遍历性能孰优孰劣？

## HashMap

### 问题：了解数据结构中的HashMap吗？介绍下他的结构和底层原理

### 问题：那你清楚HashMap的插入数据的过程吗？

### 问题：刚才你提到HashMap的初始化，那HashMap怎么设定初始容量大小的？

### 问题：你提到hash函数，你知道HashMap的hash函数是如何设计的？

### 问题：JDK1.8相比1.7，做了哪些优化

### 问题：HashMap怎么实现扩容的

### 问题：插入数据时扩容的重新hash是怎么做的？

### 问题：为什么重写equals方法后还要重写hashCode方法

## ConcurrentHashMap

### 问题： HashMap在多线程使用场景下会存在线程安全问题，怎么处理？

### 问题： Collections.synchronizedMap（）如何实现线程安全

### 问题：Hashtable的性能为什么不好？

### 问题：Hashtable和HashMap有什么区别？

### 问题：什么是fail—safe和fail—fast

### 问题： ConcurrentHashMap的数据结构是怎么样？

### 问题： Segment如何实现扩容？

### 问题：1.8版本的数据结构是什么样的？

### 问题：CAS是什么？

### 问题：ConcurrentHashMap效率为什么高

## volatile

### 问题：见过这种神奇的现象吗？

### 问题：聊聊Java Memory Model吧

### 问题：了解 计算机的内存模型吗

### 问题：JMM规定了什么？

### 问题：什么是可见性及如何解决

### 问题：JMM数据同步如何实现

### 问题： Volatile为什么能保证可见性

### 问题： Volatile为什么不能保证原子性

### 问题： Volatile为什么可以保证有序性

### 问题：什么是指令重排

### 问题：了解as—if—serial语义吗

### 问题：化禁止指令重接

### 问题：什么是总线风暴

### 问题：Volatile和Synchronized的区别

## Synchronized

### 问题：如何解决线程并发安全问题

### 问题： Synchronized有哪些应用场景

### 问题：介绍下Synchronized锁的膨胀升级过程

### 问题：对象锁的状态是如何存储的？

### 问题：了解Synchronized的底层实现逻辑吗？

### 问题：了解同步代码块的上锁逻辑吗？

### 问题：介绍下Monitor监视器锁

### 问题：了解同步方法的上锁逻辑吗？

## ReentrantLock

### 问题：介绍下AQS

### 问题：了解ReentrantLock吗？

### 问题：ReentrantLock的实现逻辑

### 问题：什么公平锁和非公平锁

### 问题：介绍下ReentrantLock的上锁逻辑
