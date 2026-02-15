import { z } from "zod";

// Esto define qué es una Receta válida.
// Si el usuario intenta enviar algo que no cumpla esto, dará error.
export const RecipeSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 letras"),
  
  // Array de pasos (texto)
  steps: z.array(z.object({
    text: z.string().min(1, "El paso no puede estar vacío") 
  })).min(1, "Añade al menos un paso"),
  
  // Array de ingredientes
  ingredients: z.array(z.object({
    name: z.string().min(2, "Nombre del ingrediente requerido"),
    amount: z.string().min(1, "Cantidad requerida (ej: 200g)"),
    store: z.string().optional(), 
  })).min(1, "Añade al menos un ingrediente"),
});

// Esto extrae el "Tipo" de TypeScript automáticamente desde las reglas de arriba
export type RecipeFormValues = z.infer<typeof RecipeSchema>;