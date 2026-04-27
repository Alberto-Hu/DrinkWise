import { Download, Calendar, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useHydration } from '../context/HydrationContext';

export function HistoryPage() {
  const { consumed, dailyGoal, events } = useHydration();

  const percentage = Math.min(100, Math.round((consumed / dailyGoal) * 100));
  const todayStr = new Date().toLocaleDateString('es-ES');

  const historyData = [
    { date: todayStr, consumption: `${consumed}ml`, goal: `${dailyGoal}ml`, percentage: percentage, events: events.length },
    { date: '22/03/2026', consumption: '1800ml', goal: '2000ml', percentage: 90, events: 24 },
    { date: '21/03/2026', consumption: '1600ml', goal: '2000ml', percentage: 80, events: 18 },
    { date: '20/03/2026', consumption: '2100ml', goal: '2000ml', percentage: 105, events: 28 },
    { date: '19/03/2026', consumption: '1500ml', goal: '2000ml', percentage: 75, events: 16 },
    { date: '18/03/2026', consumption: '1900ml', goal: '2000ml', percentage: 95, events: 22 },
    { date: '17/03/2026', consumption: '1700ml', goal: '2000ml', percentage: 85, events: 20 },
  ];

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl">Historial</h1>
          <div className="flex gap-3">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Rango de Fechas
            </Button>
            <Button className="bg-gray-900 hover:bg-gray-800">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium">Fecha</th>
                  <th className="text-left py-4 px-6 font-medium">Consumo</th>
                  <th className="text-left py-4 px-6 font-medium">Meta</th>
                  <th className="text-left py-4 px-6 font-medium">% Logrado</th>
                  <th className="text-left py-4 px-6 font-medium">Eventos</th>
                  <th className="text-right py-4 px-6 font-medium">Progreso</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((day, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">{day.date}</td>
                    <td className="py-4 px-6 font-medium">{day.consumption}</td>
                    <td className="py-4 px-6 text-gray-600">{day.goal}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                          day.percentage >= 100
                            ? 'bg-green-100 text-green-800'
                            : day.percentage >= 75
                            ? 'bg-blue-100 text-blue-800'
                            : day.percentage >= 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {day.percentage}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{day.events}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              day.percentage >= 100
                                ? 'bg-green-500'
                                : day.percentage >= 75
                                ? 'bg-blue-500'
                                : day.percentage >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(day.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button variant="outline">Cargar más resultados</Button>
        </div>
      </div>
    </div>
  );
}
