import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { Card } from '../ui/Card';
import { CategoryBreakdown } from '../../types';
import { formatINR } from '../../utils/currency';
import { useTheme } from '../../context/ThemeContext';

interface ExpenseCategoryChartProps {
  data: CategoryBreakdown[];
}

const COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b'];

export const ExpenseCategoryChart: React.FC<ExpenseCategoryChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Card className="flex flex-col">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-900 dark:text-white">Expense Breakdown</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">Distribution across society activities</p>
      </div>

      <div className="h-56 w-full relative">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
            No expenses recorded yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="amount"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [formatINR(val), 'Amount']}
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderRadius: '12px',
                  border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Legend list */}
      <div className="mt-2 space-y-2 max-h-36 overflow-y-auto pr-1">
        {data.map((item, idx) => (
          <div key={item.category} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-slate-700 dark:text-slate-300 truncate font-medium">{item.category}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatINR(item.amount, false)}</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
