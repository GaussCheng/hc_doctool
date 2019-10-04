使用说明
=======

`makedoc`是一个辅助生成文档的脚本,里面有指定输入文件和输出文件,需自行修改.

`hc_style`里面是华成文档需要用到的样式文件,里面有一个`md_example_metadata.yaml`的问题,这个文档是markdown文件转华成产品手册PDF的元数据样例文件.

```
---
#documentclass: book
title: "华成手控系统远程监控通信协议" // 文档名称
subtitle: "test sub"            // 文档副标题
author:                         // 作者
    -  程国醒                    
date: "2019-10-02"
keywords: [通信,远程]
#lang: zh-CN
listings-disable-line-numbers: true 
listings-no-page-break: true
product_type: r6                // R6产品类型
---
```
