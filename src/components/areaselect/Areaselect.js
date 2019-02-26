/*
 * @Author: wyh 
 * @Date: 2018-11-17 14:29:10 
 * @Last Modified by: wyh
 * @Last Modified time: 2019-02-26 11:20:54
 * @Description: 地区及联选择
 * 后台json生成服务 system/md/mdDistrict/genDistrictJson
 * 
 */

import React from 'react'
import axios from 'axios'
import lodash from 'lodash'
import { Cascader, Form, Spin, Tooltip } from 'antd'
import { setStorageItem, getStorageItem } from '../../utils/dataUls'

const FormItem = Form.Item;

let _localDistrictsTrees = []
const _url = "/assets/citys.json"
const _maxCacheHotCity = 10;//最大保存候选热门城市 一次清除30条（按时间和hot排序过后的） 剩余的按过期时间再清理一次
const _maxShowHotCity = 3;//最大展示热门城市
const _clearNum = 5;//一次清除数量
const _overTimeHotCity = 24 * 60 * 60 * 1000;//过期时间 最后一次选择时间在此之外的将被清理

const getAllDirectDatasFromJson = function () {
    return new Promise((resolve, reject) => {
        if (!_url) throw new Error(`ServiceHandler Error Not Match MethodKey GET_DISTRICT_JSON`)
        axios.get(_url).then(res => {
            const { status, data = '{}' } = res;
            if (status != 200) return resolve(false);
            return resolve(data);
        }).catch(err => {
            return reject(false)
        })
    })
}

/**
 * 保存地区数据到本地树
 * @param {*} DDatas 新增的树数据
 */
const setDDatas = (DDatas, isHot = false) => {
    const _V = { district: DDatas.district };
    setStorageItem(initId(isHot), _V);
}

/**
 * 保存热门城市
 * @param {*} DDatas 新增的树数据
 * @param {*} id 下拉取用的value名
 * @param {*} label 下拉取用的label名
 */
const setHotDDatas = (DDatas, id, label) => {
    if (!DDatas || DDatas.length <= 0) return;
    const _YDDatas = DDatas[DDatas.length - 1];
    const _D = getDDatas(true) || { district: [], hotPool: [] };
    if (_YDDatas.hotCity) {
        _D.district.map(d => { if (d[id] == _YDDatas[id]) { d.hot += 1; d.updateTime = new Date().getTime(); } return d; });
    } else if (_D.hotPool.indexOf(_YDDatas.path) != -1) {
        _D.district.map(d => { if (d[id] == _YDDatas.path) { d.hot += 1; d.updateTime = new Date().getTime(); } return d; });
    } else {
        const hotCityObj = {
            hot: 1,
            hotCity: true,
            parentId: -1,
            intactObj: [...DDatas],
            updateTime: new Date().getTime()
        };
        hotCityObj[id] = _YDDatas.path;
        let nameArr = [];
        DDatas.forEach(it => nameArr.push(it[label]));
        hotCityObj[label] = nameArr.join(' / ');
        _D.hotPool.push(hotCityObj[id]);
        _D.district.push(hotCityObj);
    };
    const newDistrict = lodash.orderBy(_D.district, ["hot", "updateTime"], ["desc", "desc"]);
    const _ND = deleteHotCity(newDistrict, _D.hotPool, id);
    setStorageItem(initId(true), _ND);
}

/**
 * 删除热门城市
 * @param {*} citys 所有被记录的热门城市
 */
const deleteHotCity = (citys, pools, id) => {
    const res = { district: [], hotPool: [] };
    if (citys.length <= _maxCacheHotCity) return { district: citys, hotPool: pools };
    let delCityPools = citys.splice(-_clearNum);
    const latestTime = new Date().getTime() - _overTimeHotCity;
    res.district = citys.filter(c => {
        if (c.updateTime < latestTime) {
            delCityPools.push(c);
            return false
        };
        return true;
    });
    delCityPools.forEach(cp => {
        const index = pools.indexOf(cp[id]);
        (index != -1) && pools.splice(index, 1);
    });
    res.hotPool = pools;
    return res;
}

// 从本地获取数据
const getDDatas = (isHot = false) => {
    return getStorageItem(initId(isHot));
}

/**
 * 通过id获取本地数据树
 * @param {*} datas 源数据
 * @param {*} id id
 * @param {*} key id的key
 * @param {*} justLeaf 是否只需要当前节点以下的所有子节点
 */
const findDatasById = (datas, id, key, justLeaf) => new Promise(resolve => {
    const res = { datas: [] };
    const handleFind = (D) => {
        for (let i = 0; i < D.length; i++) {
            const d = D[i];
            const _id = justLeaf ? d.parentId : d[key];
            if (_id == id) {
                res.datas = justLeaf ? D : [d];
                // console.log(res);
                return resolve(res);
            }
            if (d.children && d.children.length > 0) handleFind(d.children);
        }
        return resolve(res);
    }
    handleFind(datas);
})

//树结构扁平
const treeConvertList = (root) => {
    const list = [];
    root.forEach(r => {
        const Root = JSON.parse(JSON.stringify(r));
        const queue = [];
        queue.push(Root);
        while (queue.length) {
            const node = queue.shift();
            if (node.children && node.children.length) {
                queue.push(...node.children);
            }
            delete node.children;
            if (node.parentId !== null && node.parentId !== undefined) {
                list.push(node);
            }
        }
    })
    return list;
}

// 生成id
const initId = (isHot) => {
    const initId = isHot ? "_ditrictDatas_hot" : "_ditrictDatas";
    return initId;
}

export default class Areaselect extends React.Component {
    _initParentId = false;
    _beforeLoading = false;
    _listLocalData = [];
    _forForm = true;

    fieldNames = {
        label: 'name',
        value: 'id',
    }

    state = {
        options: [],
        loading: false,
        readonlyValue: '',
        areaselectValue: [],
        tooltipValue: ''
    };

    constructor(props) {
        super(props);
        const localData = getDDatas();
        const { refreshData } = this.props;
        if (refreshData || !localData || localData.length <= 0 || !localData.district || localData.district.length <= 0) {
            this._beforeLoading = true;
            getAllDirectDatasFromJson().then(res => {
                const districtDatas = res.districtId;
                _localDistrictsTrees = districtDatas || [];
                this._beforeLoading = false;
                setDDatas({ district: districtDatas });
            }, err => { this._beforeLoading = false });
        } else {
            _localDistrictsTrees = localData.district;
        }
    }

    componentWillMount = () => {
        const { form = false, initvalue, fieldNames = this.fieldNames, initParentId = false, justLeaf = false } = this.props;
        this._forForm = form !== false;
        this.fieldNames = fieldNames;
        initParentId !== false && (this._initParentId = initParentId);
        // if (readonly) return;
        const intFun = () => {
            if (this._beforeLoading) {
                this.setState({ loading: true });
                return intFun;
            };
            this.setState({ loading: false });
            clearInterval(timeInteval);
            this.initDatas(justLeaf, initvalue);

        }
        const timeInteval = setInterval(intFun(), 5);
    }

    onChange = (value, selectedOptions) => {
        const _selectedOptions = selectedOptions.concat();
        const _value = value.concat();
        const res = this.initReturnHotcitys(_value, _selectedOptions);
        if (!this._forForm) { this.setState({ areaselectValue: value }) };
        this.props.onChange && this.props.onChange(res.val, res.obj);
        this.props.addHotCitys && setHotDDatas(_selectedOptions, this.fieldNames.value, this.fieldNames.label);
    }

    initReturnHotcitys = (value, selectedOptions) => {
        let res = { val: [], obj: [] };
        if (selectedOptions && selectedOptions.length == 1 && selectedOptions[0].hotCity) {
            res.obj = selectedOptions[0].intactObj;
            res.val = selectedOptions[0].id.split('.').filter(_ => _ != "").map(i => i * 1);
        } else {
            res = { val: value, obj: selectedOptions };
        };
        if (!this._forForm || res.val.length == 0 || (selectedOptions && selectedOptions.length == 1 && selectedOptions[0].hotCity)) {
            const tooltipValue = lodash.map(res.obj, this.fieldNames.label).join('/');
            this.setState({ tooltipValue: tooltipValue });
        }
        return res;
    }

    setFormValue = (v) => {
        const areaselectValue = this.normalize(v);
        if (this._forForm) {
            const { form, nameKey } = this.props;
            const setV = {};
            setV[nameKey] = v;
            form.setFieldsValue(setV);
        } else {
            this.setState({ areaselectValue });
        }
    }

    getInitValue = (value, justLeaf) => {
        let res = [];
        value = value.filter(_ => _ && _ != -1);
        const returnKey = value[value.length - 1];
        const calcPosition = (_D) => {
            if (!this._initParentId) return 0;
            let i = _D.indexOf(this._initParentId.toString());
            if (i == -1) return 0;
            justLeaf && (i += 1);
            return i;
        }
        const dgs = (data) => {
            for (let i = 0; i < data.length; i++) {
                const _d = data[i];
                if (_d[this.fieldNames.value] == returnKey) {
                    const dA = _d.path.split('.');
                    const start = calcPosition(dA);
                    res = dA.slice(start, dA.length - 1).map(d => d * 1);
                    return res;
                }
                _d.children && dgs(_d.children);
            }
        }
        dgs(_localDistrictsTrees);
        return res;
    }

    getInitValueForRead = (value) => {
        const vL = value.length;
        let res = new Array(vL);
        let nl = 0;
        for (let i = 0; i < this._listLocalData.length; i++) {
            const vi = value.indexOf((this._listLocalData[i])[this.fieldNames.value]);
            if (vi != -1) {
                res[vi] = (this._listLocalData[i])[this.fieldNames.label]
                nl++;
            };
            if (nl == vL) return res.join(' / ');
        }
        return res;
    }

    initDatas = (justLeaf, initvalue) => {
        const _inv = initvalue;
        const hotCitys = this.initHotCity();
        if (this._initParentId) {
            findDatasById(_localDistrictsTrees, this._initParentId, this.fieldNames.value, justLeaf).then(res => {
                const { datas } = res;
                this._listLocalData = treeConvertList(datas);
                this.setState({
                    options: [...hotCitys, ...datas],
                }, () => { _inv && this.setFormValue(_inv) });
            })
        } else {
            this._listLocalData = treeConvertList(_localDistrictsTrees);
            this.setState({
                options: [...hotCitys, ..._localDistrictsTrees],
            }, () => { _inv && this.setFormValue(_inv) });
        }
    }

    initHotCity = () => {
        const { addHotCitys = false } = this.props;
        if (!addHotCitys) return [];
        const hotC = getDDatas(true);
        if (hotC && hotC.hotPool && hotC.hotPool.length > 0) return hotC.district.slice(0, _maxShowHotCity);
        return [];
    }

    _VAL = '';
    _NUM = 0;
    _fltime = 0;
    limit = 50;
    filter = (inputValue, path) => {
        let id = new Date().getTime();
        if (this._fltime != 0 && (id - this._fltime > 100)) {
            this._VAL = ''
        }
        this._fltime = id;
        if (this._VAL == inputValue) {
            if (this._NUM > this.limit) return false;
        } else {
            this._VAL = inputValue;
            this._NUM = 0;
        };
        const _R = path.some(option => (option[this.fieldNames.label]).toLowerCase().indexOf(inputValue.toLowerCase()) > -1) && !path[0].hotCity;
        _R && this._NUM++;
        return _R
    }

    renderFilter = (inputValue, path) => {
        // console.count(inputValue, path);
        return path.map(d => d[this.fieldNames.label]).join(' / ');
        // // let res = [];
        // let result = "";
        // const vl = inputValue.length;
        // // const sameValue = inputValue==inputValue.toLowerCase() ? 
        // const Rr = (v) => "<span style={{ color: 'red' }}>" + v + "</span>";
        // // const Rrl = <span style={{ color: 'red' }}>{inputValue.toLowerCase()}</span>


        // const fillSame = (data) => {
        //     let res = []
        //     let index = data.toLowerCase().indexOf(inputValue.toLowerCase());
        //     while (index > -1) {
        //         res.push(index);
        //         index = data.toLowerCase().indexOf(inputValue.toLowerCase(), index + 1);
        //     }
        //     return res;
        // }
        // path.forEach((p, i) => {
        //     let _V = p[this.fieldNames.label];
        //     // res.unshift(p[this.fieldNames.label].split(/inputValue|inputValue.toLowerCase()/));
        //     // const strArr = fillSame(_V);
        //     let index = _V.toLowerCase().indexOf(inputValue.toLowerCase());
        //     while (index > -1) {
        //         const RA = _V.substr(index, vl);
        //         const _RP = Rr(RA);
        //         _V = _V.replace(RA, _RP);
        //         index = _V.toLowerCase().indexOf(inputValue.toLowerCase(), index + _RP.length + 1);
        //     }
        //     if (path.length == i + 1) return result += _V;
        //     result = result + _V + " / ";
        //     // const ra = p[this.fieldNames.label].split(inputValue);
        //     // const ral = ra.join(Rr).split(inputValue.toLowerCase());
        //     // res.unshift(ral.join(Rrl));
        // });

        // let data = [];
        // path.forEach(p => data.push(p[this.fieldNames.label]));
        // data = data.join(" / ");
        // const uData = data.toLowerCase();
        // const uDataSp = uData.split(inputValue.toLowerCase())
        // uDataSp.forEach(ud => {
        //     const i = data.indexOf(ud);
        //     result = `${result} ${ud} ${<span style={{ color: 'red' }}>{data.substr(ud.length + i - 1, vl)}</span>}`
        // })
        // return result
    }

    normalize = (value, prevValue, allValues) => {
        const { readonly } = this.props;
        if (!value || value.length <= 0) {
            this.setState({ tooltipValue: "" });
            return value;
        };
        const { justLeaf = false } = this.props;
        const res = this.getInitValue(value, justLeaf);
        const readonlyValue = this.getInitValueForRead(res);
        res.length > 0 && this.setState({ tooltipValue: readonlyValue });
        if (readonly && value && value.length > 0) {
            return this.setState({ readonlyValue });
        }
        return res.length > 0 ? res : value;
    }

    getPopupContainer = () => {
        const { loadContentId } = this.props;
        const cardC = document.getElementById(`${loadContentId}`);
        if (cardC) return cardC;
        return document.body
    }

    render() {
        const { form = {}, label, nameKey, disabled, options, placeholder, readonly = false, CascaderOptions = {}, changeOnSelect = false } = this.props;
        const { getFieldDecorator } = form;
        const { loading, readonlyValue, areaselectValue, tooltipValue } = this.state;
        let fieldOptions = { rules: [{ required: true, message: 'required' }], normalize: this.normalize, ...options }

        if (readonly) {
            if (this._forForm) {
                return (
                    <FormItem label={label}>
                        {getFieldDecorator(nameKey, fieldOptions)(<Tooltip title={readonlyValue}><div>{readonlyValue}</div></Tooltip>)}
                    </FormItem>
                )
            } else {
                return <Tooltip title={readonlyValue}><div>{readonlyValue}</div></Tooltip>
            }
        }

        const pholder = placeholder || 'area select';
        return (
            <Spin spinning={loading}>
                {this._forForm ?
                    <FormItem label={label} key={nameKey}>
                        <Tooltip title={tooltipValue} key='toola'>
                            {getFieldDecorator(nameKey, fieldOptions)(
                                <Cascader
                                    style={{ width: '100%' }}
                                    options={this.state.options}
                                    // loadData={this.loadData}
                                    onChange={this.onChange}
                                    fieldNames={this.fieldNames}
                                    placeholder={pholder}
                                    showSearch={{ filter: this.filter, render: this.renderFilter }}
                                    getPopupContainer={this.getPopupContainer}
                                    changeOnSelect={changeOnSelect}
                                    disabled={disabled}
                                    {...CascaderOptions}
                                >
                                </Cascader>
                            )}
                        </Tooltip>
                    </FormItem>
                    : <Tooltip title={tooltipValue}>
                        <Cascader
                            key={nameKey}
                            style={{ width: '100%' }}
                            options={this.state.options}
                            // loadData={this.loadData}
                            onChange={this.onChange}
                            fieldNames={this.fieldNames}
                            placeholder={pholder}
                            showSearch={{ filter: this.filter, render: this.renderFilter }}
                            getPopupContainer={this.getPopupContainer}
                            changeOnSelect={changeOnSelect}
                            disabled={disabled}
                            value={areaselectValue}
                            {...CascaderOptions}
                        >
                        </Cascader>
                    </Tooltip>
                }
            </Spin>
        )
    }
}

