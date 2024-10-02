---
title: 面试算法解题思路
date: 2024-09-30 10:00:00 +0800
categories: [Algo]
tags: [algo]
description: 算法思路
pin: true
---

## 介绍
本文主要分为三个部分，读懂题目，选择解答，组织解答，代码部分只包含算法框架，旨在面试时能给面试官提供一个最优算法解的语言描述。建议读一遍有个印象之后去看看大厂的算法题，自己先想一想解答，10分钟没想出来就过来搜下关键词即可。

1. 读懂题目主要是算法词汇部分，只要能看懂题目，基本上这个算法题已经解了一半了。

2. 选择解答则是了解各类算法框架的核心后，选一个最符合题目的算法解答，例如动态规划一定是用于解最值的，也就是动态规划问题一定会具备"最优子结构"，例如从起点到终点最短路径是哪条。

3. 组织解答则是根据选好的算法核心和具体的题目，进行应对和调整，因为算法核心并不一定能完全的对应上题目的解答，此时还需要对算法核心做一些微小的调整。

## 基础词汇
很多时候看不懂题目是因为不了解某个词汇，下面有100个在leetcode题目中最常见的词汇与其定义。

### 序列
有序的元素集合, 有限或无限, 每个元素都有一个特定的位置或索引，如数列(自然数序列 1,2,3,4,...1,2,3,4,...)、字符串、数组。

```text
子序列(Subsequence): 从序列中按顺序提取部分元素形成的新序列，不要求元素连续。
```


```text
序列(sequence): 有序的元素集合, 有限或无限, 每个元素都有一个特定的位置或索引，如数列(自然数序列 1,2,3,4,...1,2,3,4,...)、字符串、数组。
子序列(Subsequence)
子数组(Subarray) : 
子字符串(Substring)
最长公共子序列(Longest Common Subsequence,LCS)
最长递增子序列(Longest Increasing Subsequence,LIS)
最大子段和(Maximum Subarray Sum)
最小子段和(Minimum Subarray Sum)

前缀和（Prefix Sum）
后缀和（Suffix Sum）
区间和（Range Sum）
滑动窗口（Sliding Window）
区间最值（Range Maximum/Minimum Query, RMQ）
最长回文子串（Longest Palindromic Substring）
最长重复子串（Longest Repeated Substring）
连续子数组积（Product of Subarray）
区间最大差值（Range Maximum Difference）
区间最小值（Range Minimum Query）
最大连续和（Maximum Continuous Sum）
最小连续和（Minimum Continuous Sum）
连续相同元素个数（Length of Consecutive Equal Elements）
非递减子段（Non-decreasing Subarray）
非递增子段（Non-increasing Subarray）
递增子段（Increasing Subarray）
递减子段（Decreasing Subarray）
区间求和（Range Sum Query）
最大长度区间（Maximum Length Subarray）
最小长度区间（Minimum Length Subarray）
最长单调递增子段（Longest Monotonically Increasing Subsequence）
最长单调递减子段（Longest Monotonically Decreasing Subsequence）
区间和大于K的子数组（Subarray with Sum Greater than K）
区间和等于K的子数组（Subarray with Sum Equals K）
最长0和1相等的子数组（Longest Subarray with Equal Number of 0s and 1s）
最大平均子数组（Maximum Average Subarray）
最小平均子数组（Minimum Average Subarray）
最长不重复子串（Longest Substring Without Repeating Characters）
最长相同字符子串（Longest Substring with Same Characters）
最长公共前缀（Longest Common Prefix）
最小窗口子串（Minimum Window Substring）
区间反转（Range Reversal）
区间更新（Range Update）
区间最小差值（Minimum Range Difference）
最短连续子数组（Shortest Continuous Subarray）
最长连续递增序列（Longest Continuous Increasing Sequence）
最长连续递减序列（Longest Continuous Decreasing Sequence）
最长交替子序列（Longest Alternating Subsequence）
连续1的最长子串（Longest Substring of Consecutive 1's）
连续0的最长子串（Longest Substring of Consecutive 0's）
区间异或和（Range XOR Sum）
连续元素乘积最大子数组（Maximum Product Subarray）
最长不重复区间（Longest Non-repeating Subarray）
```

## 算法基础

## 算法核心框架

![算法核心框架样例](/assets/img/algo/algo_framework_watermark.png)
_算法核心框架样例(仅供学习使用，禁止商用)_

算法核心框架 = 数据结构 + 基本操作 + 聪明穷举。

最终目的都是为了在不同应用场景下尽可能高效的增删改查。

数据结构最底层的存储方式只有两种 : 数组(顺序存储，内存地址连续)和链表(链式存储，内存地址不连续)，其他的数据结构都是由此发展。

基本操作无非就是遍历 + 访问，其实就是增删改查，也有两种形式 : 线性(for/while)和非线性(递归)。

聪明的穷举的关键点在于无遗漏和无冗余。

算法优化，拿空间换时间。

1. 数组框架
```java
void traverse(int[] arr){
  for(int i = 0; i < arr.length; i++){
    // 迭代访问arr[i]
  }
}
```

2. 递归框架
- 确定递归函数的参数和返回值
- 确定终止条件
- 确定单层递归的逻辑(处理当前层逻辑)
- (非必要)回溯：有时需要在递归返回时恢复之前的状态，常见于回溯问题。

```java
public void recursiveFunction(int level, int param) {
    // 确定终止条件
    if (level > MAX_LEVEL) {
        return;
    }

    // 处理当前层逻辑
    process(level, param);

    // 进入下一层递归
    recursiveFunction(level + 1, newParam);

    // 如果有需要，恢复当前层状态（回溯）
}
```

2. 链表框架
有迭代访问(for)和递归访问两种形式。

```java
void traverse(ListNode head){
  for(ListNode p = head; p != null; p = p.next){
    // 迭代访问p.val
  }
}

void traverse(ListNode head){
  // 递归访问head.val
  traverse(head.next);
}
```

### 二叉树框架
只要涉及递归的问题，都是树的问题。大部分算法技巧，本质上都是树的遍历问题。

```java
void traverse(TreeNode root){
  // 前序位置
  traverse(root.left);
  // 中序位置
  traverse(root.right);
  // 后序位置
}
```

### 动态规划框架

## 微调思路

## 参考资料

1. [labuladong的算法笔记](https://labuladong.online/algo/home/)

2. [代码随想录](https://programmercarl.com/)
