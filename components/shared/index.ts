// Shared components
export { DataTable, DataTablePagination, createSelectColumn, createSortableColumn, createColumn, createActionsColumn, SortableHeader } from './data-table';
export type { DataTableProps } from './data-table';
export { LocaleSwitcher } from './locale-switcher';
export { ThemeToggle } from './theme-toggle';
export { AccentColorSelector } from './accent-color-selector';

// Page wrapper for server components
export { PageWrapper } from './page-wrapper';

// CRUD Page component
export { CrudPage } from './crud-page';
export type { CrudPageProps } from './crud-page';

// Password validation
export { PasswordRequirements, validatePassword, isPasswordValid } from './password-requirements';
export type { PasswordValidation } from './password-requirements';

// Animations
export {
  PageTransition,
  FadeIn,
  FadeInUp,
  ScaleIn,
  StaggerList,
  StaggerItem,
  AnimatedPresenceWrapper,
  HoverScale,
  AnimatedCard,
  AnimatedTableRow,
  SkeletonPulse,
  LoadingSpinner,
  motion,
  AnimatePresence,
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  staggerContainer,
  staggerItem,
} from './animations';
