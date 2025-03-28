---
title: Zookeeper原理解析与实战
date: 2025-01-26 10:00:00 +0800
categories: [Zookeeper]
tags: [zookeeper]
description: Zookeeper
pin: true
---

## 一、Zookeeper介绍

### 1、什么是Zookeeper

​	Zookeeper 是一种分布式协调服务，用于管理大型主机。在分布式环境中协调和管理服务是一个复杂的过程，ZooKeeper通过其简单的架构和API解决了这个问题。ZooKeeper 能让开发人员专注于核心应用程序逻辑，而不必担心应用程序的分布式特性。

### 2、Zookeeper的应用场景

- 分布式协调组件

![分布式协调组件](/assets/img/zookeeper/分布式协调组件.png){: width="300" height="300" }
_nginx协调用户使用冗余部署的机器A-2，设置为true后，通过zookeeper节点通知机器A-1也修改为true_

在分布式系统中，需要有zookeeper作为分布式协调组件，协调分布式系统中的状态。

- 分布式锁

zk在实现分布式锁上，可以做到强一致性，关于分布式锁的相关知识，会在之后的ZAB协议中介绍

- 无状态化的实现

![无状态化实现](/assets/img/zookeeper/无状态化实现.png){: width="300" height="300" }
_通过将登录信息维护在zookeeper来实现无状态化_

若我们将登录信息部署在其中一个冗余部署的机器上，用户登录另一台机器则会获取不到登录信息，但是我们将数据存储在协调组件zookeeper上，则机器不用存储登录信息或登录状态，实现无状态的效果。

## 二、搭建ZooKeeper服务器

### 1、安装与启动流程(mac)

-> 搭建JDK环境 

-> [zookeeper官网](https://zookeeper.apache.org/releases.html)下载稳定的release版本 

-> 进入超级用户模式`sudo -s`，退出则`exit`，或者`sudo -i`，退出则`logout`

-> 在`/usr/local`新建文件夹zookeeper 

-> 将下载好的文件解压至`/usr/local/zookeeper`内并删除压缩文件 

-> 进入zookeeper文件内 

-> 启动前需配置文件 

-> 进入`vim ./conf/zoo_sample.cfg`只修改数据及日志存放文件位置`dataDir=/usr/local/zookeeper/zkdata`

-> 重命名文件名称`mv zoo_sample.cfg zoo.cfg`

-> 启动服务器`./zkServer.sh start ../conf/zoo.cfg`(若不指名配置文件，则会自动寻找zoo.cfg文件)

~~~ shell
# 启动成功显示
/usr/bin/java
ZooKeeper JMX enabled by default
Using config: ../conf/zoo.cfg
Starting zookeeper ... STARTED
~~~ 

### 2、zoo.conf配置文件说明

~~~ shell
# zookeeper时间配置中的基本单位（毫秒）
tickTime=2000

#允许follower初始化连接到leader最大时长，它表示tickTime时间倍数即：
initLimit*tickTimeinitLimit=10

#允许follower与leader数据同步最大时长，它表示tickTime时间倍数
syncLimit=5

#持久化机制 : zookeper数据存储目录及日志保存目录（如果没有指明dataLogDir，则日志也保存在这个文件中，若需分开则配置dataLogDir=/tmp/zookeeper）
dataDir=/tmp/zookeeper

#对客户端提供的端口号
clientPort=2181

#单个客户端与zookeeper最大并发连接数
maxClientCnxns=60

# 保存的数据快照数量，之外的将会被清除
autopurge.snapRetainCount=3

#自动触发清除任务时间间隔，小时为单位。默认为0，表示不自动清除。
autopurge.purgeInterval=1
~~~

### 3、Zookeeper服务器的操作命令

若不指名配置文件，也就是删除`../conf/zoo.cfg`，则会自动寻找zoo.cfg文件。

当前路径 : /usr/local/zookeeper/apache-zookeeper-3.7.0-bin

重启zk服务器：

~~~ shell
./bin/zkServer.sh start ./conf/zoo.cfg
~~~

查看zk服务器的状态：

~~~ shell
./bin/zkServer.sh status ./conf/zoo.cfg
~~~

状态解析 : 

~~~ shell
客户端端口Client port found: 2181.
客户端地址Client address: localhost.
SSL认证Client SSL: false.
模式单点模式Mode: standalone
~~~

停止服务器：

~~~ shell
./bin/zkServer.sh stop ./conf/zoo.cfgs
~~~

### 4、Zookeeper客户端的操作命令

从客户端/命令行(可将命令写入，让其与zkServer交互)连接到服务器

~~~ shell
# 必须先启动服务器
./bin/zkCli.sh
~~~

查询内部数据结构

~~~ shell
ls /
~~~

## 三、Zookeeper内部的数据模型

### 1、zk是如何保存数据的

zk中的数据是保存在节点上的，节点就是znode，多个znode之间构成一棵树的目录结构。

Zookeeper的数据模型是什么样子呢？类似于数据结构中的树，同时也很像文件系统的目录

![数据结构](/assets/img/zookeeper/zk是如何保存数据的.png){: width="300" height="300" }

树是由节点所组成，Zookeeper的数据存储也同样是基于节点，这种节点叫做Znode，但是不同于树的节点，Znode的引用方式是路劲引用，类似于文件路径：

~~~mark
/动物/猫
/汽车/宝马
~~~

这样的层级结构，让每一个Znode的节点拥有唯一的路径，就像命名空间一样对不同信息做出清晰的隔离。

#### 1.1、Zookeeper客户端创建节点与保存数据流程样例

-> 创建持久化节点`create /test1` 并查看内部数据结构`ls /`

-> 往节点2内存储数据abc`create /test2 abc`

-> 获取节点2的数据`get /test2`

-> 查看节点2详细信息`get /test2 -s`，[节点解析](#2查询节点)

### 2、zk中的znode是什么样的数据结构

zk中的znode包含了四个部分

 data：保存数据

 acl：权限：(定义了什么样的用户能够操作这个节点，且能够进行怎样的操作)

​			c：create 创建权限，允许在该节点下创建子节点

​			w：write 更新权限，允许更新该节点的数据

​			r：read 读取权限，允许读取该节点的内容以及子节点的列表信息

​			d：delete 删除权限，允许删除该节点的子节点信息

​			a：admin 管理者权限，允许对该节点进行acl权限设置

  stat：描述当前znode的元数据

  child：当前节点的子节点

### 3、zk中节点znode的类型

1、持久节点：创建出的节点，在会话结束后依然存在。保存数据

2、持久序号节点：创建出的节点，根据先后顺序，会在节点之后带上一个数值，越后执行数值越大，适用于分布式锁的应用场景-单调递增

3、临时节点：临时节点是在会话结束后，自动被删除的，通过这个特性，zk可以实现**服务注册与发现**的效果。服务器通过sessionId的查看是否存活，若不存活则删除该节点。

例如服务节点P创建一个临时节点注册在zk里，消费者可以通过zk消费服务，当zk查询到该服务不存活则下线服务。

![临时节点](/assets/img/zookeeper/zk中节点的znode类型_临时节点.png){: width="300" height="300" }

临时序号节点：跟持久序号节点相同，适用于临时的分布式锁

Container节点（3.5.3版本新增）：Container容器节点，当容器中没有任何子节点，该容器节点会被zk定期删除

TTL节点：可以指定节点的到期时间，到期后被zk定时删除。只能通过系统配置zookeeper.extendedTypeEnablee=true开启。(TTL生存时间)

#### 3.1、Zookeeper客户端创建不同类型节点流程样例

-> 创建持久节点`create /test3`，再次创建同名持久节点`create /test3`，报错`Node already exists: /test3`

-> 创建持久序号节点`create -s /test3`，再次创建`create -s /test3`，无报错，`ls /`查看，带有序号顺序。

-> 创建临时节点`create -e /test4`

-> 创建临时序号节点`create -e -s /test4`

-> 创建容器节点`create -c /test5`，创建子节点`create /test5/sub1`，删除子节点`delete /test5/sub1`, 60s后test5容器内无节点则自动删除。

### 4、zk的数据持久化

zk的数据是**运行在内存中**，zk提供了两种持久化机制：

​	事务日志

​	zk把执行的命令以日志形式保存在dataLogDir指定的路径中的文件中（如果没有指定dataLogDir，则按照 dataDir指定的路径）。

​	数据快照

​	zk会在一定的时间间隔内做一次内存数据快照，把时刻的内存数据保存在快照文件中。

zk通过两种形式的持久化，在恢复时先恢复快照文件中的数据到内存中，再用日志文件中的数据做增量恢复，这样恢复的速度更快。

#### 4.1、查看日志与快照流程

-> 进入先前创建的目录zkdata内`cd /usr/local/zookeeper/zkdata`，再进入`/version-2`，内有`log.1和snapshot.0`两个文件，两种模式都启动了。

## 四、Zookeeper客户端（zkCli）的使用

### 1、多节点类型创建

- 创建持久节点

  create path [data] [acl]

- 创建持久序号节点

  create -s path [data] [acl]

- 创建临时节点

  create -e path [data] [acl]

- 创建临时序号节点

  create -e -s path [data] [acl]

- 创建容器节点

  create -c path [data] [acl]

### 2、查询节点

- 普通查询

  - ls [-s -R] path

    -s 详细信息

    -R 当前目录和子目录中的所有信息

- 查询节点相关信息
  - cZxid：创建节点的事务ID
  - mZxid：修改节点的事务ID
  - pZxid：添加和删除子节点的事务ID
  - ctime：节点创建的时间
  - mtime：节点最近修改的时间
  - dataVersion：节点内数据的版本，每更新一次数据，版本会+1
  - aclVersion：此节点的权限版本
  - ephemeralOwner：如果当前节点是临时节点，该是是当前节点所有者的session id。如果节点不是临时节点，则该值为零
  - dataLength：节点内数据的长度
  - numChildren：该节点的子节点个数

- 查询节点的内容

  - get [-s] path

    -s 详细信息

### 3、删除节点

- 普通删除

- 乐观锁删除(乐观:整个系统乐观的认为并发不是很严重，很多地方不需要上锁，跟版本号有关，若版本号设置不正确则会删除不成功)

  - delete [-v] path

    -v 版本

  - deleteall path [-b batch size]

### 3、权限设置

- 注册当前会话的账号和密码：addauth(添加权限) digest(摘要) xiaowang(账号) : 123456(密码)

  ~~~mark
  addauth digest xiaowang:123456
  ~~~

- 创建节点并设置权限（指定该节点的用户，以及用户所拥有的权限s）: /test-node(持久节点) abcd(节点内数据) cdwra(创建删除可读可写)

  ~~~ mark
  create /test-node abcd auth:xiaowang:123456:cdwra
  ~~~

- 在另一个会话中必须先使用账号密码，才能拥有操作节点的权限，无权限则会显示以下类似报错
  ~~~ mark
  get /test-node
  Insufficient permission : /test-node
  ~~~

## 五、Curator客户端的使用

### 1、Curator介绍

Curator是Netflix公司开源的一套zookeeper客户端框架，Curator是对Zookeeper支持最好的客户端框架。Curator封装了大部分Zookeeper的功能，比如Leader选举、分布式锁等，减少了技术人员在使用Zookeeper时的底层细节开发工作。

### 2、引入依赖

~~~ xml
<!--Curator-->
<dependency>
	<groupId>org.apache.curator</groupId>
    <artifactId>curator-framework</artifactId>
    <version>2.12.0</version>
</dependency>
<dependency>
	<groupId>org.apache.curator</groupId>
    <artifactId>curator-recipes</artifactId>
    <version>2.12.0</version>
</dependency>
<!--Zookeeper-->
<dependency>
	<groupId>org.apache.zookeeper</groupId>
    <artifactId>zookeeper</artifactId>
    <version>3.7.14</version>
</dependency>

配置curator基本连接信息
curator.retryCount=5
curator.elapsedTimeMs=5000
curator.connectionString=192.168.200.128:2181
curator.sessionTimeoutMs=60000
curator.connectionTimeoutMs=4000

~~~

### 3、编写配置curator配置类

~~~ java
@Data
@Component
@ConfigurationProperties(prefix = "curator")
public class WrapperZK {
  private int retryCount;

  private int elapsedTimeMs;

  private String connectionString;

  private int sessionTimeoutMs;

  private int connectionTimeoutMs;
}

//引用配置类
@Configuration
public class CuratorConfig {

    @Autowired
    private WrapperZK wrapperZK;

    @Bean(initMethod = "start")
    public CuratorFramework curatorFramework(){
        return CuratorFrameworkFactory.newClient(
            wrapperZK.getConnectionString(),
            wrapperZK.getSessionTimeoutMs(),
            wrapperZK.getConnectionTimeoutMs(),
            new RetryNTimes(wrapperZK.getRetryCount(), wrapperZK.getElapsedTimeMs())
        );
    }

}
~~~

### 4、测试

~~~ java
@Autowired
private CuratorFramework curatorFramework;

@Test
//添加节点
void createNode() throws Exception{
    //添加默认(持久)节点
    String path = curatorFramework.create().forPath("/curator-node");
    //添加临时序号节点
    //String path2 = curatorFramework.create().withMode(CreateMode.EPHEMERAL_SEQUENTIAL).forPath("/curator-nodes", "messageDate".getBytes());
    System.out.println(String.format("curator create node :%s  successfully!", path));
    //		System.in.read();
}

@Test
//获取节点值
void getDate() throws Exception {
    byte[] bttes = curatorFramework.getData().forPath("/curator-node");
    System.out.println("bttes = " + bttes);
}

@Test
//设置节点值
void setDate() throws Exception {
    curatorFramework.setData().forPath("/curator-node", "newMessage".getBytes());
    byte[] bytes = curatorFramework.getData().forPath("/curator-node");
    System.out.println("bytes = " + bytes);
}

@Test
//创建多级节点
void createWithParent() throws Exception {
    String pathWithParent = "/node-parent/sub-node-1";
    String path = curatorFramework.create().creatingParentContainersIfNeeded().forPath(pathWithParent);
    System.out.println(String.format("curator create node :%s success!", path));
}

@Test
//删除节点
void delete() throws Exception {
    String path = "/node-parent";
    //删除节点的同时一并删除子节点
    curatorFramework.delete().guaranteed().deletingChildrenIfNeeded().forPath(path);
}
~~~

## 六、zk实现分布式锁

锁信息保存在zk注册中心。

### 1、zk中锁的种类：

- 读锁（读锁共享）：大家都可以读。上锁前提：之前的锁没有写锁
- 写锁（写锁排他）：只有得到写锁的才能写。上锁前提：之前没有任何锁

举例说明 : 
- 读锁: 小叶、小张和小王都可以分别跟小红约会(读锁)，但是一旦小叶跟小红结婚(写锁)了，其他人就不能跟小红约会(读锁)了。
- 写锁: 小叶、小张和小王都可以分别跟小红约会(读锁)，如果小叶跟小红正在约会，小王就不能跟小红结婚，因为要跟前面的人断干净了。

### 2、zk如何上读锁	

- 创建一个临时序号节点，节点的数据是read，表示是读锁

- 获取当前zk中序号比自己小的所有节点
- 判断最小节点是否是读锁
  - 如果不是读锁的话，则上锁失败，为最小节点设置监听。阻塞等待，zk的watch机制会当最小节点发生变化时通知当前节点，再执行第二步的流程
  - 如果是读锁的话，则上锁成功。

![zk如何上读锁](/assets/img/zookeeper/zk如何上读锁.png){: width="300" height="300" }

### 3、zk如何上写锁

- 创建一个临时序号节点，节点的数据是write，表示写锁
- 获取zk中所有的子节点
- 判断自己是否是最小的节点：
  - 如果是，则上写锁成功
  - 如果不是，说明前面还有锁，则上锁失败，监听最小节点，如果最小节点有变化，则再执行第二步。

![zk如何上写锁](/assets/img/zookeeper/zk如何上写锁.png){: width="300" height="300" }

### 4、羊群效应

如果用上述的上锁方式，只要有节点发生变化，就会触发其他节点的监听事件，这样对zk的压力非常大，而羊群效应，可以调整成链式监听。解决这个问题。

举例说明：如果现在有100个并发都在上写锁，但是现在已经有一个锁存在/read0001，那么意味着100个并发都要监听这个/read0001锁，如果/read0001节点删除，那么100个节点就要尝试上写锁，但是只有一个能成功，剩下99个又要监听那个成功的节点。以此类推。需要解决这个问题只需要监听上一个节点即可，如果上一个会话断开了就监听会话还存在的上一个节点即可。

![羊群效应](/assets/img/zookeeper/羊群效应.png){: width="300" height="300" }

### 5、Curator实现读写锁

- 获取读锁

~~~ java
@Test
void testGetReadLock()throws Exception{
    //读写锁
    InterProcessReadWriteLock interProcessReadWriteLock = new InterProcessReadWriteLock(client, "/lock1");
    //获取读锁对象
    InterProcessLock interProcessLock = interProcessReadWriteLock.readLock();
    System.out.println("等待获取读锁对象中...");
    //获取锁
    interProcessLock.acquire();
    for(int i = 1; i <= 100; i ++){
        Thread.sleep(3000);
        System.out.println(i);
    }
    //释放锁
    interProcessLock.release();
    System.out.println("等待释放锁...");
}
~~~

- 获取写锁

~~~ java
@Test
void testGetWriteLock()throws Exception{
    //读写锁
    InterProcessReadWriteLock interProcessReadWriteLock = new InterProcessReadWriteLock(client, "/lock1");
    //获取写锁对象
    InterProcessLock interProcessLock = interProcessReadWriteLock.writeLock();
    System.out.println("等待获取写锁对象中...");
    //获取锁
    interProcessLock.acquire();
    for(int i = 1; i <= 100; i ++){
        Thread.sleep(3000);
        System.out.println(i);
    }
    //释放锁
    interProcessLock.release();
    System.out.println("等待释放锁...");
}
~~~

## 七、zk的watch机制

### 1、Watch机制介绍

我们可以把Watch理解成是注册在特定Znode上的触发器。当这个Znode发生改变，也就是调用了create，delete，setData方法的时候，将会触发Znode上注册的对应事件，请求Watch的客户端会收到异步通知。

具体交互过程如下：

- 客户端调用getData方法，watch参数是true。服务端接到请求，返回节点数据，并且在对应的哈希表里插入被Watch的Znode路径，以及Watcher列表。

- 当被Watch的Znode已删除，服务端会查找哈希表，找到该Znode对应的所有Watcher，异步通知客户端，并且删除哈希表中对应的key-value。

客户端使用了NIO通信模式监听服务端的调用。

### 2、zkCli客户端使用Watch

~~~ shell
create /test date
get -w /test	一次性监听节点
ls -w /test		监听目录，创建和删除子节点会收到通知。但是子节点中新增节点不会被监听到(监听单层级)
ls -R -w /test	监听子节点中节点的变化，但内容的变化不会收到通知(监听所有层级)
~~~

### 3、Curator客户端使用Watch

通过NodeCache节点缓存对象设置一个监听器。

~~~ java
@Test
public void addNodeListener() throws Exception{
    NodeCache nodeCache = new NodeCache(curatorFramework,"/curator-node");
    nodeCache.getListenable().addListener(new NodeCacheListener() {
        @Override
        public void nodeChanged() throws Exception{
            log.info("{} path nodeChanged: ", "/curator-node");
            printNodeData();
        }
    )};

    nodeCache.start();
    // 阻塞做测试
    System.in.read();
}

public void printNodeData() throws Exception{
    byte[] bytes = curatorFramework.getData().forPath("/curator-node");
    log.info("data: {}", new String(bytes));
}
~~~

## 八、Zookeeper集群实战

集群中的节点是服务器节点。并不是znode。

### 1、Zookeeper集群角色

![集群角色](/assets/img/zookeeper/集群角色.png){: width="300" height="300" }

zookeeper集群中的节点有三种角色

- Leader：处理集群的所有事务请求，集群中只有一个Leader
- Follwoer：只能处理读请求，参与Leader选举
- Observer：只能处理读请求，提升集群读的性能，但不能参与Leader选举

### 2、集群搭建

搭建4个节点，其中一个节点为Observer

- 停止zkServer.sh

  ~~~ shell
  ./bin/zkServer.sh stop
  ~~~

- 创建4个服务器节点的myid并设值

  在usr/local/zookeeper/zkdata中创建一下四个文件, 再在各个文件内创建一个myid文件，并标注唯一标识

  ~~~ shell
  mkdir zk1 zk2 zk3 zk4
  cd zk1
  vim myid
  输入1(目前服务器节点的唯一标识)
  
  其他zk也如此，可用以下命令快速创建
  echo 2 > ./zk2/myid
  echo 3 > ./zk3/myid
  echo 4 > ./zk4/myid

  检查是否创建成功
  cd zk4
  cat myid
  ~~~

- 编写4个zoo.cfg来启动4个服务器节点

进入路径/usr/local/zookeeper/apache-zookeeper-3.7.2-bin/conf

  ~~~ shell
  vim zoo1.cfg
  复制下面shell的配置内容到zoo1.cfg

  拷贝复制
  cp zoo1.cfg zoo2.cfg
  cp zoo1.cfg zoo3.cfg
  cp zoo1.cfg zoo4.cfg

  修改各个配置文件的dataDir与客户端端口，如
  dataDir=/usr/local/zookeeper/zkdata/zk2
  clientPort=21802
  admin.serverPort=8082
  ~~~

  配置内容 : 第一台服务器节点配置文件的内容，首先修改dataDir的路径为zk1，其次是集群各个节点的通信。
  注意 : 因为当前为了教学方便所以将四个节点创建在同一台服务器。服务器ip需改成自己电脑的ip，可以用`ifconfig en0`查看，inet后既是自己的ip。其次需要添加   
  `admin.serverPort=8081`，避免`8080`端口已经被使用。如有其他问题，可在`/usr/local/zookeeper/apache-zookeeper-3.7.2-bin/logs`内查看对应ip的日志解决。
  
  ~~~ shell
  # The number of milliseconds of each tick
  tickTime=2000
  # The number of ticks that the initial 
  # synchronization phase can take
  initLimit=10
  # The number of ticks that can pass between 
  # sending a request and getting an acknowledgement
  syncLimit=5
  # the directory where the snapshot is stored.
  # do not use /tmp for storage, /tmp here is just 
  # example sakes. 修改对应的zk1 zk2 zk3 zk4
  dataDir=/usr/local/zookeeper/zkdata/zk1
  # 客户端端口，修改对应的端口为21802 21803 21804
  clientPort=21801

  # 修改对应的端口为8082 8083 8084
  admin.serverPort=8081

  # 自己的服务器ip:端口1:端口2(:身份描述)。2001为集群数据通信端口，3001为集群选举端口，observer（观察者身份）
  server.1=192.168.200.128:2001:3001
  server.2=192.169.200.128:2002:3002
  server.3=192.168.200.128:2003:3003
  server.4=192.168.200.128:2004:3004:observer
  
  ~~~

- 启动4台服务器节点

进入路径/usr/local/zookeeper/apache-zookeeper-3.7.2-bin/bin

  ~~~ shell
  ./zkServer.sh start ../conf/zoo1.cfg
  ./zkServer.sh start ../conf/zoo2.cfg
  ./zkServer.sh start ../conf/zoo3.cfg
  ./zkServer.sh start ../conf/zoo4.cfg
  ~~~

- 查看4台服务器节点状态

进入路径/usr/local/zookeeper/apache-zookeeper-3.7.2-bin/bin，以下命令查看不同服务器节点，在mode可看到不同节点的对应角色

  ~~~ shell
  >>> ./zkServer.sh status ../conf/zoo1.cfg
  /usr/bin/java
  ZooKeeper JMX enabled by default
  Using config: ../conf/zoo1.cfg
  Client port found: 21801. Client address: localhost. Client SSL: false.
  Mode: follower

  >>> ./zkServer.sh status ../conf/zoo2.cfg
  ZooKeeper JMX enabled by default
  Using config: ../conf/zoo2.cfg
  Client port found: 21802. Client address: localhost. Client SSL: false.
  Mode: leader

  >>> ./zkServer.sh status ../conf/zoo3.cfg
  /usr/bin/java
  ZooKeeper JMX enabled by default
  Using config: ../conf/zoo3.cfg
  Client port found: 21803. Client address: localhost. Client SSL: false.
  Mode: follower

  >>> ./zkServer.sh status ../conf/zoo4.cfg
  /usr/bin/java
  ZooKeeper JMX enabled by default
  Using config: ../conf/zoo4.cfg
  Client port found: 21804. Client address: localhost. Client SSL: false.
  Mode: observer

  ~~~

  ### 3、使用客户端连接Zookeeper集群

  注意: 最好是写完整的集群ip和端口，每个机器通过逗号隔开
  
  ~~~ shell
  ./zkCli.sh -server 192.168.200.128:21801,192.168.200.128:21802,192.168.200.128:21803,192.168.200.128:21804
  ~~~

## 九、ZAB协议

### 1、什么是ZAB协议

zookeeper作为非常重要的分布式协调组件，需要进行集群部署，集群中会以一主多从的形式进行部署。zookeeper为了保证数据的一致性，使用了ZAB（Zookeeper Atomic Broadcast）协议，这个协议解决了Zookeeper的崩溃恢复和主从数据同步的问题。

### 2、ZAB协议定义的四种节点状态

- Looking：选举状态。服务器节点刚上线的时候就会进入looking状态。
- Following：Following节点（从节点）所处的状态
- Leading：Leader节点（主节点）所处状态
- Observing：观察者节点所处的状态

### 3、集群上线Leader选举过程

启动第一台服务器节点时候的状态是Looking，启动第二台也进入Looking状态后..，开始选举，需要最少两台才能开始选举。myid是服务器id，zXid是事务id(增删改)。
1、第一轮投票完成后进行票数比较，首先比较事务id，因为事务更多说明数据发生的变动更新。若事务id相同，则看myid谁大。发现选票(2,0)更大，放入各个投票箱。
2、第二轮投票的发生是因为每个投票箱内的没有票数超过一半的选票，当前能参与选举的有3台，因为有1台是observater。此次投票会将手中较大的选票投给对方，并放入投票箱，这样投票箱就有两张选票了。
3、第二轮投票完成后发现各个的投票箱的票数都过半了，于是整个leader选举获胜结束。

![集群上线时Learder的选举过程](/assets/img/zookeeper/集群上线时Learder的选举过程.png){: width="300" height="300" }

![leader选举第二台获胜结束](/assets/img/zookeeper/leader选举第二台获胜结束.png){: width="300" height="300" }

创建服务器节点时最好是奇数。

### 4、崩溃恢复时的Leader选举

Leader建立完后，Leader周期性地不断向Follower发送心跳（ping命令，没有内容的socket）。当Leader崩溃后，Follower发现socket通道已关闭，于是Follower开始进入到Looking状态，重新回到上一节中的Leader选举过程，此时集群不能对外提供服务。

### 5、主从服务器之间的数据同步

二阶段提交

![主从服务器之间的数据同步](/assets/img/zookeeper/主从服务器之间的数据同步.png){: width="300" height="300" }

如果网络动荡，leader的半数以上的ack可包含自己的ack，即可执行commit，避免第二台机器因为网络原因无法收到数据或发送ack给leader。

### 6、Zookeeper中的NIO与BIO的应用

- NIO(多路复用:把所有请求放到一个队列中，避免阻塞)
  - 用于被客户端连接的21801端口，使用的是NIO模式与客户端建立连接
  - 客户端开启Watch时，也使用NIO，等待Zookeeper服务器的回调
- BIO
  - 集群在选举时，多个节点之间的投票通信端口，使用BIO进行通信

## 十、CAP理论

2000年7月，加州大学伯克利分校的 Eric Brewer教授在ACM PODC会议上提出CAP猜想。2年后，麻省理工学院的Seth Gilbert和 Nancy Lynch 从理论上证明了CAP。之后，CAP理论正式成为分布式计算领域的公认定理。

### CAP理论

CAP理论为：一个分布式系统最多只能同时满足一致性（Consistency）、可用性（Availability）和区分容错性（Partition tolerance）这三项中的两项。

- —致性(Consistency)

一致性指"all nodespsee the same data at the same time"，即更新操作成功并返回客户端完成后，所有节点在同一时间的数据完全一致。

- 可用性(Availability)

可用性指"Reads and writes always succeed"，即服务一直可用，而且是正常响应时间。

- 分区容错性(Partition tolerance)(**必须满足**)

分区容错性指"the system continues to operate despite arbitrary message loss or failure of part of the system"，即分布式系统在遇到某节点或网络分区故障的时候，仍然能够对外提供满足一致性或可用性的服务。——避免单点故障，就要进行冗余部署，**冗余部署**相当于是服务的分区，这样的分区就具备了容错性。

### BASE理论

eBay的架构师Dan Pritchett源于对大规模分布式系统的实践总结，在ACM上发表文章提出BASE理论，BASE理论是对CAP理论的延伸，核心思想是即使无法做到强一致性《Strong Consistency，CAP的一致性就是强一致性)，但应用可以采用适合的方式达到最终一致性(Eventual Consitency) 。

- 基本可用(Basically Available)

基本可用是指分布式系统在出现故障的时候，允许损失部分可用性，即保证核心可用。

电商大促时，为了应对访问量激增，部分用户可能会被引导到降级页面，服务层也可能只提供降级服务。这就是损失部分可用性的体现。例如在双11的时候，注册、评论、退款功能不能对外开放，因为这些不是核心业务。核心业务是登录、搜索、加购物车、下单等等。

- 软状态(Soft State)

软状态是指允许系统存在中间状态，而该中间状态不会影响系统整体可用性。分布式存储中一般一份数据至少会有三个副本，允许不同节点间副本同步的延时就是软状态的体现。mysql replication的异步复制也是一种体现。

- 最终一致性(Eventual Consistency)

最终一致性是指系统中的所有数据副本经过一定时间后，最终能够达到一致的状态。弱一致性和强一致性相反，最终一致性是弱一致性的—种特殊情况。

### Zookeeper追求的一致性

Zookeeper在数据同步时，追求的并不是强一致性，而是顺序一致性（事务id的单调递增）

### 复习

- 搭建Zookeeper服务器，熟练掌握各种zkCli命令

- 掌握Curator第三方工具的使用

- 搭建Zookeeper集群，掌握集群的节点状态、客户端连接等等操作

- 重点掌握zk集群的leader选举流程

- 重点掌握zk集群的数据同步流程

- 思考CAP定理和BASE理论及ZK追求的数据一致性
