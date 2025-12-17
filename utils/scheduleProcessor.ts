import { ScheduleEvent } from '../types';
import { parseDate, getWeekStartDate, addDays, formatDate, getDayName, calculateDurationHours } from './dateUtils';

/**
 * Assigne les heures de repas aux événements de la journée pour optimiser la présence.
 */
const assignMealTimes = (events: ScheduleEvent[]): ScheduleEvent[] => {
    // Grouper les événements par date
    const eventsByDate = new Map<string, ScheduleEvent[]>();
    for (const event of events) {
        if (!eventsByDate.has(event.date)) {
            eventsByDate.set(event.date, []);
        }
        eventsByDate.get(event.date)!.push(event);
    }

    // Traiter chaque journée
    for (const [, dailyEvents] of eventsByDate.entries()) {
        const workingEvents = dailyEvents.filter(e => e.presence !== 'Repos' && !e.presence.toUpperCase().includes('CFO') && e.heureDebut && e.heureFin);
        if (workingEvents.length === 0) continue;

        // 1. Appliquer la règle des 5 heures
        workingEvents.forEach(event => {
            const duration = calculateDurationHours(event.heureDebut, event.heureFin);
            if (duration <= 5) {
                event.heureRepas = "pas de pause repas";
            }
        });

        const eventsNeedingMeal = workingEvents.filter(e => !e.heureRepas);
        if (eventsNeedingMeal.length === 0) continue;

        const preferences: { [key: string]: string } = {
            'JULIEN': '12:00-13:00',
            'SEBASTIEN': '12:00-13:00',
            'FLORIAN': '13:00-14:00',
            'MATTHIEU': '13:00-14:00',
            'ANASSE': '14:00-15:00',
            'FREDERIC': '14:00-15:00',
            'RAYAN': '14:00-15:00',
        };

        const slots: Record<string, ScheduleEvent[]> = {
            '12:00-13:00': [],
            '13:00-14:00': [],
            '14:00-15:00': [],
        };
        const assignedNames = new Set<string>();

        // 2. Assigner les préférences STRICTEMENT (insensible à la casse, mais on a tout converti en MAJ avant)
        eventsNeedingMeal.forEach(event => {
            const eventNomUpper = event.nom.toUpperCase();
            // Recherche partielle pour gérer les éventuels espaces ou variations
            const prefKey = Object.keys(preferences).find(name => eventNomUpper.includes(name));

            if (prefKey) {
                const preferredSlot = preferences[prefKey];
                event.heureRepas = preferredSlot;
                slots[preferredSlot].push(event);
                assignedNames.add(event.nom);
            }
        });
        
        // 3. Assigner les personnes restantes pour équilibrer
        const unassignedEvents = eventsNeedingMeal.filter(e => !assignedNames.has(e.nom));
        unassignedEvents.forEach(event => {
            // Trouver le créneau le moins rempli
            const slotSizes = Object.entries(slots).map(([key, value]) => ({ key, size: value.length }));
            slotSizes.sort((a, b) => a.size - b.size);
            const smallestSlotKey = slotSizes[0].key;
            event.heureRepas = smallestSlotKey;
            slots[smallestSlotKey].push(event);
        });
    }

    return events;
};

/**
 * Assigne les gardes téléphoniques de manière équitable.
 */
const assignPhoneDuties = (events: ScheduleEvent[]): ScheduleEvent[] => {
    const eventsWithPhoneDuty = events.map(e => ({ ...e, enTelephonie: 'aucun' as 'matin' | 'après-midi' | 'aucun' }));

    const personStats: Record<string, { totalWorkHours: number, phoneDutyHours: number }> = {};
    const persons = [...new Set(events.map(e => e.nom))];
    persons.forEach(nom => {
        personStats[nom] = { totalWorkHours: 0, phoneDutyHours: 0 };
    });

    // Calculer le total d'heures de travail pour chaque personne
    events.forEach(event => {
        if (event.presence !== 'Repos' && !event.presence.toUpperCase().includes('CFO') && event.heureDebut && event.heureFin) {
            const duration = calculateDurationHours(event.heureDebut, event.heureFin);
            personStats[event.nom].totalWorkHours += duration;
        }
    });

    // Grouper les événements par date
    const eventsByDate = new Map<string, ScheduleEvent[]>();
    eventsWithPhoneDuty.forEach(event => {
        if (!eventsByDate.has(event.date)) {
            eventsByDate.set(event.date, []);
        }
        eventsByDate.get(event.date)!.push(event);
    });

    const sortedDates = [...eventsByDate.keys()].sort((a, b) => {
        const dateA = parseDate(a)?.getTime() || 0;
        const dateB = parseDate(b)?.getTime() || 0;
        return dateA - dateB;
    });

    for (const date of sortedDates) {
        const currentDate = parseDate(date);
        // Dimanche (getUTCDay() === 0) est exclu
        if (currentDate && currentDate.getUTCDay() === 0) {
            continue;
        }

        const dailyEvents = eventsByDate.get(date)!;
        const workingEvents = dailyEvents.filter(e => e.presence !== 'Repos' && !e.presence.toUpperCase().includes('CFO') && e.heureDebut && e.heureFin);
        
        if (workingEvents.length === 0) continue;
        
        const getRatio = (nom: string) => {
            const stats = personStats[nom];
            return stats.totalWorkHours > 0 ? stats.phoneDutyHours / stats.totalWorkHours : Infinity;
        };

        // Liste blanche des personnes autorisées en téléphonie
        const allowedPhoneDutyNames = [
            'MATTHIEU', 'HILAL', 'RACHAD', 'JULIEN', 'SEBASTIEN', 
            'FREDERIC', 'FLORIAN', 'CORINNE', 'AUGUSTIN', 'RAYAN', 'ANASSE'
        ];

        const isEligibleForPhoneDuty = (event: ScheduleEvent): boolean => {
            const nomUpper = event.nom.toUpperCase();
            
            // Vérification si la personne est dans la liste autorisée
            const isAllowed = allowedPhoneDutyNames.some(name => nomUpper.includes(name));
            if (!isAllowed) return false;

            // Exclure Frédéric de la garde téléphonique le lundi (règle spécifique conservée)
            if (nomUpper.includes('FREDERIC') && currentDate && currentDate.getUTCDay() === 1) { // Lundi
                return false;
            }
            return true;
        };

        // Assignation Matin
        let morningCandidates = workingEvents.filter(e => {
            if (!isEligibleForPhoneDuty(e)) return false; 
            const startHour = parseInt(e.heureDebut.split(':')[0], 10);
            return !isNaN(startHour) && startHour < 12;
        });
        
        morningCandidates.sort((a, b) => getRatio(a.nom) - getRatio(b.nom));

        const morningAssignees = morningCandidates.slice(0, 2);
        morningAssignees.forEach(event => {
            event.enTelephonie = 'matin';
            personStats[event.nom].phoneDutyHours += 4; // Approx. 4h pour une demi-journée
        });

        // Assignation Après-midi
        let afternoonCandidates = workingEvents.filter(e => {
             if (!isEligibleForPhoneDuty(e)) return false; 
             const endHour = parseInt(e.heureFin.split(':')[0], 10);
             const isAssignedMorning = morningAssignees.some(a => a.nom === e.nom && a.date === e.date);
             return !isNaN(endHour) && endHour >= 14 && !isAssignedMorning;
        });
        
        afternoonCandidates.sort((a, b) => getRatio(a.nom) - getRatio(b.nom));

        const afternoonAssignees = afternoonCandidates.slice(0, 2);
        afternoonAssignees.forEach(event => {
            event.enTelephonie = 'après-midi';
            personStats[event.nom].phoneDutyHours += 4;
        });
    }

    return eventsWithPhoneDuty;
};

/**
 * Calcule et applique le pourcentage de temps passé en téléphonie pour chaque personne.
 */
const calculateAndApplyPhoneDutyPercentage = (events: ScheduleEvent[]): ScheduleEvent[] => {
    const personStats: Record<string, { totalWorkHours: number, phoneDutyHours: number }> = {};

    // Initialiser les statistiques pour chaque personne
    const persons = [...new Set(events.map(e => e.nom))];
    persons.forEach(nom => {
        personStats[nom] = { totalWorkHours: 0, phoneDutyHours: 0 };
    });

    // Calculer le total des heures de travail et des heures de téléphonie
    events.forEach(event => {
        if (event.presence !== 'Repos' && !event.presence.toUpperCase().includes('CFO') && event.heureDebut && event.heureFin) {
            personStats[event.nom].totalWorkHours += calculateDurationHours(event.heureDebut, event.heureFin);
        }
        if (event.enTelephonie && event.enTelephonie !== 'aucun') {
            personStats[event.nom].phoneDutyHours += 4; // Supposant 4 heures par service
        }
    });

    // Calculer les pourcentages
    const percentages: Record<string, number> = {};
    for (const nom in personStats) {
        const stats = personStats[nom];
        if (stats.totalWorkHours > 0) {
            percentages[nom] = (stats.phoneDutyHours / stats.totalWorkHours) * 100;
        } else {
            percentages[nom] = 0;
        }
    }

    // Appliquer les pourcentages à chaque événement
    return events.map(event => ({
        ...event,
        pourcentageTel: percentages[event.nom]
    }));
};


export const processAndPadSchedule = (events: ScheduleEvent[]): ScheduleEvent[] => {
    if (!events || events.length === 0) {
        return [];
    }

    // 0. PRÉ-TRAITEMENT : Forcer les noms en MAJUSCULES
    // Cela garantit que toutes les étapes suivantes (comparaisons de chaînes) sont cohérentes
    // et répond à la demande d'avoir uniquement les prénoms en majuscule (si l'IA a bien fait son travail d'extraction du prénom).
    const uppercasedEvents = events.map(e => ({
        ...e,
        nom: e.nom.toUpperCase()
    }));

    // Filtrer les événements pour exclure Christophe.
    const eventsToProcess = uppercasedEvents.filter(event => {
        const nom = event.nom; // Déjà en majuscule
        const isChristophe = nom.includes('CHRISTOPHE');
        return !isChristophe;
    });

    if (eventsToProcess.length === 0) return [];

    // 1. Assigner les heures de repas
    const eventsWithMeals = assignMealTimes(eventsToProcess);

    // 2. Assigner les gardes téléphoniques
    const eventsWithPhoneDuty = assignPhoneDuties(eventsWithMeals);
    
    // 3. Calculer le % de téléphonie
    const eventsWithPhonePercentage = calculateAndApplyPhoneDutyPercentage(eventsWithPhoneDuty);

    const allPeople = [...new Set(eventsWithPhonePercentage.map(e => e.nom))];
    const allDates: string[] = [];

    // Trouver la plage de dates complète (du lundi au dimanche)
    const firstDate = parseDate(eventsWithPhonePercentage[0].date);
    if (!firstDate) {
        return eventsWithPhonePercentage; // Retourner les données traitées si la date est invalide
    }

    const weekStartDate = getWeekStartDate(firstDate);
    for (let i = 0; i < 7; i++) {
        allDates.push(formatDate(addDays(weekStartDate, i)));
    }
    
    // Créer une Map pour un accès rapide aux événements existants
    const eventMap = new Map<string, ScheduleEvent>();
    eventsWithPhonePercentage.forEach(event => {
        const key = `${event.nom}-${event.date}`;
        eventMap.set(key, event);
    });

    // Compléter les jours manquants
    const paddedSchedule: ScheduleEvent[] = [];
    allPeople.forEach(nom => {
        allDates.forEach(date => {
            const key = `${nom}-${date}`;
            if (eventMap.has(key)) {
                paddedSchedule.push(eventMap.get(key)!);
            } else {
                // Créer un événement "Repos" pour les jours manquants
                const parsedDate = parseDate(date);
                const dayName = parsedDate ? getDayName(parsedDate) : '';
                paddedSchedule.push({
                    nom,
                    date,
                    presence: 'Repos',
                    description: `${dayName} ${date} - Repos`,
                    heureDebut: '',
                    heureFin: '',
                    heureRepas: '-',
                    enTelephonie: 'aucun',
                    pourcentageTel: eventMap.get(`${nom}-${allDates[0]}`)?.pourcentageTel || 0, // Utiliser le % du premier jour
                });
            }
        });
    });

    // Trier le résultat final par nom puis par date
    paddedSchedule.sort((a, b) => {
        if (a.nom < b.nom) return -1;
        if (a.nom > b.nom) return 1;
        const dateA = parseDate(a.date)?.getTime() || 0;
        const dateB = parseDate(b.date)?.getTime() || 0;
        return dateA - dateB;
    });

    return paddedSchedule;
};