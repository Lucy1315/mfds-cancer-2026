import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { recentApprovals, cancerTypeStats } from '@/data/recentApprovals';
import { useMemo } from 'react';

const ApprovalChart = () => {
  // 월별 데이터 계산
  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {};
    recentApprovals.forEach((drug) => {
      const month = drug.approvalDate.substring(0, 7); // YYYY-MM
      counts[month] = (counts[month] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({
        month: month.replace('2025-', '25년 ').replace('2026-', '26년 ').replace('-', '월'),
        count,
      }));
  }, []);

  // 암종별 파이차트 데이터
  const pieData = useMemo(() => {
    return Object.entries(cancerTypeStats).map(([name, value]) => ({
      name,
      value,
    }));
  }, []);

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(210, 70%, 50%)',
    'hsl(180, 60%, 45%)',
    'hsl(150, 50%, 40%)',
  ];

  return (
    <div className="space-y-6">
      {/* 월별 승인 추이 */}
      <div className="stat-card animate-fade-in">
        <h3 className="text-lg font-semibold text-foreground mb-4">월별 항암제 승인 현황</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                formatter={(value: number) => [`${value}건`, '승인 건수']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {monthlyData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === monthlyData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 암종별 분포 */}
      <div className="stat-card animate-fade-in">
        <h3 className="text-lg font-semibold text-foreground mb-4">암종별 분포</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name} (${value})`}
                labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}건`, '승인 건수']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ApprovalChart;
