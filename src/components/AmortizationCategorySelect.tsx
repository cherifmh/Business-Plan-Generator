import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AMORTIZATION_CATEGORIES,
  AMORTIZATION_GROUP_LABELS,
  AMORTIZATION_DECREE,
  type AmortizationGroup,
} from "@/data/amortizationCategories";

/** Valeur interne du choix « personnalisé » (aucune catégorie du décret). */
export const CUSTOM_CATEGORY_VALUE = "__custom__";

const SELECTABLE_BY_GROUP = (Object.keys(AMORTIZATION_GROUP_LABELS) as AmortizationGroup[]).map(
  (group) => ({
    group,
    label: AMORTIZATION_GROUP_LABELS[group],
    categories: AMORTIZATION_CATEGORIES.filter(
      (category) => category.group === group && !category.repair
    ),
  })
);

interface AmortizationCategorySelectProps {
  value?: string;
  onChange: (categoryId: string | undefined) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Sélecteur du barème d'amortissement linéaire du Décret n° 2008-492.
 * Le choix est toujours modifiable, y compris après une proposition de l'IA.
 */
export function AmortizationCategorySelect({
  value,
  onChange,
  className,
  disabled,
}: AmortizationCategorySelectProps) {
  return (
    <Select
      value={value || CUSTOM_CATEGORY_VALUE}
      onValueChange={(next) =>
        onChange(next === CUSTOM_CATEGORY_VALUE ? undefined : next)
      }
      disabled={disabled}
    >
      <SelectTrigger className={className ?? "h-8 w-full text-xs"} title={AMORTIZATION_DECREE}>
        <SelectValue placeholder="Catégorie…" />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        <SelectItem value={CUSTOM_CATEGORY_VALUE}>
          Personnalisé / non classé
        </SelectItem>
        <SelectSeparator />
        {SELECTABLE_BY_GROUP.map(({ group, label, categories }) =>
          categories.length === 0 ? null : (
            <SelectGroup key={group}>
              <SelectLabel>{label}</SelectLabel>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.id} — {category.label} ({category.rate.toLocaleString("fr-TN")} %)
                </SelectItem>
              ))}
            </SelectGroup>
          )
        )}
      </SelectContent>
    </Select>
  );
}
