'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function CreateEventWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const templates = [
    { id: 't1', name: 'Mor Yapraklar Buluşması', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80' },
    { id: 't2', name: 'Temalı Doğum Günü', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80' },
    { id: 't3', name: 'Turuncu Ekose Davetiye', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80' },
    { id: 't4', name: 'Teal Aile Pikniği', image: 'https://images.unsplash.com/photo-1528607922812-263079ec0883?w=400&q=80' },
    { id: 't5', name: 'Oyun Gecesi', image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&q=80' },
    { id: 't6', name: 'Plaj Partisi', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80' }
  ];

  function handleNext() {
    if (step < 5) {
      setStep(step + 1);
      return;
    }
    router.push('/eventjoy/etkinlikler');
  }

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-white pb-24">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/eventjoy/etkinlikler">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="flex-1 text-center text-sm font-bold">
          {step} / 5: Özelleştir
        </h1>
        <span className="size-5" />
      </header>
      <div className="h-1 bg-emerald-500" style={{ width: `${(step / 5) * 100}%` }} />

      {step === 1 && (
        <div className="px-4 py-6">
          <h2 className="text-lg font-bold">Bir şablon seçin</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t.id)}
                className={`overflow-hidden rounded-lg text-left ${
                  selectedTemplate === t.id ? 'ring-2 ring-[#E53935]' : ''
                }`}
              >
                <img src={t.image} alt={t.name} className="aspect-square w-full object-cover" />
                <p className="py-2 text-xs font-medium">{t.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step > 1 && (
        <div className="px-4 py-8 text-center text-muted-foreground">
          <p className="font-medium text-foreground">Adım {step}</p>
          <p className="mt-2 text-sm">Etkinlik detayları, misafirler ve bütçe yakında...</p>
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t bg-white p-4">
        <button
          type="button"
          disabled={step === 1 && !selectedTemplate}
          onClick={handleNext}
          className="w-full rounded-lg py-3 font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: '#E53935' }}
        >
          {step < 5 ? 'Devam Et' : 'Etkinliği Oluştur'}
        </button>
      </div>
    </div>
  );
}
