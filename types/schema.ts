import { z } from "zod";

export const RecipeSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 letras"),

  category: z.string().optional(),

  prep_time: z.number().int().min(1).optional(),

  steps: z.array(z.object({
    text: z.string().min(1, "El paso no puede estar vacío")
  })).min(1, "Añade al menos un paso"),

  ingredients: z.array(z.object({
    ingredient_id: z.string().optional(),
    name: z.string().min(2, "Nombre del ingrediente requerido"),
    amount: z.string().min(1, "Cantidad requerida (ej: 200g)"),
    store: z.string().optional(),
  })).min(1, "Añade al menos un ingrediente"),
});

export type RecipeFormValues = z.infer<typeof RecipeSchema>;

export type CatalogIngredient = {
  id: string
  name: string
  preferred_store: string | null
}
