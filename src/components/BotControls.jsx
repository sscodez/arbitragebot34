import React, { useState, useEffect } from 'react';
import { Card, Button, Form, InputNumber, Row, Col, Typography } from 'antd';
import { webSocketService } from '../services/websocket';

const { Title } = Typography;

const BotControls = ({ address, isRunning, onStart, onStop }) => {
  const [minProfit, setMinProfit] = useState(0.1);
  const [maxAmount, setMaxAmount] = useState(1000);

  const handleConfigUpdate = () => {
    webSocketService.updateBotConfig(address, {
      minProfitThreshold: minProfit,
      maxTradeAmount: maxAmount
    });
  };

  return (
    <Card title="Bot Controls" className="mb-4">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={5}>Trading Parameters</Title>
        </Col>
        
        <Col span={12}>
          <Form.Item label="Minimum Profit (%)" tooltip="Minimum profit percentage required to execute a trade">
            <InputNumber
              min={0.01}
              max={100}
              step={0.01}
              value={minProfit}
              onChange={setMinProfit}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item label="Max Trade Amount (USDT)" tooltip="Maximum amount of USDT per trade">
            <InputNumber
              min={1}
              max={100000}
              step={100}
              value={maxAmount}
              onChange={setMaxAmount}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col>
              <Button
                type="primary"
                onClick={() => {
                  handleConfigUpdate();
                  if (!isRunning) onStart();
                }}
                disabled={isRunning}
              >
                Start Bot
              </Button>
            </Col>
            <Col>
              <Button
                type="danger"
                onClick={onStop}
                disabled={!isRunning}
              >
                Stop Bot
              </Button>
            </Col>
            <Col>
              <Button
                type="default"
                onClick={handleConfigUpdate}
                disabled={!isRunning}
              >
                Update Settings
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

export default BotControls;
