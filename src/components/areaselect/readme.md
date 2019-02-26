## 国家地区 及联选择
### 参数说明
#### form --form, 
#### label --标题, 
#### nameKey --用于form的id,
#### options --传入form.getFieldDecorator的参数,
#### initvalue --初始值, 
#### readonly --只读,
#### loadContentId --渲染节点id，默认渲染在body上 如果滑动层不在body上,下拉列表无法跟随一起滑动
#### fieldNames --显示的label和value对于的key 默认为{label: 'districtName',value: 'id'}
#### initParentId --一级渲染父节点
#### onChange --传入Cascader控件的参数，若选择传入该参数 则必须自主控制
#### justLeaf --是否只展示initParentId的children
#### disabled --只读--带输入框
#### readonly --只读--不带输入框 完全的文本展示
#### CascaderOptions --传入Cascader控件的参数，若选择传入该参数 则必须自主控制
#### changeOnSelect --是否必须选择到末级节点


###页面使用
```js

    onChange = (value,valueObjs) => {
        console.log(value,valueObjs)
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