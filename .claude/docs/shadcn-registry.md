# shadcn/ui Component Registry

Available components in this shadcn distribution.
Use this list to check if a component exists before deciding to implement from scratch.

## How to use
- Check this list first when deciding which components to use
- If a component is listed here but not in `components/ui/`, install it with `pnpm dlx shadcn add <component-name>`
- If a component is NOT listed here, implement with Tailwind only

## Component List

Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb,
Button, Button Group, Calendar, Card, Carousel, Chart, Checkbox, Collapsible,
Combobox, Command, Context Menu, Dialog, Direction, Drawer, Dropdown Menu,
Empty, Field, Hover Card, Input, Input Group, Input OTP, Item, Kbd, Label,
Menubar, Native Select, Navigation Menu, Pagination, Popover, Progress,
Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar,
Skeleton, Slider, Sonner, Spinner, Switch, Table, Tabs, Textarea, Toggle,
Toggle Group, Tooltip

## Notes
- `Form` is not a component — it's a pattern using react-hook-form + zod
- `Data Table`, `Date Picker`, `Toast`, `Typography` are docs pages, not installable components
- Each component may have sub-components (e.g. Card → CardHeader, CardContent, CardTitle, CardDescription, CardFooter). Always read `components/ui/<name>.tsx` to discover all available sub-components before implementing.
