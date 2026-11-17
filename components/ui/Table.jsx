import { cn } from "@/lib/utils";

export function TableWrap({ children, className }) {
  return <div className={cn("overflow-x-auto", className)}>{children}</div>;
}

export function Table({ children, className }) {
  return <table className={cn("w-full min-w-[520px] text-left text-sm", className)}>{children}</table>;
}

export function Th({ children, className }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-slate-100 bg-slate-50/70 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, ...props }) {
  return (
    <td className={cn("border-b border-slate-100 px-4 py-3 align-middle text-slate-700 dark:border-slate-800/70 dark:text-slate-300", className)} {...props}>
      {children}
    </td>
  );
}

export function Tr({ children, className, ...props }) {
  return (
    <tr className={cn("transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30", className)} {...props}>
      {children}
    </tr>
  );
}
