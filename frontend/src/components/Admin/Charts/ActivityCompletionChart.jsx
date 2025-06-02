// src/components/Charts/ActivityCompletionChart.jsx
import React from 'react';
import { Bar } from 'recharts';
import { 
  ComposedChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';

const ActivityCompletionChart = ({ data }) => {
  // Transform data if needed
  const chartData = data.labels.map((label, index) => ({
    name: label,
    Completed: data.datasets[0].data[index],
    Pending: data.datasets[1].data[index],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          domain={[0, 'dataMax + 10']}
          ticks={[0, 25, 50, 75, 100]}
        />
        <Tooltip 
          formatter={(value) => [`${value}`, '']}
          labelFormatter={(label) => `${label}`}
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 12
          }}
        />
        <Legend 
          verticalAlign="top" 
          align="center"
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ 
            paddingBottom: 20,
            fontSize: 12
          }}
        />
        <Bar 
          dataKey="Completed" 
          fill="#26c485" 
          barSize={30} 
          radius={[4, 4, 0, 0]}
          name="Completed"
        />
        <Bar 
          dataKey="Pending" 
          fill="#ffc107" 
          barSize={30} 
          radius={[4, 4, 0, 0]}
          name="Pending"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default ActivityCompletionChart;