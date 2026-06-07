'use client';

import Image from 'next/image';

interface ExperienceCardProps {
  title: string;
  desc: string;
  imageUrl: string;
}

export function ExperienceCard({ title, desc, imageUrl }: ExperienceCardProps) {
  return (
    <div className="group relative aspect-[3/4] overflow-hidden">
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-cloud">
        <h3 className="font-serif text-2xl">{title}</h3>
        <p className="mt-2 text-sm text-cloud/85 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
