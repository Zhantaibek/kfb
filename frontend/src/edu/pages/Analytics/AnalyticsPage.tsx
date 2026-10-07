import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import { PageHeader, Card, Skeleton } from '../../components/ui/Card';
import { statusLabel } from '../../utils';

const COLORS = ['#4eacb9', '#1a6d7a', '#76c3ce', '#0e3339'];

export function AnalyticsPage() {
  const [students, setStudents] = useState<Array<{ month: string; count: number }>>([]);
  const [courses, setCourses] = useState<Array<{ status: string; count: number }>>([]);
  const [revenue, setRevenue] = useState<Array<{ month: string; total: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/students'),
      api.get('/analytics/courses'),
      api.get('/analytics/revenue'),
    ])
      .then(([s, c, r]) => {
        setStudents(s.data.data);
        setCourses(c.data.data.map((x: { status: string; count: number }) => ({ ...x, status: statusLabel(x.status) })));
        setRevenue(r.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div>
      <PageHeader title="Аналитика" description="Студенты, курсы и выручка" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Регистрации студентов</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={students}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4eacb9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Выручка</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#348191" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5 xl:col-span-2">
          <h3 className="mb-4 font-semibold">Курсы по статусам</h3>
          <div className="mx-auto h-72 max-w-md">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={courses} dataKey="count" nameKey="status" outerRadius={110} label>
                  {courses.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
