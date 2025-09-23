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

// Colori fissi GZ default per la barra BMI (non influenzati dalla palette tema)
const BMI_COLORS = {
  underweight: "#3B82F6", // blue-500
  normal: "#10B981",     // emerald-500
  overweight: "#F59E0B", // amber-500
  obesity: "#EF4444",    // red-500
} as const;

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
  const secondaryBg = paletteConfig?.secondaryBg || "#F8FAFC";
  const border = paletteConfig?.border || "#E2E8F0";

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
        
        {/* Barra colorata BMI - colori fissi GZ */}
        <div className="relative h-4 rounded-full overflow-hidden" style={{ background: `linear-gradient(to right, ${BMI_COLORS.underweight} 0%, ${BMI_COLORS.normal} 40%, ${BMI_COLORS.overweight} 70%, ${BMI_COLORS.obesity} 100%)` }}>
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
    <section 
      id="bmi-calculator" 
      className="py-16 px-4"
      // Lo sfondo del contenitore resta sempre bianco, indipendente dalla palette
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: paletteConfig?.foreground || '#1F2937' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p 
              className="text-lg max-w-2xl mx-auto"
              style={{ color: paletteConfig?.secondaryText || '#6B7280' }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Calcolatore */}
        <div className="max-w-2xl mx-auto">
          <div 
            className="rounded-2xl p-8 border-t-4"
            style={{ 
              backgroundColor: paletteConfig?.card || '#FFFFFF',
              borderTopColor: primary,
              border: `1px solid ${border}`,
              borderTopWidth: '4px',
              // Ombra in tinta con la palette
              boxShadow: `0 10px 25px ${primary}1A`
            }}
          >
            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Peso */}
              <div className="space-y-2">
                <label 
                  htmlFor="weight" 
                  className="block text-sm font-semibold"
                  style={{ color: paletteConfig?.foreground || '#374151' }}
                >
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
                <label 
                  htmlFor="height" 
                  className="block text-sm font-semibold"
                  style={{ color: paletteConfig?.foreground || '#374151' }}
                >
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
                <h3 
                  className="text-2xl font-bold mb-2"
                  style={{ color: paletteConfig?.foreground || '#1F2937' }}
                >
                  {category.category}
                </h3>
                <p 
                  className="mb-6"
                  style={{ color: paletteConfig?.secondaryText || '#6B7280' }}
                >
                  {category.description}
                </p>

                {/* Indicatore visuale */}
                <BMIIndicator />

                {/* Nota disclaimer */}
                <div 
                  className="mt-8 p-4 border rounded-xl"
                  style={{ 
                    backgroundColor: paletteConfig?.muted || '#F1F5F9',
                    borderColor: border
                  }}
                >
                  <p 
                    className="text-sm"
                    style={{ color: paletteConfig?.foreground || '#1F2937' }}
                  >
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
                <p style={{ color: paletteConfig?.secondaryText || '#6B7280' }}>
                  Inserisci peso e altezza per calcolare il tuo BMI
                </p>
              </div>
            )}
          </div>

            {/* Informazioni aggiuntive */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div 
              className="rounded-xl p-4 shadow-md border"
              style={{ 
                backgroundColor: paletteConfig?.card || '#FFFFFF',
                borderColor: border
              }}
            >
              <div className="w-4 h-4 bg-blue-400 rounded mx-auto mb-2"></div>
              <div className="text-xs font-semibold" style={{ color: paletteConfig?.foreground || '#374151' }}>Sottopeso</div>
              <div className="text-xs" style={{ color: paletteConfig?.secondaryText || '#6B7280' }}>&lt; 18.5</div>
            </div>
            <div 
              className="rounded-xl p-4 shadow-md border"
              style={{ 
                backgroundColor: paletteConfig?.card || '#FFFFFF',
                borderColor: border
              }}
            >
              <div className="w-4 h-4 rounded mx-auto mb-2" style={{ backgroundColor: BMI_COLORS.normal }}></div>
              <div className="text-xs font-semibold" style={{ color: paletteConfig?.foreground || '#374151' }}>Normale</div>
              <div className="text-xs" style={{ color: paletteConfig?.secondaryText || '#6B7280' }}>18.5 - 24.9</div>
            </div>
            <div 
              className="rounded-xl p-4 shadow-md border"
              style={{ 
                backgroundColor: paletteConfig?.card || '#FFFFFF',
                borderColor: border
              }}
            >
              <div className="w-4 h-4 bg-yellow-400 rounded mx-auto mb-2"></div>
              <div className="text-xs font-semibold" style={{ color: paletteConfig?.foreground || '#374151' }}>Sovrappeso</div>
              <div className="text-xs" style={{ color: paletteConfig?.secondaryText || '#6B7280' }}>25 - 29.9</div>
            </div>
            <div 
              className="rounded-xl p-4 shadow-md border"
              style={{ 
                backgroundColor: paletteConfig?.card || '#FFFFFF',
                borderColor: border
              }}
            >
              <div className="w-4 h-4 bg-red-400 rounded mx-auto mb-2"></div>
              <div className="text-xs font-semibold" style={{ color: paletteConfig?.foreground || '#374151' }}>Obesità</div>
              <div className="text-xs" style={{ color: paletteConfig?.secondaryText || '#6B7280' }}>&gt; 30</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
