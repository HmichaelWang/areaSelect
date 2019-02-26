##地区级联控件
在antd的Cascader控件上二次封装，提供全球国家和城市数据的加载及搜索延迟问题的解决方案，areaselect控件数据源只在需要的时候进行更新，其余时候存储在localstorage中，减少与服务端交互频率，提升加载效率。同时搜索功能提供搜索结果数量过滤（antd官网是支持的，但是试过几次之后都不好用，所以重新封装了一下）。增加单设备热门城市计算，通过计算用户使用地区频率和时间定时清理和排序，热门城市数量、清理时间、过期时间、最大保存数量都可在控件中调整。
##使用
和所有react组件一样使用！！！
控件分三种使用场景，根据具体的开发环境选择，通过Form控制控件值、通过state控制控件值、只读形式。
##参数说明
  form --默认false使用state控制控件值，form：使用form控制, 
  label --标题, 
  nameKey --用于form的id,
  options --传入form.getFieldDecorator的参数,
  addHotCitys --是否记录并显示热门城市
  initvalue --初始值, 
  loadContentId --渲染节点id，默认渲染在body上 如果滑动层不在body上,下拉列表无法跟随一起滑动
  fieldNames --显示的label和value对应的key 默认为{label: 'districtName',value: 'id'}
  initParentId --一级渲染父节点
  onChange --传入Cascader控件的参数，若选择传入该参数 则必须自主控制
  justLeaf --是否只展示initParentId的children
  disabled --只读--带输入框
  readonly --只读--不带输入框 完全的文本展示
  CascaderOptions --传入Cascader控件的参数，若选择传入该参数 则必须自主控制
  changeOnSelect --是否必须选择到末级节点
  placeholder --提示信息


###页面使用
```js

    onChange = (value,options) => {
        console.log(value,options)
    }

    render(){
        return (
            <div id="father">
                <Areaselect
                    form={form}
                    label='CPCD'
                    nameKey="CPCD"
                    fieldNames={{
                        label: 'name',
                        value: 'id'
                    }}
                    initParentId={'20'}
                    justLeaf={true}
                    initvalue={[10,20,30]}
                    options={{ rules: [{ required: true }] }}
                    loadContentId="father"
                    onChange={this.onChange}
                    disabled={false}
                    readonly={false}
                />
          </div>
        )
    }
}
        
```