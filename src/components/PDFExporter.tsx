"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PDFExporterProps {
  clientName: string;
  progressData: any[];
  onExport: () => void;
  isLoading?: boolean;
  siteName?: string;
}

export function PDFExporter({ clientName, progressData, onExport, isLoading = false, siteName = "Demo" }: PDFExporterProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingCharts, setIsDownloadingCharts] = useState(false);
  const [Chart, setChart] = useState<any>(null);
  
  // Carica Chart.js dinamicamente
  useEffect(() => {
    const loadChart = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Importa Chart.js con tutti i componenti necessari
          const ChartJS = await import('chart.js/auto');
          setChart(() => ChartJS.Chart);
        } catch (error) {
          console.error('Errore caricamento Chart.js:', error);
        }
      }
    };
    loadChart();
  }, []);

  const generateChartImage = async (chartConfig: any, width: number = 800, height: number = 400): Promise<string> => {
    if (!Chart) throw new Error('Chart.js non caricato');
    
    // Crea canvas temporaneo
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.backgroundColor = '#ffffff';
    
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Crea il grafico
    const chart = new Chart(ctx, {
      ...chartConfig,
      options: {
        ...chartConfig.options,
        responsive: false,
        animation: false,
        plugins: {
          ...chartConfig.options?.plugins,
          legend: {
            ...chartConfig.options?.plugins?.legend,
            display: chartConfig.options?.plugins?.legend?.display !== false
          }
        }
      }
    });
    
    // Attendi il rendering
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Estrai come JPEG con sfondo bianco
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    // Cleanup
    chart.destroy();
    
    return imageData;
  };

  const downloadChartImages = async () => {
    if (!Chart) {
      alert('Chart.js non ancora caricato, riprova tra qualche secondo');
      return;
    }
    
    setIsDownloadingCharts(true);
    try {
      // Prepara dati per i grafici
      const labels = progressData.map(entry => new Date(entry.date).toLocaleDateString('it-IT'));
      const weightData = progressData.map(entry => entry.weight || null);
      const bodyFatData = progressData.map(entry => entry.bodyFat || null);
      const muscleData = progressData.map(entry => entry.muscleMass || null);
      const waistData = progressData.map(entry => entry.measurements?.waist || null);
      const chestData = progressData.map(entry => entry.measurements?.chest || null);
      const hipData = progressData.map(entry => entry.measurements?.hipCircumference || null);

      const chartConfigs = [
        {
          name: 'andamento-peso',
          title: 'Andamento Peso',
          config: {
            type: 'line',
            data: {
              labels,
              datasets: [{
                label: 'Peso (kg)',
                data: weightData,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.2,
                fill: true,
                pointRadius: 4,
                borderWidth: 3
              }]
            },
            options: {
              plugins: { 
                legend: { display: false },
                title: {
                  display: true,
                  text: `Andamento Peso - ${clientName}`,
                  font: { size: 16, weight: 'bold' }
                }
              },
              scales: { 
                y: { beginAtZero: false },
                x: { 
                  ticks: { maxTicksLimit: 8 },
                  grid: { display: true }
                }
              }
            }
          }
        },
        {
          name: 'massa-grassa',
          title: 'Massa Grassa',
          config: {
            type: 'line',
            data: {
              labels,
              datasets: [{
                label: 'Massa Grassa (%)',
                data: bodyFatData,
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.2,
                fill: true,
                pointRadius: 4,
                borderWidth: 3
              }]
            },
            options: {
              plugins: { 
                legend: { display: false },
                title: {
                  display: true,
                  text: `Massa Grassa - ${clientName}`,
                  font: { size: 16, weight: 'bold' }
                }
              },
              scales: { 
                y: { beginAtZero: false },
                x: { 
                  ticks: { maxTicksLimit: 8 },
                  grid: { display: true }
                }
              }
            }
          }
        },
        {
          name: 'massa-muscolare',
          title: 'Massa Muscolare',
          config: {
            type: 'line',
            data: {
              labels,
              datasets: [{
                label: 'Massa Muscolare (kg)',
                data: muscleData,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.2,
                fill: true,
                pointRadius: 4,
                borderWidth: 3
              }]
            },
            options: {
              plugins: { 
                legend: { display: false },
                title: {
                  display: true,
                  text: `Massa Muscolare - ${clientName}`,
                  font: { size: 16, weight: 'bold' }
                }
              },
              scales: { 
                y: { beginAtZero: false },
                x: { 
                  ticks: { maxTicksLimit: 8 },
                  grid: { display: true }
                }
              }
            }
          }
        },
        {
          name: 'misurazioni-corporee',
          title: 'Misurazioni Corporee',
          config: {
            type: 'line',
            data: {
              labels,
              datasets: [
                {
                  label: 'Vita (cm)',
                  data: waistData,
                  borderColor: '#8B5CF6',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  tension: 0.2,
                  pointRadius: 4,
                  borderWidth: 3
                },
                {
                  label: 'Petto (cm)',
                  data: chestData,
                  borderColor: '#F59E0B',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  tension: 0.2,
                  pointRadius: 4,
                  borderWidth: 3
                },
                {
                  label: 'Fianchi (cm)',
                  data: hipData,
                  borderColor: '#06B6D4',
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  tension: 0.2,
                  pointRadius: 4,
                  borderWidth: 3
                }
              ]
            },
            options: {
              plugins: { 
                legend: { 
                  display: true, 
                  position: 'bottom',
                  labels: { padding: 20, font: { size: 12 } }
                },
                title: {
                  display: true,
                  text: `Misurazioni Corporee - ${clientName}`,
                  font: { size: 16, weight: 'bold' }
                }
              },
              scales: { 
                y: { beginAtZero: false },
                x: { 
                  ticks: { maxTicksLimit: 8 },
                  grid: { display: true }
                }
              }
            }
          }
        }
      ];

      // Genera e scarica ogni grafico
      for (const chartConfig of chartConfigs) {
        const imageData = await generateChartImage(chartConfig.config, 1200, 600);
        
        // Crea link di download
        const link = document.createElement('a');
        link.download = `grafico-${chartConfig.name}-${clientName.replace(/\s+/g, '-').toLowerCase()}.jpg`;
        link.href = imageData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Piccola pausa tra i download
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setIsDownloadingCharts(false);
    } catch (error) {
      console.error('Errore download grafici:', error);
      setIsDownloadingCharts(false);
    }
  };
  
  const handleExport = async () => {
    setIsGenerating(true);
    try {
      // PDF semplificato per massima compatibilità
      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: 'a4',
        compress: true 
      });
      
      // Metadati PDF per compatibilità
      pdf.setProperties({
        title: `Report Progressi - ${clientName}`,
        subject: 'Report progressi cliente',
        author: siteName,
        creator: 'PDF Generator',
        keywords: 'nutrition, progress, report'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const usableWidth = pageWidth - (margin * 2);
      let currentY = margin;

      // Header semplice
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Report Progressi Cliente', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generato il ${new Date().toLocaleDateString('it-IT')} - ${siteName}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;

      // Linea separatrice
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      // Info cliente
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Informazioni Cliente', margin, currentY);
      currentY += 10;

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Nome: ${clientName}`, margin, currentY);
      currentY += 7;
      pdf.text(`Data Report: ${new Date().toLocaleDateString('it-IT')}`, margin, currentY);
      currentY += 7;
      pdf.text(`Progressi Registrati: ${progressData.length}`, margin, currentY);
      currentY += 15;

      // Tabella dati semplificata
      if (progressData.length > 0) {
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Storico Progressi', margin, currentY);
        currentY += 10;

        // Header tabella
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Data', margin, currentY);
        pdf.text('Peso (kg)', margin + 25, currentY);
        pdf.text('Massa Grassa (%)', margin + 50, currentY);
        pdf.text('Massa Muscolare (kg)', margin + 80, currentY);
        pdf.text('Vita (cm)', margin + 115, currentY);
        currentY += 8;

        // Linea sotto header
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 5;

        // Righe dati (max 12 per evitare overflow)
        const maxRows = Math.min(12, progressData.length);
        for (let i = 0; i < maxRows; i++) {
          const entry = progressData[i];
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          
          // Gestisce overflow di testo
          const dateStr = new Date(entry.date).toLocaleDateString('it-IT');
          const weightStr = entry.weight?.toString() || '-';
          const fatStr = entry.bodyFat?.toString() || '-';
          const muscleStr = entry.muscleMass?.toString() || '-';
          const waistStr = entry.measurements?.waist?.toString() || '-';
          
          pdf.text(dateStr, margin, currentY);
          pdf.text(weightStr, margin + 25, currentY);
          pdf.text(fatStr, margin + 50, currentY);
          pdf.text(muscleStr, margin + 80, currentY);
          pdf.text(waistStr, margin + 115, currentY);
          currentY += 6;
        }
        currentY += 10;
      }

      // Nota sui grafici
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Grafici Progressi', margin, currentY);
      currentY += 8;
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text('I grafici sono disponibili come immagini JPEG separate.', margin, currentY);
      currentY += 5;
      pdf.text('Utilizza il pulsante "Scarica Grafici" per ottenerli.', margin, currentY);
      currentY += 15;

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Report generato automaticamente da ${siteName}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
      pdf.text('Formato PDF/A per massima compatibilità', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Salva PDF
      pdf.save(`report-progressi-${clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      
      setIsGenerating(false);
      onExport?.();
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGenerating(false);
    }
  };


  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={handleExport}
        disabled={isLoading || isGenerating}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        {isGenerating ? '⏳ Generando PDF...' : '📄 Export PDF'}
      </Button>
      
      <Button
        onClick={downloadChartImages}
        disabled={isLoading || isDownloadingCharts || !Chart}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isDownloadingCharts ? '⏳ Scaricando Grafici...' : '📊 Scarica Grafici'}
      </Button>
    </div>
  );
}
