/** Filter the original registry without truncating groups or changing tool objects. */
export function discoverTools<
  Tool extends { name: string; desc: string; path: string },
  Category extends { title: string; pathPrefix: string },
>(tools: Tool[], categories: Category[], query = '', selected = 'all') {
  const term = query.trim().toLowerCase();
  return categories
    .map((category) => ({
      ...category,
      items: tools.filter(
        (tool) =>
          tool.path.startsWith(category.pathPrefix) &&
          `${tool.name} ${tool.desc} ${category.title}`.toLowerCase().includes(term),
      ),
    }))
    .filter(
      (category) =>
        (selected === 'all' || category.pathPrefix === selected) && category.items.length > 0,
    );
}
