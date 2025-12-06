import { Card, Col, Descriptions, Divider, Row, Statistic, theme } from 'antd';
import {
  FileTextOutlined,
  LineChartOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import React from 'react';
import { FormatBandWidth, FormatBytes } from '../utils/helpers';

interface StatsSidebarProps {
  type: string;
  resolution: string;
  bandwidth: number;
  totalData: number;
  bufferLength: number;
  droppedFrames: number;
  codec: string;
  audio: string;
  fps: string;
  fragDuration: number;
}

const StatsSidebar: React.FC<StatsSidebarProps> = ({
  type,
  resolution,
  bandwidth,
  totalData,
  bufferLength,
  droppedFrames,
  codec,
  audio,
  fps,
  fragDuration,
}) => {
  const { token } = theme.useToken();

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card className="stats-card">
            <Statistic
              title="Protocol"
              value={type}
              prefix={<VideoCameraOutlined />}
              valueStyle={{ color: token.colorPrimary }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="stats-card">
            <Statistic
              title="Resolution"
              value={resolution || 'N/A'}
              prefix={<PictureOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="stats-card">
            <Statistic
              title="Bandwidth"
              value={FormatBandWidth(bandwidth)}
              prefix={<LineChartOutlined />}
              valueStyle={{ fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="stats-card">
            <Statistic
              title="Total Data"
              value={FormatBytes(totalData)}
              prefix={<FileTextOutlined />}
              valueStyle={{ fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="stats-card">
            <Statistic
              title="Buffer Health"
              value={bufferLength}
              precision={2}
              suffix="sec"
              valueStyle={{ color: bufferLength < 5 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="stats-card">
            <Statistic
              title="Dropped Frames"
              value={droppedFrames}
              valueStyle={{ color: droppedFrames > 0 ? '#cf1322' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">Stream Details</Divider>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Codec">{codec || 'Unknown'}</Descriptions.Item>
        <Descriptions.Item label="Audio">{audio || 'Unknown'}</Descriptions.Item>
        <Descriptions.Item label="FPS">{fps || 'Unknown'}</Descriptions.Item>
        <Descriptions.Item label="Frag Duration">
          {fragDuration ? `${fragDuration.toFixed(3)}s` : 'N/A'}
        </Descriptions.Item>
      </Descriptions>
    </>
  );
};

export default StatsSidebar;
