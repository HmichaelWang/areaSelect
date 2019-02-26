import React, { Component } from 'react';
import { Row, Col } from "antd";
import logo from './logo.svg';
import './App.css';
import Areaselect from "./components/areaselect/Areaselect";
import FormTable from "./formTable";
import 'antd/dist/antd.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <div>
          <Row>
            <Col span={12}>with the state control</Col>
            <Col span={12}>with the Form control</Col>
          </Row>
          <Row>
            <Col span={12}>
              <Areaselect
                form={false}
                label="CPCD"
                nameKey="CPCD"
                options={{ rules: [{ required: false }] }}
                initvalue={['5970']}
                initParentId={'180'}
                justLeaf={false}
                addHotCitys={true}
                onChange={this.onChange}
                disabled={false}
                changeOnSelect={true}
              />
            </Col>
            <Col span={12}>
              <FormTable />
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}

export default App;
