import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Card } from 'antd';

interface BitrateChartProps {
  data: { timestamp: number; bitrate: number }[];
}

const BitrateChart: React.FC<BitrateChartProps> = ({ data }) => {
  const options: Highcharts.Options = {
    title: {
      text: 'Real-time Bitrate',
    },
    xAxis: {
      type: 'datetime',
      title: {
        text: 'Time',
      },
    },
    yAxis: {
      title: {
        text: 'Bitrate (bps)',
      },
      min: 0,
    },
    series: [
      {
        type: 'area',
        name: 'Bitrate',
        data: data.map((d) => [d.timestamp, d.bitrate]),
        color: '#1890ff',
        fillOpacity: 0.3,
      },
    ],
    credits: {
      enabled: false,
    },
    time: {
      // useUTC: false,
    },
    chart: {
      height: 300,
    },
  };

  return (
    <div style={{ width: '100%' }}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

export default BitrateChart;
