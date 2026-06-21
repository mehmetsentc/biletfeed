export interface InterestTag {
  id: string;
  label: string;
}

export interface InterestCategory {
  id: string;
  title: string;
  tags: InterestTag[];
}

export const interestPages: InterestCategory[][] = [
  [
    {
      id: 'music',
      title: 'Müzik',
      tags: [
        { id: 'concerts', label: 'Konserler' },
        { id: 'music-festivals', label: 'Müzik Festivalleri' },
        { id: 'music-workshops', label: 'Müzik Atölyeleri' },
        { id: 'dj-nights', label: 'DJ Geceleri' }
      ]
    },
    {
      id: 'arts',
      title: 'Sanat & Kültür',
      tags: [
        { id: 'art-exhibitions', label: 'Sanat Sergileri' },
        { id: 'cultural-festivals', label: 'Kültür Festivalleri' },
        { id: 'theater', label: 'Tiyatro Oyunları' },
        { id: 'dance', label: 'Dans Gösterileri' }
      ]
    },
    {
      id: 'food',
      title: 'Yemek & İçecek',
      tags: [
        { id: 'food-festivals', label: 'Yemek Festivalleri' },
        { id: 'wine', label: 'Şarap Tadımları' },
        { id: 'cooking', label: 'Yemek Kursları' },
        { id: 'beer', label: 'Bira Festivalleri' }
      ]
    },
    {
      id: 'sports',
      title: 'Spor & Fitness',
      tags: [
        { id: 'marathons', label: 'Maratonlar' },
        { id: 'yoga', label: 'Yoga' },
        { id: 'fitness', label: 'Fitness Etkinlikleri' },
        { id: 'outdoor', label: 'Outdoor Sporlar' }
      ]
    }
  ],
  [
    {
      id: 'business',
      title: 'İş & Networking',
      tags: [
        { id: 'conferences', label: 'Konferanslar' },
        { id: 'seminars', label: 'Seminerler' },
        { id: 'workshops-biz', label: 'Atölyeler' },
        { id: 'networking', label: 'Networking Etkinlikleri' }
      ]
    },
    {
      id: 'family',
      title: 'Aile & Çocuk',
      tags: [
        { id: 'family-friendly', label: 'Aile Dostu Etkinlikler' },
        { id: 'children-workshops', label: 'Çocuk Atölyeleri' },
        { id: 'kid-shows', label: 'Çocuk Dostu Gösteriler' },
        { id: 'educational', label: 'Eğitici Aktiviteler' }
      ]
    },
    {
      id: 'tech',
      title: 'Teknoloji',
      tags: [
        { id: 'tech-conferences', label: 'Teknoloji Konferansları' },
        { id: 'hackathons', label: 'Hackathonlar' },
        { id: 'startup-events', label: 'Startup Etkinlikleri' },
        { id: 'gadget-expos', label: 'Gadget Fuarları' }
      ]
    },
    {
      id: 'comedy',
      title: 'Komedi & Eğlence',
      tags: [
        { id: 'standup', label: 'Stand-up Komedi' },
        { id: 'improv', label: 'Doğaçlama Geceleri' },
        { id: 'comedy-festivals', label: 'Komedi Festivalleri' },
        { id: 'magic-shows', label: 'Sihir Gösterileri' }
      ]
    }
  ]
];
