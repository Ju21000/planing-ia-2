import { GoogleGenAI, Type } from "@google/genai";
import { fileToBase64 } from '../utils/fileUtils';
import { ScheduleEvent } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const scheduleSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        nom: {
          type: Type.STRING,
          description: "Le PRÉNOM uniquement de la personne, écrit strictement en MAJUSCULES (ex: 'JULIEN', 'MARIE-CLAIRE'). Ne pas inclure le nom de famille.",
        },
        date: {
            type: Type.STRING,
            description: "La date de l'événement au format JJ/MM/AAAA.",
        },
        presence: {
            type: Type.STRING,
            description: "Indiquer 'FNAC' si la personne travaille à la Fnac. Sinon, indiquer 'Repos', 'CFO', ou laisser vide.",
        },
        description: {
            type: Type.STRING,
            description: "Transcription exacte du contenu de la case.",
        },
        heureDebut: {
            type: Type.STRING,
            description: "Heure de début (HH:mm).",
        },
        heureFin: {
            type: Type.STRING,
            description: "Heure de fin (HH:mm).",
        },
      },
      required: ["nom", "date", "description"],
    },
};

export const extractScheduleFromDocs = async (
    pdfFile: File, 
    imageFile: File | null, 
    additionalInstructions: string
): Promise<ScheduleEvent[]> => {
    try {
        const base64Pdf = await fileToBase64(pdfFile);
        
        const contentParts: any[] = [
            { 
                text: `Tu es un auditeur expert en planification RH. Ta mission est d'extraire les données de planning avec une PRÉCISION ABSOLUE.
                
                SOURCES :
                1. Un planning principal (PDF).
                2. (Optionnel) Une image annexe qui contient des MODIFICATIONS, des AJOUTS ou des CORRECTIONS manuscrites.
                
                RÈGLES DE FUSION ET PRIORITÉ :
                - L'image annexe (si fournie) a TOUJOURS raison sur le PDF. Si l'image change un horaire ou un jour de repos, prends l'info de l'image.
                - Si une personne apparaît dans l'image mais pas le PDF, ajoute-la.
                
                RÈGLES D'EXTRACTION STRICTES :
                1. **NOM (IMPORTANT)** : Extrais UNIQUEMENT LE PRÉNOM. 
                   - Si le document dit "Julien DUPONT", tu écris "JULIEN".
                   - Si le document dit "D. Sébastien", tu écris "SEBASTIEN".
                   - Le format final doit être en MAJUSCULES.
                2. **DATE** : Format JJ/MM/AAAA impératif.
                3. **PRÉSENCE (CRITIQUE)** : 
                   - Si la personne est planifiée pour travailler en magasin/boutique -> Écris "FNAC".
                   - Si c'est un jour de repos -> Écris "Repos".
                   - Si c'est une formation -> Écris "CFO".
                4. **HORAIRES** : Format HH:mm. 
                   - HeureDebut : L'heure de prise de poste.
                   - HeureFin : L'heure de fin de poste.
                   - Ignore la pause déjeuner pour l'heure de fin (ex: 10h-13h / 14h-19h => Début 10:00, Fin 19:00).
                
                INSTRUCTIONS UTILISATEUR :
                ${additionalInstructions}
                
                Vérifie chaque ligne extraite. Aucune hallucination tolérée.`
            },
            {
                inlineData: {
                    data: base64Pdf,
                    mimeType: 'application/pdf',
                },
            }
        ];

        if (imageFile) {
            const base64Image = await fileToBase64(imageFile);
            contentParts.push({
                text: "Voici le fichier image annexe (corrections/ajouts) à traiter en priorité sur le PDF :"
            });
            contentParts.push({
                inlineData: {
                    data: base64Image,
                    mimeType: imageFile.type,
                },
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: {
                parts: contentParts,
            },
            config: {
                systemInstruction: "Tu es un moteur d'extraction de données infaillible. Tu analyses visuellement les tableaux. Tu dois fournir un JSON pur respectant strictement le schéma.",
                responseMimeType: "application/json",
                responseSchema: scheduleSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);
        
        if (Array.isArray(parsedData)) {
            // Filtrage basique pour éviter les lignes vides
            return (parsedData as ScheduleEvent[]).filter(p => p.nom && p.date);
        } else {
            throw new Error("Structure JSON invalide retournée par le modèle.");
        }
    } catch (error) {
        console.error("Erreur Gemini 3 Pro:", error);
        throw new Error("Erreur lors de l'analyse ultra-précise. Vérifiez les documents.");
    }
};