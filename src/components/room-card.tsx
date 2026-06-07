'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';

interface RoomCardProps {
  id: 'suite' | 'double' | 'twin';
  imageUrl: string;
  name: string;
  shortDesc: string;
  price: string;
}

export function RoomCard({ id, imageUrl, name, shortDesc, price }: RoomCardProps) {
  const t = useTranslations('rooms');

  return (
    <Link
      href={`/rooms/${id}` as any}
      className="group block bg-cloud overflow-hidden hover:shadow-lg transition-shadow duration-500"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <h3 className="font-serif text-xl text-ink">{name}</h3>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">{shortDesc}</p>
        <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
          <div>
            <span className="text-xs text-ink-mute">{t('fromPrice')}</span>
            <span className="ml-1.5 text-base text-moss font-medium">{price}</span>
            <span className="ml-1 text-xs text-ink-mute">{t('perNight')}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-moss group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
