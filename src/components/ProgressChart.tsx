"use client";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ProgressData {
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
}

interface ProgressChartProps {
  data: ProgressData[];
  type: 'weight' | 'bodyFat' | 'muscleMass' | 'measurements';
  onExportPDF: () => void;
}

export function ProgressChart({ data, type, onExportPDF }: ProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Chart dimensions
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = canvas.offsetWidth - margin.left - margin.right;
    const height = canvas.offsetHeight - margin.top - margin.bottom;

    // Prepare data
    const sortedData = data
      .filter(d => {
        switch (type) {
          case 'weight': return d.weight !== undefined;
          case 'bodyFat': return d.bodyFat !== undefined;
          case 'muscleMass': return d.muscleMass !== undefined;
          case 'measurements': return d.measurements && (d.measurements.waist || d.measurements.chest);
          default: return false;
        }
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedData.length === 0) {
      // Draw "No data" message
      ctx.fillStyle = '#6B7280';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Nessun dato disponibile', canvas.offsetWidth / 2, canvas.offsetHeight / 2);
      return;
    }

    // Get values for the selected type
    const values = sortedData.map(d => {
      switch (type) {
        case 'weight': return d.weight!;
        case 'bodyFat': return d.bodyFat!;
        case 'muscleMass': return d.muscleMass!;
        case 'measurements': return d.measurements?.waist || d.measurements?.chest || 0;
        default: return 0;
      }
    });

    // Calculate scales
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;
    const padding = valueRange * 0.1;

    const xScale = (index: number) => margin.left + (index / (sortedData.length - 1)) * width;
    const yScale = (value: number) => margin.top + height - ((value - minValue + padding) / (valueRange + padding * 2)) * height;

    // Draw axes
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + height);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + height);
    ctx.lineTo(margin.left + width, margin.top + height);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 0.5;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + width, y);
      ctx.stroke();
    }

    // Draw line chart
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    sortedData.forEach((d, index) => {
      const x = xScale(index);
      const y = yScale(values[index]);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#3B82F6';
    sortedData.forEach((d, index) => {
      const x = xScale(index);
      const y = yScale(values[index]);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (maxValue - minValue) * (1 - i / 5);
      const y = margin.top + (i / 5) * height;
      ctx.fillText(value.toFixed(1), margin.left - 10, y + 4);
    }

    // X-axis labels (dates)
    sortedData.forEach((d, index) => {
      if (index % Math.ceil(sortedData.length / 5) === 0) {
        const x = xScale(index);
        const date = new Date(d.date);
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
        ctx.fillText(dateStr, x, margin.top + height + 20);
      }
    });

    // Chart title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    const title = getChartTitle(type);
    ctx.fillText(title, canvas.offsetWidth / 2, 20);

  }, [data, type]);

  const getChartTitle = (type: string) => {
    switch (type) {
      case 'weight': return 'Andamento Peso (kg)';
      case 'bodyFat': return 'Massa Grassa (%)';
      case 'muscleMass': return 'Massa Muscolare (kg)';
      case 'measurements': return 'Misure Corporee (cm)';
      default: return 'Grafico Progressi';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{getChartTitle(type)}</h3>
        <Button
          onClick={onExportPDF}
          size="sm"
          className="bg-red-600 hover:bg-red-700"
        >
          📄 Export PDF
        </Button>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-64 border border-gray-200 rounded-lg"
          style={{ maxHeight: '400px' }}
        />
        
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-600">Nessun dato disponibile</p>
              <p className="text-sm text-gray-500">Aggiungi progressi per visualizzare il grafico</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
