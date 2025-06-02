// src/components/Charts/WeeklyApprovalChart.jsx
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const WeeklyApprovalChart = ({ data }) => {
  // Transform data if needed
  const chartData = data.labels.map((label, index) => ({
    name: label,
    rate: data.datasets[0].data[index],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip 
          formatter={(value) => [`${value}%`, 'Rate']}
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
          iconType="line"
          iconSize={10}
          wrapperStyle={{ 
            paddingBottom: 20,
            fontSize: 12
          }}
        />
        <Line 
          type="monotone" 
          dataKey="rate" 
          stroke="#ff6384" 
          activeDot={{ r: 8 }}
          strokeWidth={2}
          name="Rate"
          dot={{ stroke: '#ff6384', strokeWidth: 2, r: 4, fill: 'white' }}
        />
        <ReferenceLine y={0} stroke="#666" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default WeeklyApprovalChart;