"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Componente per testo troncato con "altro" cliccabile
function TruncatedText({ text, maxLines = 2 }: { text: string; maxLines?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Conta le righe approssimative (1 riga ≈ 50 caratteri)
  const charsPerLine = 50;
  const maxChars = maxLines * charsPerLine;
  
  if (text.length <= maxChars || isExpanded) {
    return (
      <p className="text-sm text-muted-foreground leading-relaxed font-medium">
        {text}
        {text.length > maxChars && (
          <button 
            onClick={() => setIsExpanded(false)}
            className="text-primary hover:text-primary/80 ml-1 underline"
          >
            meno
          </button>
        )}
      </p>
    );
  }
  
  return (
    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
      {text.substring(0, maxChars)}...
      <button 
        onClick={() => setIsExpanded(true)}
        className="text-primary hover:text-primary/80 ml-1 underline"
      >
        altro
      </button>
    </p>
  );
}

interface Photo {
  id: string;
  url: string;
  description?: string;
}

interface ResultsCarouselDesktopProps {
  photos: Photo[];
}

export default function ResultsCarouselDesktop({ photos }: ResultsCarouselDesktopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const photosPerPage = 3; // Mostra 3 foto per volta su desktop
  const totalPages = Math.ceil(photos.length / photosPerPage);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToPage = (pageIndex: number) => {
    setCurrentIndex(pageIndex);
  };

  const getCurrentPhotos = () => {
    const start = currentIndex * photosPerPage;
    return photos.slice(start, start + photosPerPage);
  };

  if (photos.length === 0) return null;

  return (
    <div className="relative">
      {/* Carosello Desktop */}
      <div className="hidden md:block">
        {/* Container con overflow hidden per le transizioni */}
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {/* Pagine del carosello */}
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <div key={pageIndex} className="w-full flex-shrink-0">
                <div className="grid grid-cols-3 gap-8 px-4">
                  {photos.slice(pageIndex * photosPerPage, (pageIndex + 1) * photosPerPage).map((photo, photoIndex) => (
                    <div key={photo.id} className="group relative">
                      {/* Card con effetto hover - altezza aumentata */}
                      <div className="relative bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-[520px] flex flex-col">
                        {/* Immagine con overlay gradiente */}
                        <div className="aspect-[4/5] relative overflow-hidden flex-shrink-0">
                          <img
                            src={photo.url}
                            alt={photo.description || `Risultato cliente ${pageIndex * photosPerPage + photoIndex + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          
                          {/* Overlay gradiente */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        
                        {/* Descrizione con styling moderno - spazio fisso */}
                        <div className="p-5 flex-1 flex flex-col justify-start">
                          {photo.description && (
                            <TruncatedText text={photo.description} maxLines={2} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Riempi con div vuoti se meno di 3 foto */}
                  {Array.from({ 
                    length: Math.max(0, photosPerPage - photos.slice(pageIndex * photosPerPage, (pageIndex + 1) * photosPerPage).length) 
                  }).map((_, emptyIndex) => (
                    <div key={`empty-${emptyIndex}`} className="invisible">
                      <div className="h-[520px]"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controlli di navigazione - solo se più di 3 foto */}
        {photos.length > photosPerPage && (
          <>
            {/* Frecce di navigazione esterne con contrasto */}
            <button
              onClick={goToPrev}
              className="absolute -left-6 top-1/2 -translate-y-1/2 group bg-primary hover:bg-primary/90 backdrop-blur-sm rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 z-30 border-2 border-white ring-2 ring-black/10"
              aria-label="Foto precedenti"
            >
              <ChevronLeft className="w-6 h-6 text-white group-hover:text-white/90 transition-colors duration-200" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute -right-6 top-1/2 -translate-y-1/2 group bg-primary hover:bg-primary/90 backdrop-blur-sm rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 z-30 border-2 border-white ring-2 ring-black/10"
              aria-label="Foto successive"
            >
              <ChevronRight className="w-6 h-6 text-white group-hover:text-white/90 transition-colors duration-200" />
            </button>

            {/* Indicatori di paginazione (dots) */}
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalPages }).map((_, pageIndex) => (
                <button
                  key={pageIndex}
                  onClick={() => goToPage(pageIndex)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    currentIndex === pageIndex
                      ? 'bg-primary w-8'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Vai alla pagina ${pageIndex + 1}`}
                />
              ))}
            </div>

            {/* Contatore foto */}
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                {Math.min((currentIndex + 1) * photosPerPage, photos.length)} di {photos.length} risultati
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
