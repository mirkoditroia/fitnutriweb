"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface ProgressEntry {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  notes?: string;
  photos?: string[];
}

interface ClientProgressCardProps {
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    notes: string;
    createdAt: string;
  };
  onSave: (clientId: string, progressEntry: Omit<ProgressEntry, 'id'>) => Promise<void>;
  onExportPDF: (clientId: string) => Promise<void>;
}

export function ClientProgressCard({ client, onSave, onExportPDF }: ClientProgressCardProps) {
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [newProgress, setNewProgress] = useState<Omit<ProgressEntry, 'id'>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: undefined,
    bodyFat: undefined,
    muscleMass: undefined,
    measurements: {},
    notes: '',
    photos: []
  });

  const handleSaveProgress = async () => {
    try {
      await onSave(client.id, newProgress);
      setIsAddingProgress(false);
      setNewProgress({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: undefined,
        bodyFat: undefined,
        muscleMass: undefined,
        measurements: {},
        notes: '',
        photos: []
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Attivo';
      case 'inactive': return 'Inattivo';
      case 'prospect': return 'Prospect';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{client.name}</h3>
            <p className="text-sm text-gray-600">{client.email}</p>
            <p className="text-sm text-gray-600">{client.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
            {getStatusText(client.status)}
          </span>
          <Button
            onClick={() => onExportPDF(client.id)}
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            📊 Export PDF
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Cliente dal</div>
          <div className="text-lg font-semibold text-gray-900">
            {format(new Date(client.createdAt), 'dd MMM yyyy', { locale: it })}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Ultimo aggiornamento</div>
          <div className="text-lg font-semibold text-gray-900">-</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Progressi registrati</div>
          <div className="text-lg font-semibold text-gray-900">0</div>
        </div>
      </div>

      {/* Progress Tracking */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">📈 Storico Progressi</h4>
          <Button
            onClick={() => setIsAddingProgress(!isAddingProgress)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAddingProgress ? 'Annulla' : '+ Nuovo Progresso'}
          </Button>
        </div>

        {/* Add Progress Form */}
        {isAddingProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h5 className="font-medium text-blue-900 mb-3">Aggiungi Nuovo Progresso</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <Input
                  type="date"
                  value={newProgress.date}
                  onChange={(e) => setNewProgress(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="es. 70.5"
                  value={newProgress.weight || ''}
                  onChange={(e) => setNewProgress(prev => ({ ...prev, weight: e.target.value ? parseFloat(e.target.value) : undefined }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Massa Grassa (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="es. 15.2"
                  value={newProgress.bodyFat || ''}
                  onChange={(e) => setNewProgress(prev => ({ ...prev, bodyFat: e.target.value ? parseFloat(e.target.value) : undefined }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Massa Muscolare (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="es. 35.8"
                  value={newProgress.muscleMass || ''}
                  onChange={(e) => setNewProgress(prev => ({ ...prev, muscleMass: e.target.value ? parseFloat(e.target.value) : undefined }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vita (cm)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="es. 85.0"
                  value={newProgress.measurements?.waist || ''}
                  onChange={(e) => setNewProgress(prev => ({ 
                    ...prev, 
                    measurements: { 
                      ...prev.measurements, 
                      waist: e.target.value ? parseFloat(e.target.value) : undefined 
                    } 
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Petto (cm)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="es. 95.0"
                  value={newProgress.measurements?.chest || ''}
                  onChange={(e) => setNewProgress(prev => ({ 
                    ...prev, 
                    measurements: { 
                      ...prev.measurements, 
                      chest: e.target.value ? parseFloat(e.target.value) : undefined 
                    } 
                  }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Note aggiuntive sui progressi..."
                value={newProgress.notes || ''}
                onChange={(e) => setNewProgress(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSaveProgress} className="bg-green-600 hover:bg-green-700">
                💾 Salva Progresso
              </Button>
              <Button 
                onClick={() => setIsAddingProgress(false)} 
                variant="outline"
              >
                Annulla
              </Button>
            </div>
          </div>
        )}

        {/* Progress History */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-center py-8">
            📊 Nessun progresso registrato ancora. Aggiungi il primo per iniziare a tracciare i risultati!
          </p>
        </div>
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">📝 Note Cliente</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700">{client.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
