import React from "react";
import Areaselect from './components/areaselect/Areaselect'
import { Form } from 'antd';

class FormTable extends React.Component {
    constructor(props) {
        super(props)
    }

    onChange = (values, options) => {
        console.log(values, options)
    };

    render() {
        const { form } = this.props;

        return <Areaselect
            form={form}
            label="select area"
            nameKey="CPCD"
            options={{ rules: [{ required: true }] }}
            justLeaf={false}
            addHotCitys={true}
            onChange={this.onChange}
            disabled={false}
            changeOnSelect={true}
        />
    }

}

export default Form.create()(FormTable);