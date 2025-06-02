// src/components/Charts/UserRegistrationChart.jsx
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const UserRegistrationChart = ({ data }) => {
  // Transform data from datasets to recharts format
  const chartData = data.labels.map((label, index) => {
    const entry = { name: label };
    
    // Add each dataset as a property
    data.datasets.forEach(dataset => {
      entry[dataset.label] = dataset.data[index];
    });
    
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          domain={[0, 'dataMax + 20']}
        />
        <Tooltip 
          formatter={(value, name) => [value, name]}
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
          dataKey="Teachers" 
          fill="#7e57c2" 
          barSize={15} 
          radius={[2, 2, 0, 0]} 
        />
        <Bar 
          dataKey="Parents" 
          fill="#4fc3f7" 
          barSize={15} 
          radius={[2, 2, 0, 0]} 
        />
        <Bar 
          dataKey="Students" 
          fill="#ffa726" 
          barSize={15} 
          radius={[2, 2, 0, 0]} 
        />
        <Bar 
          dataKey="Others" 
          fill="#ef5350" 
          barSize={15} 
          radius={[2, 2, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default UserRegistrationChart;