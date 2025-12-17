import { ScheduleEvent } from '../types';

const NOTION_API_VERSION = "2022-06-28";

interface NotionErrorResponse {
    code: string;
    message: string;
}

const parseInternalDate = (dateStr: string): Date | null => {
    const parts = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!parts) return null;
    const [, day, month, year] = parts;
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    if (isNaN(date.getTime()) || date.getUTCDate() !== parseInt(day)) {
        return null;
    }
    return date;
};

const createNotionDateObject = (event: ScheduleEvent): { start: string; end?: string } | null => {
    const dateObj = parseInternalDate(event.date);
    if (!dateObj) {
        console.warn("Format de date invalide pour l'événement:", event);
        return null;
    }

    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    // Gérer "Repos" ou absence d'horaires comme un événement sur toute la journée
    if (!event.heureDebut || !event.heureFin) {
        return {
            start: formattedDate,
        };
    }

    const startParts = event.heureDebut.match(/^(\d{2}):(\d{2})$/);
    const endParts = event.heureFin.match(/^(\d{2}):(\d{2})$/);

    if (!startParts || !endParts) {
         console.warn("Format d'heure invalide pour l'événement:", event);
        return null;
    }
    
    const [, startHour, startMinute] = startParts;
    const [, endHour, endMinute] = endParts;

    const startDate = new Date(`${formattedDate}T${startHour}:${startMinute}:00`);
    const endDate = new Date(`${formattedDate}T${endHour}:${endMinute}:00`);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn("Date/heure invalide construite:", event);
        return null;
    }

    return {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
    };
};


export const createNotionPageFromData = async (
    notionToken: string,
    parentId: string,
    data: ScheduleEvent[],
    fileName: string
): Promise<string> => {
    const headers = {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_API_VERSION,
    };

    // 1. Créer une nouvelle base de données
    const dbResponse = await fetch('https://api.notion.com/v1/databases', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            parent: { page_id: parentId },
            title: [
                {
                    type: "text",
                    text: {
                        content: `Planning - ${fileName.replace(/\.pdf$/i, '')}`
                    }
                }
            ],
            properties: {
                'NOM': { title: {} },
                'Présence (FNAC)': { checkbox: {} }, // CHANGEMENT IMPORTANT : Type Checkbox
                'Période': { date: {} },
                'Heure de Repas': { rich_text: {} },
                'En Téléphonie': { rich_text: {} },
                '% Tel': { number: { format: "percent" } },
                'Description': { rich_text: {} },
            }
        }),
    });

    if (!dbResponse.ok) {
        const errorData: NotionErrorResponse = await dbResponse.json();
        console.error("Erreur Notion (création BDD):", errorData);
        throw new Error(`Erreur Notion: ${errorData.message}`);
    }

    const database = await dbResponse.json();
    const databaseId = database.id;

    // 2. Ajouter des pages (lignes) à la nouvelle base de données
    for (const event of data) {
        const notionDate = createNotionDateObject(event);
        if (!notionDate) continue;

        // Détermination du booléen pour la case à cocher
        const isFnac = event.presence?.toUpperCase().includes('FNAC') || false;

        const pageProperties: any = {
            'NOM': {
                title: [{ text: { content: event.nom } }]
            },
            'Présence (FNAC)': {
                checkbox: isFnac // Envoi d'un booléen strict
            },
            'Description': {
                rich_text: [{ text: { content: event.description } }]
            },
            'Heure de Repas': {
                rich_text: [{ text: { content: event.heureRepas || "" } }]
            },
            'En Téléphonie': {
                rich_text: [{ text: { content: (event.enTelephonie && event.enTelephonie !== 'aucun') ? event.enTelephonie : "" } }]
            },
            '% Tel': {
                number: event.pourcentageTel !== undefined ? (event.pourcentageTel / 100) : null
            },
            'Période': {
                date: notionDate
            }
        };

        const pageResponse = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                parent: { database_id: databaseId },
                properties: pageProperties,
            }),
        });
        
        if (!pageResponse.ok) {
            const errorData: NotionErrorResponse = await pageResponse.json();
            console.error(`Erreur Notion (création page pour ${event.nom}):`, errorData);
        }
    }
    
    return database.url;
};