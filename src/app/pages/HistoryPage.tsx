import { useState, useEffect } from 'react';
import { Download, Calendar, Filter, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useHydration } from '../context/HydrationContext';

type DayRecord = {
  date: string;
  consumed_ml: number;
  goal_ml: number;
};

type FilterMode = 'all' | '7d' | '30d';

export function HistoryPage() {
  const { user } = useAuth();
  const { consumed, dailyGoal, events } = useHydration();
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      setLoading(true);
      let query = supabase
        .from('daily_hydration')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (filter === '7d') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        query = query.gte('date', d.toISOString().split('T')[0]);
      } else if (filter === '30d') {
        const d = new Date(); d.setDate(d.getDate() - 30);
        query = query.gte('date', d.toISOString().split('T')[0]);
      }

      const { data } = await query;
      if (data) setRecords(data);
      setLoading(false);
    };
    loadHistory();
  }, [user, filter]);

  const percentage = (c: number, g: number) => Math.min(105, Math.round((c / g) * 100));

  const exportCSV = () => {
    const header = 'Fecha,Consumo (ml),Meta (ml),% Logrado\n';
    const rows = records.map(r =>
      `${r.date},${r.consumed_ml},${r.goal_ml},${percentage(r.consumed_ml, r.goal_ml)}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drinkwise_historial_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterLabel: Record<FilterMode, string> = {
    all: 'Todos',
    '7d': 'Últimos 7 días',
    '30d': 'Últimos 30 días',
  };

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl">Historial</h1>
          <div className="flex gap-3">
            {/* Filter Dropdown */}
            <div className="relative flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {(['all', '7d', '30d'] as FilterMode[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {filterLabel[f]}
                </button>
              ))}
            </div>
            <Button onClick={exportCSV} className="bg-gray-900 hover:bg-gray-800 text-white">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Cargando historial...</div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No hay datos para el rango seleccionado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium">Fecha</th>
                    <th className="text-left py-4 px-6 font-medium">Consumo</th>
                    <th className="text-left py-4 px-6 font-medium">Meta</th>
                    <th className="text-left py-4 px-6 font-medium">% Logrado</th>
                    <th className="text-right py-4 px-6 font-medium">Progreso</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((day, idx) => {
                    const pct = percentage(day.consumed_ml, day.goal_ml);
                    const color = pct >= 100 ? 'green' : pct >= 75 ? 'blue' : pct >= 50 ? 'yellow' : 'red';
                    const badge: Record<string, string> = {
                      green: 'bg-green-100 text-green-800',
                      blue: 'bg-blue-100 text-blue-800',
                      yellow: 'bg-yellow-100 text-yellow-800',
                      red: 'bg-red-100 text-red-800',
                    };
                    const bar: Record<string, string> = {
                      green: 'bg-green-500',
                      blue: 'bg-blue-500',
                      yellow: 'bg-yellow-500',
                      red: 'bg-red-500',
                    };
                    return (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">{day.date}</td>
                        <td className="py-4 px-6 font-medium">{day.consumed_ml}ml</td>
                        <td className="py-4 px-6 text-gray-600">{day.goal_ml}ml</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${badge[color]}`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3 justify-end">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${bar[color]}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {records.length > 0 && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Mostrando {records.length} {records.length === 1 ? 'día' : 'días'} · {filterLabel[filter]}
          </p>
        )}
      </div>
    </div>
  );
}
