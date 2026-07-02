// v-accent="'#rrggbb'" injects a runtime colour as the `--c` custom property.
// This keeps data-driven colours (tower/rarity/theme) out of the template while
// all actual styling *rules* stay in the SCSS files.
function apply(el, binding) {
  if (binding.value) el.style.setProperty('--c', binding.value)
}

export const accent = {
  mounted: apply,
  updated: apply,
}
