export interface ScheduleEvent {
  nom: string;
  date: string; // La date précise, ex: "04/11/2025"
  presence: string; // Le lieu de présence, ex: "FNAC" ou "Repos"
  description: string; // Le texte original complet, ex: "mardi 04/11/2025 de 09:00 à 12:30 et 13:30 à 16:30"
  heureDebut: string; // L'heure de début au format HH:mm, ex: "09:00"
  heureFin: string; // L'heure de fin au format HH:mm, ex: "16:30"
  heureRepas?: string; // L'heure de repas assignée, ex: "12:00-13:00"
  enTelephonie?: 'matin' | 'après-midi' | 'aucun';
  pourcentageTel?: number;
}