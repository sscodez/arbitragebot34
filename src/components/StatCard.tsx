import React from 'react';
import { StatCardProps } from '@/types/app';

const StatCard: React.FC<StatCardProps> = ({ title, value, description }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-2">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
};

export default StatCard;
