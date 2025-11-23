import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

type RGBHistogramProps = {
  redData: number[];
  greenData: number[];
  blueData: number[];
};

const RGBHistogram: React.FC<RGBHistogramProps> = ({ redData, greenData, blueData }) => {
  const options = useMemo(() => {
    return {
      chart: {
        backgroundColor: '#2b2b2b',
        height: 120,
        spacing: [5, 5, 5, 5],
      },
      title: { text: '' },
      xAxis: {
        title: { text: '', style: { color: '#fff' } },

        labels: { style: { color: '#fff', fontSize: '5px' } },
        gridLineColor: 'rgba(255,255,255,0.1)',
      },
      yAxis: {
        title: { text: '', style: { color: '#fff' } },
        labels: { style: { color: '#fff', fontSize: '5px' } },
        gridLineColor: 'rgba(255,255,255,0.1)',
      },
      legend: { enabled: false },
      plotOptions: {
        series: { animation: false, marker: { enabled: false } },
      },
      series: [
        { name: 'Red', data: redData, color: '#ff4444', zIndex: 3, lineWidth: 1 },
        { name: 'Green', data: greenData, color: '#44ff44', zIndex: 2, lineWidth: 1 },
        { name: 'Blue', data: blueData, color: '#4444ff', zIndex: 1, lineWidth: 1 },
      ],
      credits: { enabled: false },
      tooltip: { enabled: false },
    };
  }, [redData, greenData, blueData]);

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default RGBHistogram;
