"use client";
import { useState, useEffect } from "react";
import { getPaletteConfig } from "@/lib/palettes";

interface BMICalculatorProps {
  title?: string;
  subtitle?: string;
  colorPalette?: string;
}

// Classificazioni BMI standard WHO
const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { category: "Sottopeso", color: "#3B82F6", description: "Peso insufficiente" };
  if (bmi < 25) return { category: "Normale", color: "#10B981", description: "Peso ideale" };
  if (bmi < 30) return { category: "Sovrappeso", color: "#F59E0B", description: "Peso eccessivo" };
  return { category: "Obesità", color: "#EF4444", description: "Consultare un medico" };
};

export default function BMICalculator({ 
  title = "📊 Calcola il tuo BMI", 
  subtitle = "Scopri il tuo Indice di Massa Corporea",
  colorPalette = "gz-default" 
}: BMICalculatorProps) {
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<any>(null);

  // Ottieni colori della palette
  const paletteConfig = getPaletteConfig(colorPalette);
  const primary = paletteConfig?.primary || "#0B5E0B";
  const accent = paletteConfig?.accent || "#00D084";

  // Calcola BMI in tempo reale
  useEffect(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // Converti cm in metri

    if (w > 0 && h > 0) {
      const calculatedBMI = w / (h * h);
      setBmi(Math.round(calculatedBMI * 10) / 10);
      setCategory(getBMICategory(calculatedBMI));
    } else {
      setBmi(null);
      setCategory(null);
    }
  }, [weight, height]);

  // Indicatore visuale BMI
  const BMIIndicator = () => {
    if (!bmi) return null;

    // Calcola posizione dell'indicatore (0-100%)
    const getIndicatorPosition = () => {
      if (bmi < 15) return 0;
      if (bmi > 40) return 100;
      return ((bmi - 15) / 25) * 100; // Range 15-40 BMI = 0-100%
    };

    return (
      <div className="mt-6">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>15</span>
          <span>25</span>
          <span>30</span>
          <span>40</span>
        </div>
        
        {/* Barra colorata BMI */}
        <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-400">
          {/* Indicatore posizione */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white border-2 border-gray-800 rounded-full transform -translate-x-1/2 transition-all duration-500"
            style={{ left: `${getIndicatorPosition()}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Sottopeso</span>
          <span>Normale</span>
          <span>Sovrappeso</span>
          <span>Obesità</span>
        </div>
      </div>
    );
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Calcolatore */}
        <div className="max-w-2xl mx-auto">
          <div 
            className="bg-white rounded-2xl shadow-xl p-8 border-t-4"
            style={{ borderTopColor: primary }}
          >
            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Peso */}
              <div className="space-y-2">
                <label htmlFor="weight" className="block text-sm font-semibold text-gray-700">
                  ⚖️ Peso (kg)
                </label>
                <div className="relative">
                  <input
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                    min="20"
                    max="300"
                    step="0.1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-lg font-medium text-center"
                    style={{ 
                      borderColor: weight ? primary : '#E5E7EB',
                      '--tw-ring-color': primary + '33'
                    } as any}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                    kg
                  </div>
                </div>
              </div>

              {/* Altezza */}
              <div className="space-y-2">
                <label htmlFor="height" className="block text-sm font-semibold text-gray-700">
                  📏 Altezza (cm)
                </label>
                <div className="relative">
                  <input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="170"
                    min="100"
                    max="250"
                    step="1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-lg font-medium text-center"
                    style={{ 
                      borderColor: height ? primary : '#E5E7EB',
                      '--tw-ring-color': primary + '33'
                    } as any}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                    cm
                  </div>
                </div>
              </div>
            </div>

            {/* Risultato BMI */}
            {bmi && category && (
              <div className="text-center">
                {/* Valore BMI */}
                <div 
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full text-white text-2xl font-bold mb-4 shadow-lg"
                  style={{ backgroundColor: category.color }}
                >
                  {bmi}
                </div>

                {/* Categoria */}
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {category.category}
                </h3>
                <p className="text-gray-600 mb-6">
                  {category.description}
                </p>

                {/* Indicatore visuale */}
                <BMIIndicator />

                {/* Nota disclaimer */}
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800">
                    <strong>⚠️ Nota:</strong> Il BMI è un indicatore generale. Per una valutazione 
                    completa della tua salute, consulta sempre un professionista qualificato.
                  </p>
                </div>
              </div>
            )}

            {/* Placeholder quando non ci sono valori */}
            {!bmi && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🤔</div>
                <p className="text-gray-500">
                  Inserisci peso e altezza per calcolare il tuo BMI
                </p>
              </div>
            )}
          </div>

          {/* Informazioni aggiuntive */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="w-4 h-4 bg-blue-400 rounded mx-auto mb-2"></div>
              <div className="text-xs font-semibold text-gray-600">Sottopeso</div>
              <div className="text-xs text-gray-500">&lt; 18.5</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="w-4 h-4 bg-green-400 rounded mx-auto mb-2"></div>
              <div className="text-xs font-semibold text-gray-600">Normale</div>
              <div className="text-xs text-gray-500">18.5 - 24.9</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="w-4 h-4 bg-yellow-400 rounded mx-auto mb-2"></div>
              <div className="text-xs font-semibold text-gray-600">Sovrappeso</div>
              <div className="text-xs text-gray-500">25 - 29.9</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="w-4 h-4 bg-red-400 rounded mx-auto mb-2"></div>
              <div className="text-xs font-semibold text-gray-600">Obesità</div>
              <div className="text-xs text-gray-500">&gt; 30</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
